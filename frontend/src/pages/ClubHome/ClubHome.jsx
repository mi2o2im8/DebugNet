import BottomNav from "../../components/BottomNav";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ClubHome.css";
import ClubSearchFilter from "../../components/common/ClubSearchFilter";

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

  // 실제 적용된 활동 요일
  const [selectedDays, setSelectedDays] = useState([]);

  // 실제 적용된 활동 시간
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);

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


  // 게스트 모집중 데이터 (임시)
  const guestList = [
    {
      id: 1,
      title: "주말 풋살 게스트",
      info: "토요일 14:00 · 강서구",
    },
    {
      id: 2,
      title: "배드민턴 게스트 모집",
      info: "일요일 10:00 · 마포구",
    },
    {
      id: 3,
      title: "테니스 게스트 모집",
      info: "토요일 13:00 · 영등포구",
    },
    {
      id: 4,
      title: "평일 저녁 풋살 게스트",
      info: "수요일 19:00 · 양천구",
    },
    {
      id: 5,
      title: "주말 배드민턴 게스트",
      info: "토요일 10:00 · 강서구",
    },
    {
      id: 6,
      title: "초보자 테니스 게스트",
      info: "일요일 15:00 · 마포구",
    },
    {
      id: 7,
      title: "금요일 풋살 게스트",
      info: "금요일 20:00 · 영등포구",
    },
  ];
  
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
          서울
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

      {/* ===================================== */}
      {/* 공통 검색 및 필터 */}
      {/* ===================================== */}

      <ClubSearchFilter
        isSearchOpen={isSearchOpen}
        searchKeyword={searchKeyword}
        onSearchKeywordChange={(keyword) => {
          setSearchKeyword(keyword);

          // 검색어가 입력되면 검색 결과 화면 표시
          if (keyword.trim()) {
            setIsSearchResult(true);
          } else if (selectedFilterCount === 0) {
            // 검색어가 없고 적용된 필터도 없으면 기본 화면
            setIsSearchResult(false);
          }
        }}
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

          // 필터 적용 후 검색 결과 화면 표시
          setIsSearchResult(true);
        }}
      />

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
            <h2
              onClick={() => navigate("/clubs/all")}
              style={{ cursor: "pointer" }}
            >
              전체 동호회
            </h2>
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
                    type="button"
                    className="ClubHome-all-clubs-more"
                    onClick={() => {
                      console.log("전체 동호회 더보기 클릭");
                      navigate("/clubs/all");
                    }}
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

<<<<<<< HEAD
          <h2>
=======
          <h2
            onClick={() => {
              if (!isSearchResult) {
                navigate("/clubs/recruit");
              }
            }}
            style={{ cursor: isSearchResult ? "default" : "pointer" }}
          >
>>>>>>> 16a8b1b (feat: 이용자용 동호회 대시보드 추가)
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
                  onClick={() => navigate("/clubs/recruit")}
                >
                  더보기 →
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
<<<<<<< HEAD
            <h2>게스트 모집중</h2>
=======
            <h2
              onClick={() => navigate("/guest-recruit")}
              style={{ cursor: "pointer" }}
            >
              게스트 모집중
            </h2>
>>>>>>> 16a8b1b (feat: 이용자용 동호회 대시보드 추가)
          </div>

          <div className="Guest-list">

            {/* 게스트 카드 최대 6개 */}
            {guestList.slice(0, 6).map((guest) => (
              <div className="Guest-card" key={guest.id}>

                <div className="Guest-card-image">
                  이미지
                </div>

                <h3 className="Guest-card-title">
                  {guest.title}
                </h3>

                <p className="Guest-card-info">
                  {guest.info}
                </p>

              </div>
            ))}

            {/* 6개 이후 더보기 버튼 */}
            {guestList.length > 6 && (
              <button
                className="ClubHome-guest-more"
<<<<<<< HEAD
                onClick={() => navigate("/clubs/guest-recruit")}
=======
                onClick={() => navigate("/guest-recruit")}
>>>>>>> 16a8b1b (feat: 이용자용 동호회 대시보드 추가)
              >
                더보기 →
              </button>
            )}

          </div>

        </section>
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