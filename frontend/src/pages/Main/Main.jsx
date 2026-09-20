// 가입 전 홈 화면!

import { Link, useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import "./Main.css";

// ⭐ 베이직 홈 이미지
import notificationIcon from "../../assets/img/playbridge_16_assets/notification_icon.png";
import chatIcon from "../../assets/img/playbridge_16_assets/chat_icon.png";

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

    return (
        <div className="basic-home">
            <main className="basic-home-main">

                {/* 상단 인사 영역 */}
                <section className="welcome-section">
                    <div className="welcome-content">

                        <div className="welcome-text">
                            <h3>안녕하세요, 언제나!</h3>
                            <p>다양한 동호회의 활동을 만나보세요.</p>
                        </div>

                        <div className="welcome-actions">
                            <img src={notificationIcon} alt="알림 아이콘" />
                            <img src={chatIcon} alt="채팅 아이콘" />
                        </div>

                    </div>
                </section>


                {/* 동호회 가입 / 생성 */}
                <section className="club-section">

                    {/* 동호회 찾아보기 */}
                    <div className="club-card">

                        {/* ⭐ 이미지 클릭 → 동호회 찾기 */}
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
                            <h4>아직 가입한 동호회가 없어요!</h4>

                            <div className="club-card-description">
                                <p>관심있는 동호회를 찾아</p>
                                <p>새로운 활동을 시작해보세요!</p>
                            </div>

                            <button
                                onClick={() => navigate("/clubs")}
                            >
                                동호회 찾아보기
                            </button>
                        </div>

                    </div>


                    {/* 동호회 만들기 */}
                    <div className="club-card">

                        {/* ⭐ 이미지 클릭 → 동호회 만들기 */}
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
                            <h4>내 동호회를 만들어 보세요!</h4>

                            <div className="club-card-description">
                                <p>함께할 멤버를 찾아</p>
                                <p>우리만의 동호회를 시작해보세요!</p>
                            </div>

                            <button
                                onClick={() => navigate("/clubs/create")}
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
                            <h3>이번 주 일정</h3>
                        </div>

                        <div className="schedule-more">
                            <p>전체 일정 보기</p>
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
                            <h4>예정된 일정이 있어요</h4>

                            <div className="schedule-description">
                                <p>동호회에 가입하면 일정과 활동을</p>
                                <p>한눈에 확인할 수 있어요!</p>
                            </div>

                            <button
                                onClick={() => navigate("/clubs")}
                            >
                                일정 둘러보기
                            </button>
                        </div>

                    </div>

                </section>


                {/* 게스트 모집 */}
                <section className="guest-section">

                    <div className="guest-header">
                        <p>팝업문구: 게스트 모집/ 게스트</p>
                    </div>


                    {/* ⭐ 제목 + 더보기 한 줄 */}
                    <div className="guest-title">

                        <div className="guest-content">
                            <img
                                src={activityIcon}
                                alt="게스트 모집 아이콘"
                            />

                            <h3>게스트 모집</h3>
                        </div>


                        {/* ⭐ 더보기 우측 상단 */}
                        <Link
                            to="/clubs"
                            className="guest-more"
                        >
                            <p>더보기</p>

                            <img
                                src={backIcon}
                                alt="게스트 모집 더보기"
                            />
                        </Link>

                    </div>


                    {/* ⭐ 게스트 모집 카드 */}
                    <div className="guest-list">

                        {/* 축구 */}
                        <div className="guest-item">

                            <Link
                                to="/clubs"
                                className="guest-item-image-link"
                            >
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

                        <h3>이런 활동도 있어요</h3>
                    </div>


                    <div className="recommendation-list">

                        {/* 클라이밍 */}
                        <div className="recommendation-item">

                            <p>팝업 문구</p>

                            <Link
                                to="/clubs"
                                className="recommendation-image-link"
                            >
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

                            <p>팝업 문구</p>

                            <Link
                                to="/clubs"
                                className="recommendation-image-link"
                            >
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

                            <p>팝업 문구</p>

                            <Link
                                to="/clubs"
                                className="recommendation-image-link"
                            >
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

                            <p>팝업 문구</p>

                            <Link
                                to="/clubs"
                                className="recommendation-image-link"
                            >
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