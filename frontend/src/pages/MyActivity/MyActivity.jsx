// 내 활동 페이지
//
// GET /api/users/me/activity 로 "가입 후 지난 일정"을 받아서
// 기간 · 종목 필터에 맞춰 프론트에서 통계를 계산한다.
//
// 참여 경기   = 일반 일정 중 "참석" 응답 + 내 동호회 팀매칭 경기
//
// 참여율 (원형 그래프 2개)
//   투표 참여율 = 응답한 일정 / 투표가 열린 일정   → 얼마나 성실하게 응답하는지
//   활동 참여율 = 참석한 일정 / 응답한 일정        → 응답했을 때 얼마나 나오는지
//   (분모를 다르게 해서 두 숫자가 서로 다른 의미를 갖게 함)
//
// 집계 대상(vote_eligible)은 팀원이 만든 멤버 상세 통계와 같은 기준:
// "가입 이후에 만들어진 참석 투표"가 있는 지난 일정
// (팀매칭 경기는 참석 투표가 없어서 제외)

import { useEffect, useMemo, useState } from "react";

import BackButton from "../../components/BackButton/BackButton";
import BottomNav from "../../components/BottomNav";

// ⭐ API
import { authenticatedRequest } from "../../api/apiClient";

import "./MyActivity.css";


/* ========================================
   ⭐ 필터 옵션
   ======================================== */

// 값: 최근 N일 (null = 전체 기간)
const PERIOD_OPTIONS = [
    { label: "최근 7일", days: 7 },
    { label: "최근 30일", days: 30 },
    { label: "최근 3개월", days: 90 },
    { label: "전체 기간", days: null },
];

const SPORT_OPTIONS = [
    "전체",
    "축구ㆍ풋살",
    "농구",
    "배구",
    "테니스",
    "탁구",
];


/* ========================================
   ⭐ 날짜 / 시간 계산
   ======================================== */

const WEEKDAYS = [
    "일요일", "월요일", "화요일", "수요일",
    "목요일", "금요일", "토요일",
];

const pad2 = (value) => String(value).padStart(2, "0");

// 오늘로부터 N일 전 "YYYY-MM-DD"
const getDateStringDaysAgo = (days) => {

    const date = new Date();
    date.setDate(date.getDate() - days);

    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

// "2026-09-13" → { date: "9.13", day: "일요일" }
const formatActivityDate = (dateString) => {

    const [year, month, day] = String(dateString)
        .slice(0, 10)
        .split("-")
        .map(Number);

    return {
        date: `${month}.${day}`,
        day: WEEKDAYS[new Date(year, month - 1, day).getDay()],
    };
};

// "19:00:00" → 분 단위 (1140)
const toMinutes = (time) => {

    if (!time) return null;

    const [hour, minute] = String(time).split(":").map(Number);

    return hour * 60 + minute;
};

// 일정 길이 (분). 종료 시간이 없거나 이상하면 0
const getDurationMinutes = (activity) => {

    const start = toMinutes(activity.start_time);
    const end = toMinutes(activity.end_time);

    if (start === null || end === null || end <= start) return 0;

    return end - start;
};

// 분 → "12h" / "1h 30m" / "45m"
const formatDuration = (minutes) => {

    if (minutes <= 0) return "0h";

    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;

    if (hours === 0) return `${rest}m`;
    if (rest === 0) return `${hours}h`;

    return `${hours}h ${rest}m`;
};

// 비율 → "92%" (분모가 0이면 "-")
const formatRate = (numerator, denominator) => {

    if (!denominator) return "-";

    return `${Math.round((numerator / denominator) * 100)}%`;
};


/* ========================================
   ⭐ 참여 여부
   ======================================== */

const isParticipated = (activity) =>
    activity.is_match || activity.my_attendance === "참석";


/* ========================================
   ⭐ 원형 그래프 (SVG)
   ======================================== */

const DONUT_RADIUS = 36;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

function DonutChart({ value, total, color, label }) {

    const ratio = total > 0 ? value / total : 0;

    return (
        <svg
            className="myactivity-donut"
            viewBox="0 0 90 90"
            role="img"
            aria-label={label}
        >
            {/* 바탕 원 */}
            <circle
                cx="45"
                cy="45"
                r={DONUT_RADIUS}
                fill="none"
                stroke="#edf1f4"
                strokeWidth="9"
            />

            {/* 채워지는 원 (12시 방향부터) */}
            <circle
                className="myactivity-donut-fill"
                cx="45"
                cy="45"
                r={DONUT_RADIUS}
                fill="none"
                stroke={color}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={DONUT_CIRCUMFERENCE}
                strokeDashoffset={DONUT_CIRCUMFERENCE * (1 - ratio)}
                transform="rotate(-90 45 45)"
                opacity={ratio > 0 ? 1 : 0}
            />
        </svg>
    );
}


function MyActivity() {

    // =========================================================
    // ⭐ 필터
    // =========================================================
    const [periodDays, setPeriodDays] = useState(30);
    const [sport, setSport] = useState("전체");


    // =========================================================
    // ⭐ API 데이터
    // =========================================================
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");


    // =========================================================
    // ⭐ 지난 일정 불러오기 (한 번만)
    // =========================================================
    useEffect(() => {

        let ignore = false;

        const fetchActivity = async () => {

            try {

                const data = await authenticatedRequest(
                    "/api/users/me/activity",
                    { method: "GET" }
                );

                if (!ignore) {
                    setActivities(data.activities ?? []);
                }

            } catch (error) {

                console.error("내 활동 조회 오류:", error);

                if (!ignore) {
                    setErrorMessage(error.message);
                }

            } finally {

                if (!ignore) setLoading(false);

            }
        };

        fetchActivity();

        return () => {
            ignore = true;
        };

    }, []);


    // =========================================================
    // ⭐ 필터 적용
    // =========================================================
    const filteredActivities = useMemo(() => {

        const startDate =
            periodDays === null ? null : getDateStringDaysAgo(periodDays);

        return activities.filter((activity) => {

            if (startDate && String(activity.event_date) < startDate) {
                return false;
            }

            if (sport !== "전체" && activity.sport_name !== sport) {
                return false;
            }

            return true;
        });

    }, [activities, periodDays, sport]);


    // =========================================================
    // ⭐ 통계 계산
    // =========================================================
    const stats = useMemo(() => {

        const participated = filteredActivities.filter(isParticipated);

        // 투표 참여율 / 참석 현황은 집계 대상 일정만
        const eligible = filteredActivities.filter(
            (activity) => activity.vote_eligible
        );

        const countBy = (answer) =>
            eligible.filter((activity) => activity.my_attendance === answer).length;

        const attending = countBy("참석");
        const absent = countBy("불참");
        const undecided = countBy("미정");
        const responded = attending + absent + undecided;
        const noResponse = eligible.length - responded;

        const totalMinutes = participated.reduce(
            (sum, activity) => sum + getDurationMinutes(activity),
            0
        );

        return {
            participated,
            participatedCount: participated.length,
            totalTime: formatDuration(totalMinutes),

            eligibleCount: eligible.length,
            attending,
            absent,
            undecided,
            responded,
            noResponse,

            voteRate: formatRate(responded, eligible.length),
            activityRate: formatRate(attending, responded),
        };

    }, [filteredActivities]);


    // ⭐ 참석 · 불참 · 미정 · 미응답 개수
    const breakdown = [
        { key: "attending", label: "참석", count: stats.attending },
        { key: "absent", label: "불참", count: stats.absent },
        { key: "undecided", label: "미정", count: stats.undecided },
        { key: "none", label: "미응답", count: stats.noResponse },
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
                        value={periodDays ?? "all"}
                        onChange={(e) =>
                            setPeriodDays(
                                e.target.value === "all"
                                    ? null
                                    : Number(e.target.value)
                            )
                        }
                        aria-label="기간"
                    >
                        {PERIOD_OPTIONS.map((option) => (
                            <option
                                key={option.label}
                                value={option.days ?? "all"}
                            >
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={sport}
                        onChange={(e) => setSport(e.target.value)}
                        aria-label="종목"
                    >
                        {SPORT_OPTIONS.map((option) => (
                            <option key={option}>
                                {option}
                            </option>
                        ))}
                    </select>

                </div>


                {loading ? (

                    <p className="myactivity-message">
                        활동 기록을 불러오는 중...
                    </p>

                ) : errorMessage ? (

                    <p className="myactivity-message">
                        활동 기록을 불러오지 못했습니다.
                        <br />
                        {errorMessage}
                    </p>

                ) : (

                    <>
                        {/* ================================
                            ⭐ 활동 통계
                        ================================= */}
                        <div className="myactivity-stats">

                            <div className="myactivity-stat">
                                <strong>{stats.participatedCount}</strong>
                                <span>참여 경기</span>
                            </div>

                            <div className="myactivity-stat">
                                <strong>{stats.totalTime}</strong>
                                <span>누적 시간</span>
                            </div>

                        </div>


                        {/* ================================
                            ⭐ 참여율
                        ================================= */}
                        <section className="myactivity-rate-card">

                            <h3 className="myactivity-card-title">
                                참여율
                            </h3>

                            {stats.eligibleCount === 0 ? (

                                <p className="myactivity-rate-empty">
                                    이 기간에는 참석 투표가 열린 일정이 없어요.
                                </p>

                            ) : (

                                <>
                                    {/* 원형 그래프 2개 나란히 */}
                                    <div className="myactivity-donuts">

                                        <div className="myactivity-donut-item">
                                            <div className="myactivity-donut-wrap">
                                                <DonutChart
                                                    value={stats.responded}
                                                    total={stats.eligibleCount}
                                                    color="#5b8def"
                                                    label={`투표 참여율 ${stats.voteRate}`}
                                                />
                                                <strong className="myactivity-donut-value">
                                                    {stats.voteRate}
                                                </strong>
                                            </div>

                                            <p className="myactivity-donut-label">
                                                투표 참여율
                                            </p>
                                            <p className="myactivity-donut-caption">
                                                {stats.eligibleCount}개 중 {stats.responded}개 응답
                                            </p>
                                        </div>

                                        <div className="myactivity-donut-item">
                                            <div className="myactivity-donut-wrap">
                                                <DonutChart
                                                    value={stats.attending}
                                                    total={stats.responded}
                                                    color="#01a17f"
                                                    label={`활동 참여율 ${stats.activityRate}`}
                                                />
                                                <strong className="myactivity-donut-value">
                                                    {stats.activityRate}
                                                </strong>
                                            </div>

                                            <p className="myactivity-donut-label">
                                                활동 참여율
                                            </p>
                                            <p className="myactivity-donut-caption">
                                                {stats.responded > 0
                                                    ? `응답 ${stats.responded}개 중 ${stats.attending}개 참석`
                                                    : "응답한 일정이 없어요"}
                                            </p>
                                        </div>

                                    </div>

                                    {/* 응답 내역 4칸 */}
                                    <ul className="myactivity-counts">
                                        {breakdown.map((item) => (
                                            <li
                                                key={item.key}
                                                className={`myactivity-count ${item.key}`}
                                            >
                                                <strong>{item.count}</strong>
                                                <span>{item.label}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* 미응답이 있을 때만: 왜 낮은지 */}
                                    {stats.noResponse > 0 && (
                                        <p className="myactivity-tip">
                                            응답하지 않은 일정이 {stats.noResponse}개 있어요.
                                            투표에 응답하면 투표 참여율이 올라가요.
                                        </p>
                                    )}
                                </>

                            )}

                        </section>

                        <p className="myactivity-footnote">
                            가입 후에 열린 투표만 계산해요. 팀매칭 경기는 투표가 없어서
                            참여 경기 수에만 포함돼요.
                        </p>


                        {/* ================================
                            ⭐ 최근 참여 경기
                        ================================= */}
                        <section className="myactivity-section">

                            <h3>최근 참여경기</h3>

                            {stats.participated.length === 0 ? (

                                <p className="myactivity-message">
                                    이 기간에 참여한 경기가 없어요.
                                    <br />
                                    기간이나 종목을 바꿔보세요.
                                </p>

                            ) : (

                                <div className="myactivity-list">
                                    {stats.participated.map((activity) => {

                                        const { date, day } = formatActivityDate(
                                            activity.event_date
                                        );

                                        return (
                                            <div
                                                className="myactivity-item"
                                                key={activity.event_id}
                                            >

                                                {/* 날짜 */}
                                                <div className="activity-date">
                                                    <strong>{date}</strong>
                                                    <span>{day}</span>
                                                </div>

                                                {/* 경기 정보 */}
                                                <div className="activity-info">
                                                    <strong>{activity.title}</strong>
                                                    <span>
                                                        {activity.club_name}
                                                        {activity.location && `, ${activity.location}`}
                                                    </span>
                                                </div>

                                                {/* 참여 상태 */}
                                                <span
                                                    className={
                                                        activity.is_match
                                                            ? "activity-status match"
                                                            : "activity-status"
                                                    }
                                                >
                                                    {activity.is_match ? "팀매칭" : "참여 완료"}
                                                </span>

                                            </div>
                                        );
                                    })}
                                </div>

                            )}

                        </section>
                    </>

                )}

            </div>


            {/* ⭐ 공통 하단 네비게이션 */}
            <BottomNav />

        </div>
    );
}

export default MyActivity;
