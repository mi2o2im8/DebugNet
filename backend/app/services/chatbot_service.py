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


def _build_llm_message(question: str) -> str:
    """
    사용자 질문에 ML1 자연어 요구 분석 결과를
    LLM 내부 참고정보로 함께 전달한다.

    ML1을 사용할 수 없는 경우에는 원래 질문만 전달한다.
    """

    ml1_result = analyze_needs(question)

    logger.warning("⭐ ML1 챗봇 분석 결과: %s", ml1_result)

    if not ml1_result.get("available"):
        return question

    factors = ml1_result.get("factors", [])
    scores = ml1_result.get("scores", {})

    if not factors:
        factor_text = "0.5 이상으로 판단된 요구 요인은 없습니다."
    else:
        factor_text = ", ".join(factors)

    score_text = ", ".join(
        f"{label}: {score:.4f}"
        for label, score in scores.items()
    )

    return f"""
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


class ChatbotService:

    def ask(self, user_id: str, message: str) -> ChatbotResponse:

        question = message.strip()

        if not question:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="질문을 입력해주세요.",
            )

        _check_rate_limit(user_id)

        # ⭐ ML1 분석 결과를 LLM 내부 참고정보로 추가
        llm_message = _build_llm_message(question)

        try:
            raw_reply = ask_llm(_SYSTEM_PROMPT, llm_message)

        except LLMError as error:
            # 키 없음, 네트워크 오류 등은 서버 로그에만 남기고
            # 화면에는 안내 문구를 보낸다. (키 등 내부 정보 노출 방지)
            logger.error("챗봇 LLM 호출 실패: %s", error)

            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="지금은 챗봇이 답변할 수 없어요. 잠시 후 다시 시도해주세요.",
            )

        reply = parse_llm_reply(raw_reply)

        if reply == FALLBACK_REPLY:
            logger.warning("챗봇 응답 형식 오류: %s", raw_reply[:300])

        return ChatbotResponse(**reply)