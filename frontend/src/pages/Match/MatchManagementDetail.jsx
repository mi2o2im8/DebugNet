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
  FiChevronRight,
  FiClock,
  FiMapPin,
  FiUsers,
} from "react-icons/fi";

import BottomNav from "../../components/BottomNav";

import {
  getMatchManagementDetail,
  approveMatchRequest,
  rejectMatchRequest,
  cancelSentMatchRequest,
  requestMatchCancellation,
  approveMatchCancellation,
  rejectMatchCancellation,
  submitMatchResult,
  approveMatchResult,
} from "./api/matchApi";

import "./CSS/MatchManagementDetail.css";





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


// ========================================
// 지난 경기 상태
// ========================================
const getRecordStatusLabel = (
  recordStatus,
  hasWrittenReview
) => {

  switch (recordStatus) {

    case "RECORD_REQUIRED":
      return "경기 기록 작성 필요";

    case "RECORD_PENDING":
      return "상대팀 확인 대기";

    case "RECORD_CONFIRM_REQUIRED":
      return "경기 기록 확인 필요";

    case "COMPLETED":

      return hasWrittenReview
        ? "후기 작성 완료"
        : "경기 완료";

    default:
      return "지난 경기";
  }
};


function MatchManagementDetail() {

  const navigate = useNavigate();

  const {
    clubId,
    clubMatchId,
  } = useParams();


  // ========================================
  // 실제 매칭 상세 데이터
  // ========================================
  const [
    match,
    setMatch,
  ] = useState(null);


  // 상세 조회 상태
  const [
    isLoading,
    setIsLoading,
  ] = useState(true);


  const [
    loadError,
    setLoadError,
  ] = useState("");


  // ========================================
  // 매칭 상세 조회
  // ========================================
  useEffect(() => {

    if (
      !clubId ||
      !clubMatchId
    ) {
      return;
    }


    const loadMatchDetail = async () => {

      setIsLoading(true);
      setLoadError("");


      try {

        const data =
          await getMatchManagementDetail(
            clubId,
            clubMatchId
          );


        setMatch(data);

      } catch (error) {

        console.error(
          "매칭 상세 조회 실패:",
          error
        );


        setMatch(null);

        setLoadError(
          error.message ||
          "매칭 정보를 불러오지 못했습니다."
        );

      } finally {

        setIsLoading(false);

      }

    };


    loadMatchDetail();

  }, [
    clubId,
    clubMatchId,
  ]);


  // ========================================
  // 경기 기록 수정
  // ========================================

  // 점수 수정 영역 표시 여부
  const [
    isRecordEditOpen,
    setIsRecordEditOpen,
  ] = useState(false);


  // 수정할 우리팀 점수
  const [
    editedMyScore,
    setEditedMyScore,
  ] = useState("");


  // 수정할 상대팀 점수
  const [
    editedOpponentScore,
    setEditedOpponentScore,
  ] = useState("");


  // ========================================
  // 상대 동호회 상세
  // ========================================
  const handleOpponentClub = () => {

    navigate(
      `/clubs/${match.opponentClubId}`
    );
  };


  // ========================================
  // 받은 신청 승인
  // ========================================
  const handleApprove = async () => {

    const confirmed =
      window.confirm(
        `${match.opponentClubName}의 매칭 신청을 승인하시겠습니까?`
      );

    if (!confirmed) {
      return;
    }


    try {

      const response =
        await approveMatchRequest(
          clubId,
          clubMatchId
        );


      alert(
        response.message ||
        "매칭 신청을 승인했습니다."
      );


      navigate(-1);

    } catch (error) {

      console.error(
        "매칭 승인 실패:",
        error
      );


      alert(
        error.message ||
        "매칭 승인에 실패했습니다."
      );

    }
  };

  // ========================================
  // 받은 신청 거절
  // ========================================
  const handleReject = async () => {

    const confirmed =
      window.confirm(
        `${match.opponentClubName}의 매칭 신청을 거절하시겠습니까?`
      );

    if (!confirmed) {
      return;
    }


    try {

      const response =
        await rejectMatchRequest(
          clubId,
          clubMatchId
        );


      alert(
        response.message ||
        "매칭 신청을 거절했습니다."
      );


      navigate(-1);

    } catch (error) {

      console.error(
        "매칭 거절 실패:",
        error
      );


      alert(
        error.message ||
        "매칭 거절에 실패했습니다."
      );

    }
  };

  // ========================================
  // 내가 보낸 매칭 신청 취소
  // ========================================
  const handleCancelSentRequest = async () => {

    const confirmed =
      window.confirm(
        `${match.opponentClubName}에게 보낸 매칭 신청을 취소하시겠습니까?`
      );

    if (!confirmed) {
      return;
    }


    try {

      const response =
        await cancelSentMatchRequest(
          clubId,
          clubMatchId
        );


      alert(
        response.message ||
        "매칭 신청을 취소했습니다."
      );


      navigate(-1);

    } catch (error) {

      console.error(
        "매칭 신청 취소 실패:",
        error
      );


      alert(
        error.message ||
        "매칭 신청 취소에 실패했습니다."
      );

    }
  };


  // ========================================
  // 확정된 경기 취소 요청
  // ========================================
  const handleCancelMatchRequest = async () => {

    const confirmed =
      window.confirm(
        `${match.opponentClubName}와의 확정된 경기를 취소 요청하시겠습니까?\n\n상대팀이 취소 요청을 확인해야 최종 취소됩니다.`
      );

    if (!confirmed) {
      return;
    }


    try {

      const response =
        await requestMatchCancellation(
          clubId,
          clubMatchId
        );


      setMatch((prev) => ({
        ...prev,

        status:
          response.status ||
          prev.status,

        statusLabel:
          "경기 취소 요청 중",

        isCancelRequestSent:
          true,

        isCancelRequestReceived:
          false,
      }));


      alert(
        response.message ||
        "경기 취소를 요청했습니다."
      );

    } catch (error) {

      console.error(
        "경기 취소 요청 실패:",
        error
      );


      alert(
        error.message ||
        "경기 취소 요청에 실패했습니다."
      );

    }
  };

  // ========================================
  // 상대팀 경기 취소 요청 승인
  // ========================================
  const handleApproveCancellation = async () => {

    const confirmed =
      window.confirm(
        `${match.opponentClubName}의 경기 취소 요청을 승인하시겠습니까?\n\n승인하면 경기가 최종 취소됩니다.`
      );

    if (!confirmed) {
      return;
    }


    try {

      const response =
        await approveMatchCancellation(
          clubId,
          clubMatchId
        );


      alert(
        response.message ||
        "경기가 취소되었습니다."
      );


      navigate(-1);

    } catch (error) {

      console.error(
        "경기 취소 승인 실패:",
        error
      );


      alert(
        error.message ||
        "경기 취소 승인에 실패했습니다."
      );

    }
  };


  // ========================================
  // 상대팀 경기 취소 요청 거절
  // ========================================
  const handleRejectCancellation = async () => {

    const confirmed =
      window.confirm(
        `${match.opponentClubName}의 경기 취소 요청을 거절하시겠습니까?`
      );

    if (!confirmed) {
      return;
    }


    try {

      const response =
        await rejectMatchCancellation(
          clubId,
          clubMatchId
        );


      setMatch((prev) => ({
        ...prev,

        status:
          response.status ||
          "approved",

        statusLabel:
          "경기 예정",

        isCancelRequestSent:
          false,

        isCancelRequestReceived:
          false,
      }));


      alert(
        response.message ||
        "경기 취소 요청을 거절했습니다."
      );

    } catch (error) {

      console.error(
        "경기 취소 요청 거절 실패:",
        error
      );


      alert(
        error.message ||
        "경기 취소 요청 거절에 실패했습니다."
      );

    }
  };


  // ========================================
  // 경기 기록 작성
  // ========================================
  const handleWriteRecord = () => {

    navigate(
      `/clubs/${clubId}/matches/${clubMatchId}/record`
    );
  };


  // ========================================
  // 경기 후기 작성
  // ========================================
  const handleWriteReview = () => {

    navigate(
      `/clubs/${clubId}/matches/${clubMatchId}/review`
    );
  };

  // ========================================
  // 경기 후기 조회
  //
  // type
  // written  = 내가 작성한 후기
  // received = 내가 받은 후기
  // ========================================
  const handleViewReview = (type) => {

    navigate(
      `/clubs/${clubId}/matches/${clubMatchId}/review-detail?type=${type}`
    );
  };

  // ========================================
  // 상대팀이 작성한 경기 기록 승인
  // ========================================
  const handleApproveRecord = async () => {

    const confirmed =
      window.confirm(
        `${match.myScore} : ${match.opponentScore} 경기 기록이 맞습니까?`
      );

    if (!confirmed) {
      return;
    }


    try {

      const response =
        await approveMatchResult(
          clubId,
          clubMatchId
        );


      setMatch((prev) => ({
        ...prev,

        myScore:
          response.my_score,

        opponentScore:
          response.opponent_score,

        recordStatus:
          response.record_status,
      }));


      alert(
        response.message ||
        "경기 기록을 승인했습니다."
      );

    } catch (error) {

      console.error(
        "경기 기록 승인 실패:",
        error
      );


      alert(
        error.message ||
        "경기 기록 승인에 실패했습니다."
      );

    }
  };


  // ========================================
  // 상대팀이 작성한 경기 기록이 다를 때
  // 수정 입력창 열기
  // ========================================
  const handleDisagreeRecord = () => {

    // 현재 상대팀이 작성한 점수를
    // 수정 입력칸의 초기값으로 넣는다.
    setEditedMyScore(
      String(match.myScore ?? "")
    );

    setEditedOpponentScore(
      String(match.opponentScore ?? "")
    );

    setIsRecordEditOpen(true);
  };


  // ========================================
  // 수정 점수 입력
  // 숫자만 입력 가능
  // ========================================
  const handleRecordScoreChange = (
    value,
    setter
  ) => {

    const numberValue =
      value.replace(
        /[^0-9]/g,
        ""
      );

    if (
      numberValue !== "" &&
      Number(numberValue) > 99
    ) {
      return;
    }

    setter(numberValue);
  };


  // ========================================
  // 경기 기록 수정 취소
  // ========================================
  const handleCancelRecordEdit = () => {

    setIsRecordEditOpen(false);

    setEditedMyScore("");
    setEditedOpponentScore("");
  };


  // ========================================
  // 수정한 경기 기록 재확인 요청
  // ========================================
  const handleSubmitCorrectedRecord = async () => {

    if (
      editedMyScore === "" ||
      editedOpponentScore === ""
    ) {

      alert(
        "양 팀의 경기 점수를 모두 입력해주세요."
      );

      return;
    }


    const confirmed =
      window.confirm(
        `${editedMyScore} : ${editedOpponentScore} 기록으로 상대팀에게 다시 확인 요청하시겠습니까?`
      );

    if (!confirmed) {
      return;
    }


    try {

      const response =
        await submitMatchResult(
          clubId,
          clubMatchId,
          {
            myScore:
              editedMyScore,

            opponentScore:
              editedOpponentScore,
          }
        );


      setIsRecordEditOpen(false);

      setEditedMyScore("");
      setEditedOpponentScore("");


      setMatch((prev) => ({
        ...prev,

        myScore:
          response.my_score,

        opponentScore:
          response.opponent_score,

        recordStatus:
          response.record_status,
      }));


      alert(
        response.message ||
        "수정한 경기 기록을 상대팀에게 보냈습니다."
      );

    } catch (error) {

      console.error(
        "경기 기록 재제출 실패:",
        error
      );


      alert(
        error.message ||
        "경기 기록 재제출에 실패했습니다."
      );

    }
  };


  // ========================================
  // 로딩 중
  // ========================================
  if (isLoading) {

    return (

      <div className="match-management-detail-container">

        <div className="match-management-detail-empty">

          매칭 정보를 불러오는 중입니다.

        </div>

      </div>

    );
  }


  // ========================================
  // 조회 실패 / 데이터 없음
  // ========================================
  if (
    loadError ||
    !match
  ) {

    return (

      <div className="match-management-detail-container">

        <header className="match-management-detail-header">

          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
            aria-label="뒤로가기"
          >
            ‹
          </button>

          <h1>
            매칭 상세
          </h1>

          <div />

        </header>


        <div className="match-management-detail-empty">

          {loadError ||
            "매칭 정보를 찾을 수 없습니다."}

        </div>

      </div>

    );
  }


  return (

    <div className="match-management-detail-container">


      {/* ========================================
          헤더
      ======================================== */}
      <header className="match-management-detail-header">

        <button
          type="button"
          className="match-management-detail-back"
          onClick={() => navigate(-1)}
          aria-label="뒤로가기"
        >
          ‹
        </button>


        <h1>
          매칭 상세
        </h1>


        <div className="match-management-detail-header-space" />

      </header>



      <main className="match-management-detail-main">


        {/* ========================================
            상대 동호회
        ======================================== */}
        <button
          type="button"
          className="match-management-opponent"
          onClick={handleOpponentClub}
        >

          <div className="match-management-opponent-profile">

            {match.opponentClubProfileImage ? (

              <img
                src={
                  match.opponentClubProfileImage
                }
                alt={`${match.opponentClubName} 프로필`}
              />

            ) : (

              <span>
                {match.opponentClubName.charAt(0)}
              </span>

            )}

          </div>


          <div className="match-management-opponent-info">

            <span>
              상대 동호회
            </span>

            <strong>
              {match.opponentClubName}
            </strong>

          </div>


          <FiChevronRight />

        </button>



        {/* ========================================
            상태
        ======================================== */}
        <section className="match-management-detail-status">

          <span>
            현재 상태
          </span>

          <strong>

            {match.type === "history"
              ? getRecordStatusLabel(
                  match.recordStatus,
                  match.hasWrittenReview
                )
              : match.statusLabel}

          </strong>

        </section>



        {/* ========================================
            경기 정보
        ======================================== */}
        <section className="match-management-detail-section">

          <h2>
            경기 정보
          </h2>


          <div className="match-management-detail-info-list">


            <div className="match-management-detail-info-row">

              <span>
                종목
              </span>

              <strong>
                {match.sportName}
              </strong>

            </div>


            <div className="match-management-detail-info-row">

              <span>
                <FiCalendar />
                날짜
              </span>

              <strong>
                {formatMatchDate(
                  match.matchDate
                )}
              </strong>

            </div>


            <div className="match-management-detail-info-row">

              <span>
                <FiClock />
                시간
              </span>

              <strong>
                {match.startTime}
                {" ~ "}
                {match.endTime}
              </strong>

            </div>


            <div className="match-management-detail-info-row">

              <span>
                <FiMapPin />
                장소
              </span>

              <strong>
                {match.locationName}
              </strong>

            </div>


            <div className="match-management-detail-info-row">

              <span>
                지역
              </span>

              <strong>
                {match.region}
              </strong>

            </div>


            <div className="match-management-detail-info-row">

              <span>
                주소
              </span>

              <strong>
                {match.address}
              </strong>

            </div>

          </div>

        </section>



        {/* ========================================
            매칭 조건
        ======================================== */}
        <section className="match-management-detail-section">

          <h2>
            매칭 조건
          </h2>


          <div className="match-management-detail-info-list">


            <div className="match-management-detail-info-row">

              <span>
                실력
              </span>

              <strong>
                {match.skillLevel}
              </strong>

            </div>


            <div className="match-management-detail-info-row">

              <span>
                <FiUsers />
                필요 인원
              </span>

              <strong>
                {match.requiredPlayers}명
              </strong>

            </div>


            <div className="match-management-detail-info-row">

              <span>
                경기장
              </span>

              <strong>
                {match.venueType}
              </strong>

            </div>


            <div className="match-management-detail-info-row">

              <span>
                주차
              </span>

              <strong>
                {match.parkingAvailable
                  ? "가능"
                  : "불가"}
              </strong>

            </div>

          </div>

        </section>



        {/* ========================================
            한 줄 소개
        ======================================== */}
        {match.intro && (

          <section className="match-management-detail-section">

            <h2>
              매칭 소개
            </h2>

            <p className="match-management-detail-intro">
              {match.intro}
            </p>

          </section>

        )}



        {/* ========================================
            작성된 경기 기록

            상대팀 확인이 필요한 상태에서도
            점수를 먼저 확인할 수 있도록 표시
        ======================================== */}
        {match.type === "history" &&
          (
            match.recordStatus ===
              "RECORD_CONFIRM_REQUIRED" ||
            match.recordStatus ===
              "COMPLETED"
          ) && (

            <section className="match-management-detail-section">

              <h2>
                경기 기록
              </h2>


              <div className="match-management-score">

                <div>

                  <span>
                    우리팀
                  </span>

                  <strong>
                    {match.myScore}
                  </strong>

                </div>


                <span className="match-management-score-divider">
                  :
                </span>


                <div>

                  <span>
                    {match.opponentClubName}
                  </span>

                  <strong>
                    {match.opponentScore}
                  </strong>

                </div>

              </div>

              {/* ========================================
                  경기 기록 수정
              ======================================== */}
              {match.recordStatus ===
                  "RECORD_CONFIRM_REQUIRED" &&
                isRecordEditOpen && (

                  <div className="match-management-record-edit">

                    <div className="match-management-record-edit-title">

                      <strong>
                        실제 경기 결과를 입력해주세요.
                      </strong>

                      <span>
                        수정한 기록은 상대팀에게 다시 확인 요청됩니다.
                      </span>

                    </div>


                    <div className="match-management-record-edit-score">

                      {/* 우리팀 */}
                      <div>

                        <span>
                          우리팀
                        </span>

                        <input
                          type="text"
                          inputMode="numeric"
                          value={editedMyScore}
                          onChange={(event) =>
                            handleRecordScoreChange(
                              event.target.value,
                              setEditedMyScore
                            )
                          }
                          placeholder="0"
                          aria-label="수정할 우리팀 점수"
                        />

                      </div>


                      <strong>
                        :
                      </strong>


                      {/* 상대팀 */}
                      <div>

                        <span>
                          {match.opponentClubName}
                        </span>

                        <input
                          type="text"
                          inputMode="numeric"
                          value={editedOpponentScore}
                          onChange={(event) =>
                            handleRecordScoreChange(
                              event.target.value,
                              setEditedOpponentScore
                            )
                          }
                          placeholder="0"
                          aria-label="수정할 상대팀 점수"
                        />

                      </div>

                    </div>

                  </div>

              )}

            </section>

          )}

          {/* ========================================
              경기 후기

              경기가 완료된 뒤부터 표시
          ======================================== */}
          {match.type === "history" &&
            
              match.recordStatus === "COMPLETED" && (

              <section className="match-management-detail-section">

                <h2>
                  경기 후기
                </h2>


                <div className="match-management-review-menu">


                  {/* ========================================
                      내가 작성한 후기
                  ======================================== */}
                  {match.hasWrittenReview ? (

                    <button
                      type="button"
                      className="match-management-review-link"
                      onClick={() =>
                        handleViewReview(
                          "written"
                        )
                      }
                    >

                      <div>

                        <strong>
                          내가 작성한 후기
                        </strong>

                        <span>
                          상대팀에게 남긴 평가를 확인합니다.
                        </span>

                      </div>

                      <FiChevronRight />

                    </button>

                  ) : (

                    <button
                      type="button"
                      className="match-management-review-link"
                      onClick={handleWriteReview}
                    >

                      <div>

                        <strong>
                          경기 후기 작성
                        </strong>

                        <span>
                          상대팀과의 경기 경험을 평가해주세요.
                        </span>

                      </div>

                      <FiChevronRight />

                    </button>

                  )}



                  {/* ========================================
                      내가 받은 후기
                  ======================================== */}
                  {match.hasReceivedReview ? (

                    <button
                      type="button"
                      className="match-management-review-link"
                      onClick={() =>
                        handleViewReview(
                          "received"
                        )
                      }
                    >

                      <div>

                        <strong>
                          내가 받은 후기
                        </strong>

                        <span>
                          상대팀이 우리팀에 남긴 평가를 확인합니다.
                        </span>

                      </div>

                      <FiChevronRight />

                    </button>

                  ) : (

                    <div className="match-management-review-empty">

                      <div>

                        <strong>
                          내가 받은 후기
                        </strong>

                        <span>
                          상대팀이 아직 후기를 작성하지 않았습니다.
                        </span>

                      </div>

                    </div>

                  )}


                </div>

              </section>

          )}


      </main>



      {/* ========================================
          하단 액션
      ======================================== */}

      {(
        match.type === "received" ||
        match.type === "sent" ||
        match.type === "upcoming" ||

        (
          match.type === "history" &&
          (
            match.recordStatus === "RECORD_REQUIRED" ||
            match.recordStatus === "RECORD_PENDING" ||
            match.recordStatus === "RECORD_CONFIRM_REQUIRED"
          )
        )
      ) && (
      <div className="match-management-detail-actions">


        {/* 받은 신청 */}
        {match.type === "received" && (
          <>

            <button
              type="button"
              className="match-management-reject-btn"
              onClick={handleReject}
            >
              거절
            </button>


            <button
              type="button"
              className="match-management-primary-btn"
              onClick={handleApprove}
            >
              매칭 승인
            </button>

          </>
        )}


        {/* ========================================
            보낸 신청
            상대팀 응답 전에는 신청 취소 가능
        ======================================== */}
        {match.type === "sent" && (

          <button
            type="button"
            className="match-management-cancel-request-btn"
            onClick={handleCancelSentRequest}
          >
            매칭 신청 취소
          </button>

        )}


        {/* ========================================
            예정 경기
            확정된 경기는 취소 요청 가능
        ======================================== */}
        {match.type === "upcoming" && (

          match.isCancelRequestReceived ? (

            <>
              <button
                type="button"
                className="match-management-reject-btn"
                onClick={handleRejectCancellation}
              >
                취소 요청 거절
              </button>


              <button
                type="button"
                className="match-management-primary-btn"
                onClick={handleApproveCancellation}
              >
                경기 취소 승인
              </button>
            </>

          ) : match.isCancelRequestSent ? (

            <div className="match-management-waiting">

              상대팀의 경기 취소 확인을 기다리고 있습니다.

            </div>

          ) : (

            <button
              type="button"
              className="match-management-cancel-request-btn"
              onClick={handleCancelMatchRequest}
            >
              경기 취소 요청
            </button>

          )

        )}


        {/* 지난 경기 - 기록 작성 필요 */}
        {match.type === "history" &&
          match.recordStatus ===
            "RECORD_REQUIRED" && (

            <button
              type="button"
              className="match-management-primary-btn full"
              onClick={handleWriteRecord}
            >
              경기 기록 작성
            </button>

          )}


        {/* 지난 경기 - 상대팀 확인 대기 */}
        {match.type === "history" &&
          match.recordStatus ===
            "RECORD_PENDING" && (

            <div className="match-management-waiting">

              상대팀의 경기 기록 확인을 기다리고 있습니다.

            </div>

          )}


        {/* ========================================
            지난 경기 - 경기 기록 확인/수정
        ======================================== */}
        {match.type === "history" &&
          match.recordStatus ===
            "RECORD_CONFIRM_REQUIRED" && (

          isRecordEditOpen ? (

            /* 점수 수정 중 */
            <>

              <button
                type="button"
                className="match-management-reject-btn"
                onClick={handleCancelRecordEdit}
              >
                취소
              </button>


              <button
                type="button"
                className="match-management-primary-btn"
                onClick={handleSubmitCorrectedRecord}
              >
                수정 기록 보내기
              </button>

            </>

          ) : (

            /* 처음 기록을 확인하는 상태 */
            <>

              <button
                type="button"
                className="match-management-reject-btn"
                onClick={handleDisagreeRecord}
              >
                기록이 달라요
              </button>


              <button
                type="button"
                className="match-management-primary-btn"
                onClick={handleApproveRecord}
              >
                기록 승인
              </button>

            </>

          )

        )}


      </div>
    )}


      <BottomNav />


    </div>

  );
}


export default MatchManagementDetail;