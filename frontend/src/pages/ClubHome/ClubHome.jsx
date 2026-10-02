import { BackButtonIcon } from "../../components/BackButton/BackButton";
import BottomNav from "../../components/BottomNav";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ClubHome.css";
import ClubSearchFilter from "../../components/common/ClubSearchFilter";
import { buildApiUrl } from "../../api/apiClient";
import { useNotifications } from "../../context/NotificationContext";
import profileIcon from "../../assets/img/basic_profile_img.png";
import chatbotIcon from "../../assets/img/chatbot/chatbot-icon.png";
// ⭐ 홈(MainHome)과 같은 섹션 아이콘 / 더보기 화살표
import findClubIcon from "../../assets/img/playbridge_16_assets/find_club.png";
import userIcon from "../../assets/img/playbridge_16_assets/user_icon.png";
import activityIcon from "../../assets/img/playbridge_16_assets/activity.png";
import backIcon from "../../assets/img/back.png";
import ChatbotButton from "../../components/Chatbot/ChatbotButton";
import Chatbot from "../Chatbot/Chatbot";
import { supabase } from "../../../supabaseClient";

// =====================================================
// 작은 아이콘 (글자 ⌄ → 대신 SVG로 위치가 정확하게)
// =====================================================
function ChevronDownIcon({ size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon({ size = 14 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 섹션 제목 + 오른쪽 "전체보기"
function SectionHeader({ icon, title, onMore }) {
  return (
    <div className="ClubHome-section-header">
      <div className="ClubHome-section-title">
        {icon && <img src={icon} alt="" aria-hidden="true" />}
        <h2>{title}</h2>
      </div>
      {onMore && (
        <button type="button" className="ClubHome-section-more" onClick={onMore}>
          더보기
          <img src={backIcon} alt="" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

// 게스트 일정 날짜: "2026-10-05" + "19:00:00" → "10/5(월) 19:00"
const formatGuestSchedule = (eventDate, startTime) => {
  const time = startTime ? String(startTime).slice(0, 5) : "";
  const parts = String(eventDate || "").slice(0, 10).split("-");

  if (parts.length !== 3) {
    return time || "일정 미정";
  }

  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];

  return `${Number(parts[1])}/${Number(parts[2])}(${weekday})${time ? ` ${time}` : ""}`;
};

// 비어 있을 때 안내 박스
function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="ClubHome-empty">
      <p className="ClubHome-empty-title">{title}</p>
      {description && <p className="ClubHome-empty-desc">{description}</p>}
      {actionLabel && (
        <button type="button" className="ClubHome-empty-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// 카드 아래 한 줄 정보: 종목 · 지역이 있으면 그걸, 없으면 소개글
const getClubMeta = (club) => {
  const meta = [club.sport_name, club.region].filter(Boolean).join(" · ");
  return meta || club.club_intro || "";
};

// 이미지 없는 동호회: 이름 첫 글자
const getClubInitial = (club) => (club.club_name || "?").trim().charAt(0);

function ClubHome() {
  const navigate = useNavigate();

  // ⭐ 이용 도우미 챗봇 열림 여부 (Main / MainHome 과 같은 챗봇)
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // =====================================================
  // 사용자 프로필
  // =====================================================
  const [profileImage, setProfileImage] = useState(
    () => localStorage.getItem("playbridge_profile_image") || ""
  );

  // =====================================================
  // 알림
  // =====================================================
  const {
    unreadCount: unreadNotificationCount,
  } = useNotifications();

  // =====================================================
  // 동호회 이미지 오류 처리
  // =====================================================
  const handleClubImageError = (event) => {
    const img = event.currentTarget;

    img.style.display = "none";

    const fallback = img.parentElement?.querySelector(
      ".Club-card-no-image"
    );

    if (fallback) {
      fallback.style.display = "flex";
    }
  };

  // =========================================
  // 동호회 목록 및 상태
  // =========================================
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================
  // 게스트 모집중 목록 및 상태
  // =========================================
  // =========================================
  // 회원 모집중 목록 (모집 중 전용 API)
  // =========================================
  const [recruitingData, setRecruitingData] = useState([]);
  const [recruitingLoading, setRecruitingLoading] = useState(true);
  const [recruitingError, setRecruitingError] = useState("");

  const [guestEvents, setGuestEvents] = useState([]);
  const [guestLoading, setGuestLoading] = useState(true);
  const [guestError, setGuestError] = useState("");

  // =========================================
  // 검색 결과 화면 표시 여부
  // =========================================
  const [isSearchResult, setIsSearchResult] = useState(false);

  // =========================================
  // 회원 모집중 더보기 상태
  // =========================================
  const [showAllClubs, setShowAllClubs] = useState(false);

  // =========================================
  // 게스트 모집중 더보기 상태
  // =========================================
  const [showAllGuests, setShowAllGuests] = useState(false);

  // =========================================
  // 검색창 열림 / 닫힘
  // =========================================
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // =========================================
  // 검색어
  // =========================================
  const [searchKeyword, setSearchKeyword] = useState("");

  // =========================================
  // 실제 적용된 필터
  // =========================================
  const [selectedSports, setSelectedSports] = useState([]);
  const [selectedRegions, setSelectedRegions] = useState([]);

  // =========================================
  // 실제 적용된 활동 요일
  // =========================================
  const [selectedDays, setSelectedDays] = useState([]);

  // =========================================
  // 실제 적용된 활동 시간
  // =========================================
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
          buildApiUrl("/api/clubs/search"),
          window.location.origin
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

        console.log(
          "API에서 가져온 동호회 데이터:",
          data
        );

        console.log(
          "동호회 개수:",
          data.length
        );

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
  }, [
    selectedSports,
    selectedRegions,
    selectedDays,
    selectedTimeSlots,
  ]);

  // =====================================================
  // 사용자 프로필 이미지 조회
  // =====================================================
  useEffect(() => {
    let isActive = true;

    const loadUserProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || !isActive) {
          return;
        }

        const { data, error } = await supabase
          .from("users")
          .select("profile_image")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error(
            "ClubHome 프로필 이미지 조회 오류:",
            error
          );

          return;
        }

        if (!isActive) {
          return;
        }

        if (data?.profile_image) {
          setProfileImage(data.profile_image);

          localStorage.setItem(
            "playbridge_profile_image",
            data.profile_image
          );
        } else {
          setProfileImage("");

          localStorage.removeItem(
            "playbridge_profile_image"
          );
        }
      } catch (error) {
        console.error(
          "ClubHome 프로필 이미지 조회 오류:",
          error
        );
      }
    };

    loadUserProfile();

    return () => {
      isActive = false;
    };
  }, []);

  // =========================================
  // 회원 모집중 동호회 조회
  // /api/clubs/search 결과에 is_recruiting 값이 안 들어올 수 있어서
  // "회원 모집중" 페이지(ClubRecruit)와 같은 전용 API를 사용
  // =========================================
  useEffect(() => {
    const controller = new AbortController();

    const fetchRecruitingClubs = async () => {
      try {
        setRecruitingLoading(true);
        setRecruitingError("");

        const url = new URL(
          buildApiUrl("/api/clubs/recruiting"),
          window.location.origin
        );

        selectedSports.forEach((sport) => url.searchParams.append("sport_name", sport));
        selectedRegions.forEach((region) => url.searchParams.append("region", region));
        selectedDays.forEach((day) => url.searchParams.append("day_of_week", day));
        selectedTimeSlots.forEach((timeSlot) => url.searchParams.append("time_slot", timeSlot));

        const response = await fetch(url.toString(), {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `모집 중인 동호회를 불러오지 못했습니다. (HTTP ${response.status})`
          );
        }

        const data = await response.json();

        const clubList = Array.isArray(data)
          ? data
          : Array.isArray(data?.clubs)
            ? data.clubs
            : Array.isArray(data?.data)
              ? data.data
              : [];

        setRecruitingData(clubList);
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }

        console.error("회원 모집중 조회 오류:", err);
        setRecruitingError(err.message);
        setRecruitingData([]);
      } finally {
        if (!controller.signal.aborted) {
          setRecruitingLoading(false);
        }
      }
    };

    fetchRecruitingClubs();

    return () => {
      controller.abort();
    };
  }, [
    selectedSports,
    selectedRegions,
    selectedDays,
    selectedTimeSlots,
  ]);

  // =========================================
  // 게스트 모집 이벤트 조회
  // =========================================
  useEffect(() => {
    const controller = new AbortController();

    const fetchGuestEvents = async () => {
      try {
        setGuestLoading(true);
        setGuestError("");

        const response = await fetch(
          buildApiUrl("/api/clubs/guest-recruiting"),
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

        console.log(
          "게스트 모집 이벤트:",
          eventList
        );

        console.log(
          "게스트 첫 번째 데이터:",
          eventList[0]
        );

        setGuestEvents(eventList);
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }

        console.error(
          "게스트 모집 조회 오류:",
          err
        );

        setGuestError(err.message);
        setGuestEvents([]);
      } finally {
        if (!controller.signal.aborted) {
          setGuestLoading(false);
        }
      }
    };

    fetchGuestEvents();

    return () => {
      controller.abort();
    };
  }, []);

  // =========================================
  // 검색어 + 적용된 필터를 기준으로 동호회 검색
  // =========================================
  const filteredClubs = clubs.filter((club) => {
    const keyword = searchKeyword
      .trim()
      .toLowerCase();

    // 동호회 이름 또는 소개글에 검색어가 포함되는지 확인
    const matchesKeyword =
      !keyword ||
      club.club_name
        ?.toLowerCase()
        .includes(keyword) ||
      club.club_intro
        ?.toLowerCase()
        .includes(keyword);

    return matchesKeyword;
  });

  // =========================================
  // 회원 모집중 동호회 (모집 중 전용 API 결과 + 검색어)
  // =========================================
  const recruitingKeyword = searchKeyword.trim().toLowerCase();

  const recruitingClubs = recruitingData.filter((club) => {
    if (!recruitingKeyword) {
      return true;
    }

    return (
      club.club_name?.toLowerCase().includes(recruitingKeyword) ||
      club.club_intro?.toLowerCase().includes(recruitingKeyword)
    );
  });

  // =========================================
  // 회원 모집중 홈 화면 표시용
  // 최대 6개
  // =========================================
  const displayRecruitingClubs =
    recruitingClubs.slice(0, 6);

  // =========================================
  // 전체 동호회 홈 화면 표시용
  // 최대 6개
  // =========================================
  const displayAllClubs =
    filteredClubs.slice(0, 6);

  return (
    <div className="ClubHome-container">

      {/* =====================================================
          상단 영역
      ===================================================== */}
      <header className="ClubHome-header">

        <button className="ClubHome-region">
          서울
          <span className="ClubHome-arrow">
            <ChevronDownIcon size={18} />
          </span>
        </button>

        <div className="ClubHome-actions">

          {/* 검색 */}
          <button
            className="ClubHome-icon-button"
            onClick={() =>
              setIsSearchOpen(
                (prev) => !prev
              )
            }
            aria-label="동호회 검색"
          >
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="11"
                cy="11"
                r="7"
                stroke="currentColor"
                strokeWidth="1.8"
              />

              <path
                d="M16.5 16.5L21 21"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {/* 알림 */}
          <button
            type="button"
            className="ClubHome-icon-button ClubHome-notification"
            aria-label="알림"
            onClick={() => navigate("/notification")}
          >
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 8C18 4.686 15.314 2 12 2C8.686 2 6 4.686 6 8C6 14 3 16 3 18H21C21 16 18 14 18 8Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d="M10 21H14"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>

            {unreadNotificationCount > 0 && (
              <span className="ClubHome-notification-badge">
                {unreadNotificationCount >= 10
                  ? "10+"
                  : unreadNotificationCount}
              </span>
            )}
          </button>

          {/* 내 정보 / 프로필 */}
          <button
            type="button"
            className="ClubHome-profile-button"
            aria-label="내 정보"
            onClick={() => navigate("/mypage")}
          >
            <img
              src={
                profileImage || profileIcon
              }
              alt="내 정보"
              onError={(e) => {
                e.currentTarget.src =
                  profileIcon;
              }}
            />
          </button>

        </div>
      </header>

      {/* =====================================================
          공통 검색 및 필터
      ===================================================== */}
      <ClubSearchFilter
        isSearchOpen={isSearchOpen}
        searchKeyword={searchKeyword}
        onSearchKeywordChange={(keyword) => {
          setSearchKeyword(keyword);

          // 검색어가 입력되면 검색 결과 화면 표시
          if (keyword.trim()) {
            setIsSearchResult(true);
          } else if (
            selectedFilterCount === 0
          ) {
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
          setSelectedSports(
            filters.sports
          );

          setSelectedRegions(
            filters.regions
          );

          setSelectedDays(
            filters.days
          );

          setSelectedTimeSlots(
            filters.timeSlots
          );

          // 필터 적용 후 검색 결과 화면 표시
          setIsSearchResult(true);
        }}
      />

      {/* =====================================================
          1. AI 맞춤 동호회 추천
          기본 화면에서만 표시
      ===================================================== */}
      {!isSearchResult && (
        <section className="ClubHome-ai">

          <div className="ClubHome-ai-content">

            <div className="ClubHome-ai-title">
              <span className="ClubHome-ai-badge">
                AI
              </span>

              <h2>
                나의 맞춤 동호회 추천
              </h2>
            </div>

            <p className="ClubHome-ai-description">
              나의 정보를 바탕으로
              <br />
              딱 맞는 동호회를 추천해 드려요!
            </p>

            <button
              type="button"
              className="ClubHome-ai-button"
              onClick={() => navigate("/clubs/recommend")}
            >
              맞춤 동호회 보러가기
              <ChevronRightIcon />
            </button>

          </div>

          {/* ⭐ 이용 도우미 챗봇과 같은 캐릭터 이미지 */}
          <div className="ClubHome-ai-character">
            <img
              src={chatbotIcon}
              alt=""
              aria-hidden="true"
            />
          </div>

        </section>
      )}

      {/* =====================================================
          전체 동호회
      ===================================================== */}
      {!isSearchResult && (
        <section className="ClubHome-all-clubs">

          <SectionHeader
            icon={findClubIcon}
            title="전체 동호회"
            onMore={() => navigate("/clubs/all")}
          />

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
                {displayAllClubs.map(
                  (club) => (
                    <div
                      className="Club-card"
                      key={club.club_id}
                      onClick={() =>
                        navigate(
                          `/clubs/${club.club_id}`
                        )
                      }
                    >

                      {/* 동호회 이미지 */}
                      <div className="Club-card-image">

                        {club.image_url ? (
                          <>
                            <img
                              src={
                                club.image_url
                              }
                              alt={
                                club.club_name
                              }
                              onError={
                                handleClubImageError
                              }
                            />

                            <div
                              className="Club-card-no-image"
                              style={{
                                display:
                                  "none",
                              }}
                            >{getClubInitial(club)}</div>
                          </>
                        ) : (
                          <div className="Club-card-no-image">{getClubInitial(club)}</div>
                        )}

                      </div>

                      {/* 동호회 이름 */}
                      <h3 className="Club-card-name">
                        {club.club_name}
                      </h3>

                      {/* 동호회 소개 */}
                      <p className="Club-card-intro">
                        {getClubMeta(club)}
                      </p>

                    </div>
                  )
                )}

              </>
            )}

          </div>

        </section>
      )}

      {/* =====================================================
          2. 회원 모집중 / 동호회 검색 결과
      ===================================================== */}
      <section className="ClubHome-recruit">

        <SectionHeader
          icon={userIcon}
          title={isSearchResult ? "검색 결과" : "회원 모집중"}
          onMore={
            isSearchResult
              ? null
              : () => navigate("/clubs/recruit")
          }
        />

        {/* 검색 결과 개수 */}
        {isSearchResult &&
          !loading &&
          !error && (
            <p className="ClubHome-result-count">
              검색 결과{" "}
              {filteredClubs.length}개
            </p>
          )}

        {/* 동호회 목록 */}
        <div className="Club-list">

          {(isSearchResult ? loading : recruitingLoading) ? (
            <p className="ClubHome-message">
              동호회 정보를 불러오는 중...
            </p>
          ) : (isSearchResult ? error : recruitingError) ? (
            <p className="ClubHome-message">
              {isSearchResult ? error : recruitingError}
            </p>
          ) : !isSearchResult &&
            recruitingClubs.length === 0 ? (
            <EmptyState
              title="지금 회원을 모집 중인 동호회가 없어요"
              description="전체 동호회에서 가입 신청을 먼저 보내볼 수 있어요."
              actionLabel="전체 동호회 보기"
              onAction={() => navigate("/clubs/all")}
            />
          ) : isSearchResult && filteredClubs.length === 0 ? (
            <EmptyState
              title="조건에 맞는 동호회가 없어요"
              description="필터를 줄이거나 다른 검색어로 찾아보세요."
            />
          ) : (
            <>
              {/* 기본 화면: 회원 모집중 / 검색 화면: 검색 결과 */}
              {(isSearchResult
                ? filteredClubs
                : displayRecruitingClubs
              ).map(
                (club) => (
                  <div
                    className="Club-card"
                    key={club.club_id}
                    onClick={() =>
                      navigate(
                        `/clubs/${club.club_id}`
                      )
                    }
                  >

                    <div className="Club-card-image">

                      {club.image_url ? (
                        <>
                          <img
                            src={
                              club.image_url
                            }
                            alt={
                              club.club_name
                            }
                            onError={
                              handleClubImageError
                            }
                          />

                          <div
                            className="Club-card-no-image"
                            style={{
                              display:
                                "none",
                            }}
                          >{getClubInitial(club)}</div>
                        </>
                      ) : (
                        <div className="Club-card-no-image">{getClubInitial(club)}</div>
                      )}

                    </div>

                    <h3 className="Club-card-name">
                      {club.club_name}
                    </h3>

                    <p className="Club-card-intro">
                      {getClubMeta(club)}
                    </p>

                  </div>
                )
              )}

            </>
          )}

        </div>

      </section>

      {/* =====================================================
          3. 게스트 모집중
          기본 화면에서만 표시
      ===================================================== */}
      {!isSearchResult && (
        <section className="ClubHome-guest">

          <SectionHeader
            icon={activityIcon}
            title="게스트 모집중"
            onMore={() => navigate("/guest-recruit")}
          />

          <div className="Guest-list">

            {guestLoading ? (
              <p className="ClubHome-message">
                게스트 모집 정보를 불러오는 중...
              </p>
            ) : guestError ? (
              <p className="ClubHome-message">
                {guestError}
              </p>
            ) : guestEvents.length === 0 ? (
              <EmptyState
                title="게스트를 찾는 일정이 아직 없어요"
                description="새 일정이 올라오면 여기에 보여드릴게요."
              />
            ) : (
              <>
                {guestEvents
                  .slice(0, 6)
                  .map((event) => (
                    <div
                      className="Guest-card"
                      key={event.event_id}
                      onClick={() =>
                        navigate(
                          `/guest-recruit/${event.event_id}`,
                          {
                            state: {
                              event: event,
                            },
                          }
                        )
                      }
                    >

                      <div className="Guest-card-image">
                        {event.event_image_url ? (
                          <img
                            src={event.event_image_url}
                            alt={event.title || "게스트 모집"}
                          />
                        ) : (
                          <img
                            className="Guest-card-fallback"
                            src={activityIcon}
                            alt=""
                            aria-hidden="true"
                          />
                        )}

                        {/* 홈과 같은 "게스트 모집" 배지 */}
                        <span className="Guest-card-badge">
                          게스트 모집
                        </span>
                      </div>

                      <h3 className="Guest-card-title">
                        {event.title || "게스트 모집"}
                      </h3>

                      <div className="Guest-card-info">
                        <span className="Guest-card-time">
                          {formatGuestSchedule(
                            event.event_date,
                            event.start_time
                          )}
                        </span>

                        <span className="Guest-card-location">
                          {event.location || "장소 미정"}
                        </span>
                      </div>

                    </div>
                  ))}

              </>
            )}

          </div>

        </section>
      )}

      {/* =====================================================
          검색 결과 화면 상단
      ===================================================== */}
      {isSearchResult && (
        <div className="ClubHome-search-result-header">

          <button
            type="button"
            className="ClubHome-search-back pb-back-text-button"
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
            <BackButtonIcon />
            <span>동호회 찾기로</span>
          </button>

        </div>
      )}

      {/* =====================================================
          이용 도우미 챗봇 (실제 챗봇 연결)
          - 예전 목업 버튼(🤖) 대신 Main / MainHome 과 같은 챗봇 사용
      ===================================================== */}
      {!isChatbotOpen && (
        <ChatbotButton
          onClick={() => setIsChatbotOpen(true)}
        />
      )}

      {isChatbotOpen && (
        <Chatbot
          onClose={() => setIsChatbotOpen(false)}
        />
      )}

      {/* =====================================================
          하단 네비게이션
      ===================================================== */}
      <BottomNav />

    </div>
  );
}

export default ClubHome;