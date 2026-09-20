// 가입 후 메인 홈

import { Link } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import "./MainHome.css";

// ⭐ 이미지
import notificationIcon from "../../assets/img/playbridge_16_assets/notification_icon.png";
import chatIcon from "../../assets/img/playbridge_16_assets/chat_icon.png";

import createClubImage from "../../assets/img/playbridge_16_assets/create_club.png";
import calendarIcon from "../../assets/img/playbridge_16_assets/calendar_icon.png";
import activityIcon from "../../assets/img/playbridge_16_assets/activity.png";
import backIcon from "../../assets/img/back.png";

import soccerImage from "../../assets/img/playbridge_16_assets/soccer.png";
import basketballImage from "../../assets/img/playbridge_16_assets/basketball.png";
import badmintonImage from "../../assets/img/playbridge_16_assets/badminton.png";
import climbingImage from "../../assets/img/playbridge_16_assets/climbing.png";
import tabletennisImage from "../../assets/img/playbridge_16_assets/tabletennis.png";
import runningImage from "../../assets/img/playbridge_16_assets/running.png";
import yogaImage from "../../assets/img/playbridge_16_assets/16_yoga.png";
import volleyballImage from "../../assets/img/volleyball.png";


function Main() {
    return (
        <div className="main-home">
            <main className="main-home-main">

                {/* ========================================
                    ⭐ 상단 인사 영역
                ======================================== */}

                <section className="main-welcome-section">

                    <div className="main-welcome-content">

                        <div className="main-welcome-text">
                            <h2>안녕하세요, 언제나! 👋</h2>
                            <p>다양한 동호회와 활동을 만나보세요!</p>
                        </div>

                        <div className="main-welcome-actions">
                            <img
                                src={notificationIcon}
                                alt="알림"
                            />

                            <img
                                src={chatIcon}
                                alt="채팅"
                            />
                        </div>

                    </div>

                </section>


                {/* ========================================
                    ⭐ 내 동호회
                ======================================== */}

                <section className="my-club-section">

                    <div className="section-header">

                        <h3>내 동호회</h3>

                        <Link
                            to="/clubs"
                            className="section-more"
                        >
                            내 동호회를 만들어보세요!
                            <img
                                src={backIcon}
                                alt="이동"
                            />
                        </Link>

                    </div>


                    <div className="my-club-list">

                        {/* 축구 */}
                        <Link
                            to="/clubs"
                            className="my-club-card"
                        >
                            <div className="my-club-image">
                                <span className="club-badge">대표</span>

                                <img
                                    src={soccerImage}
                                    alt="강서 FC"
                                />

                                <span className="club-option">•••</span>
                            </div>

                            <div className="my-club-info">
                                <h4>강서 FC</h4>
                                <p>⚽ 축구</p>
                            </div>

                            <div className="my-club-status">
                                <span>활동 중</span>
                                <span>12명</span>
                            </div>
                        </Link>


                        {/* 배구 */}
                        <Link
                            to="/clubs"
                            className="my-club-card"
                        >
                            <div className="my-club-image">

                                <img
                                    src={volleyballImage}
                                    alt="강서 배구모임"
                                />

                                <span className="club-option">•••</span>
                            </div>

                            <div className="my-club-info">
                                <h4>강서 배구모임</h4>
                                <p>🏐 배구</p>
                            </div>

                            <div className="my-club-status">
                                <span>활동 중</span>
                                <span>8명</span>
                            </div>
                        </Link>


                        {/* 배드민턴 */}
                        <Link
                            to="/clubs"
                            className="my-club-card"
                        >
                            <div className="my-club-image">

                                <img
                                    src={badmintonImage}
                                    alt="서툴쪽 친구들"
                                />

                                <span className="club-option">•••</span>
                            </div>

                            <div className="my-club-info">
                                <h4>서툴쪽 친구들</h4>
                                <p>🏸 배드민턴</p>
                            </div>

                            <div className="my-club-status">
                                <span>활동 중</span>
                                <span>6명</span>
                            </div>
                        </Link>


                        {/* 동호회 만들기 */}
                        <Link
                            to="/clubs/create"
                            className="my-club-create-card"
                        >
                            <img
                                src={createClubImage}
                                alt="동호회 만들기"
                            />

                            <p>
                                내 동호회를<br />
                                만들어보세요!
                            </p>
                        </Link>

                    </div>

                </section>


                {/* ========================================
                    ⭐ 이번 주 일정
                ======================================== */}

                <section className="main-schedule-section">

                    <div className="section-header">

                        <div className="section-title">
                            <img
                                src={calendarIcon}
                                alt="일정"
                            />

                            <h3>이번 주 일정</h3>
                        </div>

                        <Link
                            to="/schedule"
                            className="section-more"
                        >
                            전체 일정 보기
                            <img
                                src={backIcon}
                                alt="이동"
                            />
                        </Link>

                    </div>


                    {/* ⭐ 날짜 선택 */}
                    <div className="schedule-days">

                        <div className="schedule-day active">
                            <span>오늘</span>
                            <strong>9.11</strong>
                        </div>

                        <div className="schedule-day">
                            <span>금</span>
                            <strong>9.12</strong>
                        </div>

                        <div className="schedule-day">
                            <span>토</span>
                            <strong>9.13</strong>
                        </div>

                        <div className="schedule-day">
                            <span>일</span>
                            <strong>9.14</strong>
                        </div>

                        <div className="schedule-day">
                            <span>월</span>
                            <strong>9.15</strong>
                        </div>

                        <div className="schedule-day">
                            <span>화</span>
                            <strong>9.16</strong>
                        </div>

                        <div className="schedule-day">
                            <span>수</span>
                            <strong>9.17</strong>
                        </div>

                    </div>


                    {/* ⭐ 일정 목록 */}
                    <div className="schedule-list">

                        <div className="schedule-item">

                            <div className="schedule-time">
                                <span>19:00</span>
                                <span>~21:00</span>
                            </div>

                            <img
                                src={soccerImage}
                                alt="강서 FC"
                            />

                            <div className="schedule-info">
                                <h4>강서 FC 정기모임</h4>
                                <p>강서구 체육공원 1구장</p>
                            </div>

                            <button>참여 예정</button>

                        </div>


                        <div className="schedule-item">

                            <div className="schedule-time">
                                <span>18:30</span>
                                <span>~20:30</span>
                            </div>

                            <img
                                src={volleyballImage}
                                alt="강서 배구모임"
                            />

                            <div className="schedule-info">
                                <h4>강서 배구모임</h4>
                                <p>강서 배구실내체육관</p>
                            </div>

                            <button>참여 예정</button>

                        </div>


                        <div className="schedule-item">

                            <div className="schedule-time">
                                <span>16:00</span>
                                <span>~18:00</span>
                            </div>

                            <img
                                src={badmintonImage}
                                alt="서툴쪽 친구들"
                            />

                            <div className="schedule-info">
                                <h4>서툴쪽 친구들 연습</h4>
                                <p>강서구 배드민턴장</p>
                            </div>

                            <button>참여 예정</button>

                        </div>

                    </div>


                    <Link
                        to="/schedule"
                        className="schedule-all-button"
                    >
                        전체 일정 보기
                    </Link>

                </section>


                {/* ========================================
                    ⭐ 다른 동호회 게스트 모집
                ======================================== */}

                <section className="guest-section">

                    <div className="section-header">

                        <div className="section-title">
                            <img
                                src={activityIcon}
                                alt="게스트 모집"
                            />

                            <h3>다른 동호회 게스트 모집</h3>
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

                        <Link
                            to="/clubs"
                            className="guest-card"
                        >
                            <img
                                src={soccerImage}
                                alt="미국 풋살 모임"
                            />

                            <h4>미국 풋살 모임</h4>

                            <p>수요일 오후 19:00</p>
                            <p>마곡 풋살장</p>

                            <span>자세히 보기</span>
                        </Link>


                        <Link
                            to="/clubs"
                            className="guest-card"
                        >
                            <img
                                src={basketballImage}
                                alt="아하 농구 모임"
                            />

                            <h4>아하 농구 모임</h4>

                            <p>토요일 17:00</p>
                            <p>한강 농구공원</p>

                            <span>자세히 보기</span>
                        </Link>


                        <Link
                            to="/clubs"
                            className="guest-card"
                        >
                            <img
                                src={runningImage}
                                alt="러닝 함께해요"
                            />

                            <h4>러닝 함께해요</h4>

                            <p>일요일 07:00</p>
                            <p>한강공원</p>

                            <span>자세히 보기</span>
                        </Link>


                        <Link
                            to="/clubs"
                            className="guest-card"
                        >
                            <img
                                src={climbingImage}
                                alt="클라이밍 입문"
                            />

                            <h4>클라이밍 입문</h4>

                            <p>매주 화 19:00</p>
                            <p>강서 클라이밍장</p>

                            <span>자세히 보기</span>
                        </Link>

                    </div>

                </section>


                {/* ========================================
                    ⭐ 이런 활동도 있어요
                ======================================== */}

                <section className="activity-section">

                    <div className="section-header">

                        <div className="section-title">
                            <img
                                src={activityIcon}
                                alt="활동 추천"
                            />

                            <h3>이런 활동도 있어요</h3>
                        </div>

                    </div>


                    <div className="activity-list">

                        <Link
                            to="/clubs"
                            className="activity-card"
                        >
                            <span className="activity-category">운동</span>

                            <img
                                src={soccerImage}
                                alt="축구"
                            />

                            <p>축구 모임</p>
                        </Link>


                        <Link
                            to="/clubs"
                            className="activity-card"
                        >
                            <span className="activity-category">운동</span>

                            <img
                                src={basketballImage}
                                alt="농구"
                            />

                            <p>농구 모임</p>
                        </Link>


                        <Link
                            to="/clubs"
                            className="activity-card"
                        >
                            <span className="activity-category">운동</span>

                            <img
                                src={runningImage}
                                alt="러닝"
                            />

                            <p>러닝 크루</p>
                        </Link>


                        <Link
                            to="/clubs"
                            className="activity-card"
                        >
                            <span className="activity-category culture">
                                문화
                            </span>

                            <img
                                src={yogaImage}
                                alt="요가"
                            />

                            <p>요가 클래스</p>
                        </Link>

                    </div>

                </section>

            </main>

            {/* ⭐ 공통 하단 네비게이션 */}
            <BottomNav />

        </div>
    );
}

export default Main;