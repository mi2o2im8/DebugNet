import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FiBarChart2,
    FiCalendar,
    FiUsers,
    FiMessageCircle,
    FiVolume2,
    FiFileText,
    FiHeart,
    FiChevronRight,
} from "react-icons/fi";
import { GiSoccerBall } from "react-icons/gi";

import BackButton from "../../components/BackButton/BackButton";

import "./Notification.css";


function Notification() {

    const navigate = useNavigate();


    // ⭐ 현재 선택한 알림 카테고리
    const [selectedCategory, setSelectedCategory] = useState("전체");


    // ⭐ 알림 목록
    const [notifications, setNotifications] = useState([
        {
            type: "vote",
            category: "경기",

            title: "아직 참여하지 않은 투표가 있어요",
            content: "2026년 하반기 정기 활동 장소 선정 투표에 아직 참여하지 않았습니다.",
            time: "10분 전",
            Icon: FiBarChart2,

            read: false,

            // ⭐ 투표 상세 화면
            path: "/vote/detail",
        },

        {
            type: "schedule",
            category: "경기",

            title: "내일 활동 일정이 예정되어 있어요",
            content: "강서 풋살 클럽의 정기 활동이 내일 오후 7시에 시작됩니다.",
            time: "1시간 전",
            Icon: FiCalendar,

            read: false,

            // ⭐ 활동 일정
            path: "/my-schedule",
        },

        {
            type: "join",
            category: "동호회",

            title: "새로운 가입 신청이 있어요",
            content: "김지훈님이 우리 동호회에 가입을 신청했습니다.",
            time: "2시간 전",
            Icon: FiUsers,

            read: false,

            // ⭐ 가입 신청 관리
            path: "/club/join-requests",
        },

        {
            type: "matching",
            category: "경기",

            title: "팀 매칭 요청이 도착했어요",
            content: "한강 러닝 크루에서 매칭을 요청했습니다.",
            time: "3시간 전",
            Icon: GiSoccerBall,

            read: true,

            // ⭐ 팀 매칭
            path: "/team-matching",
        },

        {
            type: "comment",
            category: "커뮤니티",

            title: "내 게시글에 새 댓글이 달렸어요",
            content: "이번 주 게스트 구합니다!",
            time: "5시간 전",
            Icon: FiMessageCircle,

            read: true,

            // ⭐ 댓글이 달린 게시글로 이동
            path: "/community",
        },

        {
            type: "result",
            category: "경기",

            title: "투표 결과가 확정되었어요",
            content: "8월 정기 활동 종료 장소 투표 결과를 확인해보세요.",
            time: "어제",
            Icon: FiVolume2,

            read: true,

            // ⭐ 투표 결과
            path: "/vote/result",
        },

        {
            type: "notice",
            category: "동호회",

            title: "서비스 점검 안내",
            content: "9월 12일(금) 오전 2시부터 4시까지 서비스 점검이 진행될 예정입니다.",
            time: "어제",
            Icon: FiFileText,

            read: true,

            // ⭐ 공지사항
            path: "/notice",
        },

        {
            type: "review",
            category: "동호회",

            title: "동호회 활동 후기가 등록되었어요",
            content: "위너스 농구 모임에 새로운 후기가 등록되었습니다.",
            time: "9월 8일",
            Icon: FiHeart,

            read: true,

            // ⭐ 활동 후기
            path: "/activity-review",
        },
    ]);


    // ⭐ 선택된 카테고리의 알림만 표시
    const filteredNotifications =
        selectedCategory === "전체"
            ? notifications
            : notifications.filter(
                (notification) =>
                    notification.category === selectedCategory
            );


    // ⭐ 알림 클릭
    const handleNotificationClick = (notification) => {

        // ⭐ 클릭한 알림 읽음 처리
        setNotifications((prev) =>
            prev.map((item) =>
                item === notification
                    ? {
                        ...item,
                        read: true,
                    }
                    : item
            )
        );


        // ⭐ 해당 페이지로 이동
        if (notification.path) {
            navigate(notification.path);
        }
    };


    // ⭐ 모두 읽음
    const handleReadAll = () => {

        setNotifications((prev) =>
            prev.map((notification) => ({
                ...notification,
                read: true,
            }))
        );
    };


    return (
        <div className="notification-page">

            {/* ⭐ 헤더 */}
            <header className="notification-header">

                {/* ⭐ 뒤로가기 */}
                <BackButton />

                {/* ⭐ 제목 */}
                <h2>알림</h2>

                {/* ⭐ 모두 읽음 */}
                <button
                    type="button"
                    className="notification-read-button"
                    onClick={handleReadAll}
                >
                    모두 읽음
                </button>

            </header>


            {/* ⭐ 알림 카테고리 */}
            <div className="notification-category">

                {["전체", "경기", "동호회", "커뮤니티"].map(
                    (category) => (
                        <button
                            key={category}
                            type="button"
                            className={
                                selectedCategory === category
                                    ? "notification-category-button active"
                                    : "notification-category-button"
                            }
                            onClick={() =>
                                setSelectedCategory(category)
                            }
                        >
                            {category}
                        </button>
                    )
                )}

            </div>


            {/* ⭐ 알림 리스트 */}
            <main className="notification-list">

                {filteredNotifications.map(
                    (notification, index) => {

                        const Icon = notification.Icon;

                        return (
                            <button
                                key={index}
                                type="button"
                                className={`
                                    notification-item
                                    notification-${notification.type}
                                    ${!notification.read
                                        ? "notification-unread"
                                        : ""}
                                `}
                                onClick={() =>
                                    handleNotificationClick(
                                        notification
                                    )
                                }
                            >

                                {/* ⭐ 알림 아이콘 */}
                                <div className="notification-icon">
                                    <Icon />
                                </div>


                                {/* ⭐ 알림 내용 */}
                                <div className="notification-content">

                                    <h3>
                                        {notification.title}
                                    </h3>

                                    <p>
                                        {notification.content}
                                    </p>

                                </div>


                                {/* ⭐ 시간 + 화살표 */}
                                <div className="notification-right">

                                    <span className="notification-time">
                                        {notification.time}
                                    </span>

                                    <FiChevronRight
                                        className="notification-arrow"
                                    />

                                </div>

                            </button>
                        );
                    }
                )}

            </main>

        </div>
    );
}

export default Notification;