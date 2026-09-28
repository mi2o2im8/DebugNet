import {
  useEffect,
  useState,
} from "react";

import {
  getMatchManagementMatches,
} from "./api/matchApi";

import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import {
  FiChevronRight,
  FiClock,
  FiMapPin,
  FiFilter,
  FiX,
} from "react-icons/fi";

import BottomNav from "../../components/BottomNav";

import "./CSS/MatchManagementList.css";


// ========================================
// 매칭관리 탭
// ========================================
const MATCH_TABS = [
  {
    id: "received",
    label: "받은 신청",
  },
  {
    id: "sent",
    label: "보낸 신청",
  },
  {
    id: "upcoming",
    label: "예정 경기",
  },
  {
    id: "history",
    label: "지난 경기",
  },
  {
    id: "writtenReviews",
    label: "작성한 후기",
  },
  {
    id: "receivedReviews",
    label: "받은 후기",
  },
  
];

// ========================================
// 지난 경기 상태 필터
// ========================================
const HISTORY_STATUS_FILTERS = [
  {
    id: "all",
    label: "전체",
  },
  {
    id: "RECORD_REQUIRED",
    label: "기록 필요",
  },
  {
    id: "RECORD_CONFIRM_REQUIRED",
    label: "확인 필요",
  },
  {
    id: "RECORD_PENDING",
    label: "확인 대기",
  },
  {
    id: "COMPLETED",
    label: "경기 완료",
  },
  {
    id: "REVIEWED",
    label: "후기 완료",
  },
];


// ========================================
// 지난 경기 종목 필터
// ========================================
const HISTORY_SPORT_FILTERS = [
  "전체",
  "축구/풋살",
  "농구",
  "배구",
  "탁구",
];



// ========================================
// 날짜 표시
// 2026-09-27 → 9월 27일
// ========================================
const formatMatchDate = (dateString) => {

  if (!dateString) {
    return "";
  }

  const [, month, day] =
    dateString.split("-");

  return `${Number(month)}월 ${Number(day)}일`;
};

// ========================================
// 지난 경기 화면 표시용 상태
//
// Backend에는 REVIEWED 상태가 없다.
//
// 경기 기록이 COMPLETED이고
// 내가 후기를 작성했다면
// Frontend에서만 REVIEWED처럼 표시한다.
// ========================================
const getDisplayRecordStatus = (
  match
) => {

  if (
    match.recordStatus === "COMPLETED" &&
    match.hasWrittenReview
  ) {

    return "REVIEWED";

  }

  return match.recordStatus;
};


// ========================================
// 지난 경기 상태 문구
// ========================================
const getHistoryStatus = (
  recordStatus
) => {

  switch (recordStatus) {

    case "RECORD_REQUIRED":
      return {
        label: "경기 기록 작성 필요",
        className: "record-required",
      };

    case "RECORD_PENDING":
      return {
        label: "상대팀 확인 대기",
        className: "record-pending",
      };

    case "RECORD_CONFIRM_REQUIRED":
      return {
        label: "경기 기록 확인 필요",
        className: "record-confirm",
      };

    case "COMPLETED":
      return {
        label: "경기 완료",
        className: "completed",
      };

    case "REVIEWED":
      return {
        label: "후기 작성 완료",
        className: "reviewed",
      };

    default:
      return {
        label: "지난 경기",
        className: "",
      };
  }
};


function MatchManagementList() {

  const navigate = useNavigate();

  const { clubId } = useParams();

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  // ========================================
  // 실제 매칭관리 목록
  // ========================================
  const [
    matches,
    setMatches,
  ] = useState([]);


  // 목록 조회 중 여부
  const [
    isLoading,
    setIsLoading,
  ] = useState(true);


  // 목록 조회 오류
  const [
    loadError,
    setLoadError,
  ] = useState("");

  // ========================================
  // 지난 경기 필터
  // ========================================

  // 경기 기록 상태
  const [
    selectedHistoryStatus,
    setSelectedHistoryStatus,
  ] = useState("all");


  // 종목
  const [
    selectedHistorySport,
    setSelectedHistorySport,
  ] = useState("전체");

  // ========================================
  // 지난 경기 필터 창 열림 여부
  // ========================================
  const [
    isHistoryFilterOpen,
    setIsHistoryFilterOpen,
  ] = useState(false);


  // ========================================
  // 현재 선택된 탭
  // ========================================
  const queryTab =
    searchParams.get("tab");


  const selectedTab =
    MATCH_TABS.some(
      (tab) =>
        tab.id === queryTab
    )
      ? queryTab
      : "received";

  // ========================================
  // 현재 선택된 탭의 실제 목록 조회
  // ========================================
  useEffect(() => {

    if (!clubId) {
      return;
    }


    const loadMatches = async () => {

      setIsLoading(true);
      setLoadError("");


      try {

        const response =
          await getMatchManagementMatches(
            clubId,
            selectedTab
          );


        setMatches(
          response.items
        );

      } catch (error) {

        console.error(
          "매칭관리 목록 조회 실패:",
          error
        );


        setMatches([]);

        setLoadError(
          error.message ||
          "매칭 목록을 불러오지 못했습니다."
        );

      } finally {

        setIsLoading(false);

      }

    };


    loadMatches();

  }, [
    clubId,
    selectedTab,
  ]);

  // ========================================
  // 화면에 실제로 표시할 매칭 목록
  //
  // 지난 경기일 때만
  // 상태 + 종목 필터를 동시에 적용한다.
  // ========================================
  const filteredMatches =
    selectedTab === "history"

      ? matches.filter((match) => {

          // ------------------------------
          // 상태 필터
          // ------------------------------
          const displayRecordStatus =
            getDisplayRecordStatus(
              match
            );


          const matchesStatus =
            selectedHistoryStatus === "all" ||
            displayRecordStatus ===
              selectedHistoryStatus;


          // ------------------------------
          // 종목 필터
          // ------------------------------
          const matchesSport =
            selectedHistorySport === "전체" ||
            match.sportName ===
              selectedHistorySport;


          return (
            matchesStatus &&
            matchesSport
          );
        })

      : matches;


  // ========================================
  // 탭 변경
  // ========================================
  const handleTabChange = (tabId) => {

    setSearchParams({
      tab: tabId,
    });

    // 다른 탭으로 이동하면 필터창 닫기
    setIsHistoryFilterOpen(false);
  };


  // ========================================
  // 매칭 상세 이동
  // ========================================
  const handleMatchDetail = (
    clubMatchId
  ) => {

    // ========================================
    // 작성한 후기 목록
    // → 내가 작성한 후기 바로 열기
    // ========================================
    if (
      selectedTab ===
      "writtenReviews"
    ) {

      navigate(
        `/clubs/${clubId}/matches/${clubMatchId}/review-detail?type=written`
      );

      return;
    }


    // ========================================
    // 받은 후기 목록
    // → 상대팀이 작성한 후기 바로 열기
    // ========================================
    if (
      selectedTab ===
      "receivedReviews"
    ) {

      navigate(
        `/clubs/${clubId}/matches/${clubMatchId}/review-detail?type=received`
      );

      return;
    }


    // 일반 매칭
    navigate(
      `/clubs/${clubId}/matches/${clubMatchId}`
    );
  };


  return (

    <div className="match-management-list-container">


      {/* ========================================
          상단
      ======================================== */}
      <header className="match-management-list-header">

        <button
          type="button"
          className="match-management-list-back"
          onClick={() =>
            navigate(
              `/clubs/${clubId}/matches`
            )
          }
          aria-label="뒤로가기"
        >
          ‹
        </button>


        <h1>
          매칭 관리
        </h1>


        <div className="match-management-list-header-space" />

      </header>



      <main className="match-management-list-main">


        {/* ========================================
            4개 탭
        ======================================== */}
        <div className="match-management-tabs">

          {MATCH_TABS.map(
            (tab) => (

              <button
                key={tab.id}
                type="button"
                className={
                  selectedTab === tab.id
                    ? "match-management-tab active"
                    : "match-management-tab"
                }
                onClick={() =>
                  handleTabChange(
                    tab.id
                  )
                }
              >

                {tab.label}

              </button>

            )
          )}

        </div>



        {/* ========================================
            현재 탭 제목 + 개수
        ======================================== */}
        <div className="match-management-list-title">

          <h2>
            {
              MATCH_TABS.find(
                (tab) =>
                  tab.id === selectedTab
              )?.label
            }
          </h2>


          <div className="match-management-list-title-actions">

            <span>
              {filteredMatches.length}건
            </span>


            {/* 지난 경기에서만 필터 버튼 표시 */}
            {selectedTab === "history" && (

              <button
                type="button"
                className={
                  selectedHistoryStatus !== "all" ||
                  selectedHistorySport !== "전체"
                    ? "match-history-filter-toggle active"
                    : "match-history-filter-toggle"
                }
                onClick={() =>
                  setIsHistoryFilterOpen(
                    (previous) => !previous
                  )
                }
                aria-label="지난 경기 필터"
              >
                <FiFilter />
              </button>

            )}

          </div>

        </div>

        {/* ========================================
            지난 경기 필터
            필터 버튼을 눌렀을 때만 표시
        ======================================== */}
        {selectedTab === "history" &&
          isHistoryFilterOpen && (

          <section className="match-history-filters">


            {/* 필터 상단 */}
            <div className="match-history-filter-header">

              <strong>
                필터
              </strong>


              <button
                type="button"
                onClick={() =>
                  setIsHistoryFilterOpen(false)
                }
                aria-label="필터 닫기"
              >
                <FiX />
              </button>

            </div>



            {/* ========================================
                상태 필터
            ======================================== */}
            <div className="match-history-filter-group">

              <span className="match-history-filter-label">
                상태
              </span>


              <div className="match-history-filter-options">

                {HISTORY_STATUS_FILTERS.map(
                  (filter) => (

                    <button
                      key={filter.id}
                      type="button"
                      className={
                        selectedHistoryStatus ===
                        filter.id
                          ? "match-history-filter-chip active"
                          : "match-history-filter-chip"
                      }
                      onClick={() =>
                        setSelectedHistoryStatus(
                          filter.id
                        )
                      }
                    >
                      {filter.label}
                    </button>

                  )
                )}

              </div>

            </div>



            {/* ========================================
                종목 필터
            ======================================== */}
            <div className="match-history-filter-group">

              <span className="match-history-filter-label">
                종목
              </span>


              <div className="match-history-filter-options">

                {HISTORY_SPORT_FILTERS.map(
                  (sport) => (

                    <button
                      key={sport}
                      type="button"
                      className={
                        selectedHistorySport ===
                        sport
                          ? "match-history-filter-chip active"
                          : "match-history-filter-chip"
                      }
                      onClick={() =>
                        setSelectedHistorySport(
                          sport
                        )
                      }
                    >
                      {sport}
                    </button>

                  )
                )}

              </div>

            </div>



            {/* 초기화 */}
            {(selectedHistoryStatus !== "all" ||
              selectedHistorySport !== "전체") && (

              <button
                type="button"
                className="match-history-filter-reset"
                onClick={() => {

                  setSelectedHistoryStatus(
                    "all"
                  );

                  setSelectedHistorySport(
                    "전체"
                  );

                }}
              >
                필터 초기화
              </button>

            )}


          </section>

        )}



        {/* ========================================
            매칭 목록[]
        ======================================== */}
        <section className="match-management-match-list">

          {isLoading ? (

            <div className="match-management-list-empty">

              <strong>
                매칭 정보를 불러오는 중입니다.
              </strong>

            </div>

          ) : loadError ? (

            <div className="match-management-list-empty">

              <strong>
                목록을 불러오지 못했습니다.
              </strong>

              <p>
                {loadError}
              </p>

            </div>

          ) : filteredMatches.length > 0 ? (

            filteredMatches.map(
              (match) => {

                // 지난 경기인 경우
                // 경기기록 상태를 사용한다.
                const historyStatus =
                  selectedTab === "history"
                    ? getHistoryStatus(
                        getDisplayRecordStatus(
                          match
                        )
                      )
                    : null;


                return (

                  <button
                    key={
                      match.clubMatchId
                    }
                    type="button"
                    className="match-management-list-card"
                    onClick={() =>
                      handleMatchDetail(
                        match.clubMatchId
                      )
                    }
                  >


                    <div className="match-management-list-card-content">


                      {/* 팀명 + 상태 */}
                      <div className="match-management-list-card-top">

                        <strong>
                          {match.opponentClubName}
                        </strong>


                        {selectedTab === "history" ? (

                          <span
                            className={
                              `match-management-list-status ${historyStatus.className}`
                            }
                          >
                            {historyStatus.label}
                          </span>

                        ) : (

                          <span
                            className={
                              `match-management-list-status ${selectedTab}`
                            }
                          >
                            {match.statusLabel}
                          </span>

                        )}

                      </div>



                      {/* 종목 */}
                      <div className="match-management-list-sport">

                        {match.sportName}

                      </div>



                      {/* 날짜 / 시간 */}
                      <div className="match-management-list-info">

                        <span>
                          <FiClock />

                          {formatMatchDate(
                            match.matchDate
                          )}

                          {" · "}

                          {match.startTime}

                          {" ~ "}

                          {match.endTime}
                        </span>


                        <span>
                          <FiMapPin />

                          {match.locationName}

                          {match.region
                            ? ` · ${match.region}`
                            : ""}
                        </span>

                      </div>


                    </div>


                    <FiChevronRight />

                  </button>

                );

              }
            )

          ) : (

            <div className="match-management-list-empty">

              <strong>
                등록된 매칭이 없습니다.
              </strong>

              <p>
                새로운 매칭이 생기면 이곳에서 확인할 수 있습니다.
              </p>

            </div>

          )}

        </section>


      </main>


      <BottomNav />


    </div>

  );
}


export default MatchManagementList;