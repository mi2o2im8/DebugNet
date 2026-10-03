import { BackButtonIcon } from "../../components/BackButton/BackButton";
import BottomNav from "../../components/BottomNav";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./ClubHome.css";
import ClubSearchFilter from "../../components/common/ClubSearchFilter";
import { buildApiUrl } from "../../api/apiClient";
import { useNotifications } from "../../context/NotificationContext";
import profileIcon from "../../assets/img/basic_profile_img.png";
import chatbotIcon from "../../assets/img/chatbot/chatbot-icon.png";
import ChatbotButton from "../../components/Chatbot/ChatbotButton";
import Chatbot from "../Chatbot/Chatbot";
import { supabase } from "../../../supabaseClient";
import {
  getUserPreferences,
  isSameSport,
  isSameRegion,
} from "../../utils/recommendClubs";

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

function PinIcon({ size = 12 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true">
      <path d="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ClockIcon({ size = 12 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true">
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="7" r="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="10" cy="17" r="2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ListViewIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
      <path d="M9 6h11M9 12h11M9 18h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="4.5" cy="6" r="1.2" fill="currentColor" />
      <circle cx="4.5" cy="12" r="1.2" fill="currentColor" />
      <circle cx="4.5" cy="18" r="1.2" fill="currentColor" />
    </svg>
  );
}

function GridViewIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

// =====================================================
// 탭 / 보기 방식
// =====================================================
const TABS = [
  { id: "all", label: "전체" },
  { id: "recruit", label: "회원 모집중" },
  { id: "guest", label: "게스트 모집중" },
];

const VIEW_MODE_KEY = "playbridge_clubhome_view";

// 정렬 (동호회 탭)
const SORT_OPTIONS = [
  { id: "recommend", label: "추천순" },
  { id: "latest", label: "최신순" },
  { id: "popular", label: "인기순" },
];

// 동호회 해시태그: 동호회 만들 때 고른 분위기 태그 (atmospheres)
const getClubTags = (club) => {
  const raw = Array.isArray(club.atmospheres)
    ? club.atmospheres
    : typeof club.atmospheres === "string"
      ? club.atmospheres.split(",")
      : [];

  return raw
    .map((tag) => String(tag).replace(/^#/, "").replace(/\s+/g, "").trim())
    .filter(Boolean)
    .map((tag) => `#${tag}`);
};

const toTime = (value) => {
  const time = value ? new Date(value).getTime() : NaN;
  return Number.isNaN(time) ? 0 : time;
};

// 추천 점수: 내 관심 종목 일치 +2, 활동 지역 일치 +1
const getRecommendScore = (club, preferences) => {
  if (!preferences) return 0;

  const sports = String(club.sport_name || "").split(",").map((v) => v.trim()).filter(Boolean);
  const regions = String(club.region || "").split(",").map((v) => v.trim()).filter(Boolean);

  const sportMatch = sports.some((sport) =>
    preferences.sports.some((mine) => isSameSport(sport, mine))
  );
  const regionMatch = regions.some((region) =>
    preferences.regions.some((mine) => isSameRegion(region, mine))
  );

  return (sportMatch ? 2 : 0) + (regionMatch ? 1 : 0);
};

// 정렬 (같은 점수면 원래 순서 유지)
const sortClubs = (list, sortKey, preferences) => {
  const indexed = list.map((club, index) => ({ club, index }));

  const valueOf = (club) => {
    if (sortKey === "latest") return toTime(club.created_at);
    if (sortKey === "popular") return Number(club.current_members) || 0;
    return getRecommendScore(club, preferences);
  };

  indexed.sort((a, b) => valueOf(b.club) - valueOf(a.club) || a.index - b.index);

  return indexed.map((item) => item.club);
};

const readViewMode = () => {
  try {
    return localStorage.getItem(VIEW_MODE_KEY) === "grid" ? "grid" : "list";
  } catch {
    return "list";
  }
};

// 게스트 일정 날짜 블록: "2026-10-05" → { dow: "월", day: 5, month: 10 }
const getDateParts = (eventDate) => {
  const parts = String(eventDate || "").slice(0, 10).split("-");

  if (parts.length !== 3) {
    return null;
  }

  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));

  return {
    dow: ["일", "월", "화", "수", "목", "금", "토"][date.getDay()],
    day: date.getDate(),
    month: date.getMonth() + 1,
  };
};

// "19:00:00" + "21:00:00" → "19:00 – 21:00"
const formatTimeRange = (startTime, endTime) => {
  const start = startTime ? String(startTime).slice(0, 5) : "";
  const end = endTime ? String(endTime).slice(0, 5) : "";

  if (start && end) return `${start} – ${end}`;
  return start || "시간 미정";
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

// 종목 · 지역
const getClubMeta = (club) =>
  [club.sport_name, club.region].filter(Boolean).join(" · ");

// 이미지 없는 동호회: 이름 첫 글자
const getClubInitial = (club) => (club.club_name || "?").trim().charAt(0);

// 동호회 사진 (없거나 깨지면 이름 첫 글자)
function ClubThumb({ club, className }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={className}>
      {club.image_url && !failed ? (
        <img
          src={club.image_url}
          alt={club.club_name}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="ClubHome-thumb-initial">{getClubInitial(club)}</span>
      )}
    </div>
  );
}

// 리스트형 한 줄
function ClubRow({ club, isRecruiting, onClick }) {
  const meta = getClubMeta(club);
  const tags = getClubTags(club);

  return (
    <button type="button" className="ClubHome-row" onClick={onClick}>
      <ClubThumb club={club} className="ClubHome-row-thumb" />

      <div className="ClubHome-row-body">
        <div className="ClubHome-row-name-line">
          <h3 className="ClubHome-row-name">{club.club_name}</h3>
          {isRecruiting && <span className="ClubHome-badge">모집중</span>}
        </div>

        {meta && (
          <p className="ClubHome-row-meta">
            <PinIcon />
            <span>{meta}</span>
          </p>
        )}

        {club.club_intro && (
          <p className="ClubHome-row-intro">{club.club_intro}</p>
        )}

        {(tags.length > 0 || club.current_members > 0) && (
          <div className="ClubHome-row-foot">
            <div className="ClubHome-tags">
              {tags.slice(0, 3).map((tag) => (
                <span key={tag} className="ClubHome-tag">{tag}</span>
              ))}
            </div>
            {club.current_members > 0 && (
              <span className="ClubHome-row-members">멤버 {club.current_members}명</span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

// 타일형 (3열) — 폭이 좁아서 지역은 "서울 마포구" → "마포구"
function ClubGridCard({ club, isRecruiting, onClick }) {
  const shortRegion = String(club.region || "").split(",")[0].trim().split(" ").pop();
  const meta = [club.sport_name, shortRegion].filter(Boolean).join(" · ");
  const tags = getClubTags(club);

  return (
    <button type="button" className="ClubHome-gcard" onClick={onClick}>
      <div className="ClubHome-gcard-image-wrap">
        <ClubThumb club={club} className="ClubHome-gcard-image" />
        {isRecruiting && (
          <span className="ClubHome-badge ClubHome-badge--solid">모집중</span>
        )}
      </div>

      <h3 className="ClubHome-gcard-name">{club.club_name}</h3>
      {meta && (
        <p className="ClubHome-gcard-meta">
          <PinIcon size={10} />
          <span>{meta}</span>
        </p>
      )}
      {tags.length > 0 && (
        <p className="ClubHome-gcard-tags">{tags.slice(0, 2).join(" ")}</p>
      )}
    </button>
  );
}

// 게스트 일정 한 줄 (게스트 탭은 날짜·시간·장소가 핵심이라 리스트형만)
function GuestRow({ event, onClick }) {
  const date = getDateParts(event.event_date);

  return (
    <button type="button" className="ClubHome-guest-row" onClick={onClick}>
      <div className="ClubHome-guest-date">
        {date ? (
          <>
            <span className="ClubHome-guest-dow">{date.dow}</span>
            <span className="ClubHome-guest-day">{date.day}</span>
            <span className="ClubHome-guest-month">{date.month}월</span>
          </>
        ) : (
          <span className="ClubHome-guest-month">일정 미정</span>
        )}
      </div>

      <div className="ClubHome-guest-body">
        <h3 className="ClubHome-guest-title">{event.title || "게스트 모집"}</h3>

        <p className="ClubHome-guest-info">
          <ClockIcon />
          <span>{formatTimeRange(event.start_time, event.end_time)}</span>
        </p>

        <p className="ClubHome-guest-info">
          <PinIcon />
          <span>{event.location || "장소 미정"}</span>
        </p>
      </div>

      {event.max_guests > 0 && (
        <span className="ClubHome-guest-count">게스트 {event.max_guests}명</span>
      )}
    </button>
  );
}

function ClubHome() {
  const navigate = useNavigate();

  // ⭐ 이용 도우미 챗봇 열림 여부 (Main / MainHome 과 같은 챗봇)
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // =====================================================
  // 탭 (주소에 ?tab= 으로 저장 → 상세 갔다 뒤로 와도 같은 탭)
  // =====================================================
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = TABS.some((tab) => tab.id === tabParam) ? tabParam : "all";

  // =====================================================
  // 보기 방식 (리스트 / 카드) - 마지막 선택 기억
  // =====================================================
  const [viewMode, setViewMode] = useState(readViewMode);

  const changeViewMode = (mode) => {
    setViewMode(mode);

    try {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch {
      // 저장 실패해도 화면 전환은 그대로
    }
  };

  // =====================================================
  // 정렬
  // =====================================================
  const [sortKey, setSortKey] = useState("recommend");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef(null);
  const [preferences, setPreferences] = useState(null);

  useEffect(() => {
    let isActive = true;

    getUserPreferences().then((prefs) => {
      if (isActive) setPreferences(prefs);
    });

    return () => {
      isActive = false;
    };
  }, []);

  // 정렬 메뉴 바깥을 누르면 닫기
  useEffect(() => {
    if (!isSortOpen) return undefined;

    const handleOutside = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    };

    const handleKey = (event) => {
      if (event.key === "Escape") setIsSortOpen(false);
    };

    document.addEventListener("pointerdown", handleOutside);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("pointerdown", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isSortOpen]);

  const currentSortLabel =
    SORT_OPTIONS.find((option) => option.id === sortKey)?.label || "추천순";

  // =====================================================
  // 필터 / 종목 칩 → 공통 필터 모달 열기
  // =====================================================
  const [filterOpenRequest, setFilterOpenRequest] = useState(null);

  const openFilterModal = (scope) => {
    setFilterOpenRequest({ key: Date.now(), scope });
  };

  // =====================================================
  // 탭 바 위치 / 탭별 스크롤 위치
  // =====================================================
  const tabBarRef = useRef(null);
  const scrollByTabRef = useRef({});

  const getTabBarTop = () => {
    if (!tabBarRef.current) return 0;
    return tabBarRef.current.getBoundingClientRect().top + window.scrollY;
  };

  const changeTab = (tabId) => {
    if (tabId === activeTab) return;

    scrollByTabRef.current[activeTab] = window.scrollY;

    const next = new URLSearchParams(searchParams);
    if (tabId === "all") next.delete("tab");
    else next.set("tab", tabId);
    setSearchParams(next, { replace: true });

    // 탭 바가 위에 붙어 있던 상태면, 새 탭은 목록 맨 위(또는 전에 보던 위치)부터
    const stickTop = getTabBarTop();
    if (window.scrollY > stickTop) {
      const saved = scrollByTabRef.current[tabId];
      requestAnimationFrame(() => {
        window.scrollTo(0, Math.max(stickTop, saved || 0));
      });
    }
  };

  // =====================================================
  // 스크롤 내리는 동안 이용 도우미 버튼 숨김
  // =====================================================
  const [isChatbotHidden, setIsChatbotHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let idleTimer;

    const handleScroll = () => {
      const y = window.scrollY;
      setIsChatbotHidden(y > lastY && y > 120);
      lastY = y;

      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setIsChatbotHidden(false), 700);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(idleTimer);
    };
  }, []);

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

  // =========================================
  // 동호회 목록 및 상태
  // =========================================
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================
  // 회원 모집중 목록 (모집 중 전용 API)
  // =========================================
  const [recruitingData, setRecruitingData] = useState([]);
  const [recruitingLoading, setRecruitingLoading] = useState(true);
  const [recruitingError, setRecruitingError] = useState("");

  // =========================================
  // 게스트 모집중 목록 및 상태
  // =========================================
  const [guestEvents, setGuestEvents] = useState([]);
  const [guestLoading, setGuestLoading] = useState(true);
  const [guestError, setGuestError] = useState("");

  // =========================================
  // 검색 결과 화면 표시 여부
  // =========================================
  const [isSearchResult, setIsSearchResult] = useState(false);

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
  const [selectedDays, setSelectedDays] = useState([]);
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

        selectedSports.forEach((sport) => url.searchParams.append("sport_name", sport));
        selectedRegions.forEach((region) => url.searchParams.append("region", region));
        selectedDays.forEach((day) => url.searchParams.append("day_of_week", day));
        selectedTimeSlots.forEach((timeSlot) => url.searchParams.append("time_slot", timeSlot));

        const response = await fetch(url.toString());

        if (!response.ok) {
          throw new Error("동호회 정보를 불러오지 못했습니다.");
        }

        const data = await response.json();

        setClubs(Array.isArray(data) ? data : []);
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
          console.error("ClubHome 프로필 이미지 조회 오류:", error);
          return;
        }

        if (!isActive) {
          return;
        }

        if (data?.profile_image) {
          setProfileImage(data.profile_image);
          localStorage.setItem("playbridge_profile_image", data.profile_image);
        } else {
          setProfileImage("");
          localStorage.removeItem("playbridge_profile_image");
        }
      } catch (error) {
        console.error("ClubHome 프로필 이미지 조회 오류:", error);
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
          throw new Error(`게스트 모집 조회 실패 (HTTP ${response.status})`);
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
          throw new Error("게스트 모집 데이터 형식이 올바르지 않습니다.");
        }

        setGuestEvents(eventList);
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }

        console.error("게스트 모집 조회 오류:", err);

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
  // 검색어 필터
  // =========================================
  const keyword = searchKeyword.trim().toLowerCase();

  const matchesClubKeyword = (club) =>
    !keyword ||
    club.club_name?.toLowerCase().includes(keyword) ||
    club.club_intro?.toLowerCase().includes(keyword);

  const filteredClubs = sortClubs(
    clubs.filter(matchesClubKeyword),
    sortKey,
    preferences
  );
  const recruitingClubs = sortClubs(
    recruitingData.filter(matchesClubKeyword),
    sortKey,
    preferences
  );

  const filteredGuests = guestEvents.filter(
    (event) =>
      !keyword ||
      event.title?.toLowerCase().includes(keyword) ||
      event.description?.toLowerCase().includes(keyword) ||
      event.location?.toLowerCase().includes(keyword)
  );

  // 전체 탭에서도 모집 중인 동호회에 "모집중" 뱃지 표시
  const recruitingIds = new Set(recruitingData.map((club) => club.club_id));

  const tabCounts = {
    all: loading ? null : filteredClubs.length,
    recruit: recruitingLoading ? null : recruitingClubs.length,
    guest: guestLoading ? null : filteredGuests.length,
  };

  const isGuestTab = activeTab === "guest";

  // =========================================
  // 탭 내용
  // =========================================
  const renderClubs = (list, isLoading, listError, emptyState) => {
    if (isLoading) {
      return <p className="ClubHome-message">동호회 정보를 불러오는 중...</p>;
    }

    if (listError) {
      return <p className="ClubHome-message">{listError}</p>;
    }

    if (list.length === 0) {
      return emptyState;
    }

    const goDetail = (club) => () => navigate(`/clubs/${club.club_id}`);

    if (viewMode === "grid") {
      return (
        <div className="ClubHome-grid">
          {list.map((club) => (
            <ClubGridCard
              key={club.club_id}
              club={club}
              isRecruiting={recruitingIds.has(club.club_id)}
              onClick={goDetail(club)}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="ClubHome-rows">
        {list.map((club) => (
          <ClubRow
            key={club.club_id}
            club={club}
            isRecruiting={recruitingIds.has(club.club_id)}
            onClick={goDetail(club)}
          />
        ))}
      </div>
    );
  };

  const renderGuests = () => {
    if (guestLoading) {
      return <p className="ClubHome-message">게스트 모집 정보를 불러오는 중...</p>;
    }

    if (guestError) {
      return <p className="ClubHome-message">{guestError}</p>;
    }

    if (filteredGuests.length === 0) {
      return keyword ? (
        <EmptyState
          title="검색어에 맞는 게스트 일정이 없어요"
          description="다른 검색어로 찾아보세요."
        />
      ) : (
        <EmptyState
          title="게스트를 찾는 일정이 아직 없어요"
          description="새 일정이 올라오면 여기에 보여드릴게요."
        />
      );
    }

    return (
      <div className="ClubHome-guest-rows">
        {filteredGuests.map((event) => (
          <GuestRow
            key={event.event_id}
            event={event}
            onClick={() =>
              navigate(`/guest-recruit/${event.event_id}`, {
                state: { event },
              })
            }
          />
        ))}
        <p className="ClubHome-guest-footnote">가까운 날짜순으로 보여드려요</p>
      </div>
    );
  };

  const noResultState = (
    <EmptyState
      title="조건에 맞는 동호회가 없어요"
      description="필터를 줄이거나 다른 검색어로 찾아보세요."
    />
  );

  const renderTabContent = () => {
    if (activeTab === "guest") {
      return renderGuests();
    }

    if (activeTab === "recruit") {
      return renderClubs(
        recruitingClubs,
        recruitingLoading,
        recruitingError,
        isSearchResult ? noResultState : (
          <EmptyState
            title="지금 회원을 모집 중인 동호회가 없어요"
            description="전체 동호회에서 가입 신청을 먼저 보내볼 수 있어요."
            actionLabel="전체 동호회 보기"
            onAction={() => changeTab("all")}
          />
        )
      );
    }

    return renderClubs(
      filteredClubs,
      loading,
      error,
      isSearchResult ? noResultState : (
        <EmptyState title="등록된 동호회가 없어요" />
      )
    );
  };

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
            onClick={() => setIsSearchOpen((prev) => !prev)}
            aria-label="동호회 검색"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
              <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>

          {/* 알림 */}
          <button
            type="button"
            className="ClubHome-icon-button ClubHome-notification"
            aria-label="알림"
            onClick={() => navigate("/notification")}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M18 8C18 4.686 15.314 2 12 2C8.686 2 6 4.686 6 8C6 14 3 16 3 18H21C21 16 18 14 18 8Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M10 21H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>

            {unreadNotificationCount > 0 && (
              <span className="ClubHome-notification-badge">
                {unreadNotificationCount >= 10 ? "10+" : unreadNotificationCount}
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
              src={profileImage || profileIcon}
              alt="내 정보"
              onError={(e) => {
                e.currentTarget.src = profileIcon;
              }}
            />
          </button>

        </div>
      </header>

      {/* =====================================================
          공통 검색 및 필터
      ===================================================== */}
      <ClubSearchFilter
        hideFilterButton
        openRequest={filterOpenRequest}
        isSearchOpen={isSearchOpen}
        searchKeyword={searchKeyword}
        onSearchKeywordChange={(value) => {
          setSearchKeyword(value);

          if (value.trim()) {
            setIsSearchResult(true);
          } else if (selectedFilterCount === 0) {
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

          setIsSearchResult(true);
        }}
      />

      {/* =====================================================
          검색 / 필터 적용 중: 돌아가기
      ===================================================== */}
      {isSearchResult && (
        <div className="ClubHome-search-result-header">
          <button
            type="button"
            className="ClubHome-search-back pb-back-text-button"
            onClick={() => {
              setIsSearchResult(false);
              setSearchKeyword("");
              setIsSearchOpen(false);
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
          AI 맞춤 동호회 추천 (한 줄로 줄인 배너, 기본 화면에서만)
      ===================================================== */}
      {!isSearchResult && (
        <button
          type="button"
          className="ClubHome-ai-compact"
          onClick={() => navigate("/clubs/recommend")}
        >
          <span className="ClubHome-ai-compact-character">
            <img src={chatbotIcon} alt="" aria-hidden="true" />
          </span>

          <span className="ClubHome-ai-compact-text">
            <span className="ClubHome-ai-compact-title">
              <span className="ClubHome-ai-badge">AI</span>
              나의 맞춤 동호회 추천
            </span>
            <span className="ClubHome-ai-compact-desc">
              딱 맞는 동호회를 골라드려요
            </span>
          </span>

          <span className="ClubHome-ai-compact-button">
            보러가기
            <ChevronRightIcon size={12} />
          </span>
        </button>
      )}

      {/* =====================================================
          탭 바 (스크롤해도 위에 고정)
      ===================================================== */}
      <div className="ClubHome-tabbar" ref={tabBarRef}>
        <div className="ClubHome-tabbar-inner">

          <div className="ClubHome-tabs" role="tablist" aria-label="동호회 카테고리">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`ClubHome-tab${activeTab === tab.id ? " is-active" : ""}`}
                onClick={() => changeTab(tab.id)}
              >
                {tab.label}
                {tabCounts[tab.id] !== null && (
                  <span className="ClubHome-tab-count">{tabCounts[tab.id]}</span>
                )}
              </button>
            ))}
          </div>

          <div className="ClubHome-toolbar">
            {isGuestTab ? (
              <p className="ClubHome-toolbar-label">가까운 날짜순</p>
            ) : (
              <div className="ClubHome-chips">
                <button
                  type="button"
                  className={`ClubHome-chip${selectedFilterCount > 0 ? " is-active" : ""}`}
                  onClick={() => openFilterModal("all")}
                >
                  <FilterIcon />
                  필터
                  {selectedFilterCount > 0 && (
                    <span className="ClubHome-chip-count">{selectedFilterCount}</span>
                  )}
                </button>

                <button
                  type="button"
                  className={`ClubHome-chip${selectedSports.length > 0 ? " is-active" : ""}`}
                  onClick={() => openFilterModal("sports")}
                >
                  {selectedSports.length === 0
                    ? "종목"
                    : selectedSports.length === 1
                      ? selectedSports[0]
                      : `${selectedSports[0]} 외 ${selectedSports.length - 1}`}
                  <ChevronDownIcon size={12} />
                </button>
              </div>
            )}

            {!isGuestTab && (
              <div className="ClubHome-toolbar-right">
                <div className="ClubHome-sort" ref={sortRef}>
                  <button
                    type="button"
                    className="ClubHome-sort-button"
                    aria-haspopup="listbox"
                    aria-expanded={isSortOpen}
                    onClick={() => setIsSortOpen((prev) => !prev)}
                  >
                    {currentSortLabel}
                    <ChevronDownIcon size={14} />
                  </button>

                  {isSortOpen && (
                    <ul className="ClubHome-sort-menu" role="listbox" aria-label="정렬">
                      {SORT_OPTIONS.map((option) => (
                        <li key={option.id}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={sortKey === option.id}
                            className={`ClubHome-sort-option${sortKey === option.id ? " is-active" : ""}`}
                            onClick={() => {
                              setSortKey(option.id);
                              setIsSortOpen(false);
                            }}
                          >
                            {option.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* 게스트 탭은 리스트형만 → 보기 전환 숨김 */}
                <div className="ClubHome-view-toggle" role="group" aria-label="보기 방식">
                  <button
                    type="button"
                    className={`ClubHome-view-button${viewMode === "list" ? " is-active" : ""}`}
                    aria-pressed={viewMode === "list"}
                    aria-label="리스트로 보기"
                    onClick={() => changeViewMode("list")}
                  >
                    <ListViewIcon />
                  </button>
                  <button
                    type="button"
                    className={`ClubHome-view-button${viewMode === "grid" ? " is-active" : ""}`}
                    aria-pressed={viewMode === "grid"}
                    aria-label="타일로 보기"
                    onClick={() => changeViewMode("grid")}
                  >
                    <GridViewIcon />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* =====================================================
          탭 내용 (세로 스크롤)
      ===================================================== */}
      <section className="ClubHome-tab-panel" role="tabpanel">
        {renderTabContent()}
      </section>

      {/* =====================================================
          이용 도우미 챗봇 (스크롤 내리는 동안 잠깐 숨김)
      ===================================================== */}
      {!isChatbotOpen && (
        <div className={`ClubHome-chatbot-wrap${isChatbotHidden ? " is-hidden" : ""}`}>
          <ChatbotButton onClick={() => setIsChatbotOpen(true)} />
        </div>
      )}

      {isChatbotOpen && (
        <Chatbot onClose={() => setIsChatbotOpen(false)} />
      )}

      {/* =====================================================
          하단 네비게이션
      ===================================================== */}
      <BottomNav />

    </div>
  );
}

export default ClubHome;
