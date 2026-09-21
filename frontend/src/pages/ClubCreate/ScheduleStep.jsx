import {
    FiCheck,
    FiMapPin,
    FiPlus,
    FiTrash2
} from "react-icons/fi";

import CustomSelect from "../../components/common/CustomSelect";

const DAY_OPTIONS = [
    { value: "월요일", label: "월요일" },
    { value: "화요일", label: "화요일" },
    { value: "수요일", label: "수요일" },
    { value: "목요일", label: "목요일" },
    { value: "금요일", label: "금요일" },
    { value: "토요일", label: "토요일" },
    { value: "일요일", label: "일요일" }
];

const TIME_OPTIONS = Array.from(
    { length: 48 },
    (_, index) => {
        const hour = String(Math.floor(index / 2)).padStart(2, "0");
        const minute = index % 2 === 0 ? "00" : "30";
        const time = `${hour}:${minute}`;

        return {
            value: time,
            label: time
        };
    }
);

const CITY_OPTIONS = [
    {
        value: "서울특별시",
        label: "서울특별시"
    }
];

const DISTRICT_OPTIONS = [
    { value: "마포구", label: "마포구" },
    { value: "영등포구", label: "영등포구" },
    { value: "용산구", label: "용산구" },
    { value: "성동구", label: "성동구" }
];

const PLACE_OPTIONS = [
    {
        value: "여의도 한강공원",
        label: "여의도 한강공원"
    },
    {
        value: "망원 한강공원",
        label: "망원 한강공원"
    },
    {
        value: "반포 한강공원",
        label: "반포 한강공원"
    },
    {
        value: "잠실 한강공원",
        label: "잠실 한강공원"
    },
    {
        value: "기타",
        label: "기타 장소"
    }
];

const FREQUENCY_OPTIONS = [
    "주 1회",
    "주 2회",
    "주 3~4회",
    "비정기 활동",
    "자유 참여"
];

function ScheduleStep({ formData, onChange }) {
    const schedules = formData.schedules ?? [];

    const updateSchedule = (scheduleId, field, value) => {
        const updatedSchedules = schedules.map((schedule) =>
            schedule.id === scheduleId
                ? {
                      ...schedule,
                      [field]: value
                  }
                : schedule
        );

        onChange("schedules", updatedSchedules);
    };

    const toggleSchedule = (scheduleId) => {
        const updatedSchedules = schedules.map((schedule) =>
            schedule.id === scheduleId
                ? {
                      ...schedule,
                      enabled: !schedule.enabled
                  }
                : schedule
        );

        onChange("schedules", updatedSchedules);
    };

    const addSchedule = () => {
        const newSchedule = {
            id: Date.now(),
            day: "",
            startTime: "",
            endTime: "",
            enabled: true
        };

        onChange("schedules", [
            ...schedules,
            newSchedule
        ]);
    };

    const removeSchedule = (scheduleId) => {
        if (schedules.length <= 1) {
            return;
        }

        const updatedSchedules = schedules.filter(
            (schedule) => schedule.id !== scheduleId
        );

        onChange("schedules", updatedSchedules);
    };

    return (
        <div className="club-schedule-step">
            <div className="club-schedule-heading">
                <h2>언제, 어디서 활동하나요?</h2>

                <p>
                    요일마다 다른 시간대를 설정할 수 있어요.
                </p>
            </div>

            {/* 활동 일정 */}
            <div className="club-create-field">
                <label>
                    활동 일정 <span>(복수 추가 가능)</span>
                    <em>*</em>
                </label>

                <div className="club-schedule-list">
                    {schedules.map((schedule, index) => (
                        <div
                            key={schedule.id}
                            className={
                                schedule.enabled
                                    ? "club-schedule-card active"
                                    : "club-schedule-card"
                            }
                        >
                            <div className="club-schedule-card-top">
                                <button
                                    type="button"
                                    className="club-schedule-check"
                                    onClick={() =>
                                        toggleSchedule(schedule.id)
                                    }
                                    aria-label={`${
                                        index + 1
                                    }번째 일정 사용 여부`}
                                    aria-pressed={schedule.enabled}
                                >
                                    {schedule.enabled && <FiCheck />}
                                </button>

                                <div className="club-schedule-day">
                                    <CustomSelect
                                        value={schedule.day}
                                        options={DAY_OPTIONS}
                                        placeholder="요일 선택"
                                        ariaLabel={`${
                                            index + 1
                                        }번째 일정 요일 선택`}
                                        onChange={(value) =>
                                            updateSchedule(
                                                schedule.id,
                                                "day",
                                                value
                                            )
                                        }
                                    />
                                </div>

                                <button
                                    type="button"
                                    className="club-schedule-delete"
                                    onClick={() =>
                                        removeSchedule(schedule.id)
                                    }
                                    disabled={schedules.length <= 1}
                                    aria-label={`${
                                        index + 1
                                    }번째 일정 삭제`}
                                >
                                    <FiTrash2 />
                                </button>
                            </div>

                            <div className="club-schedule-time-row">
                                <CustomSelect
                                    value={schedule.startTime}
                                    options={TIME_OPTIONS}
                                    placeholder="시작 시간"
                                    ariaLabel={`${
                                        index + 1
                                    }번째 일정 시작 시간`}
                                    onChange={(value) =>
                                        updateSchedule(
                                            schedule.id,
                                            "startTime",
                                            value
                                        )
                                    }
                                />

                                <span className="club-schedule-time-divider">
                                    ~
                                </span>

                                <CustomSelect
                                    value={schedule.endTime}
                                    options={TIME_OPTIONS}
                                    placeholder="종료 시간"
                                    ariaLabel={`${
                                        index + 1
                                    }번째 일정 종료 시간`}
                                    onChange={(value) =>
                                        updateSchedule(
                                            schedule.id,
                                            "endTime",
                                            value
                                        )
                                    }
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    type="button"
                    className="club-schedule-add-button"
                    onClick={addSchedule}
                >
                    <FiPlus />
                    활동 일정 추가
                </button>
            </div>

            {/* 주요 활동 장소 */}
            <div className="club-create-field">
                <label>
                    주요 활동 장소 <em>*</em>
                </label>

                {/* 시·도 / 구·군 */}
                <div className="club-basic-region-row">
                    <CustomSelect
                        value={formData.city}
                        options={CITY_OPTIONS}
                        placeholder="시·도 선택"
                        ariaLabel="시도 선택"
                        onChange={(value) =>
                            onChange("city", value)
                        }
                    />

                    <CustomSelect
                        value={formData.district}
                        options={DISTRICT_OPTIONS}
                        placeholder="구·군 선택"
                        ariaLabel="구군 선택"
                        onChange={(value) =>
                            onChange("district", value)
                        }
                    />
                </div>

                {/* 실제 활동 장소 */}
                <CustomSelect
                    value={formData.activityPlace}
                    options={PLACE_OPTIONS}
                    placeholder="활동 장소를 선택해주세요"
                    ariaLabel="주요 활동 장소 선택"
                    onChange={(value) =>
                        onChange("activityPlace", value)
                    }
                />

                {/* 상세 주소 */}
                <div className="club-create-icon-input">
                    <FiMapPin />

                    <input
                        type="text"
                        className="club-create-input"
                        placeholder="상세 장소 (선택)"
                        value={formData.activityPlaceDetail}
                        onChange={(event) =>
                            onChange(
                                "activityPlaceDetail",
                                event.target.value
                            )
                        }
                    />
                </div>
            </div>

            {/* 활동 빈도 */}
            <div className="club-create-field">
                <label>
                    활동 빈도 <em>*</em>
                </label>

                <div
                    className="club-frequency-list"
                    role="radiogroup"
                    aria-label="활동 빈도 선택"
                >
                    {FREQUENCY_OPTIONS.map((frequency) => {
                        const isSelected =
                            formData.activityFrequency === frequency;

                        return (
                            <button
                                key={frequency}
                                type="button"
                                role="radio"
                                aria-checked={isSelected}
                                className={
                                    isSelected
                                        ? "club-frequency-option selected"
                                        : "club-frequency-option"
                                }
                                onClick={() =>
                                    onChange(
                                        "activityFrequency",
                                        frequency
                                    )
                                }
                            >
                                <span className="club-frequency-radio">
                                    {isSelected && <span />}
                                </span>

                                <span>{frequency}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default ScheduleStep;