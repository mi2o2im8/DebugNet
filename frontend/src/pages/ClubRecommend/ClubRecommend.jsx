import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiChevronRight,
  FiClock,
  FiMapPin,
  FiSliders,
  FiUsers,
} from "react-icons/fi";

import BackButton from "../../components/BackButton/BackButton";
import CustomSelect from "../../components/common/CustomSelect";
import {
  getClubRecommendationDefaults,
  recommendClubs,
} from "../../api/clubApi";

import "./ClubRecommend.css";

const DAY_OPTIONS = [
  { short: "월", full: "월요일" },
  { short: "화", full: "화요일" },
  { short: "수", full: "수요일" },
  { short: "목", full: "목요일" },
  { short: "금", full: "금요일" },
  { short: "토", full: "토요일" },
  { short: "일", full: "일요일" },
];

const DAYS = DAY_OPTIONS.map((item) => item.short);
const WEEKDAYS = ["월", "화", "수", "목", "금"];
const WEEKEND = ["토", "일"];

const DAY_TO_FULL = Object.fromEntries(
  DAY_OPTIONS.map((item) => [item.short, item.full])
);

const TIME_BANDS = [
  { key: "morning", label: "오전", start: "06:00", end: "12:00" },
  { key: "afternoon", label: "오후", start: "12:00", end: "18:00" },
  { key: "evening", label: "저녁", start: "18:00", end: "22:00" },
  { key: "night", label: "심야", start: "22:00", end: "24:00" },
];

const TIME_OPTIONS = Array.from(
  { length: 24 },
  (_, hour) => `${String(hour).padStart(2, "0")}:00`
);

const END_TIME_OPTIONS = [...TIME_OPTIONS.slice(1), "24:00"];

const SEOUL_DISTRICTS = [
  "전체",
  "강남구",
  "강동구",
  "강북구",
  "강서구",
  "관악구",
  "광진구",
  "구로구",
  "금천구",
  "노원구",
  "도봉구",
  "동대문구",
  "동작구",
  "마포구",
  "서대문구",
  "서초구",
  "성동구",
  "성북구",
  "송파구",
  "양천구",
  "영등포구",
  "용산구",
  "은평구",
  "종로구",
  "중구",
  "중랑구",
];

const REGION_OPTIONS = SEOUL_DISTRICTS.map((district) => ({
  value: district,
  label: district,
}));

const SKILL_OPTIONS = [
  { value: "any", label: "상관없음" },
  { value: "초급", label: "초급" },
  { value: "중급", label: "중급" },
  { value: "상급", label: "상급" },
];

const normalizeTime = (value, fallback = "") => {
  if (!value) return fallback;
  return String(value).slice(0, 5);
};

const normalizeRegion = (value) => {
  const text = String(value ?? "").trim();
  const match = text.match(/([가-힣]+구)/);
  const district = match ? match[1] : text;

  return SEOUL_DISTRICTS.includes(district) ? district : "전체";
};

const normalizeSkill = (value) => {
  const normalized = String(value ?? "").trim();

  if (!normalized || normalized === "수준무관" || normalized === "수준 무관") {
    return "any";
  }

  if (normalized === "입문") {
    return "초급";
  }

  return ["초급", "중급", "상급"].includes(normalized)
    ? normalized
    : "any";
};

const normalizeDay = (value) => {
  const text = String(value ?? "").trim();

  const matched = DAY_OPTIONS.find(
    (item) => item.short === text || item.full === text
  );

  return matched?.short ?? "";
};

const normalizeEndTimeForUi = (startTime, endTime) => {
  const start = normalizeTime(startTime);
  const end = normalizeTime(endTime);

  if (end === "00:00" && start && start !== "00:00") {
    return "24:00";
  }

  return end;
};

const timeToMinutes = (time) => {
  if (time === "24:00") return 24 * 60;

  const [hour, minute] = String(time || "")
    .split(":")
    .map(Number);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }

  return hour * 60 + minute;
};

const getBandKeysForRange = (startTime, endTime) => {
  const startIndex = TIME_BANDS.findIndex(
    (band) => band.start === startTime
  );
  const endIndex = TIME_BANDS.findIndex(
    (band) => band.end === endTime
  );

  if (startIndex < 0 || endIndex < startIndex) {
    return [];
  }

  return TIME_BANDS.slice(startIndex, endIndex + 1).map(
    (band) => band.key
  );
};

const restoreTimeSelection = (availableTimes = []) => {
  const bandRowsByDay = new Map();
  const customTimes = [];
  const normalizedRows = [];

  availableTimes.forEach((item) => {
    const day = normalizeDay(item.day_of_week);
    const startTime = normalizeTime(item.start_time);
    const endTime = normalizeEndTimeForUi(startTime, item.end_time);

    if (!day || !startTime || !endTime) {
      return;
    }

    const normalizedRow = {
      day,
      startTime,
      endTime,
    };

    normalizedRows.push(normalizedRow);

    const bandKeys = getBandKeysForRange(startTime, endTime);

    if (bandKeys.length === 0) {
      customTimes.push(normalizedRow);
      return;
    }

    const previous = bandRowsByDay.get(day) ?? [];
    bandRowsByDay.set(day, [...new Set([...previous, ...bandKeys])]);
  });

  const bandDays = DAYS.filter((day) => bandRowsByDay.has(day));
  const signatures = bandDays.map((day) =>
    TIME_BANDS
      .filter((band) => (bandRowsByDay.get(day) ?? []).includes(band.key))
      .map((band) => band.key)
      .join("|")
  );

  const sameBandPattern =
    signatures.length === 0 || signatures.every((value) => value === signatures[0]);

  if (!sameBandPattern) {
    return {
      days: [],
      bandKeys: [],
      customTimes: normalizedRows,
    };
  }

  return {
    days: bandDays,
    bandKeys:
      bandDays.length > 0
        ? TIME_BANDS
            .filter((band) => (bandRowsByDay.get(bandDays[0]) ?? []).includes(band.key))
            .map((band) => band.key)
        : [],
    customTimes,
  };
};

const buildBandAvailableTimes = (days, bandKeys) => {
  const bands = TIME_BANDS.filter((band) => bandKeys.includes(band.key));
  const ranges = [];

  bands.forEach((band) => {
    const last = ranges[ranges.length - 1];

    if (last && last.end_time === band.start) {
      last.end_time = band.end;
    } else {
      ranges.push({
        start_time: band.start,
        end_time: band.end,
      });
    }
  });

  const result = [];

  DAYS.filter((day) => days.includes(day)).forEach((day) => {
    ranges.forEach((range) => {
      result.push({
        day_of_week: DAY_TO_FULL[day],
        ...range,
      });
    });
  });

  return result;
};

const toBackendTime = (value, { isEnd = false } = {}) => {
  if (!value) return value;

  if (value === "24:00") {
    return isEnd ? "23:59:59" : "24:00:00";
  }

  return value.length === 5 ? `${value}:00` : value;
};

function ClubRecommend() {
  const navigate = useNavigate();

  const [defaults, setDefaults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [sportId, setSportId] = useState("");
  const [sportLevel, setSportLevel] = useState("any");
  const [region, setRegion] = useState("전체");

  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedBands, setSelectedBands] = useState([]);
  const [customTimes, setCustomTimes] = useState([]);
  const [showCustom, setShowCustom] = useState(false);
  const [customDay, setCustomDay] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [timeFlexible, setTimeFlexible] = useState(false);

  const [atmospheres, setAtmospheres] = useState([]);
  const [activityFrequency, setActivityFrequency] = useState("");
  const [maxMonthlyFee, setMaxMonthlyFee] = useState(0);

  useEffect(() => {
    let active = true;

    const loadDefaults = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getClubRecommendationDefaults();
        if (!active) return;

        const defaultTimes = data.available_times ?? [];
        const restoredTime = restoreTimeSelection(defaultTimes);

        setDefaults(data);
        setSportId(
          data.selected_sport_id != null
            ? String(data.selected_sport_id)
            : "any"
        );
        setSportLevel(normalizeSkill(data.selected_sport_level));
        setRegion(normalizeRegion((data.regions ?? [])[0]));

        setSelectedDays(restoredTime.days);
        setSelectedBands(restoredTime.bandKeys);
        setCustomTimes(restoredTime.customTimes);
        setShowCustom(restoredTime.customTimes.length > 0);
        setTimeFlexible(defaultTimes.length === 0);

        setAtmospheres(data.atmospheres ?? []);
        setActivityFrequency(data.activity_frequency ?? "");
        setMaxMonthlyFee(Number(data.max_monthly_fee ?? 0));
      } catch (err) {
        console.error("동호회 추천 기본값 조회 실패:", err);
        if (active) {
          setError(err.message || "추천 정보를 불러오지 못했습니다.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDefaults();

    return () => {
      active = false;
    };
  }, []);

  const sportOptions = useMemo(
    () => [
      { value: "any", label: "상관없음" },
      ...(defaults?.sports ?? []).map((sport) => ({
        value: String(sport.sport_id),
        label: sport.sport_name,
      })),
    ],
    [defaults]
  );

  const frequencyOptions = useMemo(
    () =>
      (defaults?.activity_frequency_options ?? []).map((value) => ({
        value,
        label: value,
      })),
    [defaults]
  );

  const handleSportChange = (value) => {
    setSportId(value);

    if (value === "any") {
      return;
    }

    const selectedSport = (defaults?.sports ?? []).find(
      (sport) => String(sport.sport_id) === String(value)
    );

    if (selectedSport?.sport_level) {
      setSportLevel(normalizeSkill(selectedSport.sport_level));
    }
  };

  const toggleValue = (value, setter) => {
    setter((previous) =>
      previous.includes(value)
        ? previous.filter((item) => item !== value)
        : [...previous, value]
    );
  };

  const toggleDay = (day) => {
    setSelectedDays((previous) =>
      previous.includes(day)
        ? previous.filter((item) => item !== day)
        : [...previous, day]
    );
  };

  const toggleDayGroup = (group) => {
    setSelectedDays((previous) => {
      const allSelected = group.every((day) => previous.includes(day));

      return allSelected
        ? previous.filter((day) => !group.includes(day))
        : [...new Set([...previous, ...group])];
    });
  };

  const toggleBand = (key) => {
    setSelectedBands((previous) =>
      previous.includes(key)
        ? previous.filter((item) => item !== key)
        : [...previous, key]
    );
  };

  const handleAddCustomTime = () => {
    if (!customDay || !customStart || !customEnd) {
      setError("요일과 시간을 모두 선택해주세요.");
      return;
    }

    const startMinutes = timeToMinutes(customStart);
    const endMinutes = timeToMinutes(customEnd);

    if (
      startMinutes === null ||
      endMinutes === null ||
      startMinutes >= endMinutes
    ) {
      setError("종료 시간은 시작 시간보다 늦어야 합니다.");
      return;
    }

    const isDuplicate = customTimes.some(
      (time) =>
        time.day === customDay &&
        time.startTime === customStart &&
        time.endTime === customEnd
    );

    if (isDuplicate) {
      setError("이미 추가한 시간이에요.");
      return;
    }

    setCustomTimes((previous) => [
      ...previous,
      {
        day: customDay,
        startTime: customStart,
        endTime: customEnd,
      },
    ]);

    setCustomDay("");
    setCustomStart("");
    setCustomEnd("");
    setError("");
  };

  const removeCustomTime = (index) => {
    setCustomTimes((previous) =>
      previous.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const isWeekdaysSelected = WEEKDAYS.every((day) =>
    selectedDays.includes(day)
  );
  const isWeekendSelected = WEEKEND.every((day) =>
    selectedDays.includes(day)
  );

  const hasChipSelection =
    selectedDays.length > 0 && selectedBands.length > 0;
  const hasAnyTimeSelection = hasChipSelection || customTimes.length > 0;

  const summaryDays = DAYS.filter((day) => selectedDays.includes(day)).join(", ");
  const summaryBands = TIME_BANDS
    .filter((band) => selectedBands.includes(band.key))
    .map((band) => `${band.label} ${band.start}~${band.end}`)
    .join(", ");

  const buildRequestTimes = () => {
    const bandTimes = buildBandAvailableTimes(selectedDays, selectedBands);
    const customRequestTimes = customTimes.map((item) => ({
      day_of_week: DAY_TO_FULL[item.day] ?? item.day,
      start_time: item.startTime,
      end_time: item.endTime,
    }));

    return [...bandTimes, ...customRequestTimes].map((item) => ({
      day_of_week: item.day_of_week,
      start_time: toBackendTime(item.start_time),
      end_time: toBackendTime(item.end_time, { isEnd: true }),
    }));
  };

  const handleSubmit = async () => {
    if (!timeFlexible) {
      if (selectedDays.length > 0 && selectedBands.length === 0) {
        setError("선택한 요일의 시간대를 골라주세요.");
        return;
      }

      if (selectedBands.length > 0 && selectedDays.length === 0) {
        setError("선택한 시간대의 요일을 골라주세요.");
        return;
      }

      if (!hasAnyTimeSelection) {
        setError("활동 가능 시간을 선택하거나 상관없음을 선택해주세요.");
        return;
      }
    }

    try {
      setSubmitting(true);
      setError("");

      const requestTimes = timeFlexible ? [] : buildRequestTimes();

      const requestData = {
        sport_id: sportId === "any" ? null : Number(sportId),
        sport_level: sportLevel === "any" ? null : sportLevel,
        regions: region === "전체" ? [] : [region],
        available_times: requestTimes,
        atmospheres,
        activity_frequency: activityFrequency || null,
        max_monthly_fee: Number(maxMonthlyFee || 0),
        limit: 10,
      };

      const response = await recommendClubs(requestData);
      const selectedSport = (defaults?.sports ?? []).find(
        (sport) => String(sport.sport_id) === String(sportId)
      );

      navigate("/clubs/recommend/result", {
        state: {
          recommendations: response.recommendations ?? [],
          totalCandidates: response.total_candidates ?? 0,
          searchCondition: {
            ...requestData,
            sport_name:
              sportId === "any"
                ? "상관없음"
                : selectedSport?.sport_name ?? "",
            sport_level_label:
              sportLevel === "any" ? "상관없음" : sportLevel,
            region_label: region === "전체" ? "상관없음" : region,
            time_flexible: timeFlexible,
            available_times_display: requestTimes,
          },
        },
      });
    } catch (err) {
      console.error("맞춤 동호회 추천 실패:", err);
      setError(err.message || "동호회 추천에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="club-recommend-page">
        <header className="club-recommend-header">
          <BackButton
            onClick={() => navigate("/clubs", { replace: true })}
            className="club-recommend-back"
          />
          <h1>맞춤 동호회 추천</h1>
        </header>
        <div className="club-recommend-state">내 정보를 불러오는 중이에요.</div>
      </div>
    );
  }

  if (!defaults) {
    return (
      <div className="club-recommend-page">
        <header className="club-recommend-header">
          <BackButton
            onClick={() => navigate("/clubs", { replace: true })}
            className="club-recommend-back"
          />
          <h1>맞춤 동호회 추천</h1>
        </header>
        <div className="club-recommend-state error">{error}</div>
      </div>
    );
  }

  return (
    <div className="club-recommend-page">
      <header className="club-recommend-header">
        <BackButton
          onClick={() => navigate("/clubs", { replace: true })}
          className="club-recommend-back"
        />
        <h1>맞춤 동호회 추천</h1>
      </header>

      <main className="club-recommend-main">
        <section className="club-recommend-intro">
          <div className="club-recommend-intro-icon">AI</div>
          <div>
            <strong>내 정보로 조건을 채워뒀어요</strong>
            <p>
              그대로 추천받거나, 이번 추천에서만 원하는 조건으로 바꿀 수 있어요.
            </p>
          </div>
        </section>

        <section className="club-recommend-section">
          <div className="club-recommend-section-title">

            <div className="club-recommend-section-heading">
              <FiUsers />

              <h2>
                종목과 실력
              </h2>
            </div>

            <p>
              가입할 동호회의 운동 조건을 선택해주세요.
            </p>

          </div>

          <label className="club-recommend-field">
            <span>종목</span>
            <CustomSelect
              value={sportId}
              options={sportOptions}
              onChange={handleSportChange}
              placeholder="종목 선택"
              ariaLabel="추천 종목 선택"
            />
          </label>

          <label className="club-recommend-field">
            <span>운동 수준</span>
            <CustomSelect
              value={sportLevel}
              options={SKILL_OPTIONS}
              onChange={setSportLevel}
              placeholder="운동 수준 선택"
              ariaLabel="운동 수준 선택"
            />
          </label>
        </section>

        <section className="club-recommend-section">
          <div className="club-recommend-section-title">

            <div className="club-recommend-section-heading">
              <FiMapPin />

              <h2>
                활동 지역
              </h2>
            </div>

            <p>
              주로 활동하고 싶은 서울 지역을 선택해주세요.
            </p>

          </div>

          <label className="club-recommend-field club-recommend-region-field">
            <span>서울 자치구</span>
            <CustomSelect
              value={region}
              options={REGION_OPTIONS}
              onChange={setRegion}
              placeholder="활동 지역 선택"
              ariaLabel="활동 지역 선택"
            />
          </label>
        </section>

        <section className="club-recommend-section">
          <div className="club-recommend-section-title club-recommend-time-title">

            <div className="club-recommend-section-heading">
              <FiClock />

              <h2>
                활동 가능 시간
              </h2>
            </div>

            <p>
              회원가입 때처럼 요일과 시간대를
              간단하게 선택할 수 있어요.
            </p>

            <button
              type="button"
              className={
                timeFlexible
                  ? "club-recommend-time-any active"
                  : "club-recommend-time-any"
              }
              onClick={() =>
                setTimeFlexible((previous) => !previous)
              }
            >
              상관없음
            </button>

          </div>

          {timeFlexible ? (
            <div className="club-recommend-time-any-guide">
              요일과 시간에 관계없이 추천받습니다.
            </div>
          ) : (
            <div className="club-recommend-time-picker">
              <div className="club-recommend-time-block">
                <div className="club-recommend-time-subhead">
                  <h3>요일</h3>

                  <div className="club-recommend-time-quick">
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

                <div className="club-recommend-time-days">
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

              <div className="club-recommend-time-block">
                <div className="club-recommend-time-subhead">
                  <h3>시간대</h3>
                </div>

                <div className="club-recommend-time-bands">
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

              <div className="club-recommend-time-block custom">
                {!showCustom ? (
                  <button
                    type="button"
                    className="club-recommend-time-custom-open"
                    onClick={() => setShowCustom(true)}
                  >
                    원하는 시간이 없나요? <span>+ 직접 입력</span>
                  </button>
                ) : (
                  <>
                    <div className="club-recommend-time-subhead">
                      <h3>기타 (직접 입력)</h3>
                    </div>

                    <div className="club-recommend-time-custom-row">
                      <select
                        value={customDay}
                        onChange={(event) => setCustomDay(event.target.value)}
                        aria-label="직접 입력 요일"
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
                        onChange={(event) => setCustomStart(event.target.value)}
                        aria-label="직접 입력 시작 시간"
                      >
                        <option value="">시작</option>
                        {TIME_OPTIONS.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>

                      <span>~</span>

                      <select
                        value={customEnd}
                        onChange={(event) => setCustomEnd(event.target.value)}
                        aria-label="직접 입력 종료 시간"
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
                      className="club-recommend-time-custom-add"
                      onClick={handleAddCustomTime}
                    >
                      + 시간 추가
                    </button>

                    {customTimes.length > 0 && (
                      <div className="club-recommend-time-custom-list">
                        {customTimes.map((time, index) => (
                          <button
                            key={`${time.day}-${time.startTime}-${time.endTime}-${index}`}
                            type="button"
                            className="club-recommend-time-custom-item"
                            onClick={() => removeCustomTime(index)}
                            aria-label={`${time.day} ${time.startTime}~${time.endTime} 삭제`}
                          >
                            <span>
                              {time.day} {time.startTime}~{time.endTime}
                            </span>
                            <strong>×</strong>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="club-recommend-time-summary">
                {hasAnyTimeSelection ? (
                  <>
                    {hasChipSelection && (
                      <>
                        <p className="days">{summaryDays}</p>
                        <p>{summaryBands}</p>
                      </>
                    )}

                    {customTimes.length > 0 && (
                      <p>
                        직접 입력 {" "}
                        {customTimes
                          .map(
                            (time) =>
                              `${time.day} ${time.startTime}~${time.endTime}`
                          )
                          .join(", ")}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="empty">
                    요일과 시간대를 선택하면 여기에 표시돼요.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="club-recommend-section">
          <div className="club-recommend-section-title">
            <FiSliders />
            <div>
              <h2>선호 조건</h2>
              <p>분위기, 활동 빈도, 회비까지 함께 비교해요.</p>
            </div>
          </div>

          <div className="club-recommend-field">
            <span>선호 분위기</span>
            <div className="club-recommend-chip-list compact">
              {(defaults.atmosphere_options ?? []).map((atmosphere) => (
                <button
                  key={atmosphere}
                  type="button"
                  className={`club-recommend-chip ${
                    atmospheres.includes(atmosphere) ? "selected" : ""
                  }`}
                  onClick={() => toggleValue(atmosphere, setAtmospheres)}
                >
                  {atmosphere}
                </button>
              ))}
            </div>
          </div>

          <label className="club-recommend-field">
            <span>활동 빈도</span>
            <CustomSelect
              value={activityFrequency}
              options={frequencyOptions}
              onChange={setActivityFrequency}
              placeholder="활동 빈도 선택"
              ariaLabel="활동 빈도 선택"
            />
          </label>

          <label className="club-recommend-field">
            <span>월 회비 상한</span>
            <div className="club-recommend-fee-input">
              <input
                type="number"
                min="0"
                step="1000"
                value={maxMonthlyFee}
                onChange={(event) =>
                  setMaxMonthlyFee(Math.max(0, Number(event.target.value || 0)))
                }
              />
              <span>원</span>
            </div>
          </label>
        </section>

        {error && <p className="club-recommend-error">{error}</p>}

        <button
          type="button"
          className="club-recommend-submit"
          onClick={handleSubmit}
          disabled={submitting}
        >
          <span>{submitting ? "추천 중..." : "AI 동호회 추천받기"}</span>
          {!submitting && <FiChevronRight />}
        </button>
      </main>
    </div>
  );
}

export default ClubRecommend;
