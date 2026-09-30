// 내 활동 페이지
//
// GET /api/users/me/activity 로 "가입 후 지난 일정"을 받아서
// 기간 · 종목 필터에 맞춰 프론트에서 통계를 계산한다.
//
// 참여 경기   = 일반 일정 중 "참석" 응답 + 내 동호회 팀매칭 경기
//              + 게스트로 참여한 다른 동호회 경기 (is_guest)
//
// 화면 순서: 필터 → 요약 숫자 → 참여 경기 목록(일반/팀매칭/게스트)
//            → 나의 운동 패턴 → 참여율
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

import PageHeader from "../../components/PageHeader/PageHeader";
import BottomNav from "../../components/BottomNav";

// ⭐ API
import { authenticatedRequest } from "../../api/apiClient";

import {
    FiMoon,
    FiSun,
    FiSunrise,
    FiSunset,
} from "react-icons/fi";

// ⭐ 종목 스티커 (회원가입 종목 선택 화면과 같은 그림)
import soccerImg from "../../assets/img/soccer.png";
import basketballImg from "../../assets/img/basketball.png";
import volleyballImg from "../../assets/img/volleyball.png";
import tableTennisImg from "../../assets/img/table_tennis.png";
import tennisImg from "../../assets/img/tennis.png";
import otherImg from "../../assets/img/other.png";

import "./MyActivity.css";


/* ========================================
   ⭐ 필터 옵션
   ======================================== */

// 값: 최근 N일 (null = 전체 기간)
const PERIOD_OPTIONS = [
    { label: "7일", days: 7, text: "최근 7일" },
    { label: "30일", days: 30, text: "최근 30일" },
    { label: "3개월", days: 90, text: "최근 3개월" },
    { label: "전체", days: null, text: "지금까지" },
];

const ALL = "all";


/* ========================================
   ⭐ 종목 (앱 기본 5종목으로 고정)

   DB 종목 이름이 화면마다 조금씩 달라서
   ("축구ㆍ풋살" / "축구/풋살" 등) 키워드가 들어 있으면 같은 종목으로 본다.
   ======================================== */

const SPORTS = [
    { key: "soccer", label: "축구ㆍ풋살", short: "축구", keywords: ["축구", "풋살"], image: soccerImg },
    { key: "basketball", label: "농구", short: "농구", keywords: ["농구"], image: basketballImg },
    { key: "volleyball", label: "배구", short: "배구", keywords: ["배구"], image: volleyballImg },
    { key: "tabletennis", label: "탁구", short: "탁구", keywords: ["탁구"], image: tableTennisImg },
    { key: "tennis", label: "테니스", short: "테니스", keywords: ["테니스"], image: tennisImg },
];

const OTHER_SPORT = { key: "other", label: "기타", short: "기타", keywords: [], image: otherImg };

// sport_name → 5종목 중 하나 (없으면 기타)
const getSportInfo = (sportName) => {
    const name = String(sportName || "");

    return SPORTS.find((sport) =>
        sport.keywords.some((keyword) => name.includes(keyword))
    ) ?? OTHER_SPORT;
};


/* ========================================
   ⭐ 시간대 아이콘
   ======================================== */

const SLOT_ICONS = {
    dawn: FiMoon,
    morning: FiSunrise,
    afternoon: FiSun,
    evening: FiSunset,
};


/* ========================================
   ⭐ 참여 종류 (일반 / 팀매칭 / 게스트)
   ======================================== */

const TYPE_TABS = [
    { key: ALL, label: "전체" },
    { key: "member", label: "일반" },
    { key: "match", label: "팀매칭" },
    { key: "guest", label: "게스트" },
];

const getActivityType = (activity) => {
    if (activity.is_guest) return "guest";
    if (activity.is_match) return "match";
    return "member";
};

const TYPE_BADGE = {
    member: { label: "참여 완료", className: "activity-status" },
    match: { label: "팀매칭", className: "activity-status match" },
    guest: { label: "게스트", className: "activity-status guest" },
};

// 목록 처음에 보여줄 개수 (더보기로 전체)
const LIST_PREVIEW_COUNT = 5;


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
    activity.is_match ||
    activity.is_guest ||
    activity.my_attendance === "참석";


/* ========================================
   ⭐ 나의 운동 패턴 계산
   ======================================== */

// 월요일부터 (한국 달력 느낌)
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const SHORT_WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const TIME_SLOTS = [
    { key: "dawn", label: "새벽", from: 0, to: 6 },
    { key: "morning", label: "오전", from: 6, to: 12 },
    { key: "afternoon", label: "오후", from: 12, to: 18 },
    { key: "evening", label: "저녁", from: 18, to: 24 },
];

const getWeekday = (dateString) => {
    const [year, month, day] = String(dateString)
        .slice(0, 10)
        .split("-")
        .map(Number);

    return new Date(year, month - 1, day).getDay();
};

const getTimeSlotKey = (timeString) => {
    const minutes = toMinutes(timeString);
    if (minutes === null) return null;

    const hour = Math.floor(minutes / 60);

    return TIME_SLOTS.find((slot) => hour >= slot.from && hour < slot.to)?.key
        ?? null;
};

// 가장 많은 항목 (동점이면 앞쪽). 전부 0이면 null
const pickTop = (entries) => {
    let top = null;

    entries.forEach((entry) => {
        if (entry.count > 0 && (!top || entry.count > top.count)) {
            top = entry;
        }
    });

    return top;
};

// 받침 있으면 "을", 없으면 "를" (테니스를 / 풋살을)
const withObjectParticle = (word) => {
    const last = String(word).trim().slice(-1);
    const code = last.charCodeAt(0);

    if (code < 0xac00 || code > 0xd7a3) return `${word}을(를)`;

    return (code - 0xac00) % 28 === 0 ? `${word}를` : `${word}을`;
};

// 오늘 기준 최근 6개월 [{ key: "2026-05", label: "5월" }, ...]
const getRecentMonths = (count = 6) => {
    const today = new Date();
    const months = [];

    for (let offset = count - 1; offset >= 0; offset -= 1) {
        const date = new Date(today.getFullYear(), today.getMonth() - offset, 1);

        months.push({
            key: `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`,
            label: `${date.getMonth() + 1}월`,
        });
    }

    return months;
};


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
    const [sport, setSport] = useState(ALL);
    const [clubId, setClubId] = useState(ALL);

    // 목록: 참여 종류 탭 / 더보기
    const [typeTab, setTypeTab] = useState(ALL);
    const [showAllList, setShowAllList] = useState(false);


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
    // 동호회 선택지 (내 기록에 있는 동호회만)
    const clubOptions = useMemo(() => {
        const clubMap = new Map();

        activities.forEach((activity) => {
            const previous = clubMap.get(activity.club_id);

            clubMap.set(activity.club_id, {
                id: activity.club_id,
                name: activity.club_name,
                // 한 번이라도 멤버로 참여했으면 게스트 표시 안 함
                guestOnly: previous
                    ? previous.guestOnly && Boolean(activity.is_guest)
                    : Boolean(activity.is_guest),
            });
        });

        return [...clubMap.values()].sort(
            (a, b) => a.name.localeCompare(b.name, "ko")
        );
    }, [activities]);

    // 종목 · 동호회 필터 (기간 제외) → 월별 추이에 사용
    const sportClubFiltered = useMemo(() => (
        activities.filter((activity) => {
            if (sport !== ALL && getSportInfo(activity.sport_name).key !== sport) return false;
            if (clubId !== ALL && String(activity.club_id) !== clubId) return false;
            return true;
        })
    ), [activities, sport, clubId]);

    // 기간까지 적용 → 나머지 통계 전부
    const filteredActivities = useMemo(() => {

        const startDate =
            periodDays === null ? null : getDateStringDaysAgo(periodDays);

        return sportClubFiltered.filter((activity) => (
            !startDate || String(activity.event_date) >= startDate
        ));

    }, [sportClubFiltered, periodDays]);

    // 필터가 바뀌면 목록은 다시 접기
    useEffect(() => {
        setShowAllList(false);
    }, [periodDays, sport, clubId, typeTab]);


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

        // 참여 종류별 개수
        const typeCounts = { [ALL]: participated.length, member: 0, match: 0, guest: 0 };

        participated.forEach((activity) => {
            typeCounts[getActivityType(activity)] += 1;
        });

        return {
            participated,
            participatedCount: participated.length,
            typeCounts,
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


    // =========================================================
    // ⭐ 나의 운동 패턴 (참여한 경기 기준)
    // =========================================================
    const pattern = useMemo(() => {

        const participated = stats.participated;

        // 요일
        const weekdayCounts = WEEK_ORDER.map((weekday) => ({
            key: weekday,
            label: SHORT_WEEKDAYS[weekday],
            count: participated.filter(
                (activity) => getWeekday(activity.event_date) === weekday
            ).length,
        }));

        // 시간대
        const slotCounts = TIME_SLOTS.map((slot) => ({
            ...slot,
            count: participated.filter(
                (activity) => getTimeSlotKey(activity.start_time) === slot.key
            ).length,
        }));

        // 종목
        const sportMap = new Map();

        participated.forEach((activity) => {
            const info = getSportInfo(activity.sport_name);
            const previous = sportMap.get(info.key);

            sportMap.set(info.key, {
                ...info,
                count: (previous?.count || 0) + 1,
            });
        });

        const sportCounts = [...sportMap.values()]
            .sort((a, b) => b.count - a.count);

        const topWeekday = pickTop(weekdayCounts);
        const topSlot = pickTop(slotCounts);
        const topSport = sportCounts.find((item) => item.key !== "other") ?? null;

        // "주로 토요일 저녁에 테니스를 해요"
        let summary = "";

        if (topWeekday && topSlot) {
            summary = `주로 ${topWeekday.label}요일 ${topSlot.label}에 `;
            summary += topSport
                ? `${withObjectParticle(topSport.label)} 해요`
                : "운동해요";
        }

        return {
            weekdayCounts,
            slotCounts,
            sportCounts,
            maxWeekday: Math.max(0, ...weekdayCounts.map((item) => item.count)),
            topWeekdayKey: topWeekday?.key ?? null,
            topSlotKey: topSlot?.key ?? null,
            topSport,
            summary,
        };

    }, [stats.participated]);

    // 월별 추이: 기간 필터와 상관없이 최근 6개월 (종목 · 동호회 필터는 적용)
    const monthlyCounts = useMemo(() => {

        const counts = new Map();

        sportClubFiltered
            .filter(isParticipated)
            .forEach((activity) => {
                const key = String(activity.event_date).slice(0, 7);
                counts.set(key, (counts.get(key) || 0) + 1);
            });

        return getRecentMonths(6).map((month) => ({
            ...month,
            count: counts.get(month.key) || 0,
        }));

    }, [sportClubFiltered]);

    const maxMonthly = Math.max(0, ...monthlyCounts.map((month) => month.count));


    // ⭐ 참여 경기 목록 (종류 탭 + 더보기)
    const listActivities = stats.participated.filter(
        (activity) => typeTab === ALL || getActivityType(activity) === typeTab
    );

    const visibleList = showAllList
        ? listActivities
        : listActivities.slice(0, LIST_PREVIEW_COUNT);


    // ⭐ 참석 · 불참 · 미정 · 미응답 개수
    const breakdown = [
        { key: "attending", label: "참석", count: stats.attending },
        { key: "absent", label: "불참", count: stats.absent },
        { key: "undecided", label: "미정", count: stats.undecided },
        { key: "none", label: "미응답", count: stats.noResponse },
    ];

    // 히어로 카드 문구
    const periodText =
        PERIOD_OPTIONS.find((option) => option.days === periodDays)?.text ?? "";

    const selectedSport = SPORTS.find((item) => item.key === sport) ?? null;

    // 히어로 스티커: 고른 종목 → 제일 많이 한 종목 → 기타
    const heroSticker =
        selectedSport?.image ?? pattern.topSport?.image ?? OTHER_SPORT.image;


    return (
        <div className="my-activity-page">

            <div className="myactivity-container">

                {/* ⭐ 상단 제목 (공용) */}
                <PageHeader title="내 활동" />


                {/* ================================
                    ⭐ 필터: 기간 / 종목 / 동호회
                ================================= */}
                <div
                    className="myactivity-period"
                    role="radiogroup"
                    aria-label="기간"
                >
                    {PERIOD_OPTIONS.map((option) => (
                        <button
                            key={option.label}
                            type="button"
                            role="radio"
                            aria-checked={periodDays === option.days}
                            className={
                                periodDays === option.days
                                    ? "myactivity-period-btn active"
                                    : "myactivity-period-btn"
                            }
                            onClick={() => setPeriodDays(option.days)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                <div
                    className="myactivity-sport-chips"
                    role="radiogroup"
                    aria-label="종목"
                >
                    <button
                        type="button"
                        role="radio"
                        aria-checked={sport === ALL}
                        className={
                            sport === ALL
                                ? "myactivity-sport-chip all active"
                                : "myactivity-sport-chip all"
                        }
                        onClick={() => setSport(ALL)}
                    >
                        <span className="myactivity-sport-chip-all" aria-hidden="true">
                            ALL
                        </span>
                        전체
                    </button>

                    {SPORTS.map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            role="radio"
                            aria-checked={sport === item.key}
                            className={
                                sport === item.key
                                    ? "myactivity-sport-chip active"
                                    : "myactivity-sport-chip"
                            }
                            onClick={() => setSport(item.key)}
                        >
                            <img src={item.image} alt="" />
                            {item.short}
                        </button>
                    ))}
                </div>

                <select
                    className="myactivity-club-select"
                    value={clubId}
                    onChange={(e) => setClubId(e.target.value)}
                    aria-label="동호회"
                >
                    <option value={ALL}>전체 동호회</option>
                    {clubOptions.map((club) => (
                        <option key={club.id} value={String(club.id)}>
                            {club.name}
                            {club.guestOnly ? " (게스트)" : ""}
                        </option>
                    ))}
                </select>


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
                            ⭐ 히어로: 이 기간 요약 + 한 줄 패턴
                        ================================= */}
                        <section className="myactivity-hero">

                            <img
                                className="myactivity-hero-sticker"
                                src={heroSticker}
                                alt=""
                                aria-hidden="true"
                            />

                            <p className="myactivity-hero-period">
                                {periodText}
                                {selectedSport && ` · ${selectedSport.label}`}
                            </p>

                            <div className="myactivity-hero-stats">
                                <div>
                                    <strong>{stats.participatedCount}</strong>
                                    <span>경기</span>
                                </div>

                                <div>
                                    <strong>{stats.totalTime}</strong>
                                    <span>운동 시간</span>
                                </div>
                            </div>

                            <p className="myactivity-hero-summary">
                                {pattern.summary ||
                                    "아직 기록이 없어요. 첫 경기를 기다리고 있어요!"}
                            </p>

                        </section>


                        {/* ================================
                            ⭐ 참여 경기 (일반 / 팀매칭 / 게스트)
                        ================================= */}
                        <section className="myactivity-section">

                            <h3>참여 경기</h3>

                            <div
                                className="myactivity-type-tabs"
                                role="tablist"
                                aria-label="참여 종류"
                            >
                                {TYPE_TABS.map((tab) => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        role="tab"
                                        aria-selected={typeTab === tab.key}
                                        className={
                                            typeTab === tab.key
                                                ? `myactivity-type-tab ${tab.key} active`
                                                : `myactivity-type-tab ${tab.key}`
                                        }
                                        onClick={() => setTypeTab(tab.key)}
                                    >
                                        {tab.label}
                                        <span>{stats.typeCounts[tab.key]}</span>
                                    </button>
                                ))}
                            </div>

                            {listActivities.length === 0 ? (

                                <p className="myactivity-message">
                                    {typeTab === ALL
                                        ? "이 기간에 참여한 경기가 없어요."
                                        : `이 기간에 ${TYPE_TABS.find((tab) => tab.key === typeTab)?.label} 경기가 없어요.`}
                                    <br />
                                    기간이나 필터를 바꿔보세요.
                                </p>

                            ) : (

                                <>
                                    <ul className="myactivity-list">
                                        {visibleList.map((activity) => {

                                            const { date, day } = formatActivityDate(
                                                activity.event_date
                                            );

                                            const type = getActivityType(activity);
                                            const badge = TYPE_BADGE[type];
                                            const sportInfo = getSportInfo(activity.sport_name);

                                            return (
                                                <li
                                                    className={`myactivity-item ${type}`}
                                                    key={`${type}-${activity.event_id}`}
                                                >

                                                    {/* 종목 스티커 */}
                                                    <span className="activity-sticker">
                                                        <img src={sportInfo.image} alt={sportInfo.label} />
                                                    </span>

                                                    {/* 경기 정보 */}
                                                    <div className="activity-info">
                                                        <strong>{activity.title}</strong>
                                                        <span>
                                                            {date} ({day.slice(0, 1)}) · {activity.club_name}
                                                        </span>
                                                    </div>

                                                    {/* 참여 종류 */}
                                                    <span className={badge.className}>
                                                        {badge.label}
                                                    </span>

                                                </li>
                                            );
                                        })}
                                    </ul>

                                    {listActivities.length > LIST_PREVIEW_COUNT && (
                                        <button
                                            type="button"
                                            className="myactivity-more"
                                            onClick={() => setShowAllList((value) => !value)}
                                            aria-expanded={showAllList}
                                        >
                                            {showAllList
                                                ? "접기"
                                                : `${listActivities.length - LIST_PREVIEW_COUNT}개 더보기`}
                                        </button>
                                    )}
                                </>

                            )}

                        </section>


                        {/* ================================
                            ⭐ 나의 운동 패턴
                        ================================= */}
                        <section className="myactivity-card">

                            <h3 className="myactivity-card-title">
                                나의 운동 패턴
                            </h3>

                            {stats.participatedCount === 0 ? (

                                <p className="myactivity-rate-empty">
                                    참여한 경기가 쌓이면 언제, 무엇을 주로 하는지 알려드릴게요.
                                </p>

                            ) : (

                                <>
                                    {/* 요일 */}
                                    <div className="myactivity-pattern-block">
                                        <p className="myactivity-pattern-label">
                                            요일
                                        </p>

                                        <ul className="myactivity-weekdays">
                                            {pattern.weekdayCounts.map((item) => (
                                                <li
                                                    key={item.key}
                                                    className={
                                                        item.key === pattern.topWeekdayKey
                                                            ? "top"
                                                            : ""
                                                    }
                                                    aria-label={`${item.label}요일 ${item.count}회`}
                                                >
                                                    <span className="myactivity-weekday-track">
                                                        <span
                                                            className="myactivity-weekday-bar"
                                                            style={{
                                                                height: pattern.maxWeekday && item.count
                                                                    ? `${Math.max(18, (item.count / pattern.maxWeekday) * 100)}%`
                                                                    : "0%",
                                                            }}
                                                        />
                                                    </span>
                                                    <span className="myactivity-weekday-name">
                                                        {item.label}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* 시간대 */}
                                    <div className="myactivity-pattern-block">
                                        <p className="myactivity-pattern-label">
                                            시간대
                                        </p>

                                        <ul className="myactivity-slots">
                                            {pattern.slotCounts.map((slot) => {
                                                const SlotIcon = SLOT_ICONS[slot.key];

                                                return (
                                                    <li
                                                        key={slot.key}
                                                        className={`${slot.key} ${
                                                            slot.key === pattern.topSlotKey ? "top" : ""
                                                        }`}
                                                    >
                                                        <SlotIcon aria-hidden="true" />
                                                        <span>{slot.label}</span>
                                                        <strong>{slot.count}회</strong>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>

                                    {/* 종목 */}
                                    <div className="myactivity-pattern-block">
                                        <p className="myactivity-pattern-label">
                                            종목
                                        </p>

                                        <ul className="myactivity-sports">
                                            {pattern.sportCounts.map((item) => (
                                                <li key={item.key}>
                                                    <img src={item.image} alt="" />
                                                    <span className="myactivity-sport-name">
                                                        {item.label}
                                                    </span>
                                                    <span className="myactivity-sport-track">
                                                        <span
                                                            className={`myactivity-sport-bar ${item.key}`}
                                                            style={{
                                                                width: `${(item.count / stats.participatedCount) * 100}%`,
                                                            }}
                                                        />
                                                    </span>
                                                    <span className="myactivity-sport-count">
                                                        {item.count}회
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </>

                            )}

                            {/* 월별 추이: 기간 필터와 상관없이 항상 최근 6개월 */}
                            <div className="myactivity-pattern-block">
                                <p className="myactivity-pattern-label">
                                    최근 6개월
                                </p>

                                <ul className="myactivity-months">
                                    {monthlyCounts.map((month, index) => (
                                        <li
                                            key={month.key}
                                            className={index === monthlyCounts.length - 1 ? "current" : ""}
                                            aria-label={`${month.label} ${month.count}회`}
                                        >
                                            <span className="myactivity-month-count">
                                                {month.count}
                                            </span>
                                            <span className="myactivity-month-track">
                                                <span
                                                    className="myactivity-month-bar"
                                                    style={{
                                                        height: maxMonthly && month.count
                                                            ? `${Math.max(12, (month.count / maxMonthly) * 100)}%`
                                                            : "0%",
                                                    }}
                                                />
                                            </span>
                                            <span className="myactivity-month-name">
                                                {month.label}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                        </section>


                        {/* ================================
                            ⭐ 참여율
                        ================================= */}
                        <section className="myactivity-card">

                            <h3 className="myactivity-card-title">
                                참여율
                            </h3>

                            {stats.eligibleCount === 0 ? (

                                <p className="myactivity-rate-empty">
                                    이 기간에는 참석 투표가 열린 일정이 없어요.
                                </p>

                            ) : (

                                <>
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
                            가입 후에 열린 투표만 계산해요. 팀매칭 · 게스트 경기는 투표가 없어서
                            참여 경기 수에만 포함돼요.
                        </p>
                    </>

                )}

            </div>


            {/* ⭐ 공통 하단 네비게이션 */}
            <BottomNav />

        </div>
    );
}


export default MyActivity;
