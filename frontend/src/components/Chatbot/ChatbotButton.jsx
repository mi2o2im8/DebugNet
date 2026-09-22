// 화면에 떠 있는 챗봇 버튼

    import chatbotIcon from "../../assets/img/chatbot/chatbot-icon.png";

    const ChatbotButton = () => {
        return (
            <button className="ClubHome-chatbot-button">
                {/* ⭐ 챗봇 이미지 원형 영역 */}
                <span className="ClubHome-chatbot-icon">
                    <img
                        src={chatbotIcon}
                        alt="이용 도우미"
                    />
                    
                </span>

                {/* ⭐ 챗봇 이름 */}
                <span className="ClubHome-chatbot-text">
                    이용 도우미
                </span>
            </button>
        );
    };

    export default ChatbotButton;