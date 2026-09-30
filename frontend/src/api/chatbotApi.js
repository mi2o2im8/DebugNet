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
// body: { message, history }
//   message : 현재 질문만 (최대 300자)
//   history : 최근 사용자 질문 (맥락 참고용, 최대 5개)
// 응답: { answer, steps, actions: [{ label, path }], found }
//
// ⚠ 이전 질문을 message에 이어 붙이지 않는다.
//   (이전 추천 질문 때문에 매번 동호회 추천이 실행되던 원인)
// =========================================================
export const askChatbot = async (message, history = []) => {
    return authenticatedRequest(
        "/api/chatbot",
        {
            method: "POST",
            body: {
                message: String(message || "").slice(0, 300),
                history: history
                    .map((item) => String(item || "").slice(0, 300))
                    .filter(Boolean)
                    .slice(-5),
            }
        }
    );
};
