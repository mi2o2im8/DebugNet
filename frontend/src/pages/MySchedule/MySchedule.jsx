// 내 동호회 전체 일정 페이지

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiChevronLeft,
    FiChevronRight,
} from "react-icons/fi";

import BackButton from "../../components/BackButton/BackButton";

// ⭐ API
import { getMyEvents } from "../../api/userApi";

import "./MySchedule.css";


/* ========================================
   ⭐ 날짜 관련 함수
   ======================================== */

const pad2 = (value) =>
    String(value).padStart(2, "0");


const makeDateString = (year, month, day) =>
    `${year}-${pad2(month)}-${pad2(day)}`;


const getTodayString = () => {

    const now = new Date();

    return makeDateString(
        now.getFullYear(),
        now.getMonth() + 1,
        now.getDate()
    );
};


// "19:00:00" → "19:00"
const formatTime = (time) =>
    time ? String(time).slice(0, 5) : "";


// "2026-09-25" → "9월 25일 (금)"
const formatDateLabel = (dateString) => {

    const [year, month, day] = dateString.split("-").map(Number);

    const weekday = ["일", "월", "화", "수", "목", "금", "토"][
        new Date(year, month - 1, day).getDay()
    ];

    return `${month}월 ${day}일 (${weekday})`;
};


/* ========================================
   ⭐ 동호회별 색상 (달력 점 / 범례 / 카드 왼쪽 선)
   ======================================== */

const CLUB_COLORS = [
    "#01a17f",
    "#5b8def",
    "#f2994a",
    "#bb6bd9",
    "#eb5757",
    "#27aeb9",
];


/* ========================================
   ⭐ 일정 상태 뱃지
   ======================================== */

const getStatusBadge = (event, todayString) => {

    if (event.event_date < todayString) {
        return { text: "종료", className: "done" };
    }

    if (event.my_attendance === "참석") {
        return { text: "참석 예정", className: "attend" };
    }

    if (event.my_attendance === "불참") {
        return { text: "불참", className: "absent" };
    }

    if (event.my_attendance === "미정") {
        return { text: "미정", className: "undecided" };
    }

    return { text: "응답하기", className: "respond" };
};


function MySchedule() {

    const navigate = useNavigate();

    const todayString = getTodayString();
    const today = new Date();


    // =========================================================
    // ⭐ 보고 있는 달 (이 값이 바뀌면 API 다시 호출)
    // =========================================================
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);

    // ⭐ 선택한 날짜 (null이면 그 달 전체 일정 표시)
    const [selectedDate, setSelectedDate] = useState(todayString);


    // =========================================================
    // ⭐ API 데이터
    // =========================================================
    const [clubs, setClubs] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");


    // =========================================================
    // ⭐ 월이 바뀔 때마다 일정 조회
    // =========================================================
    useEffect(() => {

        // 달을 빠르게 넘길 때 늦게 도착한 이전 응답 무시
        let ignore = false;

        const fetchMyEvents = async () => {

            try {

                setLoading(true);
                setErrorMessage("");

                const data = await getMyEvents(viewYear, viewMonth);

                if (ignore) return;

                setClubs(data.clubs ?? []);
                setEvents(data.events ?? []);

            } catch (error) {

                if (ignore) return;

                console.error("내 동호회 일정 조회 오류:", error);
                setErrorMessage(error.message);
                setEvents([]);

            } finally {

                if (!ignore) setLoading(false);

            }
        };

        fetchMyEvents();

        return () => {
            ignore = true;
        };

    }, [viewYear, viewMonth]);


    // =========================================================
    // ⭐ 동호회 id → 색상
    // =========================================================
    const colorByClubId = useMemo(() => {

        const map = {};

        clubs.forEach((club, index) => {
            map[club.club_id] = CLUB_COLORS[index % CLUB_COLORS.length];
        });

        return map;

    }, [clubs]);


    // =========================================================
    // ⭐ 날짜 → 그날 일정이 있는 동호회 색상들 (달력 점)
    // =========================================================
    const dotColorsByDate = useMemo(() => {

        const map = {};

        events.forEach((event) => {

            const color = colorByClubId[event.club_id] ?? CLUB_COLORS[0];

            if (!map[event.event_date]) {
                map[event.event_date] = [];
            }

            if (!map[event.event_date].includes(color)) {
                map[event.event_date].push(color);
            }
        });

        return map;

    }, [events, colorByClubId]);


    // =========================================================
    // ⭐ 아래 목록에 보여줄 일정
    // =========================================================
    const visibleEvents = selectedDate
        ? events.filter((event) => event.event_date === selectedDate)
        : events;


    // =========================================================
    // ⭐ 달 이동 (선택 날짜는 해제 → 그 달 전체 보기)
    // =========================================================
    const moveMonth = (direction) => {

        let nextYear = viewYear;
        let nextMonth = viewMonth + direction;

        if (nextMonth < 1) {
            nextYear -= 1;
            nextMonth = 12;
        }

        if (nextMonth > 12) {
            nextYear += 1;
            nextMonth = 1;
        }

        setViewYear(nextYear);
        setViewMonth(nextMonth);
        setSelectedDate(null);
    };


    // =========================================================
    // ⭐ 날짜 선택 (같은 날짜를 다시 누르면 해제)
    // =========================================================
    const handleSelectDate = (dateString) => {

        setSelectedDate((prev) =>
            prev === dateString ? null : dateString
        );
    };


    // =========================================================
    // ⭐ 일정 카드 클릭 → 참석 응답 페이지
    // =========================================================
    const handleEventClick = (event) => {

        navigate(
            `/clubs/${event.club_id}/events/${event.event_id}/attendance`
        );
    };


    const handleNext = () => {
        navigate("/review");
    };


    return (
        <div className="MySchedule-page">

            {/* ========================================
               ⭐ 상단 헤더
               ======================================== */}

            <div className="MySchedule-header">

                <BackButton
                    className="MySchedule-back-btn"
                    aria-label="뒤로가기"
                />

                <h2 className="MySchedule-title">
                    내 동호회 일정
                </h2>

            </div>


            {/* ========================================
               ⭐ 달력
               ======================================== */}

            <MyScheduleCalendar
                viewYear={viewYear}
                viewMonth={viewMonth}
                onMoveMonth={moveMonth}
                selectedDate={selectedDate}
                todayString={todayString}
                onSelectDate={handleSelectDate}
                dotColorsByDate={dotColorsByDate}
            />


            {/* ========================================
               ⭐ 동호회 범례 (2개 이상일 때)
               ======================================== */}

            {clubs.length > 1 && (
                <div className="MySchedule-legend">
                    {clubs.map((club) => (
                        <span
                            key={club.club_id}
                            className="MySchedule-legend-item"
                        >
                            <i
                                style={{
                                    background: colorByClubId[club.club_id],
                                }}
                            />
                            {club.club_name}
                        </span>
                    ))}
                </div>
            )}


            {/* ========================================
               ⭐ 일정 목록
               ======================================== */}

            <p className="MySchedule-list-title">
                {selectedDate
                    ? formatDateLabel(selectedDate)
                    : `${viewMonth}월 전체 일정`}
            </p>

            <div className="schedule-list">

                {loading ? (

                    <p className="MySchedule-message">
                        일정을 불러오는 중...
                    </p>

                ) : errorMessage ? (

                    <p className="MySchedule-message">
                        일정을 불러오지 못했습니다.
                        <br />
                        {errorMessage}
                    </p>

                ) : clubs.length === 0 ? (

                    <p className="MySchedule-message">
                        가입한 동호회가 없어요.
                    </p>

                ) : visibleEvents.length === 0 ? (

                    <p className="MySchedule-message">
                        {selectedDate
                            ? "이 날은 일정이 없어요."
                            : "이번 달 일정이 없어요."}
                    </p>

                ) : (

                    visibleEvents.map((event) => {

                        const badge = getStatusBadge(event, todayString);

                        return (
                            <div
                                key={event.event_id}
                                className="schedule-item"
                                style={{
                                    borderLeftColor:
                                        colorByClubId[event.club_id],
                                }}
                                role="button"
                                tabIndex={0}
                                onClick={() => handleEventClick(event)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleEventClick(event);
                                    }
                                }}
                            >

                                <div className="schedule-time">

                                    {/* 날짜를 안 골랐을 때는 날짜도 표시 */}
                                    {!selectedDate && (
                                        <span className="schedule-date">
                                            {Number(event.event_date.slice(8))}일
                                        </span>
                                    )}

                                    <span>
                                        {formatTime(event.start_time)}
                                    </span>

                                    {event.end_time && (
                                        <span>
                                            ~{formatTime(event.end_time)}
                                        </span>
                                    )}

                                </div>


                                <div className="schedule-info">

                                    <h4>
                                        {event.title}
                                    </h4>

                                    <p>
                                        <span
                                            className="schedule-club-name"
                                            style={{
                                                color: colorByClubId[event.club_id],
                                            }}
                                        >
                                            {event.club_name}
                                        </span>

                                        {event.location && (
                                            <> · {event.location}</>
                                        )}
                                    </p>

                                </div>


                                <span
                                    className={`schedule-status ${badge.className}`}
                                >
                                    {badge.text}
                                </span>

                            </div>
                        );
                    })

                )}

            </div>


            {/* ========================================
               ⭐ 활동 종료 리뷰 버튼
               ======================================== */}

            <button
                type="button"
                className="Review-btn"
                onClick={handleNext}
            >
                활동 종료 리뷰 화면 보기
            </button>

        </div>
    );
}


/* ========================================
   ⭐ 일정 달력
   (보고 있는 달은 부모가 관리 → 달이 바뀌면 부모가 API 호출)
   ======================================== */

function MyScheduleCalendar({
    viewYear,
    viewMonth,
    onMoveMonth,
    selectedDate,
    todayString,
    onSelectDate,
    dotColorsByDate = {},
}) {

    const calendarCells = useMemo(() => {

        const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay();
        const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();

        const cells = [];

        // ⭐ 시작 전 빈칸
        for (let i = 0; i < firstDay; i++) {
            cells.push(null);
        }

        // ⭐ 실제 날짜
        for (let day = 1; day <= daysInMonth; day++) {
            cells.push(day);
        }

        // ⭐ 마지막 줄 빈칸
        while (cells.length % 7 !== 0) {
            cells.push(null);
        }

        return cells;

    }, [viewYear, viewMonth]);


    const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];


    return (
        <section className="MySchedule-calendar">

            {/* ⭐ 달력 헤더 */}
            <div className="MySchedule-calendar-header">

                <button
                    type="button"
                    onClick={() => onMoveMonth(-1)}
                    aria-label="이전 달"
                >
                    <FiChevronLeft />
                </button>

                <strong>
                    {viewYear}년 {viewMonth}월
                </strong>

                <button
                    type="button"
                    onClick={() => onMoveMonth(1)}
                    aria-label="다음 달"
                >
                    <FiChevronRight />
                </button>

            </div>


            {/* ⭐ 요일 */}
            <div className="MySchedule-weekdays">
                {weekdayLabels.map((label, index) => (
                    <span
                        key={label}
                        className={
                            index === 0
                                ? "sunday"
                                : index === 6
                                    ? "saturday"
                                    : ""
                        }
                    >
                        {label}
                    </span>
                ))}
            </div>


            {/* ⭐ 날짜 */}
            <div className="MySchedule-grid">

                {calendarCells.map((day, index) => {

                    if (!day) {
                        return (
                            <div
                                key={`empty-${index}`}
                                className="MySchedule-empty-day"
                            />
                        );
                    }

                    const dateString = makeDateString(viewYear, viewMonth, day);

                    const classNames = ["MySchedule-day"];

                    if (dateString === selectedDate) classNames.push("selected");
                    if (dateString === todayString) classNames.push("today");

                    // 한 칸에 점은 최대 3개
                    const dotColors = (dotColorsByDate[dateString] ?? []).slice(0, 3);

                    return (
                        <button
                            key={dateString}
                            type="button"
                            className={classNames.join(" ")}
                            onClick={() => onSelectDate(dateString)}
                        >

                            <span>
                                {day}
                            </span>

                            <div className="MySchedule-dots">
                                {dotColors.map((color) => (
                                    <i
                                        key={color}
                                        style={{ background: color }}
                                    />
                                ))}
                            </div>

                        </button>
                    );
                })}

            </div>

        </section>
    );
}


export default MySchedule;
