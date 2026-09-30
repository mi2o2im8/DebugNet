from typing import List

from pydantic import BaseModel, Field, field_validator


# =========================================================
# 1. 챗봇 질문 Request
# =========================================================

# ---------------------------------------------------------
# POST /api/chatbot
#
# {
#     "message": "가입신청은 어디서 보지?",
#     "history": ["농구 동호회 추천해줘"]      # 선택, 최근 사용자 질문
# }
#
# ⚠ message 에는 "현재 질문만" 담는다.
#   예전처럼 이전 질문을 이어 붙여 보내면
#   1) 이전 추천 질문 때문에 매번 동호회 추천이 실행되고
#   2) 300자를 넘으면 422 오류가 난다.
#
# 로그인 사용자의 user_id는 JWT에서 가져온다.
# ---------------------------------------------------------
class ChatbotRequest(BaseModel):

    message: str = Field(
        ...,
        min_length=1,
        max_length=300,
    )

    history: List[str] = Field(
        default_factory=list,
    )

    @field_validator("history")
    @classmethod
    def _trim_history(cls, value: List[str]) -> List[str]:
        # 개수·길이가 넘쳐도 422 오류 대신 최근 5개, 300자로 정리한다.
        return [
            str(item).strip()[:300]
            for item in value
            if str(item or "").strip()
        ][-5:]


# =========================================================
# 2. 바로가기 버튼
# =========================================================
class ChatbotAction(BaseModel):

    label: str

    path: str


# =========================================================
# 3. 챗봇 답변 Response
# =========================================================

# ---------------------------------------------------------
# answer  : 말풍선 답변
# steps   : "이렇게 진행해보세요" 단계
# actions : 관련 화면 바로가기 (허용된 경로만)
# found   : 답을 찾았는지 (false면 화면에서 자주 묻는 질문 추천)
# ---------------------------------------------------------
class ChatbotResponse(BaseModel):

    answer: str

    steps: List[str] = []

    actions: List[ChatbotAction] = []

    found: bool = True
