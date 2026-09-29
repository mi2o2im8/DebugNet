import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";


const pad2 = (value) =>
  String(value).padStart(2, "0");


const makeDateString = (
  year,
  month,
  day
) =>
  `${year}-${pad2(month)}-${pad2(day)}`;


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


function MatchCalendar({
  selectedDate,
  selectedDates = [],
  multiple = false,
  onSelectDate,
  myAvailabilityDates = [],
  opponentAvailableDates = [],
  showLegend = true,
}) {
  // 다중 선택 모드에서는 날짜를 누를 때마다
  // 달력이 다른 달로 튀지 않도록 현재 보고 있는 달을 유지한다.
  const calendarSelectedDate =
    multiple
      ? ""
      : selectedDate;

  const initialMonth =
    getInitialMonth(
      calendarSelectedDate
    );

  const [viewYear, setViewYear] =
    useState(initialMonth.year);

  const [viewMonth, setViewMonth] =
    useState(initialMonth.month);


  useEffect(() => {
    if (!calendarSelectedDate) {
      return;
    }

    const [year, month] =
      calendarSelectedDate
        .split("-")
        .map(Number);

    setViewYear(year);
    setViewMonth(month);
  }, [calendarSelectedDate]);


  const myDateSet =
    useMemo(
      () =>
        new Set(
          myAvailabilityDates
        ),
      [myAvailabilityDates]
    );


  const opponentDateSet =
    useMemo(
      () =>
        new Set(
          opponentAvailableDates
        ),
      [opponentAvailableDates]
    );


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

      for (
        let i = 0;
        i < firstDay;
        i++
      ) {
        cells.push(null);
      }

      for (
        let day = 1;
        day <= daysInMonth;
        day++
      ) {
        cells.push(day);
      }

      while (
        cells.length % 7 !== 0
      ) {
        cells.push(null);
      }

      return cells;
    }, [viewYear, viewMonth]);


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
    <section className="match-calendar">

      <div className="match-calendar-header">

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


      <div className="match-calendar-weekdays">

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


      <div className="match-calendar-grid">

        {calendarCells.map(
          (day, index) => {

            if (!day) {
              return (
                <div
                  key={`empty-${index}`}
                  className="match-calendar-empty"
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
              multiple
                ? selectedDates.includes(
                    dateString
                  )
                : dateString ===
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
                    ? "match-calendar-day selected"
                    : "match-calendar-day"
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


                <div className="match-calendar-dots">

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


      {showLegend && (
        <div className="match-calendar-legend">

          <span>
            <i className="mine" />
            내가 등록한 경기
          </span>

          <span>
            <i className="team" />
            경기 가능한 팀 있음
          </span>

        </div>
      )}

    </section>
  );
}

export default MatchCalendar;
