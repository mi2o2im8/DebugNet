// 내 활동 페이지

import { useState } from "react";
import BackButton from "../../components/BackButton/BackButton";

import "./MyActivity.css";

function MyActivity() {

    const [period, setPeriod] = useState("최근 30일");
    const [sport, setSport] = useState("전체");

    // ⭐ 최근 참여 경기 임시 데이터
    const activities = [
        {
            date: "9.13",
            day: "일요일",
            title: "⚽ 강서 FC 정기모임",
            place: "강서구 보조구장",
            status: "참여 완료"
        },
        {
            date: "9.8",
            day: "화요일",
            title: "🏀 농구 모임",
            place: "마곡체육관",
            status: "참여 완료"
        },
        {
            date: "8.30",
            day: "일요일",
            title: "🏃 한강 러닝",
            place: "여의도공원",
            status: "참여 완료"
        }
    ];

    return (
        <div className="my-activity-page">

            {/* ⭐ 뒤로가기 */}
            <BackButton className="myactivity-back-btn" />

            <div className="myactivity-container">

                {/* ================================
                    ⭐ 헤더
                ================================= */}
                <header className="myactivity-header">
                    <h2>내 활동</h2>
                </header>


                {/* ================================
                    ⭐ 필터
                ================================= */}
                <div className="myactivity-filter">

                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                    >
                        <option>최근 30일</option>
                        <option>최근 7일</option>
                        <option>최근 3개월</option>
                        <option>전체 기간</option>
                    </select>

                    <select
                        value={sport}
                        onChange={(e) => setSport(e.target.value)}
                    >
                        <option>전체</option>
                        <option>축구ㆍ풋살</option>
                        <option>농구</option>
                        <option>배구</option>
                        <option>테니스</option>
                        <option>탁구</option>
                    </select>

                </div>


                {/* ================================
                    ⭐ 활동 통계
                ================================= */}
                <div className="myactivity-stats">

                    <div className="myactivity-stat">
                        <strong>6</strong>
                        <span>참여 경기</span>
                    </div>

                    <div className="myactivity-stat">
                        <strong>92%</strong>
                        <span>참석률</span>
                    </div>

                    <div className="myactivity-stat">
                        <strong>12h</strong>
                        <span>누적 시간</span>
                    </div>

                </div>


                {/* ================================
                    ⭐ 최근 참여 경기
                ================================= */}
                <section className="myactivity-section">

                    <h3>최근 참여경기</h3>

                    <div className="myactivity-list">

                        {activities.map((activity, index) => (
                            <div
                                className="myactivity-item"
                                key={index}
                            >

                                {/* 날짜 */}
                                <div className="activity-date">
                                    <strong>{activity.date}</strong>
                                    <span>{activity.day}</span>
                                </div>


                                {/* 경기 정보 */}
                                <div className="activity-info">
                                    <strong>{activity.title}</strong>
                                    <span>{activity.place}</span>
                                </div>


                                {/* 참여 상태 */}
                                <span className="activity-status">
                                    {activity.status}
                                </span>

                            </div>
                        ))}

                    </div>

                </section>

            </div>

        </div>
    );
}

export default MyActivity;