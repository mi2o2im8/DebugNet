// 뒤로가기 공용 상단 바

import { useNavigate } from "react-router-dom";
import backIcon from "../../assets/img/back.png";

import "./BackButton.css";

// ================================================================
// # BackButton      // 공용 뒤로가기 버튼 컴포넌트.         // ## 사용법
// <BackButton />
// ----------------------
// → 이전 페이지로 이동 (`navigate(-1)`)

// <BackButton to="/Login" />
// → 지정한 경로로 이동

// <BackButton onClick={handleBack} />
// → `handleBack` 실행

// ## 동작 우선순위
// ```text
// onClick → to → navigate(-1)
// ```

// ## Props
// | Props       | 기본값        | 설명           |
// | ----------- | ---------- | ------------ |
// | `to`        | 없음         | 이동할 경로       |
// | `onClick`   | 없음         | 클릭 시 실행할 함수  |
// | `icon`      | `backIcon` | 뒤로가기 아이콘     |
// | `alt`       | `"뒤로가기"`   | 접근성 텍스트      |
// | `className` | `""`       | 추가 CSS 클래스   |
// | `...props`  | -          | button 추가 속성 |

// ## 주의
// `navigate(-1)`은 브라우저 방문 기록을 기준으로 이동함.
// 회원가입처럼 이동 경로가 정해져 있는 경우:

// <BackButton to="/signup/basic" />
// 처럼 `to`를 지정.


function BackButton({
    to,
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

        if (to) {
            navigate(to);
            return;
        }

        navigate(-1);
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