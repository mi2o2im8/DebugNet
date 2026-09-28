"""
LLM 호출 전용 파일

LLM 서비스를 바꿀 때는 이 파일과 .env 만 고치면 된다.
지원: openai / anthropic  (.env 의 LLM_PROVIDER 로 선택)

별도 SDK 없이 httpx 로 직접 호출한다.
(httpx 는 supabase 패키지를 설치할 때 같이 설치되어 있다.)
"""

import httpx

from app.core.config import settings


# 서비스별 기본 모델 (.env 의 LLM_MODEL 이 비어 있을 때 사용)
# 모델 이름은 자주 바뀌므로 각 서비스 문서에서 최신 이름을 확인한다.
DEFAULT_MODELS = {
    "openai": "gpt-4o-mini",
    "anthropic": "claude-haiku-4-5-20251001",
}

TIMEOUT_SECONDS = 20.0
MAX_OUTPUT_TOKENS = 600


class LLMError(Exception):
    """LLM 호출 실패 (키 없음, 네트워크 오류, 응답 이상 등)"""


def is_llm_configured() -> bool:
    return bool(settings.llm_api_key)


def ask_llm(system_prompt: str, user_message: str) -> str:
    """
    LLM에게 질문하고 답변 텍스트만 돌려준다.
    실패하면 LLMError 를 발생시킨다.
    """

    if not is_llm_configured():
        raise LLMError("LLM_API_KEY 가 설정되지 않았습니다.")

    provider = (settings.llm_provider or "openai").lower()
    model = settings.llm_model or DEFAULT_MODELS.get(provider)

    if provider == "openai":
        return _ask_openai(model, system_prompt, user_message)

    if provider == "anthropic":
        return _ask_anthropic(model, system_prompt, user_message)

    raise LLMError(f"지원하지 않는 LLM_PROVIDER 입니다: {provider}")


# ---------------------------------------------------------
# OpenAI (Chat Completions)
# ---------------------------------------------------------
def _ask_openai(model: str, system_prompt: str, user_message: str) -> str:

    try:
        response = httpx.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.llm_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "max_tokens": MAX_OUTPUT_TOKENS,
                "temperature": 0.3,
                # JSON 형식으로만 답하도록 강제
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
            },
            timeout=TIMEOUT_SECONDS,
        )
        response.raise_for_status()

        data = response.json()
        return data["choices"][0]["message"]["content"] or ""

    except (httpx.HTTPError, KeyError, IndexError, ValueError) as error:
        raise LLMError(f"OpenAI 호출 실패: {error}") from error


# ---------------------------------------------------------
# Anthropic (Messages API)
# ---------------------------------------------------------
def _ask_anthropic(model: str, system_prompt: str, user_message: str) -> str:

    try:
        response = httpx.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.llm_api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "max_tokens": MAX_OUTPUT_TOKENS,
                "temperature": 0.3,
                "system": system_prompt,
                "messages": [
                    {"role": "user", "content": user_message},
                ],
            },
            timeout=TIMEOUT_SECONDS,
        )
        response.raise_for_status()

        data = response.json()

        return "".join(
            block.get("text", "")
            for block in data.get("content", [])
            if block.get("type") == "text"
        )

    except (httpx.HTTPError, KeyError, ValueError) as error:
        raise LLMError(f"Anthropic 호출 실패: {error}") from error
