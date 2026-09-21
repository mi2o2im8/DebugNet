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
  onSelectDate,
  myAvailabilityDates = [],
  opponentAvailableDates = [],
  showLegend = true,
}) {
  const initialMonth =
    getInitialMonth(
      selectedDate
    );

  const [viewYear, setViewYear] =
    useState(initialMonth.year);

  const [viewMonth, setViewMonth] =
    useState(initialMonth.month);


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
