// 내 정보 메인 페이지

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import BackButton from "../../components/BackButton/BackButton";

// ⭐ Supabase
import { supabase } from "../../../supabaseClient";

// ⭐ 마이페이지 이미지
import settingIcon from "../../assets/img/mypage/setting_icon.png";
import profileIcon from "../../assets/img/basic_profile_img.png";
import clubHeartIcon from "../../assets/img/mypage/club_heart.png";
import writeCommentIcon from "../../assets/img/mypage/write_comment.png";

import BottomNav from "../../components/BottomNav";

import "./Mypage.css";

function Mypage() {

    const navigate = useNavigate();

    // ⭐ 내 사용자 정보
    const [userInfo, setUserInfo] = useState(null);

    // ⭐ 내가 가입한 동호회 ID
    const [myClubId, setMyClubId] = useState(null);

    // ⭐ 내가 가입한 동호회 정보
    const [myClub, setMyClub] = useState(null);


    // ⭐ 내 사용자 정보 조회
    useEffect(() => {

        const fetchUserInfo = async () => {

            try {

                // ⭐ 현재 로그인한 Supabase 세션 가져오기
                const {
                    data: { session },
                    error: sessionError,
                } = await supabase.auth.getSession();

                if (sessionError) {
                    throw new Error("로그인 세션 조회 실패");
                }

                // ⭐ 로그인 세션이 없는 경우
                if (!session?.access_token) {
                    throw new Error("로그인 세션이 없습니다.");
                }

                // ⭐ Access Token을 FastAPI에 전달
                const response = await fetch(
                    "http://127.0.0.1:8000/api/auth/me",
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${session.access_token}`,
                        },
                    }
                );

                if (!response.ok) {

                    const errorData = await response
                        .json()
                        .catch(() => null);

                    console.error(
                        "⭐ 사용자 정보 API 오류:",
                        errorData
                    );

                    throw new Error(
                        `내 사용자 정보 조회 실패 (${response.status})`
                    );
                }

                const data = await response.json();

                console.log(
                    "⭐ 내 사용자 정보:",
                    data
                );

                setUserInfo(data);

            } catch (error) {

                console.error(
                    "내 사용자 정보 조회 오류:",
                    error
                );

            }

        };

        fetchUserInfo();

    }, []);


    // ⭐ 내가 가입한 동호회 조회
    useEffect(() => {

        const fetchMyClub = async () => {

            try {

                // ⭐ 현재 로그인한 Supabase 세션 가져오기
                const {
                    data: { session },
                    error: sessionError,
                } = await supabase.auth.getSession();

                if (sessionError) {
                    throw new Error("로그인 세션 조회 실패");
                }

                // ⭐ 로그인 세션이 없는 경우
                if (!session?.access_token) {
                    throw new Error("로그인 세션이 없습니다.");
                }

                // ⭐ Access Token을 FastAPI에 전달
                const response = await fetch(
                    "http://127.0.0.1:8000/api/clubs/my",
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${session.access_token}`,
                        },
                    }
                );

                if (!response.ok) {

                    const errorData = await response
                        .json()
                        .catch(() => null);

                    console.error(
                        "⭐ 내 동호회 API 오류:",
                        errorData
                    );

                    throw new Error(
                        `내 동호회 조회 실패 (${response.status})`
                    );
                }

                const data = await response.json();

                console.log(
                    "⭐ 내가 가입한 동호회:",
                    data
                );

                // ⭐ 백엔드에서 받은 동호회 정보 저장
                setMyClub(data);

                // ⭐ club_id 저장
                setMyClubId(data?.club_id ?? null);

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

                {/* ⭐ 헤더 */}
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


                {/* ⭐ 내 정보 */}
                <div className="profile-card">

                    {/* 프로필 이미지 */}
                    <div className="profile-image">

                        <img
                            src={profileIcon}
                            alt="프로필"
                        />

                    </div>


                    {/* ⭐ 실제 사용자 이름 */}
                    <p className="profile-name">
                        {userInfo?.name || "사용자 이름"}
                    </p>


                    {/* ⭐ 실제 운동 종목 */}
                    <p className="profile-sports">
                        {Array.isArray(userInfo?.sports)
                            ? userInfo.sports.join("ㆍ")
                            : userInfo?.sports || "운동 종목 없음"}
                    </p>


                    {/* ⭐ 실제 활동 지역 */}
                    <p className="profile-region">
                        {Array.isArray(userInfo?.regions)
                            ? userInfo.regions.join("ㆍ")
                            : userInfo?.regions || "활동 지역 없음"}
                    </p>


                    {/* ⭐ 프로필 수정 */}
                    <Link
                        to="/myinfoedit"
                        className="profile-edit-button"
                    >
                        수정
                    </Link>

                </div>


                {/* ⭐ 내 동호회 제목 */}
                <div className="section-header">

                    <h3>내 동호회</h3>

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/myschedule")
                        }
                    >
                        전체보기
                    </button>

                </div>


                {/* ⭐ 내 동호회 */}
                <div className="club-card">

                    <button
                        type="button"
                        disabled={!myClubId}
                        onClick={() => {

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

                            <p>
                                {myClub?.club_name || "우리 동호회"}
                            </p>

                            <span>
                                {myClub?.sport_name || "축구ㆍ풋살"}
                            </span>

                        </div>

                    </button>

                </div>


                {/* ⭐ 내 활동 */}
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


                    {/* ⭐ 찜한 동호회 */}
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


                {/* ⭐ 신뢰점수 제목 */}
                <div className="section-header">

                    <h3>신뢰점수</h3>

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/trustscore")
                        }
                    >
                        자세히
                    </button>

                </div>


                {/* ⭐ 신뢰점수 */}
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