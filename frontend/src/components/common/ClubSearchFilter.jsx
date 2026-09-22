import { useState } from "react";
import "./ClubSearch.css";

// =====================================================
// 동호회 검색 및 필터 공통 컴포넌트
// =====================================================

function ClubSearchFilter({
  isSearchOpen = true,
  searchKeyword = "",
  onSearchKeywordChange = () => {},
  selectedFilters = {
    sports: [],
    regions: [],
    days: [],
    timeSlots: [],
  },
  onSelectedFiltersChange = () => {},
  onToggleSearch = () => {},
}) {
  // ---------------------------------------------------
  // 필터 모달 열림 / 닫힘
  // ---------------------------------------------------
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // ---------------------------------------------------
  // 모달 내부 임시 선택값
  // ---------------------------------------------------
  const [draftSports, setDraftSports] = useState([]);
  const [draftRegions, setDraftRegions] = useState([]);
  const [draftDays, setDraftDays] = useState([]);
  const [draftTimeSlots, setDraftTimeSlots] = useState([]);

  // ---------------------------------------------------
  // 운동 종목 데이터
  // ---------------------------------------------------
  const sports = [
    {
      label: "축구/풋살",
      value: "축구·풋살",
      icon: "⚽",
    },
    {
      label: "배드민턴",
      value: "배드민턴",
      icon: "🏸",
    },
    {
      label: "탁구",
      value: "탁구",
      icon: "🏓",
    },
    {
      label: "테니스",
      value: "테니스",
      icon: "🎾",
    },
    {
      label: "배구",
      value: "배구",
      icon: "🏐",
    },
  ];

  // ---------------------------------------------------
  // 활동 지역 데이터
  // ---------------------------------------------------
  const regions = [
    "서울 종로구",
    "서울 중구",
    "서울 용산구",
    "서울 성동구",
    "서울 광진구",
    "서울 동대문구",
    "서울 중랑구",
    "서울 성북구",
    "서울 강북구",
    "서울 도봉구",
    "서울 노원구",
    "서울 은평구",
    "서울 서대문구",
    "서울 양천구",
    "서울 강서구",
    "서울 구로구",
    "서울 금천구",
    "서울 마포구",
    "서울 영등포구",
    "서울 동작구",
    "서울 관악구",
    "서울 서초구",
    "서울 강남구",
    "서울 송파구",
    "서울 강동구",
  ];

  // ---------------------------------------------------
  // 활동 요일 데이터
  // ---------------------------------------------------
  const days = [
    { label: "월", value: "월요일" },
    { label: "화", value: "화요일" },
    { label: "수", value: "수요일" },
    { label: "목", value: "목요일" },
    { label: "금", value: "금요일" },
    { label: "토", value: "토요일" },
    { label: "일", value: "일요일" },
  ];

  // ---------------------------------------------------
  // 활동 시간 데이터
  // ---------------------------------------------------
  const timeSlots = [
    {
      label: "오전",
      value: "06:00-12:00",
    },
    {
      label: "오후",
      value: "12:00-18:00",
    },
    {
      label: "저녁",
      value: "18:00-24:00",
    },
  ];

  // ---------------------------------------------------
  // 현재 적용된 필터
  // ---------------------------------------------------
  const selectedSports = selectedFilters.sports || [];
  const selectedRegions = selectedFilters.regions || [];
  const selectedDays = selectedFilters.days || [];
  const selectedTimeSlots = selectedFilters.timeSlots || [];

  // ---------------------------------------------------
  // 필터 선택 개수
  // ---------------------------------------------------
  const selectedFilterCount =
    selectedSports.length +
    selectedRegions.length +
    selectedDays.length +
    selectedTimeSlots.length;

  // ---------------------------------------------------
  // 필터 모달 열기
  // 기존 적용된 필터를 임시 선택값으로 복사
  // ---------------------------------------------------
  const openFilter = () => {
    setDraftSports([...selectedSports]);
    setDraftRegions([...selectedRegions]);
    setDraftDays([...selectedDays]);
    setDraftTimeSlots([...selectedTimeSlots]);

    setIsFilterOpen(true);
  };

  // ---------------------------------------------------
  // 종목 선택 / 해제
  // ---------------------------------------------------
  const handleSportChange = (sport) => {
    setDraftSports((prev) =>
      prev.includes(sport)
        ? prev.filter((item) => item !== sport)
        : [...prev, sport]
    );
  };

  // ---------------------------------------------------
  // 지역 선택 / 해제
  // ---------------------------------------------------
  const handleRegionChange = (region) => {
    setDraftRegions((prev) =>
      prev.includes(region)
        ? prev.filter((item) => item !== region)
        : [...prev, region]
    );
  };

  // ---------------------------------------------------
  // 요일 선택 / 해제
  // ---------------------------------------------------
  const handleDayChange = (day) => {
    setDraftDays((prev) =>
      prev.includes(day)
        ? prev.filter((item) => item !== day)
        : [...prev, day]
    );
  };

  // ---------------------------------------------------
  // 시간 선택 / 해제
  // ---------------------------------------------------
  const handleTimeSlotChange = (timeSlot) => {
    setDraftTimeSlots((prev) =>
      prev.includes(timeSlot)
        ? prev.filter((item) => item !== timeSlot)
        : [...prev, timeSlot]
    );
  };

  // ---------------------------------------------------
  // 필터 초기화
  // ---------------------------------------------------
  const handleResetFilter = () => {
    setDraftSports([]);
    setDraftRegions([]);
    setDraftDays([]);
    setDraftTimeSlots([]);
  };

  // ---------------------------------------------------
  // 필터 적용
  // 부모 페이지에 선택값 전달
  // ---------------------------------------------------
  const handleApplyFilter = () => {
    const filters = {
      sports: [...draftSports],
      regions: [...draftRegions],
      days: [...draftDays],
      timeSlots: [...draftTimeSlots],
    };

    onSelectedFiltersChange(filters);
    setIsFilterOpen(false);
  };

  // ---------------------------------------------------
  // 선택한 필터 개별 해제
  // ---------------------------------------------------
  const removeFilter = (type, value) => {
    const updatedFilters = {
      sports: [...selectedSports],
      regions: [...selectedRegions],
      days: [...selectedDays],
      timeSlots: [...selectedTimeSlots],
    };

    updatedFilters[type] = updatedFilters[type].filter(
      (item) => item !== value
    );

    onSelectedFiltersChange(updatedFilters);
  };

  // ---------------------------------------------------
  // 검색창 입력
  // ---------------------------------------------------
  const handleSearchChange = (e) => {
    onSearchKeywordChange(e.target.value);
  };

  // =====================================================
  // JSX
  // =====================================================
  return (
    <div className="ClubSearch-container">
      {/* --------------------------------------------- */}
      {/* 검색창 */}
      {/* --------------------------------------------- */}

      {isSearchOpen && (
        <div className="ClubSearch-search-box">
          <span className="ClubSearch-search-icon">🔍</span>

          <input
            type="text"
            placeholder="동호회 이름 또는 소개글 검색"
            value={searchKeyword}
            onChange={handleSearchChange}
          />

          {searchKeyword && (
            <button
              type="button"
              className="ClubSearch-search-clear"
              onClick={() => onSearchKeywordChange("")}
            >
              ×
            </button>
          )}
        </div>
      )}

      {/* --------------------------------------------- */}
      {/* 필터 설정 버튼 */}
      {/* --------------------------------------------- */}

      <section className="ClubSearch-filter-section">
        <button
          type="button"
          className="ClubSearch-filter-open-button"
          onClick={openFilter}
        >
          <span>☷ 필터 설정</span>

          {selectedFilterCount > 0 && (
            <span className="ClubSearch-filter-count">
              {selectedFilterCount}
            </span>
          )}

          <span className="ClubSearch-filter-arrow">⌄</span>
        </button>

        {/* ------------------------------------------- */}
        {/* 선택된 필터 칩 */}
        {/* ------------------------------------------- */}

        {selectedFilterCount > 0 && (
          <div className="ClubSearch-selected-filters">
            {selectedSports.map((sportValue) => {
              const sport = sports.find(
                (item) => item.value === sportValue
              );

              return (
                <button
                  type="button"
                  key={sportValue}
                  className="ClubSearch-filter-chip"
                  onClick={() => removeFilter("sports", sportValue)}
                >
                  {sport?.label || sportValue}
                  <span>×</span>
                </button>
              );
            })}

            {selectedRegions.map((region) => (
              <button
                type="button"
                key={region}
                className="ClubSearch-filter-chip"
                onClick={() => removeFilter("regions", region)}
              >
                {region}
                <span>×</span>
              </button>
            ))}

            {selectedDays.map((day) => (
              <button
                type="button"
                key={day}
                className="ClubSearch-filter-chip"
                onClick={() => removeFilter("days", day)}
              >
                {day}
                <span>×</span>
              </button>
            ))}

            {selectedTimeSlots.map((timeSlot) => {
              const slot = timeSlots.find(
                (item) => item.value === timeSlot
              );

              return (
                <button
                  type="button"
                  key={timeSlot}
                  className="ClubSearch-filter-chip"
                  onClick={() =>
                    removeFilter("timeSlots", timeSlot)
                  }
                >
                  {slot?.label || timeSlot}
                  <span>×</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* --------------------------------------------- */}
      {/* 필터 모달 */}
      {/* --------------------------------------------- */}

      {isFilterOpen && (
        <div
          className="ClubSearch-filter-overlay"
          onClick={() => setIsFilterOpen(false)}
        >
          <div
            className="ClubSearch-filter-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="ClubSearch-filter-modal-header">
              <h2>필터 설정</h2>

              <button
                type="button"
                className="ClubSearch-filter-close"
                onClick={() => setIsFilterOpen(false)}
              >
                ×
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="ClubSearch-filter-modal-body">
              {/* 운동 종목 */}
              <div className="ClubSearch-filter-group">
                <h3>운동 종목</h3>

                <div className="ClubSearch-filter-options">
                  {sports.map((sport) => (
                    <label
                      key={sport.value}
                      className={`ClubSearch-filter-option ${
                        draftSports.includes(sport.value)
                          ? "active"
                          : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={draftSports.includes(sport.value)}
                        onChange={() =>
                          handleSportChange(sport.value)
                        }
                      />

                      <span>
                        {sport.icon} {sport.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 활동 지역 */}
              <div className="ClubSearch-filter-group">
                <h3>활동 지역</h3>

                <div className="ClubSearch-filter-options">
                  {regions.map((region) => (
                    <label
                      key={region}
                      className={`ClubSearch-filter-option ${
                        draftRegions.includes(region)
                          ? "active"
                          : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={draftRegions.includes(region)}
                        onChange={() =>
                          handleRegionChange(region)
                        }
                      />

                      <span>{region}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 활동 요일 */}
              <div className="ClubSearch-filter-group">
                <h3>활동 요일</h3>

                <div className="ClubSearch-filter-options">
                  {days.map((day) => (
                    <label
                      key={day.value}
                      className={`ClubSearch-filter-option ${
                        draftDays.includes(day.value)
                          ? "active"
                          : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={draftDays.includes(day.value)}
                        onChange={() =>
                          handleDayChange(day.value)
                        }
                      />

                      <span>{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 활동 시간 */}
              <div className="ClubSearch-filter-group">
                <h3>활동 시간</h3>

                <div className="ClubSearch-filter-options">
                  {timeSlots.map((slot) => (
                    <label
                      key={slot.value}
                      className={`ClubSearch-filter-option ${
                        draftTimeSlots.includes(slot.value)
                          ? "active"
                          : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={draftTimeSlots.includes(
                          slot.value
                        )}
                        onChange={() =>
                          handleTimeSlotChange(slot.value)
                        }
                      />

                      <span>
                        {slot.label}
                        <br />
                        <small>
                          {slot.value.replace("-", " ~ ")}
                        </small>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 모달 하단 버튼 */}
            <div className="ClubSearch-filter-modal-footer">
              <button
                type="button"
                className="ClubSearch-filter-reset"
                onClick={handleResetFilter}
              >
                초기화
              </button>

              <button
                type="button"
                className="ClubSearch-filter-apply"
                onClick={handleApplyFilter}
              >
                검색 결과 보기 (
                {draftSports.length +
                  draftRegions.length +
                  draftDays.length +
                  draftTimeSlots.length}
                )
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClubSearchFilter;