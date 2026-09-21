import BottomNav from "../../components/BottomNav";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ClubHome.css";

function ClubHome() {
  const navigate = useNavigate();

  // =========================================
  // 동호회 목록 및 상태
  // =========================================
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // 검색 결과 화면 표시 여부
  const [isSearchResult, setIsSearchResult] = useState(false);

  // 회원 모집중 더보기 상태
  const [showAllClubs, setShowAllClubs] = useState(false);

  // 게스트 모집중 더보기 상태
  const [showAllGuests, setShowAllGuests] = useState(false);

  // 검색창 열림 / 닫힘
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // 검색어
  const [searchKeyword, setSearchKeyword] = useState("");

  // =========================================
  // 실제 적용된 필터
  // =========================================
  const [selectedSports, setSelectedSports] = useState([]);
  const [selectedRegions, setSelectedRegions] = useState([]);

  // =========================================
  // 모달 열림 / 닫힘
  // =========================================
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // =========================================
  // 모달 내부에서 임시로 선택한 필터
  // 검색 결과 보기 버튼을 눌러야 적용됨
  // =========================================
  const [draftSports, setDraftSports] = useState([]);
  const [draftRegions, setDraftRegions] = useState([]);

  // 임시 선택한 활동 요일
  const [draftDays, setDraftDays] = useState([]);

  // 임시 선택한 활동 시간
  const [draftTimeSlots, setDraftTimeSlots] = useState([]);

  // 실제 적용된 활동 요일
  const [selectedDays, setSelectedDays] = useState([]);

  // 실제 적용된 활동 시간
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);

  // 종목 데이터
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

  // 지역 데이터
  const regions = [
    "서울 강서구",
    "서울 마포구",
    "서울 영등포구",
  ];

  // 활동 요일
  const days = [
  { label: "월", value: "월요일" },
  { label: "화", value: "화요일" },
  { label: "수", value: "수요일" },
  { label: "목", value: "목요일" },
  { label: "금", value: "금요일" },
  { label: "토", value: "토요일" },
  { label: "일", value: "일요일" },
  ];

  // 활동 시간대
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

  // =========================================
  // 필터 모달 열기
  // 기존 적용된 조건을 임시 선택값에 복사
  // =========================================
  const openFilter = () => {
    setDraftSports([...selectedSports]);
    setDraftRegions([...selectedRegions]);
    setDraftDays([...selectedDays]);
    setDraftTimeSlots([...selectedTimeSlots]);

    setIsFilterOpen(true);
  };

  // =========================================
  // 종목 선택 / 해제
  // =========================================
  const handleSportChange = (sportName) => {
    setDraftSports((prev) =>
      prev.includes(sportName)
        ? prev.filter((sport) => sport !== sportName)
        : [...prev, sportName]
    );
  };

  // =========================================
  // 지역 선택 / 해제
  // =========================================
  const handleRegionChange = (regionName) => {
    setDraftRegions((prev) =>
      prev.includes(regionName)
        ? prev.filter((region) => region !== regionName)
        : [...prev, regionName]
    );
  };
  // 활동 요일 선택 / 해제
  const handleDayChange = (day) => {
    setDraftDays((prev) =>
      prev.includes(day)
        ? prev.filter((item) => item !== day)
        : [...prev, day]
    );
  };

  // 활동 시간 선택 / 해제
  const handleTimeSlotChange = (timeSlot) => {
    setDraftTimeSlots((prev) =>
      prev.includes(timeSlot)
        ? prev.filter((item) => item !== timeSlot)
        : [...prev, timeSlot]
    );
  };

  // =========================================
  // 필터 초기화
  // =========================================
  const handleResetFilter = () => {
    setDraftSports([]);
    setDraftRegions([]);
    setDraftDays([]);
    setDraftTimeSlots([]);
  };

  // =========================================
  // 필터 적용 및 검색 결과 화면 이동
  // =========================================
  const handleApplyFilter = () => {
    setSelectedSports([...draftSports]);
    setSelectedRegions([...draftRegions]);
    setSelectedDays([...draftDays]);
    setSelectedTimeSlots([...draftTimeSlots]);

    setIsFilterOpen(false);
    setIsSearchResult(true);
  };

  // =========================================
  // 선택 조건 개별 해제
  // =========================================
  const removeSport = (sportName) => {
    setSelectedSports((prev) =>
      prev.filter((sport) => sport !== sportName)
    );
  };

  const removeRegion = (regionName) => {
    setSelectedRegions((prev) =>
      prev.filter((region) => region !== regionName)
    );
  };

  // =========================================
  // 필터 선택 개수
  // =========================================
  const selectedFilterCount =
    selectedSports.length +
    selectedRegions.length +
    selectedDays.length +
    selectedTimeSlots.length;

  // =========================================
  // 동호회 목록 조회
  // 적용된 필터가 변경될 때만 API 호출
  // =========================================
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        setLoading(true);
        setError("");

        const url = new URL(
          "http://localhost:8000/api/clubs/search"
        );

        // 선택한 종목 다중 전달
        selectedSports.forEach((sport) => {
          url.searchParams.append("sport_name", sport);
        });

        // 선택한 지역 다중 전달
        selectedRegions.forEach((region) => {
          url.searchParams.append("region", region);
        });

        // 선택한 활동 요일 전달
        selectedDays.forEach((day) => {
          url.searchParams.append("day_of_week", day);
        });

        // 선택한 활동 시간 전달
        selectedTimeSlots.forEach((timeSlot) => {
          url.searchParams.append("time_slot", timeSlot);
        });

        const response = await fetch(url.toString());

        if (!response.ok) {
          throw new Error(
            "동호회 정보를 불러오지 못했습니다."
          );
        }

        const data = await response.json();

        console.log("API에서 가져온 동호회 데이터:", data);
        console.log("동호회 개수:", data.length);

        setClubs(data);
      } catch (error) {
        console.error(error);
        setError(error.message);
        setClubs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, [selectedSports, selectedRegions, selectedDays, selectedTimeSlots,]);

  // =========================================
  // 검색어 + 적용된 필터를 기준으로 동호회 검색
  // =========================================
  const filteredClubs = clubs.filter((club) => {
    const keyword = searchKeyword.trim().toLowerCase();

    // 동호회 이름 또는 소개글에 검색어가 포함되는지 확인
    const matchesKeyword =
      !keyword ||
      club.club_name?.toLowerCase().includes(keyword) ||
      club.club_intro?.toLowerCase().includes(keyword);

    return matchesKeyword;
  });

  // =========================================
  // 선택된 종목 이름 표시
  // =========================================
  const selectedSportLabels = sports
    .filter((sport) =>
      selectedSports.includes(sport.value)
    )
    .map((sport) => sport.label);
  
  // =========================================
  // 홈 화면 회원 모집중 목록
  // 기본 6개, 더보기 클릭 시 전체 표시
  // 검색 결과 화면에서는 전체 표시
  // =========================================
  const displayClubs = isSearchResult
    ? filteredClubs
    : showAllClubs
      ? filteredClubs
      : filteredClubs.slice(0, 6);
  
  // 전체 동호회 홈 화면 표시용 (최대 6개)
  const displayAllClubs = filteredClubs.slice(0, 6);

  return (
    <div className="ClubHome-container">

      {/* 상단 영역 */}
      <header className="ClubHome-header">

        <button className="ClubHome-region">
          대방동
          <span className="ClubHome-arrow">⌄</span>
        </button>

        <div className="ClubHome-actions">
          <button
            className="ClubHome-icon-button"
            onClick={() => setIsSearchOpen((prev) => !prev)}
          >
            🔍
          </button>

          <button className="ClubHome-icon-button">
            🔔
          </button>

          <button className="ClubHome-icon-button">
            ⚙
          </button>
        </div>

      </header>

      {/* 검색창 */}
      {isSearchOpen && (
        <div className="ClubHome-search-box">
          <span className="ClubHome-search-icon">🔍</span>

          <input
            type="text"
            placeholder="동호회 이름 또는 소개글 검색"
            value={searchKeyword}
            onChange={(e) => {
              const keyword = e.target.value;

              setSearchKeyword(keyword);

              // 검색어가 입력되면 검색 결과 화면 표시
              if (keyword.trim()) {
                setIsSearchResult(true);
              } else if (selectedFilterCount === 0) {
                // 검색어가 없고 적용된 필터도 없으면 기본 화면
                setIsSearchResult(false);
              }
            }}
          />

          {searchKeyword && (
            <button
              className="ClubHome-search-clear"
              onClick={() => setSearchKeyword("")}
            >
              ×
            </button>
          )}
        </div>
      )}

      {/* ===================================== */}
      {/* 필터 버튼 영역 */}
      {/* ===================================== */}
      <section className="ClubHome-filter-section">

        <button
          className="ClubHome-filter-open-button"
          onClick={openFilter}
        >
          <span>☷ 필터 설정</span>

          {selectedFilterCount > 0 && (
            <span className="ClubHome-filter-count">
              {selectedFilterCount}
            </span>
          )}

          <span className="ClubHome-filter-arrow">
            ⌄
          </span>
        </button>

        {/* 선택된 필터 칩 */}
        {selectedFilterCount > 0 && (
          <div className="ClubHome-selected-filters">

            {selectedSports.map((sportValue) => {
              const sport = sports.find(
                (item) => item.value === sportValue
              );

              return (
                <button
                  key={sportValue}
                  className="ClubHome-filter-chip"
                  onClick={() => removeSport(sportValue)}
                >
                  {sport?.label || sportValue}
                  <span>×</span>
                </button>
              );
            })}

            {selectedRegions.map((region) => (
              <button
                key={region}
                className="ClubHome-filter-chip"
                onClick={() => removeRegion(region)}
              >
                {region}
                <span>×</span>
              </button>
            ))}

            {/* 선택된 활동 요일 */}
            {selectedDays.map((day) => (
              <button
                key={day}
                className="ClubHome-filter-chip"
                onClick={() =>
                  setSelectedDays((prev) =>
                    prev.filter((item) => item !== day)
                  )
                }
              >
                {day}요일
                <span>×</span>
              </button>
            ))}

            {/* 선택된 활동 시간 */}
            {selectedTimeSlots.map((timeSlot) => {
              const slot = timeSlots.find(
                (item) => item.value === timeSlot
              );

              return (
                <button
                  key={timeSlot}
                  className="ClubHome-filter-chip"
                  onClick={() =>
                    setSelectedTimeSlots((prev) =>
                      prev.filter((item) => item !== timeSlot)
                    )
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

      {/* ===================================== */}
      {/* 1. AI 맞춤 동호회 추천 */}
      {/* 기본 화면에서만 표시 */}
      {/* ===================================== */}

      {!isSearchResult && (
        <section className="ClubHome-ai">

          <div className="ClubHome-ai-content">

            <div className="ClubHome-ai-title">
              <span className="ClubHome-ai-badge">AI</span>
              <h2>나의 맞춤 동호회 추천</h2>
            </div>

            <p className="ClubHome-ai-description">
              나의 정보를 바탕으로
              <br />
              딱 맞는 동호회를 추천해 드려요!
            </p>

            <button className="ClubHome-ai-button">
              맞춤 동호회 보러가기 →
            </button>

          </div>

          <div className="ClubHome-ai-character">
            🤖
          </div>

        </section>
      )}

      {/* ===================================== */}
      {/* 전체 동호회 */}
      {/* ===================================== */}

      {!isSearchResult && (
        <section className="ClubHome-all-clubs">

          {/* 제목 */}
          <div className="ClubHome-section-header">
            <h2>전체 동호회</h2>
          </div>

          {/* 동호회 목록 */}
          <div className="Club-list ClubHome-all-clubs-list">

            {loading ? (
              <p className="ClubHome-message">
                동호회 정보를 불러오는 중...
              </p>
            ) : error ? (
              <p className="ClubHome-message">
                {error}
              </p>
            ) : filteredClubs.length === 0 ? (
              <p className="ClubHome-message">
                등록된 동호회가 없습니다.
              </p>
            ) : (
              <>
                {/* 동호회 카드 최대 6개 */}
                {filteredClubs.slice(0, 6).map((club) => (
                  <div
                    className="Club-card"
                    key={club.club_id}
                    onClick={() =>
                      navigate(`/clubs/${club.club_id}`)
                    }
                  >

                    {/* 동호회 이미지 */}
                    <div className="Club-card-image">
                      {club.image_url ? (
                        <img
                          src={club.image_url}
                          alt={club.club_name}
                        />
                      ) : (
                        <div className="Club-card-no-image">
                          이미지 없음
                        </div>
                      )}
                    </div>

                    {/* 동호회 이름 */}
                    <h3 className="Club-card-name">
                      {club.club_name}
                    </h3>

                    {/* 동호회 소개 */}
                    <p className="Club-card-intro">
                      {club.club_intro}
                    </p>

                  </div>
                ))}

                {/* 6개 이후 더보기 버튼 */}
                {filteredClubs.length > 6 && (
                  <button
                    className="ClubHome-all-clubs-more"
                    onClick={() => navigate("/clubs")}
                  >
                    더보기 →
                  </button>
                )}
              </>
            )}

          </div>

        </section>
      )}

      {/* ===================================== */}
      {/* 2. 회원 모집중 / 동호회 검색 결과 */}
      {/* ===================================== */}

      <section className="ClubHome-recruit">

        <div className="ClubHome-section-header">

          <h2>
            {isSearchResult ? "검색 결과" : "회원 모집중"}
          </h2>

        </div>

        {/* 검색 결과 개수 */}
        {isSearchResult && !loading && !error && (
          <p className="ClubHome-result-count">
            검색 결과 {filteredClubs.length}개
          </p>
        )}

        {/* 동호회 목록 */}
        <div className="Club-list">

          {loading ? (
            <p className="ClubHome-message">
              동호회 정보를 불러오는 중...
            </p>
          ) : error ? (
            <p className="ClubHome-message">
              {error}
            </p>
          ) : filteredClubs.length === 0 ? (
            <p className="ClubHome-message">
              선택한 조건에 해당하는 동호회가 없습니다.
            </p>
          ) : (
            <>
              {/* 동호회 카드 */}
              {displayClubs.map((club) => (
                <div
                  className="Club-card"
                  key={club.club_id}
                  onClick={() => navigate(`/clubs/${club.club_id}`)}
                >

                  <div className="Club-card-image">

                    {club.image_url ? (
                      <img
                        src={club.image_url}
                        alt={club.club_name}
                      />
                    ) : (
                      <div className="Club-card-no-image">
                        이미지 없음
                      </div>
                    )}

                  </div>

                  <h3 className="Club-card-name">
                    {club.club_name}
                  </h3>

                  <p className="Club-card-intro">
                    {club.club_intro}
                  </p>

                </div>
              ))}

              {/* 6개 이후 더보기 버튼 */}
              {!isSearchResult && filteredClubs.length > 6 && (
                <button
                  className="ClubHome-more-button"
                  onClick={() => setShowAllClubs((prev) => !prev)}
                >
                  {showAllClubs ? "접기 ↑" : "더보기 →"}
                </button>
              )}

            </>
          )}

        </div>

      </section>


      {/* ===================================== */}
      {/* 3. 게스트 모집중 */}
      {/* 기본 화면에서만 표시 */}
      {/* ===================================== */}

      {!isSearchResult && (
        <section className="ClubHome-guest">

          <div className="ClubHome-section-header">

            <h2>게스트 모집중</h2>

            <button className="ClubHome-more-button">
              더보기 →
            </button>

          </div>

          <div className="Guest-list">

            <div className="Guest-card">

              <div className="Guest-card-image">
                이미지
              </div>

              <h3 className="Guest-card-title">
                주말 풋살 게스트
              </h3>

              <p className="Guest-card-info">
                토요일 14:00 · 강서구
              </p>

            </div>

            <div className="Guest-card">

              <div className="Guest-card-image">
                이미지
              </div>

              <h3 className="Guest-card-title">
                배드민턴 게스트 모집
              </h3>

              <p className="Guest-card-info">
                일요일 10:00 · 마포구
              </p>

            </div>

            <div className="Guest-card">

              <div className="Guest-card-image">
                이미지
              </div>

              <h3 className="Guest-card-title">
                테니스 게스트 모집
              </h3>

              <p className="ClubHome-guest-info">
                토요일 13:00 · 영등포구
              </p>

            </div>

          </div>

        </section>
      )}


      {/* ===================================== */}
      {/* 필터 모달 */}
      {/* ===================================== */}
      {isFilterOpen && (
        <div
          className="ClubHome-filter-overlay"
          onClick={() => setIsFilterOpen(false)}
        >

          <div
            className="ClubHome-filter-modal"
            onClick={(e) => e.stopPropagation()}
          >

            {/* 모달 헤더 */}
            <div className="ClubHome-filter-modal-header">

              <h2>필터 설정</h2>

              <button
                className="ClubHome-filter-close"
                onClick={() => setIsFilterOpen(false)}
              >
                ×
              </button>

            </div>

            {/* 모달 내용 */}
            <div className="ClubHome-filter-modal-body">

              {/* 운동 종목 */}
              <div className="ClubHome-filter-group">

                <h3>운동 종목</h3>

                <div className="ClubHome-filter-options">

                  {sports.map((sport) => (
                    <label
                      key={sport.value}
                      className={`ClubHome-filter-option ${
                        draftSports.includes(sport.value)
                          ? "active"
                          : ""
                      }`}
                    >

                      <input
                        type="checkbox"
                        checked={draftSports.includes(
                          sport.value
                        )}
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
              <div className="ClubHome-filter-group">

                <h3>활동 지역</h3>

                <div className="ClubHome-filter-options">

                  {regions.map((region) => (
                    <label
                      key={region}
                      className={`ClubHome-filter-option ${
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

              {/* ===================================== */}
              {/* 활동 요일 */}
              {/* ===================================== */}
              <div className="ClubHome-filter-group">
                <h3>활동 요일</h3>

                <div className="ClubHome-filter-options">
                  {days.map((day) => (
                    <label
                      key={day.value}
                      className={`ClubHome-filter-option ${
                        draftDays.includes(day.value) ? "active" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={draftDays.includes(day.value)}
                        onChange={() => handleDayChange(day.value)}
                      />

                      <span>{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* ===================================== */}
              {/* 활동 시간 */}
              {/* ===================================== */}
              <div className="ClubHome-filter-group">
                <h3>활동 시간</h3>

                <div className="ClubHome-filter-options">
                  {timeSlots.map((slot) => (
                    <label
                      key={slot.value}
                      className={`ClubHome-filter-option ${
                        draftTimeSlots.includes(slot.value)
                          ? "active"
                          : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={draftTimeSlots.includes(slot.value)}
                        onChange={() =>
                          handleTimeSlotChange(slot.value)
                        }
                      />

                      <span>
                        {slot.label}
                        <br />
                        <small>{slot.value.replace("-", " ~ ")}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

            </div>

            {/* 모달 하단 버튼 */}
            <div className="ClubHome-filter-modal-footer">

              <button
                className="ClubHome-filter-reset"
                onClick={handleResetFilter}
              >
                초기화
              </button>

              <button
                className="ClubHome-filter-apply"
                onClick={handleApplyFilter}
              >
                검색 결과 보기
                <span>
                  (
                  {
                    draftSports.length +
                    draftRegions.length +
                    draftDays.length +
                    draftTimeSlots.length
                  }
                  )
                </span>
              </button>

            </div>

          </div>

        </div>
      )}

      {/* 검색 결과 화면 상단 */}
      {isSearchResult && (
        <div className="ClubHome-search-result-header">

          <button
            className="ClubHome-search-back"
            onClick={() => {
              // 검색 결과 화면 닫기
              setIsSearchResult(false);

              // 검색어 초기화
              setSearchKeyword("");

              // 검색창 닫기
              setIsSearchOpen(false);

              // 적용된 필터 초기화
              setSelectedSports([]);
              setSelectedRegions([]);
              setSelectedDays([]);
              setSelectedTimeSlots([]);

              // 필터 모달의 임시 선택값도 초기화
              setDraftSports([]);
              setDraftRegions([]);
              setDraftDays([]);
              setDraftTimeSlots([]);
            }}
          >
            ← 동호회 찾기로
          </button>
        </div>
      )}

      {/* 이용 도우미 챗봇 버튼 */}
      <button className="ClubHome-chatbot-button">
        <span className="ClubHome-chatbot-icon">🤖</span>
        <span className="ClubHome-chatbot-text">
          이용 도우미
        </span>
      </button>

{/* 하단 네비게이션 */}
      <BottomNav />

    </div>
  );
}

export default ClubHome;