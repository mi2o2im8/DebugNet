import { useEffect, useRef, useState } from "react";

const createTimeOptions = () => {
  const times = [];

  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += 30) {
      const h = String(hour).padStart(2, "0");
      const m = String(minute).padStart(2, "0");

      times.push(`${h}:${m}`);
    }
  }

  // 하루의 마지막 시간
  times.push("24:00");

  return times;
};

const TIME_OPTIONS = createTimeOptions();

const formatTime = (time) => {
  if (!time) return "";

  if (time === "24:00") {
    return "자정 12:00";
  }

  const [hourString, minute] =
    time.slice(0, 5).split(":");

  const hour = Number(hourString);
  const period = hour < 12 ? "오전" : "오후";

  let displayHour = hour % 12;

  if (displayHour === 0) {
    displayHour = 12;
  }

  return `${period} ${displayHour}:${minute}`;
};

function MatchTimePicker({
  value,
  onChange,
  placeholder = "시간 선택",
  minTime = null,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const pickerRef = useRef(null);

  const availableTimes = TIME_OPTIONS.filter((time) => {
    if (!minTime) {
      return true;
    }

    return time > minTime.slice(0, 5);
  });

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  const handleSelectTime = (time) => {
    onChange(time);
    setIsOpen(false);
  };

  return (
    <div
      className="match-time-picker"
      ref={pickerRef}
    >
      <button
        type="button"
        className={`match-time-picker-button ${
          value ? "selected" : ""
        }`}
        onClick={() =>
          setIsOpen((prev) => !prev)
        }
      >
        <span>
          {value
            ? formatTime(value)
            : placeholder}
        </span>

        <span
          className={`match-time-arrow ${
            isOpen ? "open" : ""
          }`}
        >
          ▾
        </span>
      </button>

      {isOpen && (
        <div className="match-time-picker-menu">
          {availableTimes.map((time) => (
            <button
              key={time}
              type="button"
              className={
                value?.slice(0, 5) === time
                  ? "active"
                  : ""
              }
              onClick={() =>
                handleSelectTime(time)
              }
            >
              {formatTime(time)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default MatchTimePicker;