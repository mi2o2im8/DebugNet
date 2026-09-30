import logging
import time
from collections import defaultdict, deque

from fastapi import HTTPException, status

from app.core.chatbot_prompt import (
    FALLBACK_REPLY,
    build_system_prompt,
    parse_llm_reply,
)
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
# ⭐ LLM에 전달할 사용자 메시지 만들기
# =========================================================

def _build_llm_message(
    user_id: str,
    question: str,
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

    if not ml1_result.get("available"):

        base_message = f"""
사용자 질문:
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
사용자 질문:
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


class ChatbotService:

    def ask(
        self,
        user_id: str,
        message: str,
    ) -> ChatbotResponse:

        question = message.strip()

        if not question:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="질문을 입력해주세요.",
            )

        _check_rate_limit(user_id)

        # ⭐ ML1 + 실제 추천 결과 생성
        llm_message, recommendation_result = _build_llm_message(
            user_id=user_id,
            question=question,
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

            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "지금은 챗봇이 답변할 수 없어요. "
                    "잠시 후 다시 시도해주세요."
                ),
            )

        reply = parse_llm_reply(raw_reply)

        # ⭐ 실제 추천 동호회별 상세 페이지 버튼 추가
        recommendation_actions = _build_recommendation_actions(
            recommendation_result
        )

        if recommendation_actions:
            reply["actions"] = recommendation_actions

        if reply == FALLBACK_REPLY:

            logger.warning(
                "챗봇 응답 형식 오류: %s",
                raw_reply[:300],
            )

        return ChatbotResponse(**reply)