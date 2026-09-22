// 가입 전 홈 화면!

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav";

// ⭐ Supabase
import { supabase } from "../../../supabaseClient";

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


function Main() {
    const navigate = useNavigate();

    // ⭐ 로그인한 사용자 닉네임
    const [userName, setUserName] = useState("");

    // ⭐ 로그인한 사용자의 프로필 이미지
    const [profileImage, setProfileImage] = useState("");

    // ⭐ 안 읽은 알림 개수
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

    // ⭐ 로그인한 사용자 정보 + 안 읽은 알림 개수 + 실시간 알림
    useEffect(() => {
        let notificationChannel = null;
        let isActive = true;

        // ⭐ 안 읽은 알림 개수 조회
        const loadUnreadNotificationCount = async (userId) => {
            const {
                count,
                error,
            } = await supabase
                .from("notifications")
                .select("notification_id", {
                    count: "exact",
                    head: true,
                })
                .eq("user_id", userId)
                .eq("is_read", false);

            if (error) {
                console.error(
                    "안 읽은 알림 개수 조회 오류:",
                    error
                );
                return;
            }

            if (isActive) {
                setUnreadNotificationCount(count || 0);

                console.log(
                    "⭐ 안 읽은 알림 개수:",
                    count || 0
                );
            }
        };

        const getUserInfo = async () => {
            try {
                // ⭐ 현재 로그인한 Supabase Auth 사용자
                const {
                    data: { user },
                    error: authError,
                } = await supabase.auth.getUser();

                if (authError) {
                    console.error(
                        "Auth 사용자 조회 오류:",
                        authError
                    );
                    return;
                }

                if (!user) {
                    console.log(
                        "로그인한 사용자가 없습니다."
                    );
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

                // ⭐ 컴포넌트가 이미 정리되었으면 중단
                if (!isActive) return;

                // ⭐ 최초 안 읽은 알림 개수 조회
                await loadUnreadNotificationCount(user.id);

                // ⭐ 컴포넌트가 정리되었으면 실시간 채널 생성 금지
                if (!isActive) return;

                // ⭐ 알림 실시간 구독
                notificationChannel = supabase
                    .channel(`notification-badge-${user.id}`)
                    .on(
                        "postgres_changes",
                        {
                            event: "*",
                            schema: "public",
                            table: "notifications",
                            filter: `user_id=eq.${user.id}`,
                        },
                        async () => {
                            await loadUnreadNotificationCount(
                                user.id
                            );
                        }
                    )
                    .subscribe((status) => {
                        console.log(
                            "⭐ 알림 실시간 연결 상태:",
                            status
                        );
                    });

                // ⭐ users 테이블에서 사용자 정보 조회
                let { data, error } = await supabase
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

                // ⭐ user_id가 없으면 email로 한 번 더 조회
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

                if (error) {
                    console.error(
                        "사용자 정보 조회 오류:",
                        error
                    );
                    return;
                }

                if (!isActive) return;

                // ⭐ DB nickname 저장
                if (data?.nickname) {
                    setUserName(data.nickname);

                    console.log(
                        "⭐ 최종 닉네임:",
                        data.nickname
                    );
                } else {
                    console.log(
                        "❌ DB에서 nickname을 찾지 못했습니다."
                    );
                }

                // ⭐ DB profile_image 저장
                if (data?.profile_image) {
                    setProfileImage(data.profile_image);

                    console.log(
                        "⭐ 최종 프로필 이미지:",
                        data.profile_image
                    );
                } else {
                    console.log(
                        "ℹ️ DB에 프로필 이미지가 없어 기본 이미지를 사용합니다."
                    );
                }

            } catch (error) {
                if (isActive) {
                    console.error(
                        "사용자 정보 조회 중 오류:",
                        error
                    );
                }
            }
        };

        getUserInfo();

        return () => {
            isActive = false;

            // ⭐ 컴포넌트 종료 시 실시간 채널 정리
            if (notificationChannel) {
                supabase.removeChannel(
                    notificationChannel
                );
                notificationChannel = null;
            }
        };
    }, []);


    return (
        <div className="basic-home">
            <main className="basic-home-main">

                {/* 상단 인사 영역 */}
                <section className="welcome-section">
                    <div className="welcome-content">

                        <div className="welcome-text">

                            {/* ⭐ DB에서 가져온 닉네임 */}
                            <h3>
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

                            {/* ⭐ 알림 */}
                            <Link
                                to="/notification"
                                className="welcome-icon notification-icon-wrap"
                                aria-label="알림"
                            >
                                {/* ⭐ 기본 알림 아이콘 - 이미지 사용 안 함 */}
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


                            {/* ⭐ 내 정보 */}
                            <Link
                                to="/mypage"
                                className="welcome-icon"
                                aria-label="내 정보"
                            >
                                <img
                                    src={profileImage || profileIcon}
                                    alt="내 정보"
                                    onError={(e) => {
                                        e.currentTarget.src = profileIcon;
                                    }}
                                />
                            </Link>

                        </div>

                    </div>
                </section>


                {/* 동호회 가입 / 생성 */}
                <section className="club-section">

                    {/* 동호회 찾아보기 */}
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


                    {/* 동호회 만들기 */}
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


                {/* 이번 주 일정 */}
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


                        <div className="schedule-more">

                            <p>
                                전체 일정 보기
                            </p>

                            <img
                                src={backIcon}
                                alt="전체 일정 보기"
                            />

                        </div>

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


                {/* 게스트 모집 */}
                <section className="guest-section">

                    <div className="guest-header">
                        <p>
                            팝업문구: 게스트 모집/ 게스트
                        </p>
                    </div>


                    <div className="guest-title">

                        <div className="guest-content">

                            <img
                                src={activityIcon}
                                alt="게스트 모집 아이콘"
                            />

                            <h3>
                                게스트 모집
                            </h3>

                        </div>


                        <Link
                            to="/clubs"
                            className="guest-more"
                        >

                            <p>
                                더보기
                            </p>

                            <img
                                src={backIcon}
                                alt="게스트 모집 더보기"
                            />

                        </Link>

                    </div>


                    <div className="guest-list">

                        {/* 축구 */}
                        <div className="guest-item">

                            <Link
                                to="/clubs"
                                className="guest-item-image-link"
                            >

                                <span className="image-popup popup-green">
                                    게스트 모집
                                </span>

                                <img
                                    src={soccerImage}
                                    alt="강서 축구회"
                                />

                            </Link>


                            <Link
                                to="/clubs"
                                className="guest-item-title"
                            >
                                강서 축구회
                            </Link>

                        </div>


                        {/* 농구 */}
                        <div className="guest-item">

                            <Link
                                to="/clubs"
                                className="guest-item-image-link"
                            >

                                <span className="image-popup popup-green">
                                    게스트 모집
                                </span>

                                <img
                                    src={basketballImage}
                                    alt="아하 농구 모임"
                                />

                            </Link>


                            <Link
                                to="/clubs"
                                className="guest-item-title"
                            >
                                아하 농구 모임
                            </Link>

                        </div>


                        {/* 배드민턴 */}
                        <div className="guest-item">

                            <Link
                                to="/clubs"
                                className="guest-item-image-link"
                            >

                                <span className="image-popup popup-blue">
                                    신규
                                </span>

                                <img
                                    src={badmintonImage}
                                    alt="배드민턴 모임"
                                />

                            </Link>


                            <Link
                                to="/clubs"
                                className="guest-item-title"
                            >
                                배드민턴 모임
                            </Link>

                        </div>

                    </div>

                </section>


                {/* 동호회 활동 추천 */}
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


                    <div className="recommendation-list">

                        {/* 클라이밍 */}
                        <div className="recommendation-item">

                            <p>
                                팝업 문구
                            </p>


                            <Link
                                to="/clubs"
                                className="recommendation-image-link"
                            >

                                <span className="image-popup popup-green">
                                    입문
                                </span>

                                <img
                                    src={climbingImage}
                                    alt="클라이밍 이미지"
                                />

                            </Link>


                            <Link
                                to="/clubs"
                                className="recommendation-title"
                            >
                                클라이밍 입문
                            </Link>

                        </div>


                        {/* 탁구 */}
                        <div className="recommendation-item">

                            <p>
                                팝업 문구
                            </p>


                            <Link
                                to="/clubs"
                                className="recommendation-image-link"
                            >

                                <span className="image-popup popup-green">
                                    인기
                                </span>

                                <img
                                    src={tabletennisImage}
                                    alt="탁구 이미지"
                                />

                            </Link>


                            <Link
                                to="/clubs"
                                className="recommendation-title"
                            >
                                탁구 모임
                            </Link>

                        </div>


                        {/* 러닝 */}
                        <div className="recommendation-item">

                            <p>
                                팝업 문구
                            </p>


                            <Link
                                to="/clubs"
                                className="recommendation-image-link"
                            >

                                <span className="image-popup popup-green">
                                    추천
                                </span>

                                <img
                                    src={runningImage}
                                    alt="러닝 이미지"
                                />

                            </Link>


                            <Link
                                to="/clubs"
                                className="recommendation-title"
                            >
                                러닝 크루
                            </Link>

                        </div>


                        {/* 요가 */}
                        <div className="recommendation-item">

                            <p>
                                팝업 문구
                            </p>


                            <Link
                                to="/clubs"
                                className="recommendation-image-link"
                            >

                                <span className="image-popup popup-blue">
                                    NEW
                                </span>

                                <img
                                    src={yogaImage}
                                    alt="요가 이미지"
                                />

                            </Link>


                            <Link
                                to="/clubs"
                                className="recommendation-title"
                            >
                                요가 클래스
                            </Link>

                        </div>

                    </div>

                </section>

            </main>


            {/* 팀원이 만들어둔 공통 하단 네비게이션 */}
            <BottomNav />

        </div>
    );
}

export default Main;