import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import BottomNav from "../../components/BottomNav";
import ClubSearchFilter from "../../components/common/ClubSearchFilter";

// 기존 전체 동호회 페이지의 CSS 재사용
import "../AllClub/AllClub.css";

// =====================================================
// 게스트 모집 페이지
// =====================================================
function GuestRecruit() {
  const navigate = useNavigate();

  // -----------------------------------------------------
  // 게스트 모집 이벤트 상태
  // -----------------------------------------------------
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // -----------------------------------------------------
  // 검색 상태
  // -----------------------------------------------------
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");

  // -----------------------------------------------------
  // 필터 상태
  // -----------------------------------------------------
  const [selectedSports, setSelectedSports] = useState([]);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);

  // =====================================================
  // 게스트 모집 이벤트 조회 API
  // =====================================================
  useEffect(() => {
    const controller = new AbortController();

    const fetchGuestRecruitingEvents = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "http://localhost:8000/api/clubs/guest-recruiting",
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            `게스트 모집 조회 실패 (HTTP ${response.status})`
          );
        }

        const data = await response.json();

        let eventList = [];

        if (Array.isArray(data)) {
          eventList = data;
        } else if (Array.isArray(data.events)) {
          eventList = data.events;
        } else if (Array.isArray(data.data)) {
          eventList = data.data;
        } else {
          throw new Error(
            "게스트 모집 데이터 형식이 올바르지 않습니다."
          );
        }

        setEvents(eventList);
      } catch (err) {
        if (err.name === "AbortError") return;

        console.error("게스트 모집 조회 오류:", err);

        setError(err.message);
        setEvents([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchGuestRecruitingEvents();

    return () => {
      controller.abort();
    };
  }, []);

  // =====================================================
  // 검색어 + 필터 조건 적용
  // =====================================================
  const filteredEvents = events.filter((event) => {
    const keyword = searchKeyword.trim().toLowerCase();

    // ---------------------------------------------------
    // 검색어 조건
    // ---------------------------------------------------
    const title = event.title?.toLowerCase() || "";
    const description = event.description?.toLowerCase() || "";
    const location = event.location?.toLowerCase() || "";

    const matchesKeyword =
      !keyword ||
      title.includes(keyword) ||
      description.includes(keyword) ||
      location.includes(keyword);

    // ---------------------------------------------------
    // 운동 종목 조건
    // 이벤트 또는 연결된 동호회 데이터에서 종목 확인
    // ---------------------------------------------------
    const sportName =
      event.sport_name ||
      event.sport ||
      event.club_sport ||
      event.club?.sport_name ||
      event.club?.sport ||
      "";

    const matchesSport =
      selectedSports.length === 0 ||
      selectedSports.some((sport) => {
        // 축구/풋살 필터는 축구 또는 풋살을 포함하는 종목과 매칭
        if (sport === "축구·풋살") {
          return (
            String(sportName).includes("축구") ||
            String(sportName).includes("풋살")
          );
        }

        return String(sportName).includes(sport);
      });

    // ---------------------------------------------------
    // 활동 지역 조건
    // ---------------------------------------------------
    const matchesRegion =
      selectedRegions.length === 0 ||
      selectedRegions.some((region) => {
        const eventLocation = String(event.location || "");

        // "서울 강서구" 선택 시 장소에 "강서구"가 포함되면 매칭
        const district = region.split(" ").pop();

        return (
          eventLocation.includes(region) ||
          eventLocation.includes(district)
        );
      });

    // ---------------------------------------------------
    // 활동 요일 조건
    // event_date 기준 요일 확인
    // ---------------------------------------------------
    const dayLabels = [
      "일요일",
      "월요일",
      "화요일",
      "수요일",
      "목요일",
      "금요일",
      "토요일",
    ];

    let eventDay = "";

    if (event.event_date) {
      // 날짜를 로컬 기준으로 파싱하여 요일 확인
      const date = new Date(
        `${String(event.event_date).slice(0, 10)}T12:00:00`
      );

      if (!Number.isNaN(date.getTime())) {
        eventDay = dayLabels[date.getDay()];
      }
    }

    const matchesDay =
      selectedDays.length === 0 ||
      selectedDays.includes(eventDay);

    // ---------------------------------------------------
    // 활동 시간 조건
    // start_time 기준 시간대 확인
    // ---------------------------------------------------
    const startTime = String(event.start_time || "").slice(0, 5);
    const [hourString] = startTime.split(":");
    const hour = Number(hourString);

    const matchesTime =
      selectedTimeSlots.length === 0 ||
      selectedTimeSlots.some((timeSlot) => {
        const [start, end] = timeSlot.split("-");

        const startHour = Number(start.split(":")[0]);
        const endHour = Number(end.split(":")[0]);

        return hour >= startHour && hour < endHour;
      });

    // ---------------------------------------------------
    // 모든 조건 일치 시 표시
    // ---------------------------------------------------
    return (
      matchesKeyword &&
      matchesSport &&
      matchesRegion &&
      matchesDay &&
      matchesTime
    );
  });

  // =====================================================
  // 화면 출력
  // =====================================================
  return (
    <div className="ClubList-container">

      {/* 상단 헤더 */}
      <header className="ClubList-header">
        <button
          type="button"
          className="ClubList-back-button"
          onClick={() => navigate("/clubs")}
          aria-label="뒤로 가기"
        >
          ←
        </button>

        <h2>게스트 모집</h2>

        <button
          type="button"
          className="ClubList-search-button"
          onClick={() => setIsSearchOpen((prev) => !prev)}
          aria-label="검색창 열기"
        >
          🔍
        </button>
      </header>

      {/* ===================================== */}
      {/* 공통 검색 및 필터 */}
      {/* ===================================== */}
      <ClubSearchFilter
        isSearchOpen={isSearchOpen}
        searchKeyword={searchKeyword}
        onSearchKeywordChange={setSearchKeyword}
        selectedFilters={{
          sports: selectedSports,
          regions: selectedRegions,
          days: selectedDays,
          timeSlots: selectedTimeSlots,
        }}
        onSelectedFiltersChange={(filters) => {
          setSelectedSports(filters.sports);
          setSelectedRegions(filters.regions);
          setSelectedDays(filters.days);
          setSelectedTimeSlots(filters.timeSlots);
        }}
      />

      {/* 게스트 모집 이벤트 목록 */}
      <section className="ClubList-content">

        <div className="ClubList-title">
          <h3>게스트 모집 중</h3>

          <span>
            총 {filteredEvents.length}개
          </span>
        </div>

        {/* 로딩 */}
        {loading ? (
          <p className="ClubList-message">
            게스트 모집 정보를 불러오는 중...
          </p>
        ) : error ? (
          /* 오류 */
          <p className="ClubList-message">
            {error}
          </p>
        ) : filteredEvents.length === 0 ? (
          /* 검색 및 필터 결과 없음 */
          <p className="ClubList-message">
            조건에 맞는 게스트 모집 이벤트가 없습니다.
          </p>
        ) : (
          /* 기존 전체 동호회 카드 디자인 재사용 */
          <div className="ClubList-grid">
            {filteredEvents.map((event, index) => (
              <article
                key={event.event_id ?? index}
                className="ClubList-card"
              >
                {/* 이벤트 이미지 */}
                <div className="ClubList-card-image">
                  {event.event_image_url ? (
                    <img
                      src={event.event_image_url}
                      alt={event.title || "게스트 모집 이미지"}
                    />
                  ) : (
                    <div className="ClubList-no-image">
                      <span>이미지 없음</span>
                    </div>
                  )}
                </div>

                {/* 이벤트 정보 */}
                <div className="ClubList-card-info">
                  <h3>
                    {event.title || "제목 없는 이벤트"}
                  </h3>

                  <p>
                    {event.description || "이벤트 설명이 없습니다."}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}

      </section>

      {/* 하단 네비게이션 */}
      <BottomNav />

    </div>
  );
}

export default GuestRecruit;