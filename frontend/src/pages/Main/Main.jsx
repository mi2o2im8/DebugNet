// 가입 전 홈 화면!

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav";

// ⭐ Supabase
import { supabase } from "../../../supabaseClient";

import { attachClubInfoToEvents } from "../../utils/attachClubInfo";

import "./Main.css";

// ⭐ 베이직 홈 이미지
import profileIcon from "../../assets/img/basic_profile_img.png";

import findClubImage from "../../assets/img/playbridge_16_assets/find_club.png";
import createClubImage from "../../assets/img/playbridge_16_assets/create_club.png";

import calendarIcon from "../../assets/img/playbridge_16_assets/calendar_icon.png";
import noScheduleImage from "../../assets/img/playbridge_16_assets/no_schedule.png";

import activityIcon from "../../assets/img/playbridge_16_assets/activity.png";
import backIcon from "../../assets/img/back.png";

import climbingImage from "../../assets/img/playbridge_16_assets/climbing.png";
import tabletennisImage from "../../assets/img/playbridge_16_assets/tabletennis.png";
import runningImage from "../../assets/img/playbridge_16_assets/running.png";
import yogaImage from "../../assets/img/playbridge_16_assets/16_yoga.png";

import soccerImage from "../../assets/img/playbridge_16_assets/soccer.png";
import basketballImage from "../../assets/img/playbridge_16_assets/basketball.png";
import badmintonImage from "../../assets/img/playbridge_16_assets/badminton.png";
import ChatbotButton from "../../components/Chatbot/ChatbotButton";
import { useNotifications } from "../../context/NotificationContext";


// =========================================================
// ⭐ 백엔드 주소 (apiClient.js 와 같은 방식)
// =========================================================

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:8000";


// ⭐ 종목별 기본 이미지 (동호회 이미지가 없을 때)
const SPORT_IMAGES = {
    "축구": soccerImage,
    "풋살": soccerImage,
    "축구ㆍ풋살": soccerImage,
    "농구": basketballImage,
    "배드민턴": badmintonImage,
    "탁구": tabletennisImage,
    "클라이밍": climbingImage,
    "러닝": runningImage,
    "요가": yogaImage,
};


// ⭐ 게스트 일정 날짜/시간 표시 (예: 10.3(토) 19:00)
const formatGuestSchedule = (eventDate, startTime) => {

    if (!eventDate) {
        return "일정 미정";
    }

    const [year, month, day] =
        String(eventDate).split("-").map(Number);

    const date = new Date(year, month - 1, day);

    const weekday =
        ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];

    const time =
        startTime
            ? String(startTime).slice(0, 5)
            : "";

    return `${month}.${day}(${weekday}) ${time}`.trim();

};


// ⭐ 카드 글씨 공통 스타일 (기존 인라인 스타일 그대로)
const cardTextStyle = {
    margin: "3px 5px",
    fontSize: "7px",
    color: "#888",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
};

const cardButtonStyle = {
    display: "block",
    margin: "6px 5px 7px",
    padding: "4px 0",
    border: "1px solid #01A17F",
    borderRadius: "5px",
    background: "#fff",
    color: "#01A17F",
    textAlign: "center",
    fontSize: "7px",
};


// =========================================================
// ⭐ 게스트 일정 이미지
//
// 우선순위: 일정 이미지 → 동호회 대표 이미지 → 종목 기본 이미지 → 달력 아이콘
// 이미지 주소가 깨지면 다음 순서로 넘어감
// =========================================================

function GuestEventImage({ event }) {

    const candidates = [
        event.event_image_url,
        event.club_image_url,
        SPORT_IMAGES[event.club_sport],
    ].filter(Boolean);

    const [index, setIndex] = useState(0);

    const src = candidates[index];

    if (!src) {
        return (
            <img
                src={calendarIcon}
                alt=""
                className="main-card-fallback"
            />
        );
    }

    return (
        <img
            src={src}
            alt={event.club_name || event.title || "게스트 모집 일정"}
            onError={() => setIndex((prev) => prev + 1)}
        />
    );

}


function Main() {
    const navigate = useNavigate();

    // =========================================================
    // ⭐ 로그인한 사용자 닉네임
    // ⭐ 이전에 조회한 닉네임이 있으면 바로 표시
    // =========================================================
    const [userName, setUserName] = useState(() => {
        return localStorage.getItem("playbridge_user_nickname") || "";
    });


    // =========================================================
    // ⭐ 로그인한 사용자의 프로필 이미지
    // ⭐ 이전에 조회한 이미지가 있으면 바로 표시
    // =========================================================
    const [profileImage, setProfileImage] = useState(() => {
        return localStorage.getItem("playbridge_profile_image") || "";
    });


    // =========================================================
    // ⭐ 사용자 정보 로딩 상태
    // =========================================================
    const [isUserLoading, setIsUserLoading] = useState(() => {
        return !localStorage.getItem("playbridge_user_nickname");
    });


    // =========================================================
    // ⭐ 안 읽은 알림 개수
    // =========================================================
    // ⭐ NotificationContext 한 곳에서 관리 (실시간 구독도 Context에서만)
    const { unreadCount: unreadNotificationCount } = useNotifications();


    // =========================================================
    // ⭐ 다른 동호회 게스트 모집 (실제 데이터)
    // GET /api/clubs/guest-recruiting
    // =========================================================

    const [guestEvents, setGuestEvents] = useState([]);

    const [isGuestLoading, setIsGuestLoading] = useState(true);


    useEffect(() => {

        let isActive = true;

        const loadGuestEvents = async () => {

            try {

                // ⭐ 로그인 안 한 사용자도 볼 수 있도록
                //    인증 없이 호출 (백엔드도 인증 필요 없는 API)
                const response = await fetch(
                    `${API_BASE_URL}/api/clubs/guest-recruiting`
                );

                if (!response.ok) {
                    throw new Error("게스트 모집 일정을 불러오지 못했습니다.");
                }

                const data = await response.json();

                const eventList =
                    Array.isArray(data)
                        ? data
                        : Array.isArray(data?.items)
                            ? data.items
                            : [];

                // ⭐ 동호회 이미지 / 이름 붙이기
                const eventsWithClub =
                    await attachClubInfoToEvents(
                        eventList.slice(0, 4)
                    );

                if (isActive) {
                    setGuestEvents(eventsWithClub);
                }

            } catch (error) {

                console.error("⭐ Main 게스트 모집 조회 오류:", error);

                if (isActive) {
                    setGuestEvents([]);
                }

            } finally {

                if (isActive) {
                    setIsGuestLoading(false);
                }

            }

        };

        loadGuestEvents();

        return () => {
            isActive = false;
        };

    }, []);


    // =========================================================
    // ⭐ 이런 활동도 있어요 (실제 데이터)
    // GET /api/clubs/search
    // =========================================================

    const [activityClubs, setActivityClubs] = useState([]);

    const [isActivityLoading, setIsActivityLoading] = useState(true);


    useEffect(() => {

        let isActive = true;

        const loadActivityClubs = async () => {

            try {

                const response = await fetch(
                    `${API_BASE_URL}/api/clubs/search`
                );

                if (!response.ok) {
                    throw new Error("활동 추천 동호회를 불러오지 못했습니다.");
                }

                const data = await response.json();

                const clubList =
                    Array.isArray(data)
                        ? data
                        : Array.isArray(data?.items)
                            ? data.items
                            : [];

                if (isActive) {
                    setActivityClubs(clubList.slice(0, 4));
                }

            } catch (error) {

                console.error("⭐ Main 활동 추천 조회 오류:", error);

                if (isActive) {
                    setActivityClubs([]);
                }

            } finally {

                if (isActive) {
                    setIsActivityLoading(false);
                }

            }

        };

        loadActivityClubs();

        return () => {
            isActive = false;
        };

    }, []);


    // =========================================================
    // ⭐ 로그인한 사용자 정보
    // =========================================================
    useEffect(() => {
        let isActive = true;


        // =====================================================
        // ⭐ 사용자 정보 조회
        // =====================================================
        const getUserInfo = async () => {
            try {

                // =================================================
                // ⭐ 1. 현재 로그인한 Supabase Auth 사용자 확인
                // =================================================
                const {
                    data: { user },
                    error: authError,
                } = await supabase.auth.getUser();


                if (authError) {
                    console.error(
                        "Auth 사용자 조회 오류:",
                        authError
                    );

                    if (isActive) {
                        setIsUserLoading(false);
                    }

                    return;
                }


                if (!user) {
                    console.log(
                        "로그인한 사용자가 없습니다."
                    );

                    if (isActive) {
                        setIsUserLoading(false);
                    }

                    return;
                }


                console.log(
                    "⭐ 현재 로그인한 Auth user.id:",
                    user.id
                );

                console.log(
                    "⭐ 현재 로그인한 Auth email:",
                    user.email
                );


                if (!isActive) return;


                // =================================================
                // ⭐ 2. users 테이블에서 사용자 정보 먼저 조회
                //
                // ⭐ 기존에는 알림 조회를 먼저 했기 때문에
                //    닉네임 표시가 늦어지는 문제가 있었음
                // =================================================
                let {
                    data,
                    error,
                } = await supabase
                    .from("users")
                    .select(
                        "user_id, nickname, email, profile_image"
                    )
                    .eq("user_id", user.id)
                    .maybeSingle();


                console.log(
                    "⭐ user_id로 조회한 DB 결과:",
                    data
                );

                console.log(
                    "⭐ user_id 조회 오류:",
                    error
                );


                // =================================================
                // ⭐ 3. user_id 조회가 안 되면 email로 조회
                // =================================================
                if (!data && user.email) {

                    const result = await supabase
                        .from("users")
                        .select(
                            "user_id, nickname, email, profile_image"
                        )
                        .eq("email", user.email)
                        .maybeSingle();


                    data = result.data;
                    error = result.error;


                    console.log(
                        "⭐ email로 조회한 DB 결과:",
                        data
                    );

                    console.log(
                        "⭐ email 조회 오류:",
                        error
                    );
                }


                // =================================================
                // ⭐ 4. 사용자 정보 조회 오류
                // =================================================
                if (error) {

                    console.error(
                        "사용자 정보 조회 오류:",
                        error
                    );


                    if (isActive) {
                        setIsUserLoading(false);
                    }

                    return;
                }


                if (!isActive) return;


                // =================================================
                // ⭐ 5. 닉네임 저장
                // =================================================
                if (data?.nickname) {

                    setUserName(data.nickname);


                    // ⭐ 다음 Main 진입 시 바로 사용
                    localStorage.setItem(
                        "playbridge_user_nickname",
                        data.nickname
                    );


                    console.log(
                        "⭐ 최종 닉네임:",
                        data.nickname
                    );

                } else {

                    console.log(
                        "❌ DB에서 nickname을 찾지 못했습니다."
                    );
                }


                // =================================================
                // ⭐ 6. 프로필 이미지 저장
                // =================================================
                if (data?.profile_image) {

                    setProfileImage(
                        data.profile_image
                    );


                    // ⭐ 다음 Main 진입 시 바로 사용
                    localStorage.setItem(
                        "playbridge_profile_image",
                        data.profile_image
                    );


                    console.log(
                        "⭐ 최종 프로필 이미지:",
                        data.profile_image
                    );

                } else {

                    console.log(
                        "ℹ️ DB에 프로필 이미지가 없어 기본 이미지를 사용합니다."
                    );


                    // ⭐ 기존 이미지가 잘못 남아있지 않도록 제거
                    localStorage.removeItem(
                        "playbridge_profile_image"
                    );


                    setProfileImage("");
                }


                // =================================================
                // ⭐ 7. 사용자 정보 로딩 완료
                // =================================================
                if (isActive) {
                    setIsUserLoading(false);
                }


            } catch (error) {

                console.error(
                    "사용자 정보 조회 중 오류:",
                    error
                );


                if (isActive) {
                    setIsUserLoading(false);
                }
            }
        };


        // ⭐ 사용자 정보 조회 실행
        getUserInfo();


        // =====================================================
        // ⭐ 컴포넌트 종료 시 정리
        // =====================================================
        return () => {

            isActive = false;


        };

    }, []);


    return (
        <div className="basic-home">

            <main className="basic-home-main">


                {/* =====================================================
                    ⭐ 상단 인사 영역
                ===================================================== */}
                <section className="welcome-section">

                    <div className="welcome-content">

                        <div className="welcome-text">

                            {/* ⭐ DB에서 가져온 닉네임 */}

                            <h3
                                style={{
                                    visibility: isUserLoading
                                        ? "hidden"
                                        : "visible",
                                }}
                            >
                                안녕하세요,{" "}
                                {userName
                                    ? `${userName}님!`
                                    : "회원님!"}
                            </h3>


                            <p>
                                다양한 동호회의 활동을 만나보세요.
                            </p>

                        </div>


                        <div className="welcome-actions">


                            {/* =================================================
                                ⭐ 알림
                            ================================================= */}
                            <Link
                                to="/notification"
                                className="welcome-icon notification-icon-wrap"
                                aria-label="알림"
                            >

                                {/* ⭐ 기본 알림 아이콘 */}
                                <svg
                                    className="notification-icon-svg"
                                    viewBox="0 0 24 24"
                                    width="23"
                                    height="23"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    aria-label="알림"
                                    role="img"
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


                                {/* ⭐ 안 읽은 알림 개수 */}
                                {unreadNotificationCount > 0 && (

                                    <span className="notification-badge">

                                        {unreadNotificationCount >= 10
                                            ? "10+"
                                            : unreadNotificationCount}

                                    </span>

                                )}

                            </Link>


                            {/* =================================================
                                ⭐ 내 정보
                            ================================================= */}
                            <Link
                                to="/mypage"
                                className="welcome-icon"
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
                    ⭐ 동호회 가입 / 생성
                ===================================================== */}
                <section className="club-section">


                    {/* ⭐ 동호회 찾아보기 */}
                    <div className="club-card">

                        <Link
                            to="/clubs"
                            className="club-card-image-link"
                        >

                            <div className="club-card-image">

                                <img
                                    src={findClubImage}
                                    alt="동호회 찾아보기 이미지"
                                />

                            </div>

                        </Link>


                        <div className="club-card-content">

                            <h4>
                                아직 가입한 동호회가 없어요!
                            </h4>


                            <div className="club-card-description">

                                <p>
                                    관심있는 동호회를 찾아
                                </p>

                                <p>
                                    새로운 활동을 시작해보세요!
                                </p>

                            </div>


                            <button
                                onClick={() =>
                                    navigate("/clubs")
                                }
                            >
                                동호회 찾아보기
                            </button>

                        </div>

                    </div>



                    {/* ⭐ 동호회 만들기 */}
                    <div className="club-card">

                        <Link
                            to="/clubs/create"
                            className="club-card-image-link"
                        >

                            <div className="club-card-image">

                                <img
                                    src={createClubImage}
                                    alt="동호회 만들기 이미지"
                                />

                            </div>

                        </Link>


                        <div className="club-card-content">

                            <h4>
                                내 동호회를 만들어 보세요!
                            </h4>


                            <div className="club-card-description">

                                <p>
                                    함께할 멤버를 찾아
                                </p>

                                <p>
                                    우리만의 동호회를 시작해보세요!
                                </p>

                            </div>


                            <button
                                onClick={() =>
                                    navigate("/clubs/create")
                                }
                            >
                                동호회 만들기
                            </button>

                        </div>

                    </div>

                </section>



                {/* =====================================================
                    ⭐ 이번 주 일정
                ===================================================== */}
                <section className="schedule-box">

                    <div className="schedule-header">


                        <div className="schedule-title">

                            <img
                                src={calendarIcon}
                                alt="달력 미니 아이콘"
                            />

                            <h3>
                                이번 주 일정
                            </h3>

                        </div>


                        {/* ⭐ 전체 일정 보기 */}
                        <Link
                            to="/schedule"
                            className="schedule-more"
                        >

                            <p>
                                전체 일정 보기
                            </p>

                            <img
                                src={backIcon}
                                alt="전체 일정 보기"
                            />

                        </Link>

                    </div>



                    <div className="schedule-content">


                        <div className="schedule-image">

                            <img
                                src={noScheduleImage}
                                alt="예정된 일정이 없는 상태"
                            />

                        </div>


                        <div className="schedule-info">

                            <h4>
                                예정된 일정이 있어요
                            </h4>


                            <div className="schedule-description">

                                <p>
                                    동호회에 가입하면 일정과 활동을
                                </p>

                                <p>
                                    한눈에 확인할 수 있어요!
                                </p>

                            </div>


                            <button
                                onClick={() =>
                                    navigate("/clubs")
                                }
                            >
                                일정 둘러보기
                            </button>

                        </div>

                    </div>

                </section>



                {/* =====================================================
                    ⭐ 게스트 모집
                ===================================================== */}
                <section className="guest-section">

                    <div className="section-header">

                        <div className="section-title">

                            <img
                                src={activityIcon}
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

                    <div
                        className="guest-list"
                    >

                        {isGuestLoading ? (

                            <p className="main-list-empty">
                                게스트 모집 일정을 불러오는 중이에요.
                            </p>

                        ) : guestEvents.length === 0 ? (

                            <p className="main-list-empty">
                                지금 게스트를 모집 중인 일정이 없어요.
                            </p>

                        ) : (

                            guestEvents.map((event) => (

                                // ⭐ 게스트 전용 일정 상세 페이지가 아직 없어서
                                //    해당 동호회 상세 페이지로 이동
                                <Link
                                    key={event.event_id}
                                    to={`/clubs/${event.club_id}`}
                                    className="guest-item"
                                >

                                    <div
                                        className="guest-item-image-link"
                                    >
                                        <span
                                            className="image-popup popup-green"
                                        >
                                            게스트 모집
                                        </span>

                                        <GuestEventImage event={event} />
                                    </div>

                                    <h4
                                        className="guest-item-title"
                                    >
                                        {event.title || "게스트 모집"}
                                    </h4>

                                    <p style={cardTextStyle}>
                                        {formatGuestSchedule(
                                            event.event_date,
                                            event.start_time
                                        )}
                                    </p>

                                    <p style={cardTextStyle}>
                                        {event.location || "장소 미정"}
                                    </p>

                                    <span style={cardButtonStyle}>
                                        자세히 보기
                                    </span>

                                </Link>

                            ))

                        )}

                    </div>

                </section>


                {/* =====================================================
                    ⭐ 동호회 활동 추천
                ===================================================== */}
                <section className="activity-recommendation">

                    <div className="recommendation-header">

                        <img
                            src={activityIcon}
                            alt="활동 추천 아이콘"
                        />

                        <h3>
                            이런 활동도 있어요
                        </h3>

                    </div>

                    <div
                        className="recommendation-list"
                    >

                        {isActivityLoading ? (

                            <p className="main-list-empty">
                                추천 동호회를 불러오는 중이에요.
                            </p>

                        ) : activityClubs.length === 0 ? (

                            <p className="main-list-empty">
                                아직 추천할 동호회가 없어요.
                            </p>

                        ) : (

                            activityClubs.map((club, index) => {

                                const clubIdValue =
                                    club?.club_id ||
                                    club?.id;

                                const clubName =
                                    club?.club_name ||
                                    club?.name ||
                                    "동호회";

                                const sportName =
                                    club?.sport_name ||
                                    club?.sports?.[0] ||
                                    "";

                                const region =
                                    club?.region ||
                                    club?.regions?.[0] ||
                                    "";

                                const fallbackImage =
                                    SPORT_IMAGES[sportName] ||
                                    badmintonImage;

                                const image =
                                    club?.representative_image_url ||
                                    club?.image_url ||
                                    fallbackImage;

                                // ⭐ 종목·지역 정보가 없으면 소개글로 대신 표시
                                const subText =
                                    [sportName, region]
                                        .filter(Boolean)
                                        .join(" · ") ||
                                    club?.club_intro ||
                                    "";

                                return (

                                    <Link
                                        key={clubIdValue || `${clubName}-${index}`}
                                        to={
                                            clubIdValue
                                                ? `/clubs/${clubIdValue}`
                                                : "/clubs"
                                        }
                                        className="recommendation-item"
                                    >

                                        <div
                                            className="recommendation-image-link"
                                        >

                                            <span
                                                className="image-popup popup-green"
                                            >
                                                추천
                                            </span>

                                            <img
                                                src={image}
                                                alt={clubName}
                                                onError={(e) => {
                                                    e.currentTarget.src = fallbackImage;
                                                }}
                                            />

                                        </div>

                                        <h4
                                            className="recommendation-title"
                                        >
                                            {clubName}
                                        </h4>

                                        <p style={cardTextStyle}>
                                            {subText}
                                        </p>

                                        <span
                                        >
                                        </span>

                                    </Link>

                                );

                            })

                        )}

                    </div>

                </section>
            
            <div className="basic-home-bottom-space" />

            </main>

            {/* 공통 하단 네비게이션 */}
            <ChatbotButton />
            
            <BottomNav />

        </div>
    );
}

export default Main;