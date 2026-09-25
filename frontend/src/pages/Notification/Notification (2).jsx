import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

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
import BottomNav from "../../components/BottomNav";

import { useNotifications } from "../../context/NotificationContext";

import "./Notification.css";


function Notification() {

    const navigate = useNavigate();


    // ⭐ 알림 데이터는 Context에서 가져옴 (다른 페이지 벨 아이콘과 데이터 공유)
    const {
        notifications,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
    } = useNotifications();


    // ⭐ 이 페이지에 들어올 때마다 최신 알림을 다시 불러옴
    // - Context가 realtime 구독을 놓치는 경우에도, 이 페이지에서만큼은
    //   항상 최신 목록을 보장하기 위함
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);


    // ⭐ 현재 선택한 알림 카테고리
    const [selectedCategory, setSelectedCategory] = useState("전체");


    // ⭐ 알림 타입별 아이콘
    const notificationIcons = {
        vote: FiBarChart2,
        schedule: FiCalendar,
        join: FiUsers,
        matching: GiSoccerBall,
        comment: FiMessageCircle,
        result: FiVolume2,
        notice: FiFileText,
        review: FiHeart,

        // ⭐ 백엔드에서 사용할 수 있는 타입들
        vote_created: FiBarChart2,
        vote_result: FiVolume2,
        schedule_created: FiCalendar,
        schedule_reminder: FiCalendar,
        club_join: FiUsers,
        join_request: FiUsers,
        club_application: FiUsers,
        join_approved: FiUsers,
        join_rejected: FiUsers,
        team_matching: GiSoccerBall,
        community_comment: FiMessageCircle,
        activity_review: FiHeart,
        club_notice: FiFileText,
    };


    // ⭐ 알림 타입에 따른 카테고리
    // ⭐ "전체" 탭은 필터링을 거치지 않고 모든 알림(점검 안내 포함)을 그대로 보여줌
    const getNotificationCategory = (notification) => {

        const type = notification.notification_type || "";
        const relatedType = notification.related_type || "";


        // 경기
        if (
            type.includes("vote") ||
            type.includes("schedule") ||
            type.includes("matching") ||
            type.includes("game") ||
            relatedType === "event" ||
            relatedType === "vote"
        ) {
            return "경기";
        }


        // 커뮤니티
        if (
            type.includes("comment") ||
            type.includes("community") ||
            relatedType === "post" ||
            relatedType === "community"
        ) {
            return "커뮤니티";
        }


        // 동호회 (서비스 점검 안내 등 공지성 알림도 여기 포함 → 전체 탭에서는 그대로 노출됨)
        if (
            type.includes("club") ||
            type.includes("join") ||
            type.includes("notice") ||
            type.includes("review") ||
            relatedType === "club" ||
            relatedType === "member"
        ) {
            return "동호회";
        }


        // 기본값
        return "동호회";
    };


    // ⭐ 알림 타입에 따른 아이콘
    const getNotificationIcon = (notification) => {

        const type = notification.notification_type || "";

        return notificationIcons[type] || FiFileText;
    };


    // ⭐ 알림 클릭 시 이동할 페이지
    const getNotificationPath = (notification) => {

        const type = notification.notification_type || "";
        const relatedType = notification.related_type || "";
        const relatedId = notification.related_id;


        if (type === "vote" || type === "vote_created") {
            return "/vote/detail";
        }

        if (type === "vote_result") {
            return "/vote/result";
        }

        if (
            type === "schedule" ||
            type === "schedule_created" ||
            type === "schedule_reminder"
        ) {
            return "/my-schedule";
        }

        if (type === "club_application") {
            return relatedId ? `/clubs/${relatedId}/manage/members` : null;
        }

        if (
            type === "join" ||
            type === "club_join" ||
            type === "join_request"
        ) {
            return relatedId ? `/clubs/${relatedId}/manage/members` : null;
        }

        if (type === "join_approved") {
            return relatedId ? `/clubs/${relatedId}` : null;
        }

        if (type === "join_rejected") {
            return null;
        }

        if (type === "matching" || type === "team_matching") {
            return "/team-matching";
        }

        if (type === "comment" || type === "community_comment") {
            return "/community";
        }

        if (type === "notice" || type === "club_notice") {
            return "/notice";
        }

        if (type === "review" || type === "activity_review") {
            return "/activity-review";
        }

        if (relatedType === "event") {
            return "/my-schedule";
        }

        if (relatedType === "vote") {
            return "/vote/detail";
        }

        if (relatedType === "post") {
            return "/community";
        }

        if (relatedType === "club") {
            return "/clubs";
        }

        return null;
    };


    // ⭐ 알림 시간 표시
    const formatNotificationTime = (createdAt) => {

        if (!createdAt) {
            return "";
        }

        const createdTime = new Date(createdAt);
        const now = new Date();
        const diff = now.getTime() - createdTime.getTime();

        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) {
            return "방금 전";
        }

        if (minutes < 60) {
            return `${minutes}분 전`;
        }

        if (hours < 24) {
            return `${hours}시간 전`;
        }

        if (days === 1) {
            return "어제";
        }

        if (days < 7) {
            return `${days}일 전`;
        }

        return createdTime.toLocaleDateString("ko-KR", {
            month: "numeric",
            day: "numeric",
        });
    };


    // ⭐ 선택된 카테고리만 표시 ("전체"는 필터 없이 전부 다 표시)
    const filteredNotifications =
        selectedCategory === "전체"
            ? notifications
            : notifications.filter(
                (notification) =>
                    getNotificationCategory(notification) === selectedCategory
            );


    // ⭐ 알림 클릭
    const handleNotificationClick = async (notification) => {

        if (!notification.is_read) {
            await markAsRead(notification.notification_id);
        }

        const path = getNotificationPath(notification);

        if (path) {
            navigate(path);
        }

    };


    return (

        <div className="notification-page">


            {/* ⭐ 헤더 */}
            <header className="notification-header">

                <BackButton />

                <h2>알림</h2>

                <button
                    type="button"
                    className="notification-read-button"
                    onClick={markAllAsRead}
                >
                    모두 읽음
                </button>

            </header>


            {/* ⭐ 알림 카테고리 */}
            <div className="notification-category">

                {["전체", "경기", "동호회", "커뮤니티"].map((category) => (

                    <button
                        key={category}
                        type="button"
                        className={
                            selectedCategory === category
                                ? "notification-category-button active"
                                : "notification-category-button"
                        }
                        onClick={() => setSelectedCategory(category)}
                    >
                        {category}
                    </button>

                ))}

            </div>


            {/* ⭐ 알림 리스트 */}
            <main className="notification-list">

                {loading && (
                    <div className="notification-empty">
                        알림을 불러오는 중...
                    </div>
                )}

                {!loading && filteredNotifications.length === 0 && (
                    <div className="notification-empty">
                        새로운 알림이 없습니다.
                    </div>
                )}

                {!loading &&
                    filteredNotifications.map((notification) => {

                        const Icon = getNotificationIcon(notification);

                        return (

                            <button
                                key={notification.notification_id}
                                type="button"
                                className={`
                                    notification-item
                                    notification-${notification.notification_type}
                                    ${
                                        !notification.is_read
                                            ? "notification-unread"
                                            : ""
                                    }
                                `}
                                onClick={() =>
                                    handleNotificationClick(notification)
                                }
                            >

                                {/* ⭐ 알림 아이콘 */}
                                <div className="notification-icon">
                                    <Icon />
                                </div>

                                {/* ⭐ 알림 내용 */}
                                <div className="notification-content">
                                    <h3>{notification.title}</h3>
                                    <p>{notification.content}</p>
                                </div>

                                {/* ⭐ 안읽음 점 + 시간 + 화살표 */}
                                <div className="notification-right">

                                    {!notification.is_read && (
                                        <span className="notification-dot" />
                                    )}

                                    <span className="notification-time">
                                        {formatNotificationTime(
                                            notification.created_at
                                        )}
                                    </span>

                                    <FiChevronRight className="notification-arrow" />

                                </div>

                            </button>

                        );

                    })}

                <div className="basic-home-bottom-space" />

            </main>

            <BottomNav />

        </div>

    );

}


export default Notification;
