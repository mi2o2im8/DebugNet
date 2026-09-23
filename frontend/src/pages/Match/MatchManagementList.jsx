import {
  useState,
} from "react";

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
// 임시 매칭 데이터
//
// TODO:
// 백엔드 연결 후 실제 API 응답으로 교체
// ========================================
const SAMPLE_MATCHES = {

  received: [
    {
      clubMatchId: 1,
      opponentClubName: "신림 FC",
      sportName: "축구/풋살",
      matchDate: "2026-09-27",
      startTime: "19:00",
      endTime: "21:00",
      region: "관악구",
      locationName: "관악구민운동장",
      statusLabel: "승인 대기",
    },

    {
      clubMatchId: 2,
      opponentClubName: "봉천 풋살클럽",
      sportName: "축구/풋살",
      matchDate: "2026-09-29",
      startTime: "20:00",
      endTime: "22:00",
      region: "관악구",
      locationName: "신림체육센터",
      statusLabel: "승인 대기",
    },
  ],


  sent: [
    {
      clubMatchId: 3,
      opponentClubName: "서울 유나이티드",
      sportName: "축구/풋살",
      matchDate: "2026-09-28",
      startTime: "18:00",
      endTime: "20:00",
      region: "동작구",
      locationName: "노량진 축구장",
      statusLabel: "응답 대기",
    },
  ],


  upcoming: [
    {
      clubMatchId: 4,
      opponentClubName: "관악 위너스",
      sportName: "축구/풋살",
      matchDate: "2026-10-02",
      startTime: "19:00",
      endTime: "21:00",
      region: "관악구",
      locationName: "관악구민운동장",
      statusLabel: "경기 예정",
    },

    {
      clubMatchId: 5,
      opponentClubName: "신림 스타즈",
      sportName: "축구/풋살",
      matchDate: "2026-10-05",
      startTime: "20:00",
      endTime: "22:00",
      region: "관악구",
      locationName: "신림체육센터",
      statusLabel: "경기 예정",
    },
  ],


  history: [
    {
      clubMatchId: 6,
      opponentClubName: "봉천 FC",
      sportName: "축구/풋살",
      matchDate: "2026-09-20",
      startTime: "19:00",
      endTime: "21:00",
      region: "관악구",
      locationName: "관악구민운동장",

      // TODO:
      // 실제 백엔드 경기기록 상태값과
      // 나중에 맞춰서 교체
      recordStatus: "RECORD_REQUIRED",
    },

    {
      clubMatchId: 7,
      opponentClubName: "서울 킥커스",
      sportName: "축구/풋살",
      matchDate: "2026-09-18",
      startTime: "20:00",
      endTime: "22:00",
      region: "동작구",
      locationName: "노량진 축구장",
      recordStatus: "RECORD_PENDING",
    },

    {
      clubMatchId: 8,
      opponentClubName: "신림 유나이티드",
      sportName: "축구/풋살",
      matchDate: "2026-09-15",
      startTime: "19:00",
      endTime: "21:00",
      region: "관악구",
      locationName: "신림체육센터",
      recordStatus: "COMPLETED",
    },
  ],

  // ========================================
  // 내가 작성한 후기
  // ========================================
  writtenReviews: [
    {
      clubMatchId: 8,

      opponentClubName:
        "신림 유나이티드",

      sportName:
        "축구/풋살",

      matchDate:
        "2026-09-15",

      startTime:
        "19:00",

      endTime:
        "21:00",

      region:
        "관악구",

      locationName:
        "신림체육센터",

      statusLabel:
        "작성 완료",
    },
  ],


  // ========================================
  // 내가 받은 후기
  // ========================================
  receivedReviews: [
    {
      clubMatchId: 8,

      opponentClubName:
        "신림 유나이티드",

      sportName:
        "축구/풋살",

      matchDate:
        "2026-09-15",

      startTime:
        "19:00",

      endTime:
        "21:00",

      region:
        "관악구",

      locationName:
        "신림체육센터",

      statusLabel:
        "후기 도착",
    },
  ],

};


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
  // 현재 탭의 매칭 목록
  //
  // TODO:
  // 백엔드 연결 후 SAMPLE_MATCHES 대신
  // 실제 조회 결과 사용
  // ========================================
  const matches =
    SAMPLE_MATCHES[selectedTab] || [];

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
          const matchesStatus =
            selectedHistoryStatus === "all" ||
            match.recordStatus ===
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
            매칭 목록
        ======================================== */}
        <section className="match-management-match-list">

          {filteredMatches.length > 0 ? (

            filteredMatches.map(
              (match) => {

                // 지난 경기인 경우
                // 경기기록 상태를 사용한다.
                const historyStatus =
                  selectedTab === "history"
                    ? getHistoryStatus(
                        match.recordStatus
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