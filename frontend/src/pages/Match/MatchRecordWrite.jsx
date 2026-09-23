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

import "./CSS/MatchRecordWrite.css";


// ========================================
// 임시 경기 데이터
//
// TODO:
// 백엔드 연결 후 clubMatchId로
// 경기 상세 데이터를 조회하도록 교체
// ========================================
const SAMPLE_MATCH = {
  myClubName: "사과좋아 풋살클럽",

  opponentClubName: "봉천 FC",

  sportName: "축구/풋살",

  matchDate: "2026-09-20",

  startTime: "19:00",
  endTime: "21:00",

  locationName: "관악구민운동장",

  region: "관악구",
};


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


function MatchRecordWrite() {

  const navigate = useNavigate();

  const {
    clubId,
    clubMatchId,
  } = useParams();


  // ========================================
  // 경기 점수
  // ========================================
  const [
    myScore,
    setMyScore,
  ] = useState("");


  const [
    opponentScore,
    setOpponentScore,
  ] = useState("");


  // ========================================
  // 숫자 점수 입력
  // ========================================
  const handleScoreChange = (
    value,
    setter
  ) => {

    // 숫자가 아닌 값 제거
    const numberValue =
      value.replace(
        /[^0-9]/g,
        ""
      );


    // 너무 큰 점수 입력 방지
    if (
      numberValue !== "" &&
      Number(numberValue) > 99
    ) {
      return;
    }


    setter(numberValue);
  };


  // ========================================
  // 경기 기록 제출
  // ========================================
  const handleSubmit = () => {

    if (
      myScore === "" ||
      opponentScore === ""
    ) {

      alert(
        "양 팀의 경기 점수를 모두 입력해주세요."
      );

      return;
    }


    const confirmed =
      window.confirm(
        `${SAMPLE_MATCH.myClubName} ${myScore} : ${opponentScore} ${SAMPLE_MATCH.opponentClubName}\n\n이 경기 기록으로 상대팀에게 확인을 요청하시겠습니까?`
      );


    if (!confirmed) {
      return;
    }


    // ========================================
    // TODO: 백엔드 연결
    //
    // 추후 전달할 값 예시:
    //
    // club_match_id
    // my_club_id
    // my_score
    // opponent_score
    //
    // 작성 사용자 ID는 프론트 입력값을
    // 신뢰하지 않고 JWT에서 확인하는 방향
    // ========================================

    alert(
      "경기 기록을 등록했습니다.\n상대팀 운영진의 확인을 기다립니다."
    );


    // 등록 후 해당 매칭 상세로 복귀
    navigate(
      -1
    );
  };


  return (

    <div className="match-record-write-container">


      {/* ========================================
          헤더
      ======================================== */}
      <header className="match-record-write-header">

        <button
          type="button"
          className="match-record-write-back"
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
          경기 기록 작성
        </h1>


        <div className="match-record-write-header-space" />

      </header>



      <main className="match-record-write-main">


        {/* ========================================
            경기 기본 정보
        ======================================== */}
        <section className="match-record-info-card">

          <span className="match-record-eyebrow">
            지난 경기
          </span>


          <h2>
            {SAMPLE_MATCH.myClubName}
            {" vs "}
            {SAMPLE_MATCH.opponentClubName}
          </h2>


          <div className="match-record-basic-info">

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
            점수 입력
        ======================================== */}
        <section className="match-record-score-section">

          <div className="match-record-section-title">

            <h2>
              경기 결과
            </h2>

            <p>
              실제 경기 결과를 입력해주세요.
            </p>

          </div>


          <div className="match-record-score-box">


            {/* 우리팀 */}
            <div className="match-record-team">

              <span>
                우리팀
              </span>

              <strong>
                {SAMPLE_MATCH.myClubName}
              </strong>


              <input
                type="text"
                inputMode="numeric"
                value={myScore}
                onChange={(event) =>
                  handleScoreChange(
                    event.target.value,
                    setMyScore
                  )
                }
                placeholder="0"
                aria-label="우리팀 점수"
              />

            </div>



            {/* 가운데 */}
            <div className="match-record-score-divider">
              :
            </div>



            {/* 상대팀 */}
            <div className="match-record-team">

              <span>
                상대팀
              </span>

              <strong>
                {SAMPLE_MATCH.opponentClubName}
              </strong>


              <input
                type="text"
                inputMode="numeric"
                value={opponentScore}
                onChange={(event) =>
                  handleScoreChange(
                    event.target.value,
                    setOpponentScore
                  )
                }
                placeholder="0"
                aria-label="상대팀 점수"
              />

            </div>


          </div>

        </section>



        {/* ========================================
            안내
        ======================================== */}
        <section className="match-record-notice">

          <strong>
            기록을 등록하면 상대팀의 확인이 필요합니다.
          </strong>

          <p>
            상대팀 운영진이 같은 경기 결과를 확인하면
            경기가 최종 완료 처리되고 경기 후기를 작성할 수 있습니다.
          </p>

        </section>


      </main>



      {/* ========================================
          하단 등록 버튼
      ======================================== */}
      <div className="match-record-write-actions">

        <button
          type="button"
          className="match-record-submit-btn"
          onClick={handleSubmit}
        >
          경기 완료 요청
        </button>

      </div>


      <BottomNav />


    </div>

  );
}


export default MatchRecordWrite;