// 내 정보 메인 페이지

import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import BackButton from "../../components/BackButton/BackButton";

// ⭐ API
import { authenticatedRequest } from "../../api/apiClient";
import { getMyProfile } from "../../api/userApi";

// ⭐ 마이페이지 이미지
import settingIcon from "../../assets/img/mypage/setting_icon.png";
import profileIcon from "../../assets/img/basic_profile_img.png";
import clubHeartIcon from "../../assets/img/mypage/club_heart.png";
import writeCommentIcon from "../../assets/img/mypage/write_comment.png";

import BottomNav from "../../components/BottomNav";

import "./Mypage.css";


// =========================================================
// ⭐ /api/clubs/my 응답 → 슬라이드용 배열
//
// 운영 중인 동호회를 앞에, 가입한 동호회를 뒤에 둔다.
// 같은 동호회가 양쪽에 있으면 한 번만 보여준다.
// =========================================================
const buildClubList = (clubData) => {

    const operatingClubs = (clubData?.operating_clubs ?? []).map((club) => ({
        ...club,
        isOperator: true,
    }));

    const joinedClubs = (clubData?.joined_clubs ?? []).map((club) => ({
        ...club,
        isOperator: false,
    }));

    const seen = new Set();

    return [...operatingClubs, ...joinedClubs].filter((club) => {

        if (!club?.club_id || seen.has(club.club_id)) {
            return false;
        }

        seen.add(club.club_id);
        return true;
    });
};


function Mypage() {

    const navigate = useNavigate();


    // =========================================================
    // ⭐ 내 사용자 정보
    // =========================================================
    const [userInfo, setUserInfo] = useState(null);


    // =========================================================
    // ⭐ 내 동호회 목록 (운영 + 가입을 하나로 합친 배열)
    //
    // [{ ...club, isOperator: true | false }, ...]
    // =========================================================
    const [myClubs, setMyClubs] = useState([]);

    // ⭐ 슬라이드 현재 위치
    const [clubIndex, setClubIndex] = useState(0);
    const sliderRef = useRef(null);

    // ⭐ 페이지 전체 데이터 로딩 상태
    const [loading, setLoading] = useState(true);


    // =========================================================
    // ⭐ 내 정보 + 내 동호회 한 번에 조회
    // =========================================================
    useEffect(() => {

        const fetchMypageData = async () => {

            try {

                // ⭐ 내 정보 + 내 동호회를 동시에 요청
                // allSettled: 한쪽이 실패해도 다른 쪽은 화면에 표시
                const [userResult, clubResult] = await Promise.allSettled([
                    getMyProfile(),
                    authenticatedRequest("/api/clubs/my", {
                        method: "GET",
                    }),
                ]);

                if (userResult.status === "fulfilled") {
                    console.log("⭐ 내 사용자 정보:", userResult.value);
                    setUserInfo(userResult.value);
                } else {
                    console.error("⭐ 사용자 정보 API 오류:", userResult.reason);
                    setUserInfo(null);
                }

                if (clubResult.status === "fulfilled") {

                    setMyClubs(buildClubList(clubResult.value));

                } else {

                    console.error("⭐ 내 동호회 API 오류:", clubResult.reason);
                    setMyClubs([]);

                }

            } catch (error) {

                console.error(
                    "마이페이지 정보 조회 오류:",
                    error
                );

                // ⭐ 오류 시 빈 상태
                setUserInfo(null);

                setMyClubs([]);

            } finally {

                // ⭐ 모든 API 요청이 끝난 후 화면 표시
                setLoading(false);

            }

        };

        fetchMypageData();

    }, []);


    // =========================================================
    // ⭐ 로딩 중
    // =========================================================
    if (loading) {

        return (
            <div className="mypage-container">
                <div className="mypage-loading">
                    정보를 불러오는 중...
                </div>
            </div>
        );

    }


    // =========================================================
    // ⭐ 프로필 표시용 값
    // =========================================================
    const sportText =
        userInfo?.sports?.length > 0
            ? userInfo.sports
                .map((sport) => sport.sport_name)
                .join(" · ")
            : "운동 종목 없음";

    const regionText =
        userInfo?.regions?.length > 0
            ? userInfo.regions.join(" · ")
            : "활동 지역 없음";


    // =========================================================
    // ⭐ 동호회 카드 클릭
    //
    // 운영자 → 동호회 관리 / 멤버 → 동호회 상세
    // =========================================================
    const handleClubClick = (club) => {

        if (!club?.club_id) return;

        navigate(
            club.isOperator
                ? `/clubs/${club.club_id}/manage`
                : `/clubs/${club.club_id}`
        );
    };


    // =========================================================
    // ⭐ 슬라이드 이동 (화살표 / 점 버튼)
    // =========================================================
    const scrollToClub = (index) => {

        const slider = sliderRef.current;

        if (!slider) return;

        const nextIndex = Math.max(
            0,
            Math.min(index, myClubs.length - 1)
        );

        slider.scrollTo({
            left: slider.clientWidth * nextIndex,
            behavior: "smooth",
        });
    };


    // =========================================================
    // ⭐ 손가락으로 넘겼을 때 현재 위치 갱신
    // =========================================================
    const handleSliderScroll = () => {

        const slider = sliderRef.current;

        if (!slider || slider.clientWidth === 0) return;

        const index = Math.round(
            slider.scrollLeft / slider.clientWidth
        );

        if (index !== clubIndex) {
            setClubIndex(index);
        }
    };


    return (
        <>

            {/* ⭐ 마이페이지 전용 className props */}
            <BackButton className="mypage-back-btn" />


            <div className="mypage-container">


                {/* =================================================
                    ⭐ 헤더
                ================================================= */}
                <div className="mypage-header">

                    <h2>
                        내 정보
                    </h2>


                    <button
                        type="button"
                        onClick={() =>
                            navigate("/mypage/settings")
                        }
                    >

                        <img
                            src={settingIcon}
                            alt="설정"
                        />

                    </button>

                </div>


                {/* =================================================
                    ⭐ 내 정보
                ================================================= */}
                <div className="profile-card">


                    {/* ⭐ 프로필 이미지 */}
                    <div className="profile-image">

                        <img
                            src={userInfo?.profile_image || profileIcon}
                            alt="프로필"
                        />

                    </div>


                    {/* ⭐ 닉네임 (없으면 이름) */}
                    <p className="profile-name">

                        {userInfo?.nickname || userInfo?.name || "사용자 이름"}

                    </p>


                    {/* ⭐ 운동 종목 */}
                    <p className="profile-sports">

                        {sportText}

                    </p>


                    {/* ⭐ 활동 지역 */}
                    <p className="profile-region">

                        {regionText}

                    </p>


                    {/* ⭐ 프로필 수정 */}
                    <Link
                        to="/myinfoedit"
                        className="profile-edit-button"
                    >
                        수정
                    </Link>

                </div>


                {/* =================================================
                    ⭐ 내 동호회
                ================================================= */}
                <div className="section-header">

                    <h3>
                        내 동호회
                    </h3>


                    <button
                        type="button"
                        onClick={() =>
                            navigate("/myschedule")
                        }
                    >
                        전체보기
                    </button>

                </div>


                {/* =================================================
                    ⭐ 내 동호회 슬라이드
                ================================================= */}
                {myClubs.length === 0 ? (

                    <div className="club-empty">
                        가입한 동호회가 없습니다.
                    </div>

                ) : (

                    <div className="my-club-slider">

                        {/* ⭐ [‹] [카드] [›] 가로 배치 → 화살표가 자동으로 세로 가운데 */}
                        <div className="my-club-slider-box">

                            {myClubs.length > 1 && (
                                <button
                                    type="button"
                                    className="my-club-arrow"
                                    onClick={() => scrollToClub(clubIndex - 1)}
                                    disabled={clubIndex === 0}
                                    aria-label="이전 동호회"
                                >
                                    ‹
                                </button>
                            )}


                            {/* ⭐ 카드 목록 (가로 스크롤 + 스냅) */}
                            <div
                                className="my-club-track"
                                ref={sliderRef}
                                onScroll={handleSliderScroll}
                            >
                                {myClubs.map((club) => (

                                    <button
                                        key={club.club_id}
                                        type="button"
                                        className="my-club-slide"
                                        onClick={() => handleClubClick(club)}
                                    >

                                        <img
                                            src={
                                                club.representative_image_url ||
                                                clubHeartIcon
                                            }
                                            alt={club.club_name}
                                            className={
                                                club.representative_image_url
                                                    ? "my-club-thumb cover"
                                                    : "my-club-thumb"
                                            }
                                        />

                                        <div className="my-club-info">
                                            <p>{club.club_name}</p>
                                            <span>
                                                {club.sport_name || "운동 종목 없음"}
                                            </span>
                                        </div>

                                        {/* ⭐ 오른쪽 끝 (다음 화살표 바로 옆) */}
                                        <span
                                            className={
                                                club.isOperator
                                                    ? "my-club-badge operator"
                                                    : "my-club-badge"
                                            }
                                        >
                                            {club.isOperator ? "운영자" : "멤버"}
                                        </span>

                                    </button>

                                ))}
                            </div>


                            {myClubs.length > 1 && (
                                <button
                                    type="button"
                                    className="my-club-arrow"
                                    onClick={() => scrollToClub(clubIndex + 1)}
                                    disabled={clubIndex === myClubs.length - 1}
                                    aria-label="다음 동호회"
                                >
                                    ›
                                </button>
                            )}

                        </div>


                        {/* ⭐ 위치 점 */}
                        {myClubs.length > 1 && (
                            <div className="my-club-dots">
                                {myClubs.map((club, index) => (
                                    <button
                                        key={club.club_id}
                                        type="button"
                                        className={
                                            index === clubIndex
                                                ? "my-club-dot active"
                                                : "my-club-dot"
                                        }
                                        onClick={() => scrollToClub(index)}
                                        aria-label={`${index + 1}번째 동호회`}
                                    />
                                ))}
                            </div>
                        )}

                    </div>

                )}


                {/* =================================================
                    ⭐ 내 활동
                ================================================= */}
                <h3 className="section-title">

                    내 활동

                </h3>


                <div className="activity-list">


                    {/* ⭐ 최근 참여경기 / 통계 */}
                    <button
                        type="button"
                        className="activity-item"
                        onClick={() =>
                            navigate("/myactivity")
                        }
                    >

                        <img
                            src={clubHeartIcon}
                            alt="최근 참여경기"
                        />


                        <p>
                            최근 참여경기 / 통계
                        </p>

                    </button>


                    {/* ⭐ 내가 쓴 글 / 댓글 */}
                    <button
                        type="button"
                        className="activity-item"
                        onClick={() =>
                            navigate("/mypostcomment")
                        }
                    >

                        <img
                            src={writeCommentIcon}
                            alt="내가 쓴 글 / 댓글"
                        />


                        <p>
                            내가 쓴 글 / 댓글
                        </p>

                    </button>


                    {/* ⭐ 찜한 동호회 */}
                    <button
                        type="button"
                        className="activity-item"
                        onClick={() => navigate("/favoriteClub")}
                    >
                        <img
                            src={clubHeartIcon}
                            alt="찜한 동호회"
                        />

                        <p>
                            찜한 동호회
                        </p>
                    </button>

                </div>


                {/* =================================================
                    ⭐ 신뢰점수 제목
                ================================================= */}
                <div className="section-header">

                    <h3>
                        신뢰점수
                    </h3>


                    <button
                        type="button"
                        onClick={() =>
                            navigate("/trustscore")
                        }
                    >
                        자세히
                    </button>

                </div>


                {/* =================================================
                    ⭐ 신뢰점수
                ================================================= */}
                <div className="trust-score-wrapper">

                    <button
                        type="button"
                        className="trust-score-card"
                        onClick={() =>
                            navigate("/trustscore")
                        }
                    >

                        <h2>
                            92
                        </h2>


                        <p>
                            참석률과 참여 기록 기반
                        </p>


                        <p>
                            매우 좋음
                        </p>


                        <div className="trust-progress">

                            <div className="trust-progress-bar" />

                        </div>

                    </button>

                </div>


                {/* =================================================
                    ⭐ 공통 하단 네비게이션
                ================================================= */}
                <BottomNav />

            </div>

        </>
    );
}


export default Mypage;
