import { useEffect, useState } from "react";
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
import BottomNav from "../../components/BottomNav";

import "./Notification.css";

import { supabase } from "../../../supabaseClient";


function Notification() {

    const navigate = useNavigate();


    // ⭐ 현재 선택한 알림 카테고리
    const [selectedCategory, setSelectedCategory] = useState("전체");


    // ⭐ 알림 목록
    const [notifications, setNotifications] = useState([]);


    // ⭐ 로딩
    const [loading, setLoading] = useState(true);


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
        team_matching: GiSoccerBall,
        community_comment: FiMessageCircle,
        activity_review: FiHeart,
        club_notice: FiFileText,
    };


    // ⭐ 알림 타입에 따른 카테고리
    const getNotificationCategory = (notification) => {

        const type =
            notification.notification_type || "";

        const relatedType =
            notification.related_type || "";


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


        // 동호회
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

        const type =
            notification.notification_type || "";


        return (
            notificationIcons[type] ||
            FiFileText
        );
    };


    // ⭐ 알림 클릭 시 이동할 페이지
    const getNotificationPath = (notification) => {

        const type =
            notification.notification_type || "";

        const relatedType =
            notification.related_type || "";

        const relatedId =
            notification.related_id;


        // ⭐ 투표
        if (
            type === "vote" ||
            type === "vote_created"
        ) {
            return "/vote/detail";
        }


        // ⭐ 투표 결과
        if (type === "vote_result") {
            return "/vote/result";
        }


        // ⭐ 일정
        if (
            type === "schedule" ||
            type === "schedule_created" ||
            type === "schedule_reminder"
        ) {
            return "/my-schedule";
        }


        // ⭐ 가입 신청
        if (
            type === "join" ||
            type === "club_join" ||
            type === "join_request" ||
            type === "club_application"
        ) {
            return "/club/join-requests";
        }


        // ⭐ 팀 매칭
        if (
            type === "matching" ||
            type === "team_matching"
        ) {
            return "/team-matching";
        }


        // ⭐ 댓글
        if (
            type === "comment" ||
            type === "community_comment"
        ) {
            return "/community";
        }


        // ⭐ 공지
        if (
            type === "notice" ||
            type === "club_notice"
        ) {
            return "/notice";
        }


        // ⭐ 활동 후기
        if (
            type === "review" ||
            type === "activity_review"
        ) {
            return "/activity-review";
        }


        // ⭐ related_type 기준 보조 처리
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


        // ⭐ 이동할 페이지가 없으면 알림 화면 유지
        return null;
    };


    // ⭐ 알림 시간 표시
    const formatNotificationTime = (createdAt) => {

        if (!createdAt) {
            return "";
        }


        const createdTime =
            new Date(createdAt);

        const now = new Date();


        const diff =
            now.getTime() -
            createdTime.getTime();


        const minutes = Math.floor(
            diff / (1000 * 60)
        );


        const hours = Math.floor(
            diff / (1000 * 60 * 60)
        );


        const days = Math.floor(
            diff / (1000 * 60 * 60 * 24)
        );


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


        return createdTime.toLocaleDateString(
            "ko-KR",
            {
                month: "numeric",
                day: "numeric",
            }
        );
    };


    // ⭐ DB에서 알림 조회
    useEffect(() => {

        const fetchNotifications = async () => {

            try {

                setLoading(true);


                // ⭐ 현재 로그인 사용자
                const {
                    data: {
                        user,
                    },
                    error: userError,
                } = await supabase.auth.getUser();


                if (userError) {
                    throw userError;
                }


                if (!user) {

                    console.log(
                        "⭐ 로그인한 사용자가 없습니다."
                    );

                    setNotifications([]);

                    return;
                }


                // ⭐ 실제 notifications 테이블 컬럼만 조회
                const {
                    data,
                    error,
                } = await supabase
                    .from("notifications")
                    .select(`
                        notification_id,
                        user_id,
                        notification_type,
                        title,
                        content,
                        related_type,
                        related_id,
                        is_read,
                        created_at
                    `)
                    .eq("user_id", user.id)
                    .order("created_at", {
                        ascending: false,
                    });


                if (error) {
                    throw error;
                }


                console.log(
                    "⭐ 알림 DB:",
                    data
                );


                setNotifications(
                    data || []
                );

            } catch (error) {

                console.error(
                    "알림 조회 오류:",
                    error
                );

                setNotifications([]);

            } finally {

                setLoading(false);

            }
        };


        fetchNotifications();

    }, []);


    // ⭐ 선택된 카테고리만 표시
    const filteredNotifications =
        selectedCategory === "전체"
            ? notifications
            : notifications.filter(
                (notification) =>
                    getNotificationCategory(
                        notification
                    ) === selectedCategory
            );


    // ⭐ 알림 클릭
    const handleNotificationClick = async (
        notification
    ) => {

        try {

            // ⭐ 읽지 않은 알림만 DB 업데이트
            if (!notification.is_read) {

                const {
                    error,
                } = await supabase
                    .from("notifications")
                    .update({
                        is_read: true,
                    })
                    .eq(
                        "notification_id",
                        notification.notification_id
                    );


                if (error) {
                    throw error;
                }

            }


            // ⭐ 화면에서도 읽음 처리
            setNotifications((prev) =>
                prev.map((item) =>
                    item.notification_id ===
                    notification.notification_id
                        ? {
                            ...item,
                            is_read: true,
                        }
                        : item
                )
            );


            // ⭐ 이동할 페이지
            const path =
                getNotificationPath(
                    notification
                );


            if (path) {
                navigate(path);
            }

        } catch (error) {

            console.error(
                "알림 읽음 처리 오류:",
                error
            );

        }

    };


    // ⭐ 모두 읽음
    const handleReadAll = async () => {

        try {

            // ⭐ 현재 로그인 사용자
            const {
                data: {
                    user,
                },
                error: userError,
            } = await supabase.auth.getUser();


            if (userError) {
                throw userError;
            }


            if (!user) {
                return;
            }


            // ⭐ DB에서 모두 읽음 처리
            const {
                error,
            } = await supabase
                .from("notifications")
                .update({
                    is_read: true,
                })
                .eq("user_id", user.id)
                .eq("is_read", false);


            if (error) {
                throw error;
            }


            // ⭐ 화면에서도 모두 읽음
            setNotifications((prev) =>
                prev.map((notification) => ({
                    ...notification,
                    is_read: true,
                }))
            );


        } catch (error) {

            console.error(
                "모두 읽음 처리 오류:",
                error
            );

        }

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

                {[
                    "전체",
                    "경기",
                    "동호회",
                    "커뮤니티",
                ].map(
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
                                setSelectedCategory(
                                    category
                                )
                            }
                        >
                            {category}
                        </button>

                    )
                )}

            </div>


            {/* ⭐ 알림 리스트 */}
            <main className="notification-list">


                {/* ⭐ 로딩 */}
                {loading && (

                    <div className="notification-empty">
                        알림을 불러오는 중...
                    </div>

                )}


                {/* ⭐ 알림 없음 */}
                {!loading &&
                    filteredNotifications.length === 0 && (

                        <div className="notification-empty">
                            새로운 알림이 없습니다.
                        </div>

                    )}


                {/* ⭐ 알림 목록 */}
                {!loading &&
                    filteredNotifications.map(
                        (notification) => {

                            const Icon =
                                getNotificationIcon(
                                    notification
                                );


                            const category =
                                getNotificationCategory(
                                    notification
                                );


                            return (

                                <button
                                    key={
                                        notification.notification_id
                                    }
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

                                            {formatNotificationTime(
                                                notification.created_at
                                            )}

                                        </span>


                                        <FiChevronRight
                                            className="notification-arrow"
                                        />

                                    </div>


                                </button>

                            );

                        }
                    )}


                <div className="basic-home-bottom-space" />


            </main>

            {/* ⭐ 공통 하단 네비게이션 */}
            <BottomNav />


        </div>

    );

}


export default Notification;