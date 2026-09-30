// =========================================================
// ⭐ 홈 월간 달력 (공용)
//
// MainHome 달력과 같은 모양. Main(가입 전 홈)에서도 쓰려고 분리했다.
//
// props
//   selectedDate  : "YYYY-MM-DD"
//   onSelectDate  : (dateString) => void
//   schedules     : [{ date: "YYYY-MM-DD", isGuest: boolean }]
//                   isGuest=false → 초록/주황 점(동호회 일정)
//                   isGuest=true  → 분홍 점(게스트 일정)
// =========================================================

import { useEffect, useState } from "react";

import "./HomeCalendar.css";


const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export const toDateString = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;


function HomeCalendar({
    selectedDate,
    onSelectDate,
    schedules = [],
}) {

    const today = new Date();

    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);


    // ⭐ 날짜가 선택되면 해당 월로 이동
    useEffect(() => {

        if (!selectedDate) return;

        const [year, month] = selectedDate.split("-").map(Number);

        setViewYear(year);
        setViewMonth(month);

    }, [selectedDate]);


    // ⭐ 일정이 있는 날짜
    const clubDateSet = new Set(
        schedules.filter((item) => !item.isGuest).map((item) => item.date)
    );

    const guestDateSet = new Set(
        schedules.filter((item) => item.isGuest).map((item) => item.date)
    );


    // ⭐ 달력 칸 만들기
    const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells = [];

    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) cells.push(day);
    while (cells.length % 7 !== 0) cells.push(null);


    // ⭐ 이전 / 다음 달
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
    };


    // ⭐ 오늘로 이동
    const moveToday = () => {

        const now = new Date();

        setViewYear(now.getFullYear());
        setViewMonth(now.getMonth() + 1);

        onSelectDate?.(toDateString(now));
    };


    return (
        <div className="home-calendar">

            {/* 헤더 */}
            <div className="home-calendar-header">

                <button
                    type="button"
                    onClick={() => moveMonth(-1)}
                    aria-label="이전 달"
                >
                    ‹
                </button>

                <strong>
                    {viewYear}년 {viewMonth}월
                </strong>

                <div className="home-calendar-header-right">

                    <button
                        type="button"
                        onClick={moveToday}
                        className="home-calendar-today"
                    >
                        오늘
                    </button>

                    <button
                        type="button"
                        onClick={() => moveMonth(1)}
                        aria-label="다음 달"
                    >
                        ›
                    </button>

                </div>

            </div>


            {/* 요일 */}
            <div className="home-calendar-weekdays">
                {WEEKDAY_LABELS.map((label, index) => (
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


            {/* 날짜 */}
            <div className="home-calendar-grid">

                {cells.map((day, index) => {

                    if (!day) {
                        return (
                            <div
                                key={`empty-${index}`}
                                className="home-calendar-empty"
                            />
                        );
                    }

                    const dateString =
                        `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

                    const isSelected = dateString === selectedDate;
                    const hasClub = clubDateSet.has(dateString);
                    const hasGuest = guestDateSet.has(dateString);

                    return (
                        <button
                            key={dateString}
                            type="button"
                            className={
                                isSelected
                                    ? "home-calendar-day selected"
                                    : "home-calendar-day"
                            }
                            onClick={() => onSelectDate?.(dateString)}
                        >
                            <span>{day}</span>

                            {(hasClub || hasGuest) && (
                                <div className="home-calendar-dots">
                                    {hasClub && <i />}
                                    {hasGuest && <i className="guest" />}
                                </div>
                            )}
                        </button>
                    );
                })}

            </div>

        </div>
    );
}

export default HomeCalendar;
