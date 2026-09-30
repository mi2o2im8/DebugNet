import logging
import time
from collections import defaultdict, deque

from fastapi import HTTPException, status

from app.core.chatbot_knowledge import match_intent
from app.core.chatbot_prompt import (
    FALLBACK_REPLY,
    build_system_prompt,
    is_allowed_path,
    parse_llm_reply,
)
from app.core.supabase import get_supabase_admin_client
from app.core.llm_client import LLMError, ask_llm
from app.ml.chatbot_ml1 import analyze_needs
from app.schemas.chatbot import ChatbotResponse
from app.services.chatbot_recommendation import recommend_from_text


logger = logging.getLogger(__name__)


# ---------------------------------------------------------
# 사용자별 호출 횟수 제한 (API 요금 보호)
#
# 서버 메모리에 저장하므로 서버를 재시작하면 초기화된다.
# 시연용 MVP에는 충분하고, 운영 단계에서는 DB나 Redis로 옮긴다.
# ---------------------------------------------------------
RATE_LIMIT_COUNT = 20
RATE_LIMIT_WINDOW_SECONDS = 10 * 60

_request_times = defaultdict(deque)


def _check_rate_limit(user_id: str) -> None:

    now = time.time()
    times = _request_times[user_id]

    # 제한 시간보다 오래된 기록은 지운다.
    while times and now - times[0] > RATE_LIMIT_WINDOW_SECONDS:
        times.popleft()

    if len(times) >= RATE_LIMIT_COUNT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="질문이 너무 많아요. 잠시 후 다시 물어봐주세요.",
        )

    times.append(now)


# 프롬프트는 서버가 켜질 때 한 번만 만든다.
_SYSTEM_PROMPT = build_system_prompt()


# =========================================================
# ⭐ 추천 질문인지 확인
# =========================================================

def _is_recommendation_question(question: str) -> bool:
    """
    사용자가 실제 동호회 추천을 원하는지 간단하게 판별한다.

    "동호회 찾는 방법" 같은 이용 방법 질문은
    실제 추천 요청으로 오인하지 않도록 제외한다.
    """

    text = (question or "").strip()

    if not text:
        return False

    recommendation_keywords = [
        "추천해줘",
        "추천해 줘",
        "추천해줄",
        "추천해 줄",
        "찾아줘",
        "찾아 줘",
        "찾아줄",
        "찾아 줄",
        "골라줘",
        "골라 줘",
        "골라줄",
        "골라 줄",
        "어디가 좋아",
        "어디가 괜찮",
        "가입할 만한",
        "가입할만한",
        "맞는 동호회",
        "어울리는 동호회",
    ]

    if not any(keyword in text for keyword in recommendation_keywords):
        return False

    method_keywords = [
        "찾는 방법",
        "찾는법",
        "검색 방법",
        "검색하는 방법",
        "어떻게 찾아",
        "어떻게 검색",
        "어디서 찾아",
        "어디서 검색",
    ]

    if any(keyword in text for keyword in method_keywords):
        return False

    # ⭐ 운영진 질문은 동호회 추천이 아니다.
    # 예) "우리 동호회에 맞는 회원 찾아줘", "상대 팀 찾아줘"
    compact = text.replace(" ", "")

    operator_keywords = [
        "우리동호회",
        "회원",
        "상대",
        "운영진",
        "신청자",
        "매칭",
        "경기",
    ]

    if any(keyword in compact for keyword in operator_keywords):
        return False

    return True


# =========================================================
# ⭐ 추천 결과를 LLM 참고정보로 변환
# =========================================================

def _build_recommendation_context(
    recommendation_result: dict | None,
) -> str:

    if not recommendation_result:
        return ""

    recommendations = recommendation_result.get(
        "recommendations",
        [],
    )

    total_candidates = recommendation_result.get(
        "total_candidates",
        0,
    )

    if not recommendations:

        return """
[실제 동호회 추천 결과]
현재 조건에 맞는 추천 동호회를 찾지 못했습니다.

이 경우 존재하지 않는 동호회를 만들어내지 마세요.
사용자에게 조건을 조금 넓혀서 다시 찾아보도록 안내해주세요.
""".strip()

    lines = [
        "[실제 동호회 추천 결과]",
        f"- 추천 후보 수: {len(recommendations)}개",
        f"- 전체 후보 수: {total_candidates}개",
        "",
    ]

    for index, club in enumerate(recommendations, start=1):

        club_name = club.get("club_name") or "이름 없음"
        sport_name = club.get("sport_name") or ""
        club_intro = club.get("club_intro") or ""
        regions = club.get("regions") or []
        monthly_fee = club.get("monthly_fee")
        activity_frequency = club.get(
            "activity_frequency"
        )
        atmospheres = club.get("atmospheres") or []
        reasons = club.get("reasons") or []

        lines.append(f"{index}. {club_name}")

        if sport_name:
            lines.append(f"   종목: {sport_name}")

        if regions:
            lines.append(
                f"   지역: {', '.join(map(str, regions[:3]))}"
            )

        if monthly_fee is not None:
            lines.append(
                f"   월 회비: {int(monthly_fee):,}원"
            )

        if activity_frequency:
            lines.append(
                f"   활동 빈도: {activity_frequency}"
            )

        if atmospheres:
            lines.append(
                f"   분위기: {', '.join(map(str, atmospheres[:3]))}"
            )

        if club_intro:
            lines.append(
                f"   소개: {club_intro[:180]}"
            )

        if reasons:
            lines.append(
                f"   추천 이유: {' / '.join(map(str, reasons[:3]))}"
            )

        lines.append("")

    lines.extend(
        [
            "이 정보는 백엔드의 실제 동호회 추천 결과입니다.",
            "추천 결과에 없는 동호회 이름이나 정보를 만들어내지 마세요.",
            "fit_score 같은 내부 점수는 사용자에게 그대로 보여주지 마세요.",
            "추천 후보가 있다면 후보 이름과 실제 제공된 정보만 사용해서 답변하세요.",
        ]
    )

    return "\n".join(lines)


# =========================================================
# ⭐ 실제 추천 동호회 바로가기 생성
# =========================================================

def _build_recommendation_actions(
    recommendation_result: dict | None,
) -> list[dict]:
    """
    실제 추천 결과의 club_id를 이용해
    동호회 상세 페이지 바로가기 버튼을 만든다.

    실제 club_id를 백엔드에서 직접 사용하므로
    LLM이 임의의 URL을 만들 필요가 없다.
    """

    if not recommendation_result:
        return []

    recommendations = recommendation_result.get(
        "recommendations",
        [],
    )

    actions = []

    for index, club in enumerate(recommendations[:3], start=1):

        club_id = club.get("club_id")
        club_name = str(
            club.get("club_name") or "동호회"
        ).strip()

        if club_id is None:
            continue

        actions.append(
            {
                "label": f"{index}. {club_name} 보기",
                "path": f"/clubs/{int(club_id)}",
            }
        )

    return actions


# =========================================================
# ⭐ 이전 대화 (맥락 참고용)
# =========================================================

def _build_history_text(history: list[str] | None) -> str:

    items = [
        str(item).strip()
        for item in (history or [])
        if str(item or "").strip()
    ][-5:]

    if not items:
        return ""

    lines = ["[이전 대화 - 맥락 참고용, 여기에 답하지 마세요]"]
    lines.extend(f"- 사용자: {item}" for item in items)

    return "\n".join(lines) + "\n\n"


# =========================================================
# ⭐ 내 동호회 조회 (운영진 바로가기용)
# =========================================================

OPERATOR_ROLES = {"owner", "manager", "동호회장", "운영진"}
OWNER_ROLES = {"owner", "동호회장"}


def _get_my_clubs(user_id: str) -> list[dict]:
    """
    로그인 사용자가 활동 중인 동호회 목록
    [{"club_id": 1, "club_name": "...", "role": "owner"}, ...]

    실패해도 챗봇은 계속 동작해야 하므로 빈 목록을 돌려준다.
    """

    try:

        supabase = get_supabase_admin_client()

        member_response = (
            supabase
            .table("club_members")
            .select("club_id, role")
            .eq("user_id", user_id)
            .eq("status", "active")
            .execute()
        )

        members = member_response.data or []

        if not members:
            return []

        club_ids = list({member["club_id"] for member in members})

        club_response = (
            supabase
            .table("clubs")
            .select("club_id, club_name, status")
            .in_("club_id", club_ids)
            .execute()
        )

        clubs = {
            club["club_id"]: club
            for club in (club_response.data or [])
            if club.get("status") is True
        }

        result = []

        for member in members:

            club = clubs.get(member["club_id"])

            if not club:
                continue

            result.append(
                {
                    "club_id": club["club_id"],
                    "club_name": str(club.get("club_name") or "내 동호회").strip(),
                    "role": member.get("role"),
                }
            )

        return result

    except Exception as error:

        logger.exception("챗봇 내 동호회 조회 실패: %s", error)
        return []


# =========================================================
# ⭐ 규칙(의도) 기반 답변
# =========================================================

MAX_ACTIONS = 3


def _build_intent_reply(user_id: str, intent: dict) -> dict:
    """
    지식베이스(chatbot_knowledge)의 답변을 화면 응답으로 만든다.

    운영진 질문이면 실제 운영 중인 동호회의 관리 화면 바로가기를 붙인다.
    예) "누가 물개냐 가입 신청 보기" → /clubs/26/manage/members
    """

    answer = intent["answer"]
    steps = list(intent.get("steps") or [])
    actions: list[dict] = []

    if intent.get("role") == "operator":

        my_clubs = _get_my_clubs(user_id)

        operating_clubs = [
            club for club in my_clubs
            if club.get("role") in OPERATOR_ROLES
        ]

        if intent.get("owner_only"):
            target_clubs = [
                club for club in operating_clubs
                if club.get("role") in OWNER_ROLES
            ]
        else:
            target_clubs = operating_clubs

        if not operating_clubs:

            answer = (
                f"{answer}\n\n"
                "지금은 운영 중인 동호회가 없어서 이 메뉴가 보이지 않아요. "
                "동호회장이나 운영진만 사용할 수 있는 기능이에요."
            )

            actions.append(
                {"label": "동호회 만들기", "path": "/clubs/create"}
            )

        elif intent.get("owner_only") and not target_clubs:

            answer = (
                f"{answer}\n\n"
                "지금은 운영진으로 참여 중이라 이 기능은 동호회장에게 요청해주세요."
            )

        templates = intent.get("club_actions") or []

        # 운영 동호회가 여러 개면 동호회별로, 템플릿이 여러 개면 첫 동호회 기준으로
        if len(target_clubs) > 1 and templates:
            pairs = [(templates[0], club) for club in target_clubs]
        else:
            pairs = [
                (template, club)
                for club in target_clubs[:1]
                for template in templates
            ]

        for template, club in pairs:

            path = template["path"].format(club_id=int(club["club_id"]))

            if not is_allowed_path(path):
                continue

            actions.append(
                {
                    "label": template["label"].format(club_name=club["club_name"]),
                    "path": path,
                }
            )

    # 고정 경로 바로가기
    for action in intent.get("actions") or []:
        if is_allowed_path(action.get("path")):
            actions.append(dict(action))

    # 중복 제거 + 개수 제한
    unique_actions = []
    seen_paths = set()

    for action in actions:

        if action["path"] in seen_paths:
            continue

        seen_paths.add(action["path"])
        unique_actions.append(action)

        if len(unique_actions) == MAX_ACTIONS:
            break

    return {
        "answer": answer,
        "steps": steps[:4],
        "actions": unique_actions,
        "found": True,
    }


# =========================================================
# ⭐ LLM에 전달할 사용자 메시지 만들기
# =========================================================

def _build_llm_message(
    user_id: str,
    question: str,
    history: list[str] | None = None,
) -> tuple[str, dict | None]:

    # -----------------------------------------------------
    # 1. ML1 자연어 요구 분석
    # -----------------------------------------------------

    ml1_result = analyze_needs(question)

    logger.warning(
        "⭐ ML1 챗봇 분석 결과: %s",
        ml1_result,
    )

    # -----------------------------------------------------
    # 2. 실제 동호회 추천이 필요한 질문인지 확인
    # -----------------------------------------------------

    recommendation_result = None

    if _is_recommendation_question(question):

        try:

            recommendation_result = recommend_from_text(
                user_id=user_id,
                text=question,
                limit=5,
            )

            logger.warning(
                "⭐ 챗봇 동호회 추천 결과: %s",
                recommendation_result,
            )

        except Exception as error:

            # 추천 기능이 실패해도 기본 챗봇은 계속 사용할 수 있게 한다.
            logger.exception(
                "챗봇 동호회 추천 실패: %s",
                error,
            )

    # -----------------------------------------------------
    # 3. ML1을 사용할 수 없는 경우
    # -----------------------------------------------------

    history_text = _build_history_text(history)

    if not ml1_result.get("available"):

        base_message = f"""
{history_text}[현재 질문]
{question}
""".strip()

    else:

        factors = ml1_result.get(
            "factors",
            [],
        )

        scores = ml1_result.get(
            "scores",
            {},
        )

        if not factors:
            factor_text = (
                "0.5 이상으로 판단된 요구 요인은 없습니다."
            )
        else:
            factor_text = ", ".join(factors)

        score_text = ", ".join(
            f"{label}: {score:.4f}"
            for label, score in scores.items()
        )

        base_message = f"""
{history_text}[현재 질문]
{question}

[내부 ML1 자연어 요구 분석]
- 0.5 이상 요구 요인: {factor_text}
- 요인별 예측 확률: {score_text}

이 ML1 정보는 답변을 돕기 위한 내부 참고 정보입니다.
사용자 질문 자체를 가장 우선해서 답변하세요.
ML1의 확률값이나 내부 분석 내용을 사용자에게 그대로 보여주지 마세요.
ML1 결과만으로 사용자의 의도나 사실을 단정하지 마세요.
""".strip()

    # -----------------------------------------------------
    # 4. 실제 추천 결과 추가
    # -----------------------------------------------------

    recommendation_context = _build_recommendation_context(
        recommendation_result
    )

    if recommendation_context:

        base_message = (
            f"{base_message}\n\n"
            f"{recommendation_context}"
        )

    return base_message, recommendation_result


# 이 점수 이상이면 LLM 없이 규칙 답변을 바로 쓴다.
# (낮은 점수는 LLM 답변이 실패했을 때 대신 쓴다.)
INTENT_DIRECT_SCORE = 4


class ChatbotService:

    def ask(
        self,
        user_id: str,
        message: str,
        history: list[str] | None = None,
    ) -> ChatbotResponse:

        question = message.strip()

        if not question:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="질문을 입력해주세요.",
            )

        _check_rate_limit(user_id)

        # -------------------------------------------------
        # 1. 실제 동호회 추천 요청 → 추천 + LLM
        #    (현재 질문만 보고 판단한다. 이전 대화는 보지 않는다.)
        # -------------------------------------------------
        is_recommendation = _is_recommendation_question(question)

        # -------------------------------------------------
        # 2. 앱 이용 / 운영진 질문 → 규칙 답변 (빠르고 정확함)
        # -------------------------------------------------
        intent, intent_score = (None, 0)

        if not is_recommendation:

            intent, intent_score = match_intent(question)

            logger.info(
                "챗봇 의도 매칭: %s (%s)",
                intent["id"] if intent else None,
                intent_score,
            )

            if intent and intent_score >= INTENT_DIRECT_SCORE:
                return ChatbotResponse(
                    **_build_intent_reply(user_id, intent)
                )

        # -------------------------------------------------
        # 3. 그 외 질문 → LLM
        # -------------------------------------------------
        llm_message, recommendation_result = _build_llm_message(
            user_id=user_id,
            question=question,
            history=history,
        )

        try:

            raw_reply = ask_llm(
                _SYSTEM_PROMPT,
                llm_message,
            )

        except LLMError as error:

            logger.error(
                "챗봇 LLM 호출 실패: %s",
                error,
            )

            # LLM이 안 돼도 비슷한 규칙 답변이 있으면 그걸로 답한다.
            if intent:
                return ChatbotResponse(
                    **_build_intent_reply(user_id, intent)
                )

            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "지금은 챗봇이 답변할 수 없어요. "
                    "잠시 후 다시 시도해주세요."
                ),
            )

        reply = parse_llm_reply(raw_reply)

        if reply == FALLBACK_REPLY:

            logger.warning(
                "챗봇 응답 형식 오류: %s",
                raw_reply[:300],
            )

            if intent:
                return ChatbotResponse(
                    **_build_intent_reply(user_id, intent)
                )

        # ⭐ 실제 추천 동호회별 상세 페이지 버튼 추가
        recommendation_actions = _build_recommendation_actions(
            recommendation_result
        )

        if recommendation_actions:
            reply["actions"] = recommendation_actions

        return ChatbotResponse(**reply)
