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


class ChatbotService:

    def ask(self, user_id: str, message: str) -> ChatbotResponse:

        question = message.strip()

        if not question:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="질문을 입력해주세요.",
            )

        _check_rate_limit(user_id)

        try:
            raw_reply = ask_llm(_SYSTEM_PROMPT, question)

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
