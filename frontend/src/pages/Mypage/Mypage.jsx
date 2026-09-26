// 내 정보 메인 페이지

import { useEffect, useState } from "react";
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


function Mypage() {

    const navigate = useNavigate();


    // =========================================================
    // ⭐ 내 사용자 정보
    // =========================================================
    const [userInfo, setUserInfo] = useState(null);


    // =========================================================
    // ⭐ 내가 운영 중인 동호회 + 가입한 동호회
    // =========================================================
    const [myClubs, setMyClubs] = useState({
        operating_club: null,
        joined_club: null,
    });

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
                    const clubData = clubResult.value;

                    setMyClubs({
                        operating_club: clubData?.operating_club ?? null,
                        joined_club: clubData?.joined_club ?? null,
                    });
                } else {
                    console.error("⭐ 내 동호회 API 오류:", clubResult.reason);
                    setMyClubs({
                        operating_club: null,
                        joined_club: null,
                    });
                }

            } catch (error) {

                console.error(
                    "마이페이지 정보 조회 오류:",
                    error
                );

                // ⭐ 오류 시 빈 상태
                setUserInfo(null);

                setMyClubs({
                    operating_club: null,
                    joined_club: null,
                });

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
    // ⭐ 운영 중인 동호회 이동
    // =========================================================
    const handleOperatingClubClick = () => {

        const clubId =
            myClubs?.operating_club?.club_id;


        if (clubId) {
            navigate(`/clubs/${clubId}/manage`);
        }

    };


    // 한 칸만 만들고 좌우로 이동 시켜서 가입한 동호회 슬라이스?
    // 그 이후 전체보기에서 운영중인 동호회랑 가입한 동호회 나누어서 볼 수 있게 설정

    // =========================================================
    // ⭐ 가입한 동호회 이동
    // =========================================================
    const handleJoinedClubClick = () => {

        const clubId =
            myClubs?.joined_club?.club_id;


        if (clubId) {
            navigate(`/clubs/${clubId}`);
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
                    ⭐ 운영 중인 동호회
                ================================================= */}
                <div className="club-subsection">

                    <h4 className="club-subsection-title">
                        운영 중인 동호회
                    </h4>


                    <div className="club-card">


                        {myClubs?.operating_club ? (

                            <button
                                type="button"
                                onClick={handleOperatingClubClick}
                            >

                                <img
                                    src={clubHeartIcon}
                                    alt="운영 중인 동호회"
                                />


                                <div className="club-info">

                                    <p>
                                        {
                                            myClubs.operating_club
                                                .club_name
                                        }
                                    </p>


                                    <span>
                                        {
                                            myClubs.operating_club
                                                .sport_name ||
                                            "운동 종목 없음"
                                        }
                                    </span>

                                </div>

                            </button>

                        ) : (

                            <div className="club-empty">

                                운영 중인 동호회가 없습니다.

                            </div>

                        )}

                    </div>

                </div>


                {/* =================================================
                    ⭐ 가입한 동호회
                ================================================= */}
                <div className="club-subsection">

                    <h4 className="club-subsection-title">
                        가입한 동호회
                    </h4>


                    <div className="club-card">


                        {myClubs?.joined_club ? (

                            <button
                                type="button"
                                onClick={handleJoinedClubClick}
                            >

                                <img
                                    src={clubHeartIcon}
                                    alt="가입한 동호회"
                                />


                                <div className="club-info">

                                    <p>
                                        {
                                            myClubs.joined_club
                                                .club_name
                                        }
                                    </p>


                                    <span>
                                        {
                                            myClubs.joined_club
                                                .sport_name ||
                                            "운동 종목 없음"
                                        }
                                    </span>

                                </div>

                            </button>

                        ) : (

                            <div className="club-empty">

                                가입한 동호회가 없습니다.

                            </div>

                        )}

                    </div>

                </div>


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