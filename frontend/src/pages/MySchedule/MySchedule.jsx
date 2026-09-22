import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiChevronLeft,
    FiChevronRight,
    FiSettings,
    FiMoreHorizontal,
} from "react-icons/fi";

import BackButton from "../../components/BackButton/BackButton";

import "./MySchedule.css";


// ⭐ 임시 데이터 객체
const matchingStatus = {
    received: 2,
    sent: 1,
    completed: 3,
};


/* ========================================
   ⭐ 날짜 관련 함수
   ======================================== */

const pad2 = (value) =>
    String(value).padStart(2, "0");


const makeDateString = (
    year,
    month,
    day
) =>
    `${year}-${pad2(month)}-${pad2(day)}`;


/* ========================================
   ⭐ 달력 초기 날짜
   ======================================== */

const getInitialMonth = (
    selectedDate
) => {

    if (!selectedDate) {

        const now = new Date();

        return {
            year: now.getFullYear(),
            month: now.getMonth() + 1,
        };
    }

    const [year, month] =
        selectedDate
            .split("-")
            .map(Number);

    return {
        year,
        month,
    };
};


function MySchedule() {

    const navigate = useNavigate();

    const [selectedDate, setSelectedDate] =
        useState(null);

    // ⭐ 나중에 DB에서 받아올 동호회 정보
    const club = {
        clubId: 1,
        clubName: "강서 FC",
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

                {/* ⭐ 뒤로가기 */}
                <BackButton
                    className="MySchedule-back-btn"
                    aria-label="뒤로가기"
                />

                {/* ⭐ 동호회 이름 */}
                <h2 className="MySchedule-title">
                    {club.clubName}
                </h2>

                {/* ⭐ 설정 / 더보기 */}
                <div className="MySchedule-header-right">

                    <button
                        type="button"
                        className="MySchedule-header-btn"
                        aria-label="동호회 설정"
                    >
                        <FiSettings />
                    </button>

                    <button
                        type="button"
                        className="MySchedule-header-btn"
                        aria-label="더보기"
                    >
                        <FiMoreHorizontal />
                    </button>

                </div>

            </div>


            {/* ========================================
               ⭐ 달력
               ======================================== */}

            <MyScheduleCalendar
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                myAvailabilityDates={[
                    "2026-09-23",
                    "2026-09-27",
                ]}
                opponentAvailableDates={[
                    "2026-09-25",
                    "2026-09-27",
                ]}
            />


            {/* ========================================
               ⭐ 일정 목록
               ======================================== */}

            <div className="schedule-list">

                {/* ⭐ 일정 1 */}

                <div className="schedule-item">

                    <div className="schedule-time">

                        <span>
                            19:00
                        </span>

                        <span>
                            ~21:00
                        </span>

                    </div>


                    <div className="schedule-info">

                        <h4>
                            강서 FC 정기모임
                        </h4>

                        <p>
                            강서구 체육공원 1구장
                        </p>

                    </div>


                    <button
                        type="button"
                        className="schedule-status"
                    >
                        참여 예정
                    </button>

                </div>


                {/* ⭐ 일정 2 */}

                <div className="schedule-item">

                    <div className="schedule-time">

                        <span>
                            18:30
                        </span>

                        <span>
                            ~20:30
                        </span>

                    </div>


                    <div className="schedule-info">

                        <h4>
                            강서 FC 풋살 모임
                        </h4>

                        <p>
                            강서 풋살장
                        </p>

                    </div>


                    <button
                        type="button"
                        className="schedule-status"
                    >
                        참여 예정
                    </button>

                </div>

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
   ======================================== */

function MyScheduleCalendar({
    selectedDate,
    onSelectDate,
    myAvailabilityDates = [],
    opponentAvailableDates = [],
}) {

    const initialMonth =
        getInitialMonth(selectedDate);


    const [viewYear, setViewYear] =
        useState(initialMonth.year);

    const [viewMonth, setViewMonth] =
        useState(initialMonth.month);


    /* ========================================
       ⭐ 선택 날짜가 변경되면 해당 월로 이동
       ======================================== */

    useEffect(() => {

        if (!selectedDate) {
            return;
        }


        const [year, month] =
            selectedDate
                .split("-")
                .map(Number);


        setViewYear(year);
        setViewMonth(month);

    }, [selectedDate]);


    /* ========================================
       ⭐ 내가 등록한 일정
       ======================================== */

    const myDateSet =
        useMemo(
            () =>
                new Set(
                    myAvailabilityDates
                ),
            [myAvailabilityDates]
        );


    /* ========================================
       ⭐ 다른 팀 일정
       ======================================== */

    const opponentDateSet =
        useMemo(
            () =>
                new Set(
                    opponentAvailableDates
                ),
            [opponentAvailableDates]
        );


    /* ========================================
       ⭐ 달력 날짜 생성
       ======================================== */

    const calendarCells =
        useMemo(() => {

            const firstDay =
                new Date(
                    viewYear,
                    viewMonth - 1,
                    1
                ).getDay();


            const daysInMonth =
                new Date(
                    viewYear,
                    viewMonth,
                    0
                ).getDate();


            const cells = [];


            /* ⭐ 시작 전 빈칸 */

            for (
                let i = 0;
                i < firstDay;
                i++
            ) {

                cells.push(null);

            }


            /* ⭐ 실제 날짜 */

            for (
                let day = 1;
                day <= daysInMonth;
                day++
            ) {

                cells.push(day);

            }


            /* ⭐ 마지막 줄 빈칸 */

            while (
                cells.length % 7 !== 0
            ) {

                cells.push(null);

            }


            return cells;

        }, [viewYear, viewMonth]);


    /* ========================================
       ⭐ 이전 / 다음 달
       ======================================== */

    const moveMonth = (
        direction
    ) => {

        let nextYear =
            viewYear;

        let nextMonth =
            viewMonth + direction;


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


    const weekdayLabels = [
        "일",
        "월",
        "화",
        "수",
        "목",
        "금",
        "토",
    ];


    return (
        <section className="MySchedule-calendar">

            {/* ========================================
               ⭐ 달력 헤더
               ======================================== */}

            <div className="MySchedule-calendar-header">

                <button
                    type="button"
                    onClick={() =>
                        moveMonth(-1)
                    }
                    aria-label="이전 달"
                >
                    <FiChevronLeft />
                </button>


                <strong>
                    {viewYear}년 {viewMonth}월
                </strong>


                <button
                    type="button"
                    onClick={() =>
                        moveMonth(1)
                    }
                    aria-label="다음 달"
                >
                    <FiChevronRight />
                </button>

            </div>


            {/* ========================================
               ⭐ 요일
               ======================================== */}

            <div className="MySchedule-weekdays">

                {weekdayLabels.map(
                    (label, index) => (

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

                    )
                )}

            </div>


            {/* ========================================
               ⭐ 날짜
               ======================================== */}

            <div className="MySchedule-grid">

                {calendarCells.map(
                    (day, index) => {

                        /* ⭐ 빈 날짜 */

                        if (!day) {

                            return (
                                <div
                                    key={`empty-${index}`}
                                    className="MySchedule-empty-day"
                                />
                            );

                        }


                        const dateString =
                            makeDateString(
                                viewYear,
                                viewMonth,
                                day
                            );


                        const isSelected =
                            dateString ===
                            selectedDate;


                        const isMine =
                            myDateSet.has(
                                dateString
                            );


                        const hasTeams =
                            opponentDateSet.has(
                                dateString
                            );


                        return (
                            <button
                                key={dateString}
                                type="button"
                                className={
                                    isSelected
                                        ? "MySchedule-day selected"
                                        : "MySchedule-day"
                                }
                                onClick={() =>
                                    onSelectDate(
                                        dateString
                                    )
                                }
                            >

                                <span>
                                    {day}
                                </span>


                                <div className="MySchedule-dots">

                                    {isMine && (
                                        <i className="mine" />
                                    )}


                                    {hasTeams && (
                                        <i className="team" />
                                    )}

                                </div>

                            </button>
                        );

                    }
                )}

            </div>

        </section>
    );
}


export default MySchedule;