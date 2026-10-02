import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiChevronRight, FiMapPin, FiRefreshCw } from "react-icons/fi";

import BackButton from "../../components/BackButton/BackButton";
import "./ClubRecommend.css";
import { goBack } from "../../utils/navigation";

const formatFee = (value) => {
  const number = Number(value ?? 0);
  return number === 0 ? "무료" : `${number.toLocaleString()}원`;
};

const formatTime = (value) => (value ? String(value).slice(0, 5) : "-");

function ClubRecommendResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showScrollTop, setShowScrollTop] = useState(false);

  const recommendations = location.state?.recommendations ?? [];
  const searchCondition = location.state?.searchCondition ?? null;

  useEffect(() => {
    const container = document.querySelector(".club-manage-layout-content");
    if (!container) return undefined;

    const handleScroll = () => setShowScrollTop(container.scrollTop > 500);
    handleScroll();
    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    document.querySelector(".club-manage-layout-content")?.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!searchCondition) {
    return (
      <div className="club-recommend-page">
        <header className="club-recommend-header">
          <BackButton to="/clubs/recommend" className="club-recommend-back" />
          <h1>AI 추천 결과</h1>
        </header>
        <div className="club-recommend-state">
          <p>추천 조건이 없어요.</p>
          <button type="button" onClick={() => navigate("/clubs/recommend", { replace: true })}>
            추천 조건 입력하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="club-recommend-page">
      <header className="club-recommend-header">
        <BackButton className="club-recommend-back" />
        <h1>AI 추천 결과</h1>
      </header>

      <main className="club-recommend-main result">
        <section className="club-recommend-result-condition">
          <div>
            <span>종목</span>
            <strong>{searchCondition.sport_name || "-"}</strong>
          </div>
          <div>
            <span>실력</span>
            <strong>{searchCondition.sport_level || "상관없음"}</strong>
          </div>
          <div>
            <span>활동 지역</span>
            <strong>
              {searchCondition.regions?.length
                ? searchCondition.regions.join(", ")
                : "상관없음"}
            </strong>
          </div>
          <div>
            <span>월 회비</span>
            <strong>{formatFee(searchCondition.max_monthly_fee)} 이하</strong>
          </div>
        </section>

        <section className="club-recommend-result-section">
          <div className="club-recommend-result-head">
            <div>
              <span>CLUB FIT</span>
              <h2>추천 동호회</h2>
            </div>
            <strong>{recommendations.length}개</strong>
          </div>

          {recommendations.length === 0 ? (
            <div className="club-recommend-empty">
              <strong>조건에 맞는 동호회가 아직 없어요.</strong>
              <p>지역이나 시간, 선호 조건을 조금 넓혀 다시 추천받아보세요.</p>
              <button type="button" onClick={() => goBack(navigate)}>
                <FiRefreshCw /> 조건 다시 입력하기
              </button>
            </div>
          ) : (
            <div className="club-recommend-result-list">
              {recommendations.map((club, index) => (
                <article className="club-recommend-card" key={club.club_id}>
                  <div className="club-recommend-card-top">
                    <span className="club-recommend-rank">추천 {index + 1}위</span>
                    <strong>{Math.round(Number(club.fit_score ?? 0))}점</strong>
                  </div>

                  <div className="club-recommend-card-profile">
                    {club.image_url ? (
                      <img src={club.image_url} alt={`${club.club_name} 대표`} />
                    ) : (
                      <div className="club-recommend-card-fallback">
                        {club.club_name?.charAt(0) || "동"}
                      </div>
                    )}

                    <div>
                      <h3>{club.club_name}</h3>
                      <p>
                        {club.sport_name}
                        {club.sport_levels?.length
                          ? ` · ${club.sport_levels.join("/")}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="club-recommend-card-info">
                    <div>
                      <FiMapPin />
                      <span>{club.regions?.join(", ") || "지역 정보 없음"}</span>
                    </div>
                    <div>
                      <span>활동 빈도</span>
                      <strong>{club.activity_frequency || "-"}</strong>
                    </div>
                    <div>
                      <span>월 회비</span>
                      <strong>{formatFee(club.monthly_fee)}</strong>
                    </div>
                    <div>
                      <span>회원</span>
                      <strong>
                        {club.current_members ?? 0}명
                        {club.max_members ? ` / ${club.max_members}명` : ""}
                      </strong>
                    </div>
                  </div>

                  {club.schedules?.length > 0 && (
                    <div className="club-recommend-schedules">
                      {club.schedules.slice(0, 3).map((schedule, scheduleIndex) => (
                        <span key={`${schedule.day_of_week}-${scheduleIndex}`}>
                          {schedule.day_of_week} {formatTime(schedule.start_time)}~{formatTime(schedule.end_time)}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="club-recommend-reasons">
                    <strong>추천 이유</strong>
                    <ul>
                      {(club.reasons ?? []).map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    className="club-recommend-detail-button"
                    onClick={() => navigate(`/clubs/${club.club_id}`)}
                  >
                    동호회 자세히 보기 <FiChevronRight />
                  </button>
                </article>
              ))}
            </div>
          )}

          <button
            type="button"
            className="club-recommend-retry"
            onClick={() => goBack(navigate)}
          >
            <FiRefreshCw /> 조건 다시 설정하기
          </button>
        </section>
      </main>

      {showScrollTop && (
        <button
          type="button"
          className="club-recommend-scroll-top"
          onClick={scrollToTop}
          aria-label="최상단으로 이동"
        >
          ↑
        </button>
      )}
    </div>
  );
}

export default ClubRecommendResult;
