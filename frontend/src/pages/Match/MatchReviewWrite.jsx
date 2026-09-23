import {
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  FiCalendar,
  FiClock,
  FiMapPin,
} from "react-icons/fi";

import BottomNav from "../../components/BottomNav";

import "./CSS/MatchReview.css";


// ========================================
// 임시 경기 데이터
//
// TODO:
// 백엔드 연결 후 clubMatchId로
// 실제 완료 경기 데이터를 조회하도록 교체
// ========================================
const SAMPLE_MATCH = {
  myClubName: "사과좋아 풋살클럽",

  opponentClubId: 28,
  opponentClubName: "신림 유나이티드",
  opponentClubProfileImage: "",

  sportName: "축구/풋살",

  matchDate: "2026-09-15",

  startTime: "19:00",
  endTime: "21:00",

  locationName: "신림체육센터",

  region: "관악구",

  myScore: 3,
  opponentScore: 2,
};


// ========================================
// 후기 평가 항목
// ========================================
const REVIEW_ITEMS = [
  {
    id: "manner",
    label: "매너",
    description:
      "상대팀 선수들의 경기 매너는 어땠나요?",
  },

  {
    id: "punctuality",
    label: "시간 준수",
    description:
      "약속한 경기 시간을 잘 지켰나요?",
  },

  {
    id: "rosterAccuracy",
    label: "인원 일치",
    description:
      "사전에 약속한 인원과 실제 참가 인원이 잘 맞았나요?",
  },

  {
    id: "safety",
    label: "안전한 경기",
    description:
      "과격한 행동 없이 안전하게 경기를 진행했나요?",
  },

  {
    id: "gameFlow",
    label: "경기 진행",
    description:
      "경기 진행과 의사소통이 원활했나요?",
  },

  {
    id: "rematch",
    label: "재경기 의사",
    description:
      "다음에도 이 팀과 경기하고 싶나요?",
  },
];


// ========================================
// 날짜 표시
// ========================================
const formatMatchDate = (dateString) => {

  if (!dateString) {
    return "";
  }

  const [
    year,
    month,
    day,
  ] = dateString.split("-");

  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
};


function MatchReviewWrite() {

  const navigate = useNavigate();

  const {
    clubId,
    clubMatchId,
  } = useParams();


  // ========================================
  // 후기 점수
  // ========================================
  const [
    ratings,
    setRatings,
  ] = useState({
    manner: 0,
    punctuality: 0,
    rosterAccuracy: 0,
    safety: 0,
    gameFlow: 0,
    rematch: 0,
  });

  // ========================================
  // 직접 작성하는 경기 후기
  // 선택사항
  // ========================================
  const [
    reviewContent,
    setReviewContent,
  ] = useState("");


  // ========================================
  // 평가 선택
  // ========================================
  const handleRatingChange = (
    itemId,
    score
  ) => {

    setRatings(
      (previous) => ({
        ...previous,
        [itemId]: score,
      })
    );
  };


  // ========================================
  // 모든 항목 평가 여부
  // ========================================
  const isAllRated =
    Object.values(
      ratings
    ).every(
      (score) => score > 0
    );


  // ========================================
  // 후기 등록
  // ========================================
  const handleSubmit = () => {

    if (!isAllRated) {

      alert(
        "모든 평가 항목을 선택해주세요."
      );

      return;
    }


    const confirmed =
      window.confirm(
        `${SAMPLE_MATCH.opponentClubName}에 대한 경기 후기를 등록하시겠습니까?`
      );


    if (!confirmed) {
      return;
    }


    // ========================================
    // TODO: 백엔드 연결
    //
    // 추후 전송 예정 값
    //
    // club_match_id
    // reviewer_club_id
    //
    // manner_score
    // punctuality_score
    // roster_accuracy_score
    // safety_score
    // game_flow_score
    // rematch_score
    // content (선택)
    //
    // reviewer_user_id는
    // JWT 로그인 사용자 기준으로
    // 백엔드에서 결정
    // ========================================

    console.log(
      "경기 후기:",
      {
        ...ratings,

        // 직접 작성 후기는 선택사항
        // 작성하지 않았으면 null 처리
        content:
          reviewContent.trim() ||
          null,
      }
    );


    alert(
      "경기 후기가 등록되었습니다."
    );


    // 후기 작성 후
    // 해당 매칭 상세로 이동
    navigate(
      -1
    );
  };


  return (

    <div className="match-review-container">


      {/* ========================================
          헤더
      ======================================== */}
      <header className="match-review-header">

        <button
          type="button"
          className="match-review-back"
          onClick={() =>
            navigate(
              -1
            )
          }
          aria-label="뒤로가기"
        >
          ‹
        </button>


        <h1>
          경기 후기
        </h1>


        <div className="match-review-header-space" />

      </header>



      <main className="match-review-main">


        {/* ========================================
            상대 동호회
        ======================================== */}
        <section className="match-review-opponent">

          <div className="match-review-opponent-profile">

            {SAMPLE_MATCH.opponentClubProfileImage ? (

              <img
                src={
                  SAMPLE_MATCH.opponentClubProfileImage
                }
                alt={`${SAMPLE_MATCH.opponentClubName} 프로필`}
              />

            ) : (

              <span>
                {SAMPLE_MATCH.opponentClubName.charAt(0)}
              </span>

            )}

          </div>


          <div className="match-review-opponent-info">

            <span>
              상대 동호회
            </span>

            <strong>
              {SAMPLE_MATCH.opponentClubName}
            </strong>

          </div>

        </section>



        {/* ========================================
            경기 정보
        ======================================== */}
        <section className="match-review-match-card">

          <div className="match-review-score">

            <div>
              <span>
                {SAMPLE_MATCH.myClubName}
              </span>

              <strong>
                {SAMPLE_MATCH.myScore}
              </strong>
            </div>


            <span className="match-review-score-divider">
              :
            </span>


            <div>
              <span>
                {SAMPLE_MATCH.opponentClubName}
              </span>

              <strong>
                {SAMPLE_MATCH.opponentScore}
              </strong>
            </div>

          </div>


          <div className="match-review-match-info">

            <span>
              {SAMPLE_MATCH.sportName}
            </span>


            <span>
              <FiCalendar />

              {formatMatchDate(
                SAMPLE_MATCH.matchDate
              )}
            </span>


            <span>
              <FiClock />

              {SAMPLE_MATCH.startTime}
              {" ~ "}
              {SAMPLE_MATCH.endTime}
            </span>


            <span>
              <FiMapPin />

              {SAMPLE_MATCH.locationName}
              {" · "}
              {SAMPLE_MATCH.region}
            </span>

          </div>

        </section>



        {/* ========================================
            평가 제목
        ======================================== */}
        <div className="match-review-title">

          <h2>
            경기는 어떠셨나요?
          </h2>

          <p>
            상대팀과의 경기 경험을 평가해주세요.
          </p>

        </div>



        {/* ========================================
            6개 평가 항목
        ======================================== */}
        <section className="match-review-rating-list">

          {REVIEW_ITEMS.map(
            (item) => (

              <div
                key={item.id}
                className="match-review-rating-item"
              >

                <div className="match-review-rating-text">

                  <strong>
                    {item.label}
                  </strong>

                  <p>
                    {item.description}
                  </p>

                </div>


                {/* 1 ~ 5점 */}
                <div className="match-review-rating-buttons">

                  {[1, 2, 3, 4, 5].map(
                    (score) => (

                      <button
                        key={score}
                        type="button"
                        className={
                          ratings[item.id] === score
                            ? "active"
                            : ""
                        }
                        onClick={() =>
                          handleRatingChange(
                            item.id,
                            score
                          )
                        }
                        aria-label={`${item.label} ${score}점`}
                      >
                        {score}
                      </button>

                    )
                  )}

                </div>

              </div>

            )
          )}

        </section>


        {/* ========================================
            직접 작성하는 후기
            선택사항
        ======================================== */}
        <section className="match-review-content-section">

          <div className="match-review-content-title">

            <h2>
              직접 후기를 남겨주세요
            </h2>

            <span>
              선택
            </span>

          </div>


          <p className="match-review-content-description">
            상대팀과 경기하며 느낀 점을 자유롭게 작성해주세요.
          </p>


          <textarea
            value={reviewContent}
            onChange={(event) =>
              setReviewContent(
                event.target.value.slice(
                  0,
                  300
                )
              )
            }
            maxLength={300}
            placeholder="예) 매너가 좋고 경기 진행도 원활했습니다."
          />


          <div className="match-review-content-count">
            {reviewContent.length} / 300
          </div>

        </section>



        {/* ========================================
            안내
        ======================================== */}
        <section className="match-review-notice">

          <strong>
            후기는 상대팀의 신뢰도에 활용됩니다.
          </strong>

          <p>
            실제 경기 경험을 기준으로 평가해주세요.
          </p>

        </section>


      </main>



      {/* ========================================
          하단 등록 버튼
      ======================================== */}
      <div className="match-review-actions">

        <button
          type="button"
          className="match-review-submit"
          onClick={handleSubmit}
          disabled={!isAllRated}
        >
          후기 등록하기
        </button>

      </div>


      <BottomNav />


    </div>

  );
}


export default MatchReviewWrite;