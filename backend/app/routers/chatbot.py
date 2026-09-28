from fastapi import APIRouter, Depends

from app.core.security import get_current_user_id

from app.schemas.chatbot import (
    ChatbotRequest,
    ChatbotResponse,
)

from app.services.chatbot_service import ChatbotService


# ---------------------------------------------------------
# PlayBridge 이용 도우미(챗봇) Router
#
# 자주 묻는 질문 버튼은 프론트에서 바로 답하고,
# 사용자가 직접 입력한 질문만 이 API로 LLM에게 보낸다.
# ---------------------------------------------------------
router = APIRouter(
    prefix="/api/chatbot",
    tags=["Chatbot"],
)


# ---------------------------------------------------------
# POST /api/chatbot
#
# Request:
# {
#     "message": "게스트 신청 어떻게 해요?"
# }
#
# Response:
# {
#     "answer": "...",
#     "steps": ["...", "..."],
#     "actions": [{"label": "동호회 찾기", "path": "/clubs/all"}],
#     "found": true
# }
# ---------------------------------------------------------
@router.post(
    "",
    response_model=ChatbotResponse,
)
def ask_chatbot(

    request_data: ChatbotRequest,

    user_id: str = Depends(
        get_current_user_id
    ),
):

    chatbot_service = ChatbotService()

    return chatbot_service.ask(
        user_id=user_id,
        message=request_data.message,
    )
