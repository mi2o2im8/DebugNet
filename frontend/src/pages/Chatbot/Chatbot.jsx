// 챗봇 페이지 (이용 도우미)
//
// UX 흐름
// 1. 처음 화면: 인사 + 자주 묻는 질문
// 2. 질문 선택 또는 직접 입력
// 3. 답변 + 진행 단계 + 관련 화면 바로가기
// 4. 답변 평가 + 이어서 볼 질문 추천
//
// - 자주 묻는 질문 버튼: chatbotData.js 에서 바로 답변 (무료, 즉시)
// - 직접 입력한 질문: 백엔드 /api/chatbot → LLM 답변
//   LLM이 실패하면 chatbotData.js 키워드 검색으로 대신 답한다.

import {
    useEffect,
    useRef,
    useState,
} from "react";

import { useNavigate } from "react-router-dom";

import ChatMessage from "../../components/Chatbot/ChatMessage";

import { askChatbot } from "../../api/chatbotApi";

import {
    FAQ_ITEMS,
    WELCOME_QUESTION_IDS,
    findFaqByText,
    getFaqById,
} from "./chatbotData";

import "./Chatbot.css";
import chatbotIcon from "../../assets/img/chatbot/chatbot-icon.png";


const WELCOME_QUESTIONS = WELCOME_QUESTION_IDS
    .map(getFaqById)
    .filter(Boolean);


// ⭐ 메시지 고유 id
let messageSeq = 0;
const createMessageId = () => {
    messageSeq += 1;
    return `msg-${Date.now()}-${messageSeq}`;
};


// =========================================================
// ⭐ 답변 만들기
//
// 모든 답변은 같은 모양으로 맞춘다.
// { kind, text, steps, actions, related }
//   kind: "answer" (답 찾음) / "fallback" (답 못 찾음)
// =========================================================

const FALLBACK_TEXT =
    "아직 그 질문에는 답을 준비하지 못했어요. 아래 질문 중에 궁금한 내용이 있는지 확인해주세요.";

// ⭐ chatbotData.js 항목 → 답변
const replyFromFaq = (faq) => ({
    kind: "answer",
    text: faq.answer,
    steps: faq.steps,
    actions: faq.actions,
    related: faq.related,
});

// ⭐ 로컬 키워드 검색 (LLM 실패 시 대체)
const replyFromLocal = (text, prefix = "") => {

    const faq = findFaqByText(text);

    if (faq) {
        const reply = replyFromFaq(faq);

        return {
            ...reply,
            text: prefix ? `${prefix} ${reply.text}` : reply.text,
        };
    }

    return {
        kind: "fallback",
        text: prefix ? `${prefix} ${FALLBACK_TEXT}` : FALLBACK_TEXT,
        steps: [],
        actions: [],
        related: [],
    };
};


const getBotReply = async ({ faqId, text }) => {

    // 1. 자주 묻는 질문 버튼 → 바로 답변
    if (faqId) {
        const faq = getFaqById(faqId);

        if (faq) {
            return replyFromFaq(faq);
        }
    }

    // 2. 직접 입력 → LLM
    try {

        const data = await askChatbot(text);

        if (!data?.found) {
            return {
                kind: "fallback",
                text: data?.answer || FALLBACK_TEXT,
                steps: [],
                actions: [],
                related: [],
            };
        }

        return {
            kind: "answer",
            text: data.answer,
            steps: data.steps || [],
            actions: data.actions || [],
            related: [],
        };

    } catch (error) {

        console.error("챗봇 API 오류:", error);

        // 질문 횟수 제한: 서버 안내 문구를 그대로 보여준다.
        if (error.status === 429) {
            return {
                kind: "fallback",
                text: error.message,
                steps: [],
                actions: [],
                related: [],
            };
        }

        // 3. LLM을 못 쓰면 키워드 검색으로 대신 답변
        return replyFromLocal(
            text,
            "지금은 AI 답변이 어려워서 자주 묻는 질문에서 찾아봤어요."
        );

    }

};


function Chatbot({ onClose }) {

    const navigate = useNavigate();

    const [messages, setMessages] = useState([]);

    // ⭐ 직접 입력
    const [input, setInput] = useState("");

    // ⭐ 답변 준비 중 (AI 연결 후 로딩 표시용)
    const [isReplying, setIsReplying] = useState(false);

    // ⭐ 자동 스크롤 기준점
    const bottomRef = useRef(null);


    // =========================================================
    // ⭐ 새 메시지가 오면 맨 아래로 스크롤
    // =========================================================

    useEffect(() => {

        bottomRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });

    }, [messages, isReplying]);


    // =========================================================
    // ⭐ 질문 보내기 (버튼 선택 / 직접 입력 공통)
    // =========================================================

    const askQuestion = async ({ faqId = null, text }) => {

        if (isReplying) {
            return;
        }

        setMessages((prev) => [
            ...prev,
            {
                id: createMessageId(),
                type: "user",
                text,
            },
        ]);

        setIsReplying(true);

        try {

            const reply = await getBotReply({ faqId, text });

            setMessages((prev) => [
                ...prev,
                {
                    id: createMessageId(),
                    type: "bot",
                    ...reply,
                    feedback: null,
                },
            ]);

        } catch (error) {

            console.error("챗봇 답변 오류:", error);

            setMessages((prev) => [
                ...prev,
                {
                    id: createMessageId(),
                    type: "bot",
                    kind: "fallback",
                    text: "답변을 불러오지 못했어요. 잠시 후 다시 시도해주세요.",
                    steps: [],
                    actions: [],
                    related: [],
                    feedback: null,
                },
            ]);

        } finally {

            setIsReplying(false);

        }

    };


    const handleQuestionClick = (item) => {
        askQuestion({ faqId: item.id, text: item.label });
    };


    const handleSend = () => {

        const trimmedInput = input.trim();

        if (!trimmedInput) return;

        setInput("");

        askQuestion({ text: trimmedInput });

    };


    // ⭐ 답변 평가
    const handleFeedback = (messageId, value) => {

        setMessages((prev) =>
            prev.map((message) =>
                message.id === messageId
                    ? { ...message, feedback: value }
                    : message
            )
        );

    };


    // ⭐ 관련 화면으로 이동
    const handleActionClick = (path) => {
        onClose?.();
        navigate(path);
    };


    // =========================================================
    // ⭐ 챗봇 답변 (단계 / 바로가기 / 평가 / 추천)
    // =========================================================

    const renderBotExtras = (message) => {

        const {
            kind,
            feedback,
            steps = [],
            actions = [],
            related = [],
        } = message;

        // 답을 못 찾았을 때: 자주 묻는 질문 추천
        if (kind === "fallback") {
            return (
                <div className="chatbot-suggest">
                    {WELCOME_QUESTIONS.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className="chatbot-chip"
                            onClick={() => handleQuestionClick(item)}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            );
        }

        // 이어서 볼 질문: 정해진 추천이 없으면(LLM 답변) 자주 묻는 질문 중 3개
        const relatedItems = (
            related.length > 0
                ? related.map(getFaqById).filter(Boolean)
                : WELCOME_QUESTIONS.slice(0, 3)
        );

        return (
            <div className="chatbot-answer-extra">

                {/* 진행 단계 */}
                {steps.length > 0 && (
                    <div className="chatbot-steps">

                        <strong>이렇게 진행해보세요</strong>

                        <ol>
                            {steps.map((step) => (
                                <li key={step}>{step}</li>
                            ))}
                        </ol>

                    </div>
                )}


                {/* 관련 화면 바로가기 */}
                {actions.length > 0 && (
                    <div className="chatbot-actions">
                        {actions.map((action) => (
                            <button
                                key={action.path}
                                type="button"
                                className="chatbot-action-button"
                                onClick={() =>
                                    handleActionClick(action.path)
                                }
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}


                {/* 답변 평가 */}
                {!feedback && (
                    <div className="chatbot-feedback">

                        <span>답변이 도움이 되었나요?</span>

                        <div className="chatbot-feedback-buttons">
                            <button
                                type="button"
                                onClick={() =>
                                    handleFeedback(message.id, "up")
                                }
                            >
                                👍 도움이 돼요
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    handleFeedback(message.id, "down")
                                }
                            >
                                👎 아쉬워요
                            </button>
                        </div>

                    </div>
                )}


                {/* 평가 후: 이어서 볼 질문 */}
                {feedback && (
                    <div className="chatbot-followup">

                        <p>
                            {feedback === "up"
                                ? "도움이 되었다니 다행이에요! 더 궁금한 점이 있나요?"
                                : "다른 질문으로 다시 찾아볼까요?"}
                        </p>

                        <div className="chatbot-suggest">
                            {relatedItems.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    className="chatbot-chip"
                                    onClick={() =>
                                        handleQuestionClick(item)
                                    }
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                    </div>
                )}

            </div>
        );

    };


    return (
        <div className="chatbot-overlay">

            {/* ⭐ 챗봇 팝업 */}
            <div
                className="chatbot-popup"
                role="dialog"
                aria-label="PlayBridge 이용 도우미"
            >

                {/* ⭐ 상단 헤더 */}
                <div className="chatbot-header">

                    <button
                        type="button"
                        className="chatbot-close"
                        onClick={() => onClose?.()}
                        aria-label="챗봇 닫기"
                    >
                        ×
                    </button>

                    <h2>이용 도우미</h2>

                    <button
                        type="button"
                        className="chatbot-more"
                        aria-label="더보기"
                    >
                        •••
                    </button>

                </div>


                {/* ⭐ 본문 (처음 화면 + 대화가 한 줄로 이어짐) */}
                <div
                    className="chatbot-body"
                    aria-live="polite"
                >

                    {/* ⭐ 처음 화면: 대화가 시작되면 위로 밀려 올라감 */}
                    <div className="chatbot-welcome">

                        <div className="chatbot-icon">
                            <img
                                src={chatbotIcon}
                                alt=""
                            />
                        </div>

                        <h3>
                            안녕하세요! PlayBridge 이용 도우미예요.
                        </h3>

                        <p>
                            무엇을 도와드릴까요?
                        </p>

                    </div>

                    <div className="chatbot-questions">
                        {WELCOME_QUESTIONS.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() =>
                                    handleQuestionClick(item)
                                }
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>


                    {/* ⭐ 대화 내용 */}
                    {messages.length > 0 && (
                        <div className="chatbot-messages">

                            {messages.map((message) => (

                                <div
                                    key={message.id}
                                    className="chatbot-message-group"
                                >

                                    <ChatMessage
                                        type={message.type}
                                        text={message.text}
                                    />

                                    {message.type === "bot" &&
                                        renderBotExtras(message)}

                                </div>

                            ))}

                        </div>
                    )}


                    {/* ⭐ 답변 준비 중 */}
                    {isReplying && (
                        <div className="chat-message bot">
                            <div className="chat-message-bubble chatbot-typing">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    )}

                    <div ref={bottomRef}></div>

                </div>


                {/* ⭐ 대화 중: 자주 묻는 질문 한 줄 (옆으로 스크롤) */}
                {messages.length > 0 && (
                    <div
                        className="chatbot-chip-bar"
                        aria-label="자주 묻는 질문"
                    >
                        {FAQ_ITEMS.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                className="chatbot-chip"
                                onClick={() => handleQuestionClick(item)}
                                disabled={isReplying}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                )}


                {/* ⭐ 하단 입력창 */}
                <div className="chatbot-input-area">

                    <input
                        type="text"
                        placeholder="궁금한 내용을 입력해주세요..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            // 한글 조합 중 Enter 중복 입력 방지
                            if (
                                e.key === "Enter" &&
                                !e.nativeEvent.isComposing
                            ) {
                                handleSend();
                            }
                        }}
                        aria-label="질문 입력"
                    />

                    <button
                        type="button"
                        className="chatbot-send"
                        onClick={handleSend}
                        disabled={isReplying}
                        aria-label="메시지 보내기"
                    >
                        ➤
                    </button>

                </div>

            </div>

        </div>
    );
}

export default Chatbot;
