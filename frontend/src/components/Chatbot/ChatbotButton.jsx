// 화면에 떠 있는 챗봇 버튼

import chatbotIcon from "../../assets/img/chatbot/chatbot-icon.png";
import "./ChatbotButton.css";

const ChatbotButton = () => {
    return (
        <button className="club-home-chatbot-button">
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