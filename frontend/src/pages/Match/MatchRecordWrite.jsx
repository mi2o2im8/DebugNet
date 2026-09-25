import {
  useEffect,
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

import {
  getMatchManagementDetail,
  submitMatchResult,
} from "./api/matchApi";

import {
  getClubDashboard,
} from "../../api/clubApi";

import "./CSS/MatchRecordWrite.css";


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
  // 실제 경기 정보
  // ========================================
  const [
    match,
    setMatch,
  ] = useState(null);


  // 현재 관리 중인 우리 동호회 이름
  const [
    myClubName,
    setMyClubName,
  ] = useState("");


  // 조회 상태
  const [
    isLoading,
    setIsLoading,
  ] = useState(true);


  const [
    loadError,
    setLoadError,
  ] = useState("");


  // 제출 중 중복 클릭 방지
  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);


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
  // 경기 정보 조회
  //
  // 매칭 상세:
  // 상대팀 / 날짜 / 시간 / 장소 등
  //
  // 동호회 대시보드:
  // 현재 관리 중인 우리팀 이름
  // ========================================
  useEffect(() => {

    if (
      !clubId ||
      !clubMatchId
    ) {
      return;
    }


    const loadMatch = async () => {

      setIsLoading(true);
      setLoadError("");


      try {

        const [
          matchData,
          clubData,
        ] = await Promise.all([

          getMatchManagementDetail(
            clubId,
            clubMatchId
          ),

          getClubDashboard(
            clubId
          ),
        ]);


        setMatch(
          matchData
        );


        setMyClubName(
          clubData.club_name || "우리팀"
        );

      } catch (error) {

        console.error(
          "경기 기록 작성 정보 조회 실패:",
          error
        );


        setMatch(null);

        setLoadError(
          error.message ||
          "경기 정보를 불러오지 못했습니다."
        );

      } finally {

        setIsLoading(false);

      }

    };


    loadMatch();

  }, [
    clubId,
    clubMatchId,
  ]);


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
  const handleSubmit = async () => {

    if (
      myScore === "" ||
      opponentScore === ""
    ) {

      alert(
        "양 팀의 경기 점수를 모두 입력해주세요."
      );

      return;
    }


    if (
      !match ||
      isSubmitting
    ) {
      return;
    }


    const confirmed =
      window.confirm(
        `${myClubName} ${myScore} : ${opponentScore} ${match.opponentClubName}\n\n이 경기 기록으로 상대팀에게 확인을 요청하시겠습니까?`
      );


    if (!confirmed) {
      return;
    }


    setIsSubmitting(true);


    try {

      const response =
        await submitMatchResult(
          clubId,
          clubMatchId,
          {
            myScore,
            opponentScore,
          }
        );


      alert(
        response.message ||
        "경기 기록을 등록했습니다.\n상대팀 운영진의 확인을 기다립니다."
      );


      // 기존 상세 페이지로 돌아가기
      navigate(-1);

    } catch (error) {

      console.error(
        "경기 기록 등록 실패:",
        error
      );


      alert(
        error.message ||
        "경기 기록 등록에 실패했습니다."
      );

    } finally {

      setIsSubmitting(false);

    }
  };

  // ========================================
  // 로딩 중
  // ========================================
  if (isLoading) {

    return (

      <div className="match-record-write-container">

        <div className="match-record-notice">

          <strong>
            경기 정보를 불러오는 중입니다.
          </strong>

        </div>

      </div>

    );
  }


  // ========================================
  // 조회 실패
  // ========================================
  if (
    loadError ||
    !match
  ) {

    return (

      <div className="match-record-write-container">

        <header className="match-record-write-header">

          <button
            type="button"
            className="match-record-write-back"
            onClick={() =>
              navigate(-1)
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


        <div className="match-record-notice">

          <strong>
            경기 정보를 불러오지 못했습니다.
          </strong>

          <p>
            {loadError}
          </p>

        </div>

      </div>

    );
  }


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
            {myClubName}
            {" vs "}
            {match.opponentClubName}
          </h2>


          <div className="match-record-basic-info">

            <span>
              {match.sportName}
            </span>


            <span>
              <FiCalendar />

              {formatMatchDate(
                match.matchDate
              )}
            </span>


            <span>
              <FiClock />

              {match.startTime}
              {" ~ "}
              {match.endTime}
            </span>


            <span>
              <FiMapPin />

              {match.locationName}
              {" · "}
              {match.region}
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
                {myClubName}
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
                {match.opponentClubName}
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
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "등록 중..."
            : "경기 완료 요청"}
        </button>

      </div>


      <BottomNav />


    </div>

  );
}


export default MatchRecordWrite;