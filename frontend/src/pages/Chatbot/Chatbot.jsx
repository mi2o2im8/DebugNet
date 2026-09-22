// 챗봇 페이지

import { useState } from "react";
import ChatMessage from "../../components/Chatbot/ChatMessage";
import "./Chatbot.css";
import chatbotIcon from "../../assets/img/chatbot/chatbot-icon.png";

// ⭐ 자주 묻는 질문
const quickQuestions = [
    {
        question: "🔎 동호회 찾는 방법",
        answer:
            "메인 화면에서 관심 있는 종목과 활동 지역을 선택하면 원하는 동호회를 찾아볼 수 있어요."
    },
    {
        question: "🔄 팀 매칭 방법",
        answer:
            "동호회 상세 페이지에서 팀 매칭에 참여하거나 원하는 조건에 맞는 팀을 찾아볼 수 있어요."
    },
    {
        question: "🗓 일정 등록 방법",
        answer:
            "내 동호회에서 일정을 선택한 후 모임 날짜와 시간을 등록할 수 있어요."
    },
    {
        question: "💬 커뮤니티 이용 방법",
        answer:
            "동호회 커뮤니티에서 게시글과 댓글을 통해 다른 회원들과 소통할 수 있어요."
    },
    {
        question: "⚙ 내 정보 / 설정",
        answer:
            "내 정보 페이지에서 프로필, 활동 정보, 알림 및 설정을 변경할 수 있어요."
    }
];

function Chatbot({ onClose }) {

    const [messages, setMessages] = useState([]);

    // ⭐ 직접 입력
    const [input, setInput] = useState("");

    // ⭐ 지정 질문 클릭
    const handleQuestionClick = (item) => {
        setMessages((prev) => [
            ...prev,
            {
                type: "user",
                text: item.question
            },
            {
                type: "bot",
                text: item.answer
            }
        ]);
    };

    // ⭐ 메시지 보내기
    const handleSend = () => {

        const trimmedInput = input.trim();

        if (!trimmedInput) return;

        setMessages((prev) => [
            ...prev,
            {
                type: "user",
                text: trimmedInput
            },
            {
                type: "bot",
                text:
                    "궁금한 내용을 확인하고 있어요. 현재는 자주 묻는 질문 기능을 먼저 제공하고 있어요."
            }
        ]);

        setInput("");
    };

    return (
        <div className="chatbot-overlay">

            {/* ⭐ 챗봇 팝업 */}
            <div className="chatbot-popup">

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


                {/* ⭐ 본문 */}
                <div className="chatbot-body">

                    {/* ⭐ 처음 화면 */}
                    {messages.length === 0 && (
                        <>
                            <div className="chatbot-welcome">

                                <div className="chatbot-icon">

                                    <img
                                        src={chatbotIcon}
                                        alt="PlayBridge 이용 도우미"
                                    />

                                </div>

                                <h3>
                                    안녕하세요! PlayBridge 이용 도우미예요.
                                </h3>

                                <p>
                                    무엇을 도와드릴까요?
                                </p>

                            </div>


                            {/* ⭐ 지정 질문 */}
                            <div className="chatbot-questions">

                                {quickQuestions.map((item, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() =>
                                            handleQuestionClick(item)
                                        }
                                    >
                                        {item.question}
                                    </button>
                                ))}

                            </div>
                        </>
                    )}


                    {/* ⭐ 대화 내용 */}
                    {messages.length > 0 && (
                        <div className="chatbot-messages">

                            {messages.map((message, index) => (
                                <ChatMessage
                                    key={index}
                                    type={message.type}
                                    text={message.text}
                                />
                            ))}


                            {/* ⭐ 질문 다시 보기 */}
                            <div className="chatbot-questions chatbot-question-again">

                                <span>
                                    자주 묻는 질문
                                </span>

                                {quickQuestions.map((item, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() =>
                                            handleQuestionClick(item)
                                        }
                                    >
                                        {item.question}
                                    </button>
                                ))}

                            </div>

                        </div>
                    )}

                </div>


                {/* ⭐ 하단 입력창 */}
                <div className="chatbot-input-area">

                    <input
                        type="text"
                        placeholder="궁금한 내용을 입력해주세요..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleSend();
                            }
                        }}
                    />

                    <button
                        type="button"
                        className="chatbot-send"
                        onClick={handleSend}
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