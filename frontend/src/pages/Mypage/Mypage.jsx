// 내 정보 메인 페이지

import { useNavigate } from "react-router-dom";

import BackButton from "../../components/BackButton/BackButton";

// ⭐ 마이페이지 이미지
import settingIcon from "../../assets/img/mypage/setting_icon.png";
import profileIcon from "../../assets/img/basic_profile_img.png";
import clubHeartIcon from "../../assets/img/mypage/club_heart.png";
import favoriteStarIcon from "../../assets/img/mypage/favorite_star.png";
import writeCommentIcon from "../../assets/img/mypage/write_comment.png";

import "./Mypage.css";

function Mypage() {

    const navigate = useNavigate();

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
                        onClick={() => navigate("/mypage/settings")}
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
                        onClick={() => navigate("/myschedule")}
                    >
                        전체보기
                    </button>

                </div>


                {/* 내 동호회 */}
                <div className="club-card">

                    {/* ⭐ 개별 동호회 선택은 기존대로 유지 */}
                    <button
                        type="button"
                        onClick={() =>
                            navigate("/club/1")
                        }
                    >

                        <img
                            src={clubHeartIcon}
                            alt="동호회"
                        />

                        <div className="club-info">

                            <p>우리 동호회</p>

                            <span>
                                축구ㆍ풋살
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
                            navigate("/mypage/activity/matches")
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
                            navigate("/mypage/activity/posts")
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
                            navigate("/mypage/activity/clubs")
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

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/mypage/trust-score")
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
                            navigate("/mypage/trust-score")
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

            </div>
        </>
    );
}

export default Mypage;