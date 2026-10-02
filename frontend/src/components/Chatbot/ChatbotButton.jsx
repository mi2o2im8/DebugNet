// 화면에 떠 있는 챗봇 버튼

import chatbotIcon from "../../assets/img/chatbot/chatbot-icon.png";
import "./ChatbotButton.css";

// variant
//   "stacked" (기본) : 동그란 버튼 안에 이미지 + 아래 "이용 도우미" 글씨
//   "pill"           : 예전 가로형 (이미지 옆에 글씨)
const ChatbotButton = ({ onClick, variant = "stacked" }) => {
    return (
        <button
            type="button"
            className={
                variant === "pill"
                    ? "club-home-chatbot-button"
                    : "club-home-chatbot-button stacked"
            }
            onClick={onClick}
            aria-label="이용 도우미 열기"
        >
            {/* ⭐ 챗봇 이미지 원형 영역 */}
            <span className="club-home-chatbot-image-wrap">

                <img
                    className="club-home-chatbot-image"
                    src={chatbotIcon}
                    alt="이용 도우미"
                />

            </span>


            {/* ⭐ 챗봇 이름 */}
            <span className="club-home-chatbot-text">
                이용 도우미
            </span>

        </button>
    );
};

export default ChatbotButton;