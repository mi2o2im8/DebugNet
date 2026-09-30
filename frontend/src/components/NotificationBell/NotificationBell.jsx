// =========================================================
// ⭐ 공용 알림 종 버튼
//
// 안 읽은 알림 개수 배지 + 누르면 알림 페이지(/notification)로 이동
// 알림 개수는 NotificationContext(앱 전체 공유)에서 가져온다.
//
// 사용:
//   import NotificationBell from "../../components/NotificationBell/NotificationBell";
//   <NotificationBell />
//
// 페이지마다 위치 · 색을 바꾸고 싶으면 className 을 넘겨서
// 그 페이지 CSS 에서 조절한다.
//   <NotificationBell className="ClubHome-notification" />
// =========================================================

import { useNavigate } from "react-router-dom";
import { FiBell } from "react-icons/fi";

import { useNotifications } from "../../context/NotificationContext";

import "./NotificationBell.css";


// 배지에 보여줄 최대 숫자 (넘으면 "10+")
const MAX_BADGE_COUNT = 10;


function NotificationBell({ className = "" }) {

    const navigate = useNavigate();
    const { unreadCount } = useNotifications();

    const count = Number(unreadCount) || 0;

    return (
        <button
            type="button"
            className={`notification-bell ${className}`.trim()}
            aria-label={
                count > 0
                    ? `알림, 읽지 않은 알림 ${count}개`
                    : "알림"
            }
            onClick={() => navigate("/notification")}
        >
            <FiBell aria-hidden="true" />

            {count > 0 && (
                <span
                    className="notification-bell-badge"
                    aria-hidden="true"
                >
                    {count >= MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : count}
                </span>
            )}
        </button>
    );
}


export default NotificationBell;
