import {
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

import "./CSS/MatchManagementDetail.css";


// ========================================
// 임시 상세 데이터
//
// TODO:
// 백엔드 연결 후 clubMatchId를 이용한
// 실제 매칭 상세 조회 API로 교체
// ========================================
const SAMPLE_MATCH_DETAILS = {

  1: {
    clubMatchId: 1,

    type: "received",

    opponentClubId: 21,
    opponentClubName: "신림 FC",
    opponentClubProfileImage: "",

    sportName: "축구/풋살",

    matchDate: "2026-09-27",

    startTime: "19:00",
    endTime: "21:00",

    region: "관악구",

    locationName: "관악구민운동장",
    address: "서울 관악구",

    skillLevel: "중급",

    requiredPlayers: 8,

    venueType: "실외",

    parkingAvailable: true,

    intro:
      "즐겁게 경기하실 팀을 찾고 있습니다.",

    statusLabel: "승인 대기",
  },


  2: {
    clubMatchId: 2,

    type: "received",

    opponentClubId: 22,
    opponentClubName: "봉천 풋살클럽",
    opponentClubProfileImage: "",

    sportName: "축구/풋살",

    matchDate: "2026-09-29",

    startTime: "20:00",
    endTime: "22:00",

    region: "관악구",

    locationName: "신림체육센터",
    address: "서울 관악구",

    skillLevel: "중급",

    requiredPlayers: 10,

    venueType: "실내",

    parkingAvailable: false,

    intro:
      "매너 있는 경기 원합니다.",

    statusLabel: "승인 대기",
  },


  3: {
    clubMatchId: 3,

    type: "sent",

    opponentClubId: 23,
    opponentClubName: "서울 유나이티드",
    opponentClubProfileImage: "",

    sportName: "축구/풋살",

    matchDate: "2026-09-28",

    startTime: "18:00",
    endTime: "20:00",

    region: "동작구",

    locationName: "노량진 축구장",
    address: "서울 동작구",

    skillLevel: "중급",

    requiredPlayers: 8,

    venueType: "실외",

    parkingAvailable: true,

    intro:
      "시간 맞춰서 즐겁게 경기하고 싶습니다.",

    statusLabel: "응답 대기",
  },


  4: {
    clubMatchId: 4,

    type: "upcoming",

    opponentClubId: 24,
    opponentClubName: "관악 위너스",
    opponentClubProfileImage: "",

    sportName: "축구/풋살",

    matchDate: "2026-10-02",

    startTime: "19:00",
    endTime: "21:00",

    region: "관악구",

    locationName: "관악구민운동장",
    address: "서울 관악구",

    skillLevel: "중급",

    requiredPlayers: 8,

    venueType: "실외",

    parkingAvailable: true,

    intro:
      "확정된 경기입니다.",

    statusLabel: "경기 예정",
  },


  5: {
    clubMatchId: 5,

    type: "upcoming",

    opponentClubId: 25,
    opponentClubName: "신림 스타즈",
    opponentClubProfileImage: "",

    sportName: "축구/풋살",

    matchDate: "2026-10-05",

    startTime: "20:00",
    endTime: "22:00",

    region: "관악구",

    locationName: "신림체육센터",
    address: "서울 관악구",

    skillLevel: "중급",

    requiredPlayers: 10,

    venueType: "실내",

    parkingAvailable: false,

    intro:
      "확정된 경기입니다.",

    statusLabel: "경기 예정",
  },


  6: {
    clubMatchId: 6,

    type: "history",

    opponentClubId: 26,
    opponentClubName: "봉천 FC",
    opponentClubProfileImage: "",

    sportName: "축구/풋살",

    matchDate: "2026-09-20",

    startTime: "19:00",
    endTime: "21:00",

    region: "관악구",

    locationName: "관악구민운동장",
    address: "서울 관악구",

    skillLevel: "중급",

    requiredPlayers: 8,

    venueType: "실외",

    parkingAvailable: true,

    intro: "",

    recordStatus: "RECORD_REQUIRED",
  },


  7: {
    clubMatchId: 7,

    type: "history",

    opponentClubId: 27,
    opponentClubName: "서울 킥커스",
    opponentClubProfileImage: "",

    sportName: "축구/풋살",

    matchDate: "2026-09-18",

    startTime: "20:00",
    endTime: "22:00",

    region: "동작구",

    locationName: "노량진 축구장",
    address: "서울 동작구",

    skillLevel: "중급",

    requiredPlayers: 8,

    venueType: "실외",

    parkingAvailable: true,

    intro: "",

    // 상대팀이 경기 기록을 먼저 작성했고
    // 현재 내가 확인해야 하는 상태
    recordStatus: "RECORD_CONFIRM_REQUIRED",

    myScore: 2,
    opponentScore: 2,
  },


  8: {
    clubMatchId: 8,

    type: "history",

    opponentClubId: 28,
    opponentClubName: "신림 유나이티드",
    opponentClubProfileImage: "",

    sportName: "축구/풋살",

    matchDate: "2026-09-15",

    startTime: "19:00",
    endTime: "21:00",

    region: "관악구",

    locationName: "신림체육센터",
    address: "서울 관악구",

    skillLevel: "중급",

    requiredPlayers: 8,

    venueType: "실내",

    parkingAvailable: false,

    intro: "",

    recordStatus: "REVIEWED",

    myScore: 3,
    opponentScore: 2,

    // ========================================
    // TODO: 백엔드 연결 후 실제 후기 존재 여부 사용
    // ========================================
    hasWrittenReview: true,
    hasReceivedReview: true,
  },

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


// ========================================
// 지난 경기 상태
// ========================================
const getRecordStatusLabel = (
  recordStatus
) => {

  switch (recordStatus) {

    case "RECORD_REQUIRED":
      return "경기 기록 작성 필요";

    case "RECORD_PENDING":
      return "상대팀 확인 대기";

    case "RECORD_CONFIRM_REQUIRED":
      return "경기 기록 확인 필요";

    case "COMPLETED":
      return "경기 완료";

    case "REVIEWED":
      return "후기 작성 완료";

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
  // 임시 상세 데이터
  //
  // TODO:
  // API 연결 후 state + useEffect로 교체
  // ========================================
  const match =
    SAMPLE_MATCH_DETAILS[
      Number(clubMatchId)
    ];

  // ========================================
  // 확정 경기 취소 요청 여부
  //
  // TODO:
  // 백엔드 연결 후 실제 매칭 상태값으로 교체
  // ========================================
  const [
    isCancelRequestSent,
    setIsCancelRequestSent,
  ] = useState(false);


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


  // 수정 기록을 상대팀에게 다시 보냈는지
  // TODO: 백엔드 연결 후 실제 상태값으로 교체
  const [
    isRecordResubmitted,
    setIsRecordResubmitted,
  ] = useState(false);


  // ========================================
  // 상대 동호회 상세
  // ========================================
  const handleOpponentClub = () => {

    // TODO:
    // 실제 상대 동호회 상세 페이지의
    // 라우트가 확정되면 navigate 연결
    const handleOpponentClub = () => {

      navigate(
        `/clubs/${match.opponentClubId}`
      );
    };
  };


  // ========================================
  // 받은 신청 승인
  // ========================================
  const handleApprove = () => {

    const confirmed =
      window.confirm(
        `${match.opponentClubName}의 매칭 신청을 승인하시겠습니까?`
      );

    if (!confirmed) {
      return;
    }

    // TODO:
    // 백엔드 승인 API 연결
    alert(
      "매칭 승인 API와 연결할 예정입니다."
    );
  };


  // ========================================
  // 받은 신청 거절
  // ========================================
  const handleReject = () => {

    const confirmed =
      window.confirm(
        `${match.opponentClubName}의 매칭 신청을 거절하시겠습니까?`
      );

    if (!confirmed) {
      return;
    }

    // TODO:
    // 백엔드 거절 API 연결
    alert(
      "매칭 거절 API와 연결할 예정입니다."
    );
  };

  // ========================================
  // 내가 보낸 매칭 신청 취소
  // ========================================
  const handleCancelSentRequest = () => {

    const confirmed =
      window.confirm(
        `${match.opponentClubName}에게 보낸 매칭 신청을 취소하시겠습니까?`
      );

    if (!confirmed) {
      return;
    }


    // ========================================
    // TODO: 백엔드 연결
    //
    // 보낸 매칭 신청 취소 API 연결
    //
    // 필요한 값:
    // clubMatchId
    //
    // 백엔드에서는 반드시
    // 현재 로그인 사용자가 해당 신청을 보낸
    // 동호회의 운영진인지 확인
    // ========================================

    alert(
      "매칭 신청 취소 API와 연결할 예정입니다."
    );
  };


  // ========================================
  // 확정된 경기 취소 요청
  // ========================================
  const handleCancelMatchRequest = () => {

    const confirmed =
      window.confirm(
        `${match.opponentClubName}와의 확정된 경기를 취소 요청하시겠습니까?\n\n상대팀이 취소 요청을 확인해야 최종 취소됩니다.`
      );

    if (!confirmed) {
      return;
    }


    // ========================================
    // TODO: 백엔드 연결
    //
    // 확정 경기 취소 요청 API
    //
    // 필요한 값:
    // clubMatchId
    //
    // 처리 흐름:
    // 1. 우리팀 취소 요청
    // 2. 상대팀 운영진에게 확인 요청
    // 3. 상대팀 동의
    // 4. 경기 최종 취소
    //
    // 백엔드에서는 현재 로그인 사용자가
    // 해당 동호회의 운영진인지 확인해야 함
    // ========================================

    setIsCancelRequestSent(true);
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
  const handleApproveRecord = () => {

    const confirmed =
      window.confirm(
        `${match.myScore} : ${match.opponentScore} 경기 기록이 맞습니까?`
      );

    if (!confirmed) {
      return;
    }


    // ========================================
    // TODO: 백엔드 연결
    //
    // 경기 기록 승인 API 호출
    // 승인 후 양 팀 확인이 완료되면
    // 경기 상태를 COMPLETED로 변경
    // ========================================

    alert(
      "경기 기록을 승인했습니다."
    );
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
  const handleSubmitCorrectedRecord = () => {

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


    // ========================================
    // TODO: 백엔드 연결
    //
    // 수정 경기 기록 재확인 요청 API
    //
    // 필요한 값 예시:
    // clubMatchId
    // reviewer/요청 동호회 ID
    // my_score
    // opponent_score
    //
    // 처리 후 상대팀은 다시
    // "경기 기록 확인 필요" 상태가 되어야 함
    // ========================================

    setIsRecordEditOpen(false);

    setIsRecordResubmitted(true);
  };


  // ========================================
  // 데이터 없음
  // ========================================
  if (!match) {

    return (

      <div className="match-management-detail-container">

        <header className="match-management-detail-header">

          <button
            type="button"
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
            매칭 상세
          </h1>

          <div />

        </header>


        <div className="match-management-detail-empty">

          매칭 정보를 찾을 수 없습니다.

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
                  match.recordStatus
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
              "COMPLETED" ||
            match.recordStatus ===
              "REVIEWED"
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
            (
              match.recordStatus === "COMPLETED" ||
              match.recordStatus === "REVIEWED"
            ) && (

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

          isCancelRequestSent ? (

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

          isRecordResubmitted ? (

            /* 수정 기록을 이미 다시 보낸 상태 */
            <div className="match-management-waiting">

              상대팀의 경기 기록 재확인을 기다리고 있습니다.

            </div>

          ) : isRecordEditOpen ? (

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