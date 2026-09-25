import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiChevronRight,
} from "react-icons/fi";

import BottomNav from "../../components/BottomNav";

import {
  getMatchReviewDetail,
  getMatchManagementDetail,
} from "./api/matchApi";

import {
  getClubDashboard,
} from "../../api/clubApi";

import "./CSS/MatchReviewDetail.css";


// ========================================
// 후기 평가 항목
// ========================================
const REVIEW_ITEMS = [
  {
    key: "mannerScore",
    label: "매너",
  },
  {
    key: "punctualityScore",
    label: "시간 준수",
  },
  {
    key: "rosterAccuracyScore",
    label: "인원 일치",
  },
  {
    key: "safetyScore",
    label: "안전한 경기",
  },
  {
    key: "gameFlowScore",
    label: "경기 진행",
  },
  {
    key: "rematchScore",
    label: "재경기 의사",
  },
];



// ========================================
// 날짜 표시
// ========================================
const formatMatchDate = (
  dateString
) => {

  if (!dateString) {
    return "";
  }

  const [
    year,
    month,
    day,
  ] = dateString.split("-");

  return (
    `${year}년 ${Number(month)}월 ${Number(day)}일`
  );
};


function MatchReviewDetail() {

  const navigate =
    useNavigate();

  const {
    clubId,
    clubMatchId,
  } = useParams();

  const [
    searchParams,
  ] = useSearchParams();


  // ========================================
  // written  = 내가 작성한 후기
  // received = 내가 받은 후기
  // ========================================
  const reviewType =
    searchParams.get("type") ===
    "received"
      ? "received"
      : "written";

    // ========================================
  // 실제 후기 데이터
  // ========================================
  const [
    review,
    setReview,
  ] = useState(null);


  // 조회 상태
  const [
    isLoading,
    setIsLoading,
  ] = useState(true);


  const [
    loadError,
    setLoadError,
  ] = useState("");

  // ========================================
  // 후기 상세 조회
  //
  // 후기 자체 데이터 +
  // 기존 화면에서 필요한 경기/동호회 정보까지
  // 함께 조회한다.
  // ========================================
  useEffect(() => {

    if (
      !clubId ||
      !clubMatchId
    ) {
      return;
    }


    const loadReview = async () => {

      setIsLoading(true);
      setLoadError("");


      try {

        const [
          reviewData,
          matchData,
          clubData,
        ] = await Promise.all([

          getMatchReviewDetail(
            clubId,
            clubMatchId,
            reviewType
          ),

          getMatchManagementDetail(
            clubId,
            clubMatchId
          ),

          getClubDashboard(
            clubId
          ),
        ]);


        // 후기 API에 없는 화면 표시용 데이터는
        // 매칭 상세 / 동호회 정보에서 합친다.
        setReview({
          ...reviewData,

          myClubName:
            clubData.club_name ||
            "우리팀",

          sportName:
            matchData.sportName,

          region:
            matchData.region,
        });

      } catch (error) {

        console.error(
          "경기 후기 상세 조회 실패:",
          error
        );


        setReview(null);

        setLoadError(
          error.message ||
          "후기를 불러오지 못했습니다."
        );

      } finally {

        setIsLoading(false);

      }

    };


    loadReview();

  }, [
    clubId,
    clubMatchId,
    reviewType,
  ]);

  // ========================================
  // 상대 동호회 상세 페이지 이동
  // ========================================
  const handleOpponentClub = () => {

    navigate(
      `/clubs/${review.opponentClubId}`
    );
  };

  // ========================================
  // 로딩 중
  // ========================================
  if (isLoading) {

    return (

      <div className="match-review-detail-container">

        <header className="match-review-detail-header">

          <button
            type="button"
            className="match-review-detail-back"
            onClick={() =>
              navigate(-1)
            }
            aria-label="뒤로가기"
          >
            ‹
          </button>


          <h1>
            {reviewType === "written"
              ? "내가 작성한 후기"
              : "내가 받은 후기"}
          </h1>


          <div className="match-review-detail-header-space" />

        </header>


        <main className="match-review-detail-main">

          <section className="match-review-detail-content">

            <p>
              후기를 불러오는 중입니다.
            </p>

          </section>

        </main>

      </div>

    );
  }


  // ========================================
  // 조회 실패 / 후기 없음
  // ========================================
  if (
    loadError ||
    !review
  ) {

    return (

      <div className="match-review-detail-container">

        <header className="match-review-detail-header">

          <button
            type="button"
            className="match-review-detail-back"
            onClick={() =>
              navigate(-1)
            }
            aria-label="뒤로가기"
          >
            ‹
          </button>


          <h1>
            {reviewType === "written"
              ? "내가 작성한 후기"
              : "내가 받은 후기"}
          </h1>


          <div className="match-review-detail-header-space" />

        </header>


        <main className="match-review-detail-main">

          <section className="match-review-detail-content">

            <p className="empty">
              {loadError ||
                "후기 정보를 찾을 수 없습니다."}
            </p>

          </section>

        </main>

      </div>

    );
  }

  // ========================================
  // 후기 평균
  // ========================================
  const averageScore = (

    REVIEW_ITEMS.reduce(
      (total, item) =>
        total +
        Number(
          review[item.key] || 0
        ),
      0
    ) / REVIEW_ITEMS.length

  ).toFixed(1);


  return (

    <div className="match-review-detail-container">


      {/* ========================================
          헤더
      ======================================== */}
      <header className="match-review-detail-header">

        <button
          type="button"
          className="match-review-detail-back"
          onClick={() =>
            navigate(-1)
          }
          aria-label="뒤로가기"
        >
          ‹
        </button>


        <h1>

          {reviewType === "written"
            ? "내가 작성한 후기"
            : "내가 받은 후기"}

        </h1>


        <div className="match-review-detail-header-space" />

      </header>



      <main className="match-review-detail-main">


        {/* ========================================
            후기 대상 동호회
        ======================================== */}
        <section
          className="match-review-detail-opponent"
          onClick={handleOpponentClub}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {

            if (
              event.key === "Enter" ||
              event.key === " "
            ) {

              handleOpponentClub();

            }

          }}
        >


          <div className="match-review-detail-profile">

            {review.opponentClubProfileImage ? (

              <img
                src={
                  review.opponentClubProfileImage
                }
                alt={`${review.opponentClubName} 프로필`}
              />

            ) : (

              <span>
                {review.opponentClubName.charAt(0)}
              </span>

            )}

          </div>


          <div className="match-review-detail-opponent-info">

            <span>

              {reviewType === "written"
                ? "내가 평가한 상대팀"
                : "후기를 작성한 상대팀"}

            </span>

            <strong>
              {review.opponentClubName}
            </strong>

          </div>

          <FiChevronRight
            className="match-review-detail-opponent-arrow"
          />


        </section>



        {/* ========================================
            경기 정보
        ======================================== */}
        <section className="match-review-detail-match">

          <div className="match-review-detail-score">

            <div>

              <span>
                {review.myClubName}
              </span>

              <strong>
                {review.myScore}
              </strong>

            </div>


            <span>
              :
            </span>


            <div>

              <span>
                {review.opponentClubName}
              </span>

              <strong>
                {review.opponentScore}
              </strong>

            </div>

          </div>


          <div className="match-review-detail-match-info">

            <span>
              {review.sportName}
            </span>


            <span>
              <FiCalendar />

              {formatMatchDate(
                review.matchDate
              )}
            </span>


            <span>
              <FiClock />

              {review.startTime}
              {" ~ "}
              {review.endTime}
            </span>


            <span>
              <FiMapPin />

              {review.locationName}
              {" · "}
              {review.region}
            </span>

          </div>

        </section>



        {/* ========================================
            평균 점수
        ======================================== */}
        <section className="match-review-detail-average">

          <span>
            평균 평가
          </span>

          <strong>
            {averageScore}
          </strong>

          <small>
            / 5.0
          </small>

        </section>



        {/* ========================================
            6개 평가 결과
        ======================================== */}
        <section className="match-review-detail-ratings">

          <h2>
            평가 항목
          </h2>


          <div className="match-review-detail-rating-list">

            {REVIEW_ITEMS.map(
              (item) => (

                <div
                  key={item.key}
                  className="match-review-detail-rating-row"
                >

                  <span>
                    {item.label}
                  </span>


                  <div className="match-review-detail-rating-value">

                    <strong>
                      {review[item.key]}
                    </strong>

                    <small>
                      / 5
                    </small>

                  </div>

                </div>

              )
            )}

          </div>

        </section>



        {/* ========================================
            직접 작성한 후기
        ======================================== */}
        <section className="match-review-detail-content">

          <h2>
            직접 작성한 후기
          </h2>


          {review.content ? (

            <p>
              {review.content}
            </p>

          ) : (

            <p className="empty">
              작성된 내용이 없습니다.
            </p>

          )}

        </section>


      </main>


      <BottomNav />


    </div>

  );
}


export default MatchReviewDetail;