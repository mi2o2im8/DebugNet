import { useNavigate, useParams } from "react-router-dom";
import {
  useEffect,
  useState,
} from "react";
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

import {
  getMatchManagementSummary,
  getMatchManagementMatches,
} from "./api/matchApi";

import {
  getClubDashboard,
} from "../../api/clubApi";

import "./CSS/MatchManagement.css";


function MatchManagement() {

  const navigate = useNavigate();

  // 현재 운영 중인 동호회 ID
  const { clubId } = useParams();

  // ========================================
  // 매칭관리 실제 데이터
  // ========================================

  // 운영 중인 동호회 이름
  const [
    clubName,
    setClubName,
  ] = useState("");


  // 매칭관리 요약 개수
  const [
    summary,
    setSummary,
  ] = useState({
    received: 0,
    sent: 0,
    upcoming: 0,
    history: 0,
    writtenReviews: 0,
    receivedReviews: 0,
  });


  // 최근 매칭
  const [
    recentMatches,
    setRecentMatches,
  ] = useState([]);

  // ========================================
  // 매칭관리 메인 데이터 조회
  // ========================================
  useEffect(() => {

    if (!clubId) {
      return;
    }


    const loadMatchManagement = async () => {

      try {

        // ----------------------------------------
        // 매칭관리 요약 / 받은 신청 / 예정 경기 /
        // 운영 중인 동호회 정보를 동시에 조회
        // ----------------------------------------
        const [
          summaryData,
          receivedData,
          upcomingData,
          dashboardData,
        ] = await Promise.all([

          getMatchManagementSummary(
            clubId
          ),

          getMatchManagementMatches(
            clubId,
            "received"
          ),

          getMatchManagementMatches(
            clubId,
            "upcoming"
          ),

          getClubDashboard(
            clubId
          ),
        ]);


        // 매칭관리 개수
        setSummary(
          summaryData
        );


        // 운영 중인 동호회 이름
        setClubName(
          dashboardData.club_name || ""
        );


        // ----------------------------------------
        // 기존 화면의 최근 매칭은
        // 받은 신청 + 예정 경기로 구성
        // ----------------------------------------
        const receivedMatches =
          receivedData.items.map(
            (match) => ({
              ...match,
              type: "received",
            })
          );


        const upcomingMatches =
          upcomingData.items.map(
            (match) => ({
              ...match,
              type: "upcoming",
            })
          );


        // 날짜/시간이 가까운 순서
        const mergedMatches = [
          ...receivedMatches,
          ...upcomingMatches,
        ]
          .sort((a, b) => {

            const aDate =
              `${a.matchDate} ${a.startTime || ""}`;

            const bDate =
              `${b.matchDate} ${b.startTime || ""}`;

            return aDate.localeCompare(
              bDate
            );

          })
          .slice(0, 2);


        setRecentMatches(
          mergedMatches
        );

      } catch (error) {

        console.error(
          "매칭관리 메인 조회 실패:",
          error
        );

      }

    };


    loadMatchManagement();

  }, [clubId]);




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
        ======================================== */}
        <section className="match-management-club">

          <span>
            운영 중인 동호회
          </span>

          <strong>
            {clubName || "동호회"}
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