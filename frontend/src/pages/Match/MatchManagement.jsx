import { useNavigate, useParams } from "react-router-dom";

import {
  FiChevronRight,
  FiInbox,
  FiSend,
  FiCalendar,
  FiClock,
  FiEdit3,
  FiMessageCircle,
} from "react-icons/fi";

import BottomNav from "../../components/BottomNav";

import "./CSS/MatchManagement.css";


function MatchManagement() {

  const navigate = useNavigate();

  // 현재 운영 중인 동호회 ID
  const { clubId } = useParams();


  // ========================================
  // 임시 데이터
  // API 연결 전 화면 확인용
  // ========================================
  const summary = {
    received: 3,
    sent: 2,
    upcoming: 4,
    history: 7,
    // TODO: 백엔드 연결 후 실제 후기 개수로 교체
    writtenReviews: 4,
    receivedReviews: 3,
  };


  const recentMatches = [
    {
      clubMatchId: 1,

      type: "received",

      opponentClubName: "신림 FC",

      sportName: "축구/풋살",

      matchDate: "2026-09-27",

      startTime: "19:00",

      region: "관악구",
    },

    {
      clubMatchId: 2,

      type: "upcoming",

      opponentClubName: "봉천 풋살클럽",

      sportName: "축구/풋살",

      matchDate: "2026-09-30",

      startTime: "20:00",

      region: "관악구",
    },
  ];


  // ========================================
  // 목록 페이지 이동
  // ========================================
  const handleMoveList = (tab) => {

    navigate(
      `/clubs/${clubId}/matches/list?tab=${tab}`
    );
  };


  // ========================================
  // 매칭 상세 이동
  // ========================================
  const handleMatchDetail = (
    clubMatchId
  ) => {

    navigate(
      `/clubs/${clubId}/matches/${clubMatchId}`
    );
  };


  return (

    <div className="match-management-container">


      {/* ========================================
          상단
      ======================================== */}
      <header className="match-management-header">

        <button
          type="button"
          className="match-management-back-btn"
          onClick={() => navigate(-1)}
          aria-label="뒤로가기"
        >
          ‹
        </button>


        <h1>
          매칭 관리
        </h1>


        {/* 가운데 정렬을 위한 빈 공간 */}
        <div className="match-management-header-space" />

      </header>



      <main className="match-management-main">


        {/* ========================================
            현재 관리 중인 동호회
            나중에 API에서 club_name 연결
        ======================================== */}
        <section className="match-management-club">

          <span>
            운영 중인 동호회
          </span>

          <strong>
            사과좋아 풋살클럽
          </strong>

        </section>



        {/* ========================================
            매칭 현황
        ======================================== */}
        <section className="match-management-summary">

          <h2>
            매칭 현황
          </h2>


          <div className="match-management-summary-grid">


            {/* 받은 신청 */}
            <button
              type="button"
              className="match-management-summary-card"
              onClick={() =>
                handleMoveList(
                  "received"
                )
              }
            >

              <div className="match-management-summary-icon">
                <FiInbox />
              </div>

              <span>
                받은 신청
              </span>

              <strong>
                {summary.received}
              </strong>

            </button>



            {/* 보낸 신청 */}
            <button
              type="button"
              className="match-management-summary-card"
              onClick={() =>
                handleMoveList(
                  "sent"
                )
              }
            >

              <div className="match-management-summary-icon">
                <FiSend />
              </div>

              <span>
                보낸 신청
              </span>

              <strong>
                {summary.sent}
              </strong>

            </button>



            {/* 예정 경기 */}
            <button
              type="button"
              className="match-management-summary-card"
              onClick={() =>
                handleMoveList(
                  "upcoming"
                )
              }
            >

              <div className="match-management-summary-icon">
                <FiCalendar />
              </div>

              <span>
                예정 경기
              </span>

              <strong>
                {summary.upcoming}
              </strong>

            </button>



            {/* 지난 경기 */}
            <button
              type="button"
              className="match-management-summary-card"
              onClick={() =>
                handleMoveList(
                  "history"
                )
              }
            >

              <div className="match-management-summary-icon">
                <FiClock />
              </div>

              <span>
                지난 경기
              </span>

              <strong>
                {summary.history}
              </strong>

            </button>

            {/* ========================================
                내가 작성한 후기
            ======================================== */}
            <button
              type="button"
              className="match-management-summary-card"
              onClick={() =>
                handleMoveList(
                  "writtenReviews"
                )
              }
            >

              <div className="match-management-summary-icon">
                <FiEdit3 />
              </div>

              <span>
                작성한 후기
              </span>

              <strong>
                {summary.writtenReviews}
              </strong>

            </button>


            {/* ========================================
                내가 받은 후기
            ======================================== */}
            <button
              type="button"
              className="match-management-summary-card"
              onClick={() =>
                handleMoveList(
                  "receivedReviews"
                )
              }
            >

              <div className="match-management-summary-icon">
                <FiMessageCircle />
              </div>

              <span>
                받은 후기
              </span>

              <strong>
                {summary.receivedReviews}
              </strong>

            </button>


          </div>

        </section>



        {/* ========================================
            최근 매칭
        ======================================== */}
        <section className="match-management-recent">


          <div className="match-management-section-head">

            <h2>
              최근 매칭
            </h2>

          </div>



          <div className="match-management-recent-list">


            {recentMatches.map(
              (match) => (

                <button
                  key={
                    match.clubMatchId
                  }
                  type="button"
                  className="match-management-recent-card"
                  onClick={() =>
                    handleMatchDetail(
                      match.clubMatchId
                    )
                  }
                >

                  <div className="match-management-recent-content">


                    <div className="match-management-recent-top">

                      <strong>
                        {match.opponentClubName}
                      </strong>


                      <span
                        className={
                          `match-management-status ${match.type}`
                        }
                      >

                        {match.type ===
                        "received"
                          ? "받은 신청"
                          : "예정 경기"}

                      </span>

                    </div>


                    <div className="match-management-recent-info">

                      <span>
                        {match.sportName}
                      </span>

                      <span>
                        {match.matchDate}
                      </span>

                      <span>
                        {match.startTime}
                      </span>

                      <span>
                        {match.region}
                      </span>

                    </div>

                  </div>


                  <FiChevronRight />

                </button>

              )
            )}


          </div>

        </section>


      </main>


      <BottomNav />


    </div>

  );
}


export default MatchManagement;