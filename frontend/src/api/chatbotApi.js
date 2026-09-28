import { authenticatedRequest } from "./apiClient";

// =========================================================
// 이용 도우미(챗봇) API
//
// Backend: app/routers/chatbot.py
//
// 자주 묻는 질문 버튼은 프론트(chatbotData.js)에서 바로 답하고,
// 직접 입력한 질문만 이 API로 보낸다.
// =========================================================


// =========================================================
// 챗봇에게 질문
//
// POST /api/chatbot
// body: { message }
// 응답: { answer, steps, actions: [{ label, path }], found }
// =========================================================
export const askChatbot = async (message) => {
    return authenticatedRequest(
        "/api/chatbot",
        {
            method: "POST",
            body: {
                message
            }
        }
    );
};
