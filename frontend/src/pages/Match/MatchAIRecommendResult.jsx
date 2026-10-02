import {
  useEffect,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import BackButton
  from "../../components/BackButton/BackButton";

import "./CSS/MatchAvailability.css";
import "./CSS/MatchCommon.css";
import "./CSS/MatchAIRecommend.css";
import { goBack } from "../../utils/navigation";


// ========================================
// 19:00:00 → 19:00
// ========================================
const formatMatchTime = (
  value
) => {

  if (!value) {
    return "";
  }

  return String(
    value
  ).slice(
    0,
    5
  );
};


function MatchAIRecommendResult() {

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [showScrollTop, setShowScrollTop] =
    useState(false);


  useEffect(() => {

    const scrollContainer =
      document.querySelector(
        ".club-manage-layout-content"
      );

    if (!scrollContainer) {
      return;
    }


    const handleScroll = () => {

      setShowScrollTop(
        scrollContainer.scrollTop > 500
      );
    };


    handleScroll();

    scrollContainer.addEventListener(
      "scroll",
      handleScroll,
      { passive: true }
    );


    return () => {

      scrollContainer.removeEventListener(
        "scroll",
        handleScroll
      );
    };

  }, []);


  const handleScrollToTop = () => {

    const scrollContainer =
      document.querySelector(
        ".club-manage-layout-content"
      );

    scrollContainer?.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  const recommendations =
    location.state?.recommendations || [];

  const selectedDates =
    location.state?.selectedDates || [];

  const searchCondition =
    location.state?.searchCondition || null;


  const handleOpenTeamDetail = (
    availabilityId
  ) => {

    navigate(
      `/matches/team/${availabilityId}`
    );
  };


  return (

    <div className="match-availability-container">

      <header className="match-availability-header">

        <BackButton
          className="match-shared-back-button"
        />

        <h1>
          AI 추천 결과
        </h1>

      </header>


      <main className="match-availability-main">

        {searchCondition && (

          <section className="match-ai-result-condition">

            <div>
              <span>
                선택 날짜
              </span>

              <strong>
                {selectedDates.join(
                  ", "
                )}
              </strong>
            </div>

            <div>
              <span>
                종목
              </span>

              <strong>
                {searchCondition.sportName}
              </strong>
            </div>

            <div>
              <span>
                시간
              </span>

              <strong>
                {searchCondition.timeFlexible
                  ? "상관없음"
                  : `${searchCondition.startTime} ~ ${searchCondition.endTime}`}
              </strong>
            </div>

            <div>
              <span>
                내 출발 위치
              </span>

              <strong>
                {searchCondition.startLocation
                  ?.location_name || "-"}
              </strong>
            </div>

          </section>
        )}


        <section className="match-ai-result-page-section">

          <div className="match-ai-result-head">

            <div>

              <span>
                MATCH FIT
              </span>

              <h2>
                추천 상대팀
              </h2>

            </div>

            <strong>
              {recommendations.length}팀
            </strong>

          </div>


          {recommendations.length === 0 ? (

            <div className="match-ai-result-empty">

              <strong>
                조건에 맞는 모집 중인 경기가 없어요.
              </strong>

              <p>
                날짜나 시간, 종목 조건을 바꿔 다시 추천받아보세요.
              </p>

              <button
                type="button"
                className="match-ai-retry-button"
                onClick={() => goBack(navigate)}
              >
                조건 다시 입력하기
              </button>

            </div>

          ) : (

            <div className="match-ai-result-list">

              {recommendations.map(
                (
                  team,
                  index
                ) => (

                  <article
                    key={
                      team.availability_id
                    }
                    className="match-ai-result-card"
                  >

                    <div className="match-ai-result-card-top">

                      <span className="match-ai-rank-badge">
                        추천 {index + 1}위
                      </span>

                      <strong className="match-ai-fit-score">
                        {Math.round(
                          team.match_fit_score
                        )}점
                      </strong>

                    </div>


                    <div className="match-ai-result-team">

                      {team.club_profile_image ? (

                        <img
                          src={
                            team.club_profile_image
                          }
                          alt={`${team.club_name} 프로필`}
                        />

                      ) : (

                        <div className="match-ai-profile-fallback">
                          {team.club_name
                            ?.charAt(0) ||
                            "팀"}
                        </div>
                      )}


                      <div>

                        <strong>
                          {team.club_name}
                        </strong>

                        <span>
                          {team.sport_name}
                          {" · "}
                          {team.skill_level}
                          {" · "}
                          {team.region}
                        </span>

                      </div>

                    </div>


                    <div className="match-ai-result-info">

                      <div>
                        <span>
                          경기 일시
                        </span>

                        <strong>
                          {team.match_date}
                          {" "}
                          {formatMatchTime(
                            team.start_time
                          )}
                          {" ~ "}
                          {formatMatchTime(
                            team.end_time
                          )}
                        </strong>
                      </div>


                      <div>
                        <span>
                          경기 장소
                        </span>

                        <strong>
                          {team.location_name}
                        </strong>
                      </div>


                      <div>
                        <span>
                          경기 인원
                        </span>

                        <strong>
                          {team.required_players}명
                        </strong>
                      </div>


                      {team.distance_km != null && (

                        <div>
                          <span>
                            예상 거리
                          </span>

                          <strong>
                            {team.distance_km}km
                            {team.estimated_travel_minutes != null
                              ? ` · 약 ${team.estimated_travel_minutes}분`
                              : ""}
                          </strong>
                        </div>
                      )}

                    </div>


                    <div className="match-ai-score-grid">

                      <span>
                        시간 {Math.round(
                          team.score_detail?.time ||
                          0
                        )}
                      </span>

                      <span>
                        거리 {Math.round(
                          team.score_detail?.distance ||
                          0
                        )}
                      </span>

                      <span>
                        실력 {Math.round(
                          team.score_detail?.skill ||
                          0
                        )}
                      </span>

                      <span>
                        인원 {Math.round(
                          team.score_detail?.players ||
                          0
                        )}
                      </span>

                    </div>


                    {team.reasons?.length > 0 && (

                      <ul className="match-ai-reasons">

                        {team.reasons.map(
                          (reason) => (

                            <li key={reason}>
                              {reason}
                            </li>
                          )
                        )}

                      </ul>
                    )}


                    <button
                      type="button"
                      className="match-ai-detail-button"
                      onClick={() =>
                        handleOpenTeamDetail(
                          team.availability_id
                        )
                      }
                    >
                      경기 상세보기
                    </button>

                  </article>
                )
              )}

            </div>
          )}


          {recommendations.length > 0 && (

            <button
              type="button"
              className="match-ai-retry-button"
              onClick={() => goBack(navigate)}
            >
              조건 다시 입력하기
            </button>
          )}

        </section>

      </main>

      {showScrollTop && (

        <button
          type="button"
          className="match-ai-scroll-top-button"
          onClick={handleScrollToTop}
          aria-label="최상단으로 이동"
        >
          ↑
        </button>

      )}

    </div>
  );
}


export default MatchAIRecommendResult;
