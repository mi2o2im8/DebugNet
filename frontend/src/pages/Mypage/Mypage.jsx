// 내 정보 메인 페이지

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import BackButton from "../../components/BackButton/BackButton";

// ⭐ 마이페이지 이미지
import settingIcon from "../../assets/img/mypage/setting_icon.png";
import profileIcon from "../../assets/img/basic_profile_img.png";
import clubHeartIcon from "../../assets/img/mypage/club_heart.png";
import writeCommentIcon from "../../assets/img/mypage/write_comment.png";

import BottomNav from "../../components/BottomNav";

import "./Mypage.css";

function Mypage() {

    const navigate = useNavigate();

    // ⭐ 내가 가입한 동호회 ID
    const [myClubId, setMyClubId] = useState(null);

    // ⭐ 내가 가입한 동호회 정보
    const [myClub, setMyClub] = useState(null);

    // ⭐ 가입한 동호회 조회
    useEffect(() => {

        const fetchMyClub = async () => {

            try {

                const response = await fetch(
                    "http://127.0.0.1:8000/api/clubs/my"
                );

                if (!response.ok) {
                    throw new Error("내 동호회 조회 실패");
                }

                const data = await response.json();

                console.log("⭐ 내가 가입한 동호회:", data);

                // ⭐ 백엔드에서 받은 동호회 정보 저장
                setMyClub(data);

                // ⭐ club_id 저장
                setMyClubId(data.club_id);

            } catch (error) {

                console.error(
                    "내 동호회 조회 오류:",
                    error
                );

            }

        };

        fetchMyClub();

    }, []);


    return (
        <>
            {/* ⭐ 마이페이지 전용 className props */}
            <BackButton className="mypage-back-btn" />

            <div className="mypage-container">

                {/* 헤더 */}
                <div className="mypage-header">

                    <h2>내 정보</h2>

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


                {/* 내 정보 */}
                <div className="profile-card">

                    {/* 프로필 이미지 */}
                    <div className="profile-image">
                        <img
                            src={profileIcon}
                            alt="프로필"
                        />
                    </div>

                    {/* 사용자 이름 */}
                    <p className="profile-name">
                        사용자 이름
                    </p>

                    {/* 운동 종목 */}
                    <p className="profile-sports">
                        축구ㆍ농구
                    </p>

                    {/* 활동 지역 */}
                    <p className="profile-region">
                        서울특별시 강서구
                    </p>

                    {/* 프로필 수정 */}
                    <button
                        type="button"
                        className="profile-edit-button"
                        onClick={() =>
                            navigate("/mypage/profile/edit")
                        }
                    >
                        수정
                    </button>

                </div>


                {/* 내 동호회 제목 */}
                <div className="section-header">

                    <h3>내 동호회</h3>

                    {/* ⭐ 전체보기 → 내 동호회 일정 */}
                    <button
                        type="button"
                        onClick={() =>
                            navigate("/myschedule")
                        }
                    >
                        전체보기
                    </button>

                </div>


                {/* 내 동호회 */}
                <div className="club-card">

                    <button
                        type="button"
                        disabled={!myClubId}
                        onClick={() => {

                            // ⭐ 가입한 동호회가 있을 때만 이동
                            if (myClubId) {
                                navigate(`/clubs/${myClubId}`);
                            }

                        }}
                    >

                        <img
                            src={clubHeartIcon}
                            alt="동호회"
                        />

                        <div className="club-info">

                            {/* ⭐ DB에서 가져온 동호회 이름 */}
                            <p>
                                {myClub?.club_name || "우리 동호회"}
                            </p>

                            {/* ⭐ DB에서 가져온 종목 */}
                            <span>
                                {myClub?.sport_name || "축구ㆍ풋살"}
                            </span>

                        </div>

                    </button>

                </div>


                {/* 내 활동 */}
                <h3 className="section-title">
                    내 활동
                </h3>

                <div className="activity-list">

                    {/* 최근 참여경기 / 통계 */}
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


                    {/* 내가 쓴 글 / 댓글 */}
                    <button
                        type="button"
                        className="activity-item"
                        onClick={() =>
                            navigate(
                                "/mypage/activity/posts"
                            )
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


                    {/* 찜한 동호회 */}
                    <button
                        type="button"
                        className="activity-item"
                        onClick={() =>
                            navigate(
                                "/mypage/activity/clubs"
                            )
                        }
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


                {/* 신뢰점수 제목 */}
                <div className="section-header">

                    <h3>신뢰점수</h3>

                    {/* ⭐ 자세히 → 신뢰점수 페이지 */}
                    <button
                        type="button"
                        onClick={() =>
                            navigate("/trustscore")
                        }
                    >
                        자세히
                    </button>

                </div>


                {/* 신뢰점수 */}
                <div className="trust-score-wrapper">

                    <button
                        type="button"
                        className="trust-score-card"
                        onClick={() =>
                            navigate("/trustscore")
                        }
                    >

                        <h2>92</h2>

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


                {/* ⭐ 공통 하단 네비게이션 */}
                <BottomNav />

            </div>
        </>
    );
}

export default Mypage;