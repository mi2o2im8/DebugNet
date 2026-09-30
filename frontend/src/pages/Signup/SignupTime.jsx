// 6. 활동 가능 시간
import "./Signup.css";
import { useNavigate } from "react-router-dom";
import { useSignup } from "./SignupContext";
import { useState } from "react";
// 뒤로가기 버튼 소환
import { BackButtonIcon } from "../../components/BackButton/BackButton";


// -------------------------------------------------
// 요일 / 시간대 목록
// -------------------------------------------------
const DAYS = ["월", "화", "수", "목", "금", "토", "일"];
const WEEKDAYS = ["월", "화", "수", "목", "금"];
const WEEKEND = ["토", "일"];

// 시간대는 순서대로 이어져 있어야 한다 (붙어 있는 시간대를 하나로 합치기 때문)
const TIME_BANDS = [
    { key: "morning", label: "오전", start: "06:00", end: "12:00" },
    { key: "afternoon", label: "오후", start: "12:00", end: "18:00" },
    { key: "evening", label: "저녁", start: "18:00", end: "22:00" },
    { key: "night", label: "심야", start: "22:00", end: "24:00" },
];


// 직접 입력용 시간 목록 (정시)
const TIME_OPTIONS = Array.from(
    { length: 24 },
    (_, hour) => `${String(hour).padStart(2, "0")}:00`
);
const END_TIME_OPTIONS = [...TIME_OPTIONS.slice(1), "24:00"];


// 시간을 분으로 바꿔서 비교
const timeToMinutes = (time) => {
    if (time === "24:00") return 24 * 60;
    const [hour, minute] = time.split(":").map(Number);
    return hour * 60 + minute;
};


// -------------------------------------------------
// 선택한 요일 × 시간대 → 기존과 같은 { day, startTime, endTime } 형태로 변환
//
// 붙어 있는 시간대는 하나로 합친다.
// 예) 월 + 저녁 + 심야 → { day: "월", startTime: "18:00", endTime: "24:00" }
// → 백엔드, 확인 페이지는 그대로 사용 가능
// -------------------------------------------------
const buildAvailableTimes = (days, bandKeys) => {
    const bands = TIME_BANDS.filter((band) => bandKeys.includes(band.key));

    // 붙어 있는 시간대 합치기
    const ranges = [];
    bands.forEach((band) => {
        const last = ranges[ranges.length - 1];

        if (last && last.endTime === band.start) {
            last.endTime = band.end;
        } else {
            ranges.push({ startTime: band.start, endTime: band.end });
        }
    });

    const result = [];
    DAYS.filter((day) => days.includes(day)).forEach((day) => {
        ranges.forEach((range) => {
            result.push({ day, ...range });
        });
    });

    return result;
};


// -------------------------------------------------
// 이미 저장된 시간(뒤로 갔다 온 경우)에서 선택 상태 복원
// -------------------------------------------------
const restoreSelection = (availableTimes = []) => {
    const days = [];
    const bandKeys = [];
    const customTimes = [];

    availableTimes.forEach((time) => {
        // 직접 입력한 시간은 따로 모은다
        if (time.custom) {
            customTimes.push(time);
            return;
        }

        if (!days.includes(time.day)) days.push(time.day);

        const start = timeToMinutes(time.startTime);
        const end = timeToMinutes(time.endTime);

        TIME_BANDS.forEach((band) => {
            const inRange =
                start <= timeToMinutes(band.start) &&
                end >= timeToMinutes(band.end);

            if (inRange && !bandKeys.includes(band.key)) {
                bandKeys.push(band.key);
            }
        });
    });

    return { days, bandKeys, customTimes };
};


function SignupTime() {
    const navigate = useNavigate();

    // 회원가입 전체 데이터 가져오기
    const { signupData, setSignupData } = useSignup();

    // 선택한 요일 / 시간대 (저장된 값이 있으면 복원)
    const [selectedDays, setSelectedDays] = useState(
        () => restoreSelection(signupData.availableTimes).days
    );
    const [selectedBands, setSelectedBands] = useState(
        () => restoreSelection(signupData.availableTimes).bandKeys
    );

    // 기타(직접 입력) 시간
    const [customTimes, setCustomTimes] = useState(
        () => restoreSelection(signupData.availableTimes).customTimes
    );
    const [showCustom, setShowCustom] = useState(
        () => restoreSelection(signupData.availableTimes).customTimes.length > 0
    );
    const [customDay, setCustomDay] = useState("");
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");


    // 선택이 바뀔 때마다 signupData에도 바로 반영
    // (칩으로 고른 시간 + 직접 입력한 시간)
    const saveSelection = (days, bandKeys, customs = customTimes) => {
        setSelectedDays(days);
        setSelectedBands(bandKeys);
        setCustomTimes(customs);

        setSignupData({
            ...signupData,
            availableTimes: [
                ...buildAvailableTimes(days, bandKeys),
                ...customs,
            ],
        });
    };


    // 직접 입력 시간 추가
    const handleAddCustom = () => {
        if (!customDay || !customStart || !customEnd) {
            alert("요일과 시간을 모두 선택해주세요.");
            return;
        }

        if (timeToMinutes(customStart) >= timeToMinutes(customEnd)) {
            alert("종료 시간은 시작 시간보다 늦어야 합니다.");
            return;
        }

        const isDuplicate = customTimes.some(
            (time) =>
                time.day === customDay &&
                time.startTime === customStart &&
                time.endTime === customEnd
        );

        if (isDuplicate) {
            alert("이미 추가한 시간이에요.");
            return;
        }

        // custom: true → 뒤로 갔다 왔을 때 칩 선택과 구분하기 위한 표시
        // (백엔드에서는 사용하지 않는 값이라 무시됨)
        const newTime = {
            day: customDay,
            startTime: customStart,
            endTime: customEnd,
            custom: true,
        };

        saveSelection(selectedDays, selectedBands, [...customTimes, newTime]);

        setCustomDay("");
        setCustomStart("");
        setCustomEnd("");
    };


    // 직접 입력 시간 삭제
    const handleDeleteCustom = (index) => {
        saveSelection(
            selectedDays,
            selectedBands,
            customTimes.filter((_, i) => i !== index)
        );
    };


    // 요일 하나 선택 / 해제
    const toggleDay = (day) => {
        const nextDays = selectedDays.includes(day)
            ? selectedDays.filter((d) => d !== day)
            : [...selectedDays, day];

        saveSelection(nextDays, selectedBands);
    };


    // 평일 / 주말 한 번에 선택 (이미 다 선택돼 있으면 해제)
    const toggleDayGroup = (group) => {
        const allSelected = group.every((day) => selectedDays.includes(day));

        const nextDays = allSelected
            ? selectedDays.filter((day) => !group.includes(day))
            : [...new Set([...selectedDays, ...group])];

        saveSelection(nextDays, selectedBands);
    };


    // 시간대 선택 / 해제
    const toggleBand = (key) => {
        const nextBands = selectedBands.includes(key)
            ? selectedBands.filter((k) => k !== key)
            : [...selectedBands, key];

        saveSelection(selectedDays, nextBands);
    };


    const isWeekdaysSelected = WEEKDAYS.every((day) => selectedDays.includes(day));
    const isWeekendSelected = WEEKEND.every((day) => selectedDays.includes(day));


    // 선택 요약 문구
    const summaryDays = DAYS.filter((day) => selectedDays.includes(day)).join(", ");
    const summaryBands = TIME_BANDS
        .filter((band) => selectedBands.includes(band.key))
        .map((band) => `${band.label} ${band.start}~${band.end}`)
        .join(", ");


    const hasChipSelection = selectedDays.length > 0 && selectedBands.length > 0;
    const hasAnySelection = hasChipSelection || customTimes.length > 0;


    const handleNext = () => {
        // 요일만 고르고 시간대를 안 고른 경우 (또는 그 반대)
        if (selectedDays.length > 0 && selectedBands.length === 0) {
            alert("선택한 요일의 시간대를 골라주세요.");
            return;
        }

        if (selectedBands.length > 0 && selectedDays.length === 0) {
            alert("선택한 시간대의 요일을 골라주세요.");
            return;
        }

        if (!hasAnySelection) {
            alert("활동 가능한 시간을 하나 이상 선택해주세요.");
            return;
        }

        // 활동 빈도 선택 페이지로 이동
        navigate("/signup/basic/SignupFrequency");
    };


    return (
        // 헤더
        <div className="signup-container">

            {/* 뒤로가기 버튼 */}
            <button
                type="button"
                className="Back-btn"
                onClick={() => navigate("/signup/basic/SignupLocation")}
                aria-label="뒤로가기"
            >
                <BackButtonIcon alt="뒤로가기" />
            </button>

            <div className="signup-header06">
                <h2>활동 가능한 시간을</h2>
                <h2>선택해주세요</h2>
                {/* <h3 className="ex-title">
                    (예)월19:00~22:00,<br/>
                    토 13:00~18:00
                </h3> */}
                {/* <h3 className="ex-title">
                    요일과 시간대 모두 여러 개 고를 수 있어요<br/>
                    토 13:00~18:00
                </h3> */}
                <p>요일과 시간대 모두 여러 개 고를 수 있어요.</p>
            </div>


            {/* ---- 요일 선택 ---- */}
            <div className="time-pick-section">

                <div className="time-pick-title-row">
                    <h4>요일</h4>

                    <div className="time-pick-quick">
                        <button
                            type="button"
                            className={isWeekdaysSelected ? "selected" : ""}
                            onClick={() => toggleDayGroup(WEEKDAYS)}
                        >
                            평일
                        </button>

                        <button
                            type="button"
                            className={isWeekendSelected ? "selected" : ""}
                            onClick={() => toggleDayGroup(WEEKEND)}
                        >
                            주말
                        </button>
                    </div>
                </div>

                <div className="time-pick-days">
                    {DAYS.map((day) => (
                        <button
                            key={day}
                            type="button"
                            className={selectedDays.includes(day) ? "selected" : ""}
                            onClick={() => toggleDay(day)}
                        >
                            {day}
                        </button>
                    ))}
                </div>

            </div>


            {/* ---- 시간대 선택 ---- */}
            <div className="time-pick-section">

                <div className="time-pick-title-row">
                    <h4>시간대</h4>
                </div>

                <div className="time-pick-bands">
                    {TIME_BANDS.map((band) => (
                        <button
                            key={band.key}
                            type="button"
                            className={selectedBands.includes(band.key) ? "selected" : ""}
                            onClick={() => toggleBand(band.key)}
                        >
                            <strong>{band.label}</strong>
                            <span>{band.start} ~ {band.end}</span>
                        </button>
                    ))}
                </div>

            </div>


            {/* ---- 기타: 직접 입력 ---- */}
            <div className="time-pick-section">

                {!showCustom ? (
                    <button
                        type="button"
                        className="time-custom-open"
                        onClick={() => setShowCustom(true)}
                    >
                        원하는 시간이 없나요? <span>+ 직접 입력</span>
                    </button>
                ) : (
                    <>
                        <div className="time-pick-title-row">
                            <h4>기타 (직접 입력)</h4>
                        </div>

                        <div className="time-custom-row">
                            <select
                                value={customDay}
                                onChange={(e) => setCustomDay(e.target.value)}
                            >
                                <option value="">요일</option>
                                {DAYS.map((day) => (
                                    <option key={day} value={day}>
                                        {day}요일
                                    </option>
                                ))}
                            </select>

                            <select
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                            >
                                <option value="">시작</option>
                                {TIME_OPTIONS.map((time) => (
                                    <option key={time} value={time}>
                                        {time}
                                    </option>
                                ))}
                            </select>

                            <span className="time-custom-tilde">~</span>

                            <select
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                            >
                                <option value="">종료</option>
                                {END_TIME_OPTIONS.map((time) => (
                                    <option key={time} value={time}>
                                        {time}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="button"
                            className="time-custom-add"
                            onClick={handleAddCustom}
                        >
                            + 시간 추가
                        </button>

                        {customTimes.length > 0 && (
                            <div className="time-custom-list">
                                {customTimes.map((time, index) => (
                                    <button
                                        key={`${time.day}-${time.startTime}-${time.endTime}`}
                                        type="button"
                                        className="selected-regions-item"
                                        onClick={() => handleDeleteCustom(index)}
                                    >
                                        <span>
                                            {time.day} {time.startTime}~{time.endTime}
                                        </span>
                                        <span className="regions-remove">x</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}

            </div>


            {/* ---- 선택 요약 ---- */}
            <div className="time-pick-summary">
                {hasAnySelection ? (
                    <>
                        {hasChipSelection && (
                            <>
                                <p className="time-pick-summary-days">{summaryDays}</p>
                                <p className="time-pick-summary-bands">{summaryBands}</p>
                            </>
                        )}

                        {customTimes.length > 0 && (
                            <p className="time-pick-summary-bands">
                                직접 입력{" "}
                                {customTimes
                                    .map((t) => `${t.day} ${t.startTime}~${t.endTime}`)
                                    .join(", ")}
                            </p>
                        )}
                    </>
                ) : (
                    <p className="time-pick-summary-empty">
                        요일과 시간대를 선택하면 여기에 표시돼요
                    </p>
                )}
            </div>


            {/* ---------------다음버튼 -----------------*/}
            <button className="Next-btn" onClick={handleNext}>
                다음
            </button>

        </div>
    );
}

// -------------
export default SignupTime;
