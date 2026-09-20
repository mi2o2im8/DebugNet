// 뒤로가기 공용 상단 바

import { useNavigate } from "react-router-dom";
import backIcon from "../../assets/img/back.png";

import "./BackButton.css";

function BackButton({
    to = "/Login",
    onClick,
    icon = backIcon,
    alt = "뒤로가기",
    className = "",
    ...props
}) {
    const navigate = useNavigate();

    const handleClick = () => {
        if (onClick) {
            onClick();
            return;
        }

        navigate(to);
    };

    return (
        <button
            type="button"
            className={`Back-btn ${className}`}
            onClick={handleClick}
            aria-label={alt}
            {...props}
        >
            <img src={icon} alt={alt} />
        </button>
    );
}

export default BackButton;