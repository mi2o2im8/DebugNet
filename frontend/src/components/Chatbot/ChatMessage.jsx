// 챗봇/사용자 메시지

function ChatMessage({ type, text }) {
    return (
        <div className={`chat-message ${type}`}>
            <div className="chat-message-bubble">
                {text}
            </div>
        </div>
    );
}

export default ChatMessage;