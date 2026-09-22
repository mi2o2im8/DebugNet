import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import BottomNav from "../../components/BottomNav";
import ClubSearchFilter from "../../components/common/ClubSearchFilter";

import "./AllClub.css";

// =====================================================
// 동호회 카드 컴포넌트
// =====================================================
function ClubCard({ club, onClick }) {
  const [imageError, setImageError] = useState(false);

  return (
    <article
      className="ClubList-card"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
    >
      {/* 동호회 이미지 */}
      <div className="ClubList-card-image">
        {club.image_url && !imageError ? (
          <img
            src={club.image_url}
            alt={club.club_name || "동호회 이미지"}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="ClubList-no-image">
            <span>이미지 없음</span>
          </div>
        )}
      </div>

      {/* 동호회 정보 */}
      <div className="ClubList-card-info">
        <h3>{club.club_name || "이름 없는 동호회"}</h3>

        <p>{club.club_intro || "동호회 소개가 없습니다."}</p>
      </div>
    </article>
  );
}


// =====================================================
// 전체 동호회 페이지
// =====================================================
function AllClubs() {
  const navigate = useNavigate();

  // -----------------------------------------------------
  // 동호회 목록 상태
  // -----------------------------------------------------
  const [clubs, setClubs] = useState([]);
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
  const [selectedFilters, setSelectedFilters] = useState({
    sports: [],
    regions: [],
    days: [],
    timeSlots: [],
  });

  // =====================================================
  // 동호회 목록 API 호출
  // =====================================================
  useEffect(() => {
    const controller = new AbortController();

    const fetchClubs = async () => {
      try {
        setLoading(true);
        setError("");

        const url = new URL(
          "http://localhost:8000/api/clubs/search"
        );

        // 종목 필터
        selectedFilters.sports.forEach((sport) => {
          url.searchParams.append("sport_name", sport);
        });

        // 지역 필터
        selectedFilters.regions.forEach((region) => {
          url.searchParams.append("region", region);
        });

        // 활동 요일 필터
        selectedFilters.days.forEach((day) => {
          url.searchParams.append("day_of_week", day);
        });

        // 활동 시간 필터
        selectedFilters.timeSlots.forEach((timeSlot) => {
          url.searchParams.append("time_slot", timeSlot);
        });

        const response = await fetch(url.toString(), {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `동호회 조회 실패 (HTTP ${response.status})`
          );
        }

        const data = await response.json();

        // API 응답 구조에 맞춰 목록 추출
        let clubList = [];

        if (Array.isArray(data)) {
          clubList = data;
        } else if (Array.isArray(data.clubs)) {
          clubList = data.clubs;
        } else if (Array.isArray(data.data)) {
          clubList = data.data;
        } else {
          throw new Error(
            "동호회 데이터 형식이 올바르지 않습니다."
          );
        }

        setClubs(clubList);
      } catch (err) {
        // 요청 취소는 오류 메시지로 표시하지 않음
        if (err.name === "AbortError") return;

        console.error("동호회 조회 오류:", err);

        setError(err.message);
        setClubs([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchClubs();

    return () => {
      controller.abort();
    };
  }, [selectedFilters]);

  // =====================================================
  // 검색어 필터링
  // =====================================================
  const filteredClubs = clubs.filter((club) => {
    const keyword = searchKeyword.trim().toLowerCase();

    if (!keyword) return true;

    const clubName = club.club_name?.toLowerCase() || "";
    const clubIntro = club.club_intro?.toLowerCase() || "";

    return (
      clubName.includes(keyword) ||
      clubIntro.includes(keyword)
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

        <h2>전체 동호회</h2>

        <button
          type="button"
          className="ClubList-search-button"
          onClick={() => setIsSearchOpen((prev) => !prev)}
          aria-label="검색창 열기"
        >
          🔍
        </button>
      </header>

      {/* 공통 검색 및 필터 */}
      <div className="ClubList-search-area">
        <ClubSearchFilter
          isSearchOpen={isSearchOpen}
          searchKeyword={searchKeyword}
          onSearchKeywordChange={setSearchKeyword}
          selectedFilters={selectedFilters}
          onSelectedFiltersChange={setSelectedFilters}
        />
      </div>

      {/* 전체 동호회 목록 */}
      <section className="ClubList-content">

        <div className="ClubList-title">
          <h3>전체 동호회</h3>

          <span>
            총 {filteredClubs.length}개
          </span>
        </div>

        {/* 로딩 */}
        {loading ? (
          <p className="ClubList-message">
            동호회 정보를 불러오는 중...
          </p>
        ) : error ? (
          /* 오류 */
          <p className="ClubList-message">
            {error}
          </p>
        ) : filteredClubs.length === 0 ? (
          /* 검색 결과 없음 */
          <p className="ClubList-message">
            검색 조건에 맞는 동호회가 없습니다.
          </p>
        ) : (
          /* 동호회 카드 목록 */
          <div className="ClubList-grid">
            {filteredClubs.map((club, index) => (
              <ClubCard
                key={club.club_id ?? index}
                club={club}
                onClick={() => {
                  if (club.club_id) {
                    navigate(`/clubs/${club.club_id}`);
                  }
                }}
              />
            ))}
          </div>
        )}

      </section>

      {/* 하단 네비게이션 */}
      <BottomNav />

    </div>
  );
}

export default AllClubs;