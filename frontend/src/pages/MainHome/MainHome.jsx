// 가입 후 메인 홈

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import BottomNav from "../../components/BottomNav";
import "./MainHome.css";

import { supabase } from "../../../supabaseClient";

// ⭐ API
import { getMyClub } from "../../api/clubApi";

// ⭐ 이미지
import profileIcon from "../../assets/img/basic_profile_img.png";
import createClubImage from "../../assets/img/playbridge_16_assets/create_club.png";
import calendarIcon from "../../assets/img/playbridge_16_assets/calendar_icon.png";
import activityIcon from "../../assets/img/playbridge_16_assets/activity.png";
import backIcon from "../../assets/img/back.png";

import soccerImage from "../../assets/img/playbridge_16_assets/soccer.png";
import basketballImage from "../../assets/img/playbridge_16_assets/basketball.png";
import badmintonImage from "../../assets/img/playbridge_16_assets/badminton.png";
import climbingImage from "../../assets/img/playbridge_16_assets/climbing.png";
import runningImage from "../../assets/img/playbridge_16_assets/running.png";
import yogaImage from "../../assets/img/playbridge_16_assets/16_yoga.png";
import volleyballImage from "../../assets/img/volleyball.png";

// ⭐ 챗봇
import ChatbotButton from "../../components/Chatbot/ChatbotButton";
import Chatbot from "../Chatbot/Chatbot";


function MainHome() {

    const navigate = useNavigate();


    // =========================================================
    // ⭐ 가입 후 메인 홈 진입 기준
    //
    // - 운영 중인 동호회가 있으면 진입 가능
    // - 운영자 승인 후 active 회원이면 진입 가능
    // - 둘 다 없으면 가입 전 메인으로 이동
    // =========================================================

    const [
        isMainHomeAccessChecked,
        setIsMainHomeAccessChecked,
    ] = useState(false);


    // ⭐ 현재 동호회 ID
    const [clubId, setClubId] = useState(null);


    // =========================================================
    // ⭐ 사용자 정보
    // =========================================================

    const [userName, setUserName] = useState(
        () =>
            localStorage.getItem(
                "playbridge_user_nickname"
            ) || ""
    );


    const [profileImage, setProfileImage] = useState(
        () =>
            localStorage.getItem(
                "playbridge_profile_image"
            ) || ""
    );


    // =========================================================
    // ⭐ 알림
    // =========================================================

    const [
        unreadNotificationCount,
        setUnreadNotificationCount,
    ] = useState(0);


    // =========================================================
    // ⭐ 달력 / 챗봇
    // =========================================================

    const today = new Date();


    const todayString =
        `${today.getFullYear()}-${String(
            today.getMonth() + 1
        ).padStart(2, "0")}-${String(
            today.getDate()
        ).padStart(2, "0")}`;


    const [selectedDate, setSelectedDate] =
        useState(todayString);


    const [isChatbotOpen, setIsChatbotOpen] =
        useState(false);


    // =========================================================
    // ⭐ 일정 참여 상태
    // =========================================================

    const [participated, setParticipated] =
        useState({
            0: false,
            1: false,
            2: false,
        });


    // =========================================================
    // ⭐ 내 동호회
    // =========================================================

    const clubs = [

        {
            name: "강서 FC",
            sport: "축구",
            members: "12명",
            image: soccerImage,
            alt: "강서 FC",
            leader: true,
        },

        {
            name: "강서 배구모임",
            sport: "배구",
            members: "8명",
            image: volleyballImage,
            alt: "강서 배구모임",
        },

        {
            name: "서툴쪽 친구들",
            sport: "배드민턴",
            members: "6명",
            image: badmintonImage,
            alt: "서툴쪽 친구들",
        },

    ];


    // =========================================================
    // ⭐ 일정
    // =========================================================

    const schedules = [

        {
            date: "2026-09-23",
            time: "19:00",
            endTime: "21:00",
            image: soccerImage,
            alt: "강서 FC",
            title: "강서 FC 정기모임",
            place: "강서구 체육공원 1구장",
        },

        {
            date: "2026-09-25",
            time: "18:30",
            endTime: "20:30",
            image: volleyballImage,
            alt: "강서 배구모임",
            title: "강서 배구모임",
            place: "강서 배구실내체육관",
        },

        {
            date: "2026-09-27",
            time: "16:00",
            endTime: "18:00",
            image: badmintonImage,
            alt: "서툴쪽 친구들",
            title: "서툴쪽 친구들 연습",
            place: "강서구 배드민턴장",
        },

    ];


    // =========================================================
    // ⭐ 게스트 모집
    // =========================================================

    const guests = [

        {
            image: soccerImage,
            alt: "미국 풋살 모임",
            title: "미국 풋살 모임",
            time: "수요일 오후 19:00",
            place: "마곡 풋살장",
        },

        {
            image: basketballImage,
            alt: "아하 농구 모임",
            title: "아하 농구 모임",
            time: "토요일 17:00",
            place: "한강 농구공원",
        },

        {
            image: runningImage,
            alt: "러닝 함께해요",
            title: "러닝 함께해요",
            time: "일요일 07:00",
            place: "한강공원",
        },

        {
            image: climbingImage,
            alt: "클라이밍 입문",
            title: "클라이밍 입문",
            time: "매주 화 19:00",
            place: "강서 클라이밍장",
        },

    ];


    // =========================================================
    // ⭐ 커뮤니티
    // =========================================================

    const posts = [

        {
            id: 1,
            category: "자유게시판",
            title: "이번 주말 같이 운동하실 분 있나요?",
            description: "근처에서 가볍게 운동하실 분 구해요!",
            date: "오늘",
            comments: "댓글 5",
        },

        {
            id: 2,
            category: "운동정보",
            title: "초보자도 쉽게 할 수 있는 운동 추천",
            description: "처음 시작하는 분들에게 추천하는 운동이에요.",
            date: "어제",
            comments: "댓글 3",
        },

        {
            id: 3,
            category: "모집",
            title: "강서구 배드민턴 함께 하실 분!",
            description: "주말에 같이 운동할 분들을 찾고 있어요.",
            date: "어제",
            comments: "댓글 8",
        },

    ];


    // =========================================================
    // ⭐ 활동 추천
    // =========================================================

    const activities = [

        {
            image: soccerImage,
            alt: "축구",
            category: "운동",
            title: "축구 모임",
            place: "강서구",
        },

        {
            image: basketballImage,
            alt: "농구",
            category: "운동",
            title: "농구 모임",
            place: "강서구",
        },

        {
            image: runningImage,
            alt: "러닝",
            category: "운동",
            title: "러닝 크루",
            place: "한강공원",
        },

        {
            image: yogaImage,
            alt: "요가",
            category: "문화",
            title: "요가 클래스",
            place: "강서구",
        },

    ];


    // =========================================================
    // ⭐ MainHome 진입 권한 확인
    //
    // 운영 중인 동호회가 있거나
    // 운영자 승인 후 가입한 동호회가 있으면 진입
    // =========================================================

    useEffect(() => {

        let isActive = true;


        const checkMainHomeAccess =
            async () => {

                try {

                    const myClub =
                        await getMyClub();


                    console.log(
                        "⭐ 내 동호회 정보:",
                        myClub
                    );


                    const hasOperatingClub =
                        Boolean(
                            myClub?.operating_club
                        );


                    const hasJoinedClub =
                        Boolean(
                            myClub?.joined_club
                        );


                    // ⭐ ClubEventList 이동에 사용할 실제 동호회 ID
                    const currentClubId =
                        myClub?.operating_club?.club_id ||
                        myClub?.operating_club?.id ||
                        myClub?.joined_club?.club_id ||
                        myClub?.joined_club?.id ||
                        null;

                    if (isActive) {
                        setClubId(currentClubId);
                    }


                    // -----------------------------------------
                    // ⭐ 운영 동호회도 없고
                    // ⭐ 가입 승인 동호회도 없는 경우
                    // -----------------------------------------

                    if (
                        !hasOperatingClub &&
                        !hasJoinedClub
                    ) {

                        navigate(
                            "/main",
                            {
                                replace: true,
                            }
                        );

                        return;
                    }


                    // -----------------------------------------
                    // ⭐ MainHome 진입 허용
                    // -----------------------------------------

                    if (isActive) {

                        setIsMainHomeAccessChecked(
                            true
                        );

                    }

                } catch (error) {

                    console.error(
                        "가입 후 메인 홈 진입 권한 확인 오류:",
                        error
                    );


                    if (isActive) {

                        navigate(
                            "/main",
                            {
                                replace: true,
                            }
                        );

                    }

                }

            };


        checkMainHomeAccess();


        return () => {

            isActive = false;

        };

    }, [navigate]);


    // =========================================================
    // ⭐ 사용자 정보 + 알림 조회
    // =========================================================

    useEffect(() => {

        let isActive = true;

        let notificationChannel = null;


        const getUserInfo =
            async () => {

                try {

                    // -----------------------------------------
                    // ⭐ 현재 로그인 사용자
                    // -----------------------------------------

                    const {
                        data: {
                            user,
                        },
                    } =
                        await supabase.auth.getUser();


                    if (
                        !user ||
                        !isActive
                    ) {

                        return;

                    }


                    // -----------------------------------------
                    // ⭐ 사용자 정보
                    // -----------------------------------------

                    const {
                        data,
                        error,
                    } =
                        await supabase
                            .from("users")
                            .select(
                                "nickname, profile_image"
                            )
                            .eq(
                                "user_id",
                                user.id
                            )
                            .maybeSingle();


                    if (error) {

                        console.error(
                            "가입 후 홈 사용자 정보 조회 오류:",
                            error
                        );

                    } else if (
                        isActive &&
                        data
                    ) {

                        // ⭐ 닉네임

                        if (
                            data.nickname
                        ) {

                            setUserName(
                                data.nickname
                            );


                            localStorage.setItem(
                                "playbridge_user_nickname",
                                data.nickname
                            );

                        }


                        // ⭐ 프로필 이미지

                        if (
                            data.profile_image
                        ) {

                            setProfileImage(
                                data.profile_image
                            );


                            localStorage.setItem(
                                "playbridge_profile_image",
                                data.profile_image
                            );

                        } else {

                            setProfileImage("");


                            localStorage.removeItem(
                                "playbridge_profile_image"
                            );

                        }

                    }


                    // -----------------------------------------
                    // ⭐ 안 읽은 알림 개수
                    // -----------------------------------------

                    const {
                        count,
                        error:
                            notificationError,
                    } =
                        await supabase
                            .from("notifications")
                            .select(
                                "notification_id",
                                {
                                    count: "exact",
                                    head: true,
                                }
                            )
                            .eq(
                                "user_id",
                                user.id
                            )
                            .eq(
                                "is_read",
                                false
                            );


                    if (
                        notificationError
                    ) {

                        console.error(
                            "안 읽은 알림 개수 조회 오류:",
                            notificationError
                        );

                    } else if (
                        isActive
                    ) {

                        setUnreadNotificationCount(
                            count || 0
                        );

                    }


                    // -----------------------------------------
                    // ⭐ 알림 실시간 갱신
                    //
                    // 반드시
                    // channel()
                    // → on()
                    // → subscribe()
                    // 순서
                    // -----------------------------------------

                    const channelName =
                        `main-home-notifications-${user.id}`;


                    notificationChannel =
                        supabase.channel(
                            channelName
                        );


                    notificationChannel.on(
                        "postgres_changes",
                        {
                            event: "*",
                            schema: "public",
                            table: "notifications",
                            filter:
                                `user_id=eq.${user.id}`,
                        },
                        async () => {

                            try {

                                const {
                                    count:
                                        latestCount,
                                    error,
                                } =
                                    await supabase
                                        .from(
                                            "notifications"
                                        )
                                        .select(
                                            "notification_id",
                                            {
                                                count:
                                                    "exact",
                                                head: true,
                                            }
                                        )
                                        .eq(
                                            "user_id",
                                            user.id
                                        )
                                        .eq(
                                            "is_read",
                                            false
                                        );


                                if (error) {

                                    console.error(
                                        "알림 개수 실시간 갱신 오류:",
                                        error
                                    );

                                    return;
                                }


                                if (
                                    isActive
                                ) {

                                    setUnreadNotificationCount(
                                        latestCount ||
                                            0
                                    );

                                }

                            } catch (
                                realtimeError
                            ) {

                                console.error(
                                    "알림 실시간 갱신 오류:",
                                    realtimeError
                                );

                            }

                        }
                    );


                    // -----------------------------------------
                    // ⭐ on 등록 후 마지막에 subscribe
                    // -----------------------------------------

                    notificationChannel.subscribe(
                        (status) => {

                            console.log(
                                "알림 realtime 상태:",
                                status
                            );

                        }
                    );

                } catch (error) {

                    console.error(
                        "가입 후 홈 사용자/알림 정보 조회 오류:",
                        error
                    );

                }

            };


        getUserInfo();


        // =====================================================
        // ⭐ Cleanup
        // =====================================================

        return () => {

            isActive = false;


            if (
                notificationChannel
            ) {

                supabase.removeChannel(
                    notificationChannel
                );

                notificationChannel = null;

            }

        };

    }, []);


    // =========================================================
    // ⭐ 일정 참여 / 취소
    // =========================================================

    const handleParticipation =
        (index) => {

            setParticipated(
                (prev) => ({
                    ...prev,
                    [index]:
                        !prev[index],
                })
            );

        };


    // =========================================================
    // ⭐ 선택 날짜 일정
    // =========================================================

    const selectedSchedules =
        schedules.filter(
            (schedule) =>
                schedule.date ===
                selectedDate
        );


    // =========================================================
    // ⭐ MainHome 접근 확인 중
    //
    // ⭐ 중요:
    // 모든 Hook 실행 후 return 해야 함
    // =========================================================

    if (
        !isMainHomeAccessChecked
    ) {

        return (
            <div className="main-home-loading">
                동호회 정보를 확인하는 중...
            </div>
        );

    }


    // =========================================================
    // ⭐ 화면
    // =========================================================

    return (

        <div className="main-home">

            <main className="main-home-main">


                {/* =====================================================
                    ⭐ 상단 인사
                ===================================================== */}

                <section className="main-welcome-section">

                    <div className="main-welcome-content">

                        <div className="main-welcome-text">

                            <h2>

                                안녕하세요,{" "}

                                {userName
                                    ? `${userName}님!`
                                    : "회원님!"}

                            </h2>


                            <p>
                                다양한 동호회와 활동을 만나보세요.
                            </p>

                        </div>


                        <div className="main-welcome-actions">

                            {/* ⭐ 알림 */}

                            <Link
                                to="/notification"
                                className="main-welcome-icon notification-icon-wrap"
                                aria-label="알림"
                            >

                                <svg
                                    className="notification-icon-svg"
                                    viewBox="0 0 24 24"
                                    width="22"
                                    height="22"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >

                                    <path
                                        d="M18 8C18 4.686 15.314 2 12 2C8.686 2 6 4.686 6 8C6 14 3 16 3 18H21C21 16 18 14 18 8Z"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />

                                    <path
                                        d="M10 21H14"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                    />

                                </svg>


                                {unreadNotificationCount > 0 && (

                                    <span className="notification-badge">

                                        {unreadNotificationCount >=
                                        10
                                            ? "10+"
                                            : unreadNotificationCount}

                                    </span>

                                )}

                            </Link>


                            {/* ⭐ 프로필 */}

                            <Link
                                to="/mypage"
                                className="main-welcome-icon"
                                aria-label="내 정보"
                            >

                                <img
                                    src={
                                        profileImage ||
                                        profileIcon
                                    }
                                    alt="내 정보"
                                    onError={(e) => {

                                        e.currentTarget.src =
                                            profileIcon;

                                    }}
                                />

                            </Link>

                        </div>

                    </div>

                </section>


                {/* =====================================================
                    ⭐ 내 동호회
                ===================================================== */}

                <section className="my-club-section">

                    <div className="section-header">

                        <h3>
                            내 동호회
                        </h3>

                        <span className="section-more">
                            내 동호회를 만들어보세요!
                        </span>

                    </div>


                    <div className="my-club-list">

                        {clubs.map(
                            (club) => (

                                <Link
                                    key={club.name}
                                    to="/clubs"
                                    className="my-club-card"
                                >

                                    <div className="my-club-image">

                                        {club.leader && (

                                            <span className="club-badge">
                                                대표
                                            </span>

                                        )}


                                        <img
                                            src={
                                                club.image
                                            }
                                            alt={
                                                club.alt
                                            }
                                        />


                                        <span className="club-option">
                                            •••
                                        </span>

                                    </div>


                                    <div className="my-club-info">

                                        <h4>
                                            {club.name}
                                        </h4>

                                        <p>
                                            {club.sport}
                                        </p>

                                    </div>


                                    <div className="my-club-status">

                                        <span>
                                            활동 중
                                        </span>

                                        <span>
                                            {club.members}
                                        </span>

                                    </div>

                                </Link>

                            )
                        )}


                        <Link
                            to="/clubs/create"
                            className="my-club-create-card"
                        >

                            <img
                                src={
                                    createClubImage
                                }
                                alt="동호회 만들기"
                            />

                            <p>
                                내 동호회를
                                <br />
                                만들어보세요!
                            </p>

                        </Link>

                    </div>

                </section>


                {/* =====================================================
                    ⭐ 이번 달 일정
                ===================================================== */}

                <section className="main-schedule-section">

                    <div className="section-header">

                        <div className="section-title">

                            <img
                                src={
                                    calendarIcon
                                }
                                alt="일정"
                            />

                            <h3>
                                이번 달 일정
                            </h3>

                        </div>


                        <Link
                            to={clubId ? `/clubs/${clubId}/manage/events` : "/myschedule"}
                            className="section-more"
                        >
                            전체 일정 보기

                            <img
                                src={backIcon}
                                alt="이동"
                            />
                        </Link>

                    </div>


                    {/* ⭐ 월간 달력 */}

                    <MainHomeCalendar
                        selectedDate={
                            selectedDate
                        }
                        onSelectDate={
                            setSelectedDate
                        }
                        schedules={
                            schedules
                        }
                    />


                    {/* ⭐ 선택한 날짜 일정 */}

                    <div className="schedule-list">

                        {selectedSchedules.length >
                        0 ? (

                            selectedSchedules.map(
                                (schedule) => {

                                    const scheduleIndex =
                                        schedules.indexOf(
                                            schedule
                                        );


                                    return (

                                        <div
                                            className="schedule-item"
                                            key={
                                                schedule.title
                                            }
                                        >

                                            <div className="schedule-time">

                                                <span>
                                                    {
                                                        schedule.time
                                                    }
                                                </span>

                                                <span>
                                                    ~
                                                    {
                                                        schedule.endTime
                                                    }
                                                </span>

                                            </div>


                                            <img
                                                src={
                                                    schedule.image
                                                }
                                                alt={
                                                    schedule.alt
                                                }
                                            />


                                            <div className="schedule-info">

                                                <h4>
                                                    {
                                                        schedule.title
                                                    }
                                                </h4>

                                                <p>
                                                    {
                                                        schedule.place
                                                    }
                                                </p>

                                            </div>


                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleParticipation(
                                                        scheduleIndex
                                                    )
                                                }
                                                className={
                                                    participated[
                                                        scheduleIndex
                                                    ]
                                                        ? "participated"
                                                        : ""
                                                }
                                            >

                                                {
                                                    participated[
                                                        scheduleIndex
                                                    ]
                                                        ? "참여 취소"
                                                        : "참여 예정"
                                                }

                                            </button>

                                        </div>

                                    );

                                }
                            )

                        ) : (

                            <div className="main-home-no-schedule">
                                선택한 날짜에 일정이 없습니다.
                            </div>

                        )}

                    </div>


                    {/* ⭐ 전체 일정 */}

                    <Link
                        to="/myschedule"
                        className="schedule-all-button"
                    >
                        전체 일정 보기
                    </Link>

                </section>


                {/* =====================================================
                    ⭐ 게스트 모집
                ===================================================== */}

                <section className="guest-section">

                    <div className="section-header">

                        <div className="section-title">

                            <img
                                src={
                                    activityIcon
                                }
                                alt="게스트 모집"
                            />

                            <h3>
                                다른 동호회 게스트 모집
                            </h3>

                        </div>


                        <Link
                            to="/clubs"
                            className="section-more"
                        >

                            더보기

                            <img
                                src={backIcon}
                                alt="이동"
                            />

                        </Link>

                    </div>


                    <div className="guest-list">

                        {guests.map(
                            (guest) => (

                                <Link
                                    key={
                                        guest.title
                                    }
                                    to="/clubs"
                                    className="guest-card"
                                >

                                    <img
                                        src={
                                            guest.image
                                        }
                                        alt={
                                            guest.alt
                                        }
                                    />

                                    <h4>
                                        {
                                            guest.title
                                        }
                                    </h4>

                                    <p>
                                        {
                                            guest.time
                                        }
                                    </p>

                                    <p>
                                        {
                                            guest.place
                                        }
                                    </p>

                                    <span>
                                        자세히 보기
                                    </span>

                                </Link>

                            )
                        )}

                    </div>

                </section>


                {/* =====================================================
                    ⭐ 커뮤니티
                ===================================================== */}

                <section className="community-section">

                    <div className="section-header">

                        <h3>
                            커뮤니티
                        </h3>


                        <Link
                            to="/community"
                            className="section-more"
                        >

                            더보기

                            <img
                                src={backIcon}
                                alt="이동"
                            />

                        </Link>

                    </div>


                    <div className="community-list">

                        {posts.map(
                            (post) => (

                                <Link
                                    key={
                                        post.id
                                    }
                                    to={
                                        `/community/post/${post.id}`
                                    }
                                    className="community-card"
                                >

                                    <span className="community-category">
                                        {
                                            post.category
                                        }
                                    </span>


                                    <h4>
                                        {
                                            post.title
                                        }
                                    </h4>


                                    <p>
                                        {
                                            post.description
                                        }
                                    </p>


                                    <div className="community-meta">

                                        <span>
                                            {
                                                post.date
                                            }
                                        </span>

                                        <span>
                                            {
                                                post.comments
                                            }
                                        </span>

                                    </div>

                                </Link>

                            )
                        )}

                    </div>

                </section>


                {/* =====================================================
                    ⭐ 이런 활동도 있어요
                ===================================================== */}

                <section className="activity-section">

                    <div className="section-header">

                        <div className="section-title">

                            <img
                                src={
                                    activityIcon
                                }
                                alt="활동 추천"
                            />

                            <h3>
                                이런 활동도 있어요
                            </h3>

                        </div>

                    </div>


                    <div className="activity-list">

                        {activities.map(
                            (activity) => (

                                <Link
                                    key={
                                        activity.title
                                    }
                                    to="/clubs"
                                    className="activity-card"
                                >

                                    <div className="activity-image">

                                        <span className="activity-category">
                                            {
                                                activity.category
                                            }
                                        </span>


                                        <img
                                            src={
                                                activity.image
                                            }
                                            alt={
                                                activity.alt
                                            }
                                        />

                                    </div>


                                    <h4>
                                        {
                                            activity.title
                                        }
                                    </h4>


                                    <p>
                                        {
                                            activity.place
                                        }
                                    </p>


                                    <span className="activity-action">
                                        자세히 보기
                                    </span>

                                </Link>

                            )
                        )}

                    </div>

                </section>

            </main>


            {/* ⭐ 챗봇 */}

            {!isChatbotOpen && (

                <ChatbotButton
                    onClick={() =>
                        setIsChatbotOpen(
                            true
                        )
                    }
                />

            )}


            {isChatbotOpen && (

                <Chatbot
                    onClose={() =>
                        setIsChatbotOpen(
                            false
                        )
                    }
                />

            )}


            {/* ⭐ 하단 네비 */}

            <BottomNav />

        </div>

    );
}


// =========================================================
// ⭐ 메인 홈 월간 달력
// =========================================================

function MainHomeCalendar({
    selectedDate,
    onSelectDate,
    schedules = [],
}) {

    const today = new Date();


    const [viewYear, setViewYear] =
        useState(
            today.getFullYear()
        );


    const [viewMonth, setViewMonth] =
        useState(
            today.getMonth() + 1
        );


    // =========================================================
    // ⭐ 날짜가 선택되면 해당 월로 이동
    // =========================================================

    useEffect(() => {

        if (!selectedDate) {
            return;
        }


        const [
            year,
            month,
        ] = selectedDate
            .split("-")
            .map(Number);


        setViewYear(year);
        setViewMonth(month);

    }, [selectedDate]);


    // =========================================================
    // ⭐ 일정 날짜
    // =========================================================

    const scheduleDateSet =
        new Set(
            schedules.map(
                (schedule) =>
                    schedule.date
            )
        );


    // =========================================================
    // ⭐ 달력 날짜 생성
    // =========================================================

    const firstDay =
        new Date(
            viewYear,
            viewMonth - 1,
            1
        ).getDay();


    const daysInMonth =
        new Date(
            viewYear,
            viewMonth,
            0
        ).getDate();


    const calendarCells = [];


    // ⭐ 시작 빈칸

    for (
        let i = 0;
        i < firstDay;
        i++
    ) {

        calendarCells.push(
            null
        );

    }


    // ⭐ 실제 날짜

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        calendarCells.push(
            day
        );

    }


    // ⭐ 마지막 빈칸

    while (
        calendarCells.length %
            7 !==
        0
    ) {

        calendarCells.push(
            null
        );

    }


    // =========================================================
    // ⭐ 이전 / 다음 달
    // =========================================================

    const moveMonth =
        (direction) => {

            let nextYear =
                viewYear;

            let nextMonth =
                viewMonth +
                direction;


            if (
                nextMonth < 1
            ) {

                nextYear -= 1;
                nextMonth = 12;

            }


            if (
                nextMonth > 12
            ) {

                nextYear += 1;
                nextMonth = 1;

            }


            setViewYear(
                nextYear
            );

            setViewMonth(
                nextMonth
            );

        };


    // =========================================================
    // ⭐ 오늘로 이동
    // =========================================================

    const moveToday = () => {

        const now =
            new Date();


        const todayDate =
            `${now.getFullYear()}-${String(
                now.getMonth() + 1
            ).padStart(2, "0")}-${String(
                now.getDate()
            ).padStart(2, "0")}`;


        setViewYear(
            now.getFullYear()
        );


        setViewMonth(
            now.getMonth() + 1
        );


        onSelectDate(
            todayDate
        );

    };


    const weekdayLabels = [
        "일",
        "월",
        "화",
        "수",
        "목",
        "금",
        "토",
    ];


    return (

        <div className="main-home-calendar">

            {/* ⭐ 달력 헤더 */}

            <div className="main-home-calendar-header">

                <button
                    type="button"
                    onClick={() =>
                        moveMonth(-1)
                    }
                    aria-label="이전 달"
                >
                    ‹
                </button>


                <strong>
                    {viewYear}년{" "}
                    {viewMonth}월
                </strong>


                <button
                    type="button"
                    onClick={
                        moveToday
                    }
                    className="main-home-today-button"
                >
                    오늘
                </button>

            </div>


            {/* ⭐ 요일 */}

            <div className="main-home-weekdays">

                {weekdayLabels.map(
                    (
                        label,
                        index
                    ) => (

                        <span
                            key={label}
                            className={
                                index === 0
                                    ? "sunday"
                                    : index === 6
                                        ? "saturday"
                                        : ""
                            }
                        >
                            {label}
                        </span>

                    )
                )}

            </div>


            {/* ⭐ 날짜 */}

            <div className="main-home-calendar-grid">

                {calendarCells.map(
                    (
                        day,
                        index
                    ) => {

                        if (!day) {

                            return (

                                <div
                                    key={
                                        `empty-${index}`
                                    }
                                    className="main-home-empty-day"
                                />

                            );

                        }


                        const dateString =
                            `${viewYear}-${String(
                                viewMonth
                            ).padStart(
                                2,
                                "0"
                            )}-${String(
                                day
                            ).padStart(
                                2,
                                "0"
                            )}`;


                        const isSelected =
                            dateString ===
                            selectedDate;


                        const hasSchedule =
                            scheduleDateSet.has(
                                dateString
                            );


                        return (

                            <button
                                key={
                                    dateString
                                }
                                type="button"
                                className={
                                    isSelected
                                        ? "main-home-calendar-day selected"
                                        : "main-home-calendar-day"
                                }
                                onClick={() =>
                                    onSelectDate(
                                        dateString
                                    )
                                }
                            >

                                <span>
                                    {day}
                                </span>


                                {hasSchedule && (

                                    <div className="main-home-calendar-dots">

                                        <i />

                                    </div>

                                )}

                            </button>

                        );

                    }
                )}

            </div>

        </div>

    );
}


export default MainHome;