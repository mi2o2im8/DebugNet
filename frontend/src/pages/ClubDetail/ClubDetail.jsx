import { BackButtonIcon } from "../../components/BackButton/BackButton";
import { supabase } from "../../../supabaseClient";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import {
  FiShare2,
  FiHeart,
  FiMapPin,
  FiClock,
  FiUsers,
  FiCalendar,
} from "react-icons/fi";

import "./ClubDetail.css";
import { buildApiUrl } from "../../api/apiClient";
import {
  getClubReviews,
  getClubLeaveReviews,
} from "../../api/clubApi";
import { goBack } from "../../utils/navigation";

function ClubDetail() {
  const navigate = useNavigate();
  const { clubId } = useParams();

  const maskNickname = (nickname) => {
    if (!nickname) {
      return "익명";
    }

    if (nickname.length <= 3) {
      return nickname;
    }

    return (
      nickname.slice(0, 3) +
      "*".repeat(nickname.length - 3)
    );
  };

  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [memberStatus, setMemberStatus] = useState(null);

  const [reviews, setReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(true);

  // -----------------------------------------------------
  // 동호회 가입 상태 확인
  // -----------------------------------------------------
  useEffect(() => {
    const fetchMemberStatus = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // 로그인하지 않은 경우
        if (!user) {
          setMemberStatus(null);
          return;
        }

        const response = await fetch(
          buildApiUrl(
            `/api/clubs/${clubId}/member-status?user_id=${user.id}`
          )
        );

        if (!response.ok) {
          throw new Error(
            "가입 상태를 불러오지 못했습니다."
          );
        }

        const data = await response.json();

        setMemberStatus(data.status);

        if (data.status === "active") {
          // ⭐ replace: 상세 페이지를 방문 기록에 남기지 않는다.
          //   (남기면 동호회 홈에서 뒤로가기 → 상세 → 다시 홈으로 튕김)
          navigate(`/clubs/${clubId}/home`, { replace: true });
          return;
        }
      } catch (error) {
        console.error(
          "가입 상태 조회 오류:",
          error
        );
      }
    };

    fetchMemberStatus();
  }, [clubId]);

  // -----------------------------------------------------
  // 가입 신청 페이지 이동
  // -----------------------------------------------------
  const handleJoinClub = () => {
    navigate(`/clubs/${clubId}/application`);
  };

  // -----------------------------------------------------
  // 동호회 상세 정보 가져오기
  // -----------------------------------------------------
  useEffect(() => {
    const fetchClub = async () => {
      try {
        const response = await fetch(
          buildApiUrl(`/api/clubs/${clubId}`)
        );

        if (!response.ok) {
          throw new Error(
            "동호회 정보를 불러오지 못했습니다."
          );
        }

        const data = await response.json();

        setClub(data);
      } catch (error) {
        console.error(error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClub();
  }, [clubId]);

  // -----------------------------------------------------
  // 동호회 활동 후기 + 탈퇴 후기 조회
  // -----------------------------------------------------
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setReviewLoading(true);

        const [
          activityReviews,
          leaveReviews,
        ] = await Promise.all([
          getClubReviews(clubId),
          getClubLeaveReviews(clubId),
        ]);

        console.log(
          "동호회 활동 후기 조회 결과:",
          activityReviews
        );

        console.log(
          "동호회 탈퇴 후기 조회 결과:",
          leaveReviews
        );

        const activityReviewList =
          Array.isArray(activityReviews)
            ? activityReviews
            : [];

        const leaveReviewList =
          Array.isArray(leaveReviews)
            ? leaveReviews
            : [];

        // -------------------------------------------------
        // 활동 후기 + 탈퇴 후기를 하나의 리뷰 목록으로 통합
        // -------------------------------------------------
        const mergedReviews = [
          ...activityReviewList,
          ...leaveReviewList,
        ];

        // -------------------------------------------------
        // 작성 시간 기준 최신순 정렬
        // -------------------------------------------------
        mergedReviews.sort(
          (a, b) => {
            const dateA = a.created_at
              ? new Date(
                  a.created_at
                ).getTime()
              : 0;

            const dateB = b.created_at
              ? new Date(
                  b.created_at
                ).getTime()
              : 0;

            return dateB - dateA;
          }
        );

        setReviews(mergedReviews);
      } catch (error) {
        console.error(
          "동호회 후기 조회 오류:",
          error
        );

        setReviews([]);
      } finally {
        setReviewLoading(false);
      }
    };

    fetchReviews();
  }, [clubId]);

  // -----------------------------------------------------
  // 로딩
  // -----------------------------------------------------
  if (loading) {
    return (
      <div className="club-detail-page">
        <p className="club-detail-message">
          동호회 정보를 불러오는 중...
        </p>
      </div>
    );
  }

  // -----------------------------------------------------
  // 오류
  // -----------------------------------------------------
  if (error) {
    return (
      <div className="club-detail-page">
        <p className="club-detail-message">
          {error}
        </p>
      </div>
    );
  }

  // -----------------------------------------------------
  // 데이터 없음
  // -----------------------------------------------------
  if (!club) {
    return (
      <div className="club-detail-page">
        <p className="club-detail-message">
          동호회 정보가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="club-detail-page">

      {/* 상단 헤더 */}
      <header className="club-detail-header">

        <button
          className="club-detail-header-btn"
          onClick={() => goBack(navigate)}
        >
          <BackButtonIcon />
        </button>

        <h1>동호회 상세</h1>

        <div className="club-detail-header-actions">

          <button className="club-detail-header-btn">
            <FiShare2 />
          </button>

          <button className="club-detail-header-btn">
            <FiHeart />
          </button>

        </div>

      </header>

      {/* 대표 이미지 */}
      <section className="club-detail-cover">

        {club.images &&
        club.images.length > 0 ? (

          <img
            className="club-detail-cover-image"
            src={club.images[0].image_url}
            alt={`${club.club_name} 대표 이미지`}
          />

        ) : (

          <div className="club-detail-cover-placeholder">
            동호회 대표 이미지
          </div>

        )}

      </section>

      {/* 동호회 기본 정보 */}
      <section className="club-detail-main-info">

        <div className="club-detail-title-area">

          <div className="club-detail-logo">
            ⚽
          </div>

          <div className="club-detail-title">

            {/* 운동 종목 */}
            <span className="club-detail-sport">
              {club.sports?.join(", ") ||
                "종목 정보 없음"}
            </span>

            {/* 동호회 이름 */}
            <h2>
              {club.club_name}
            </h2>

            {/* 지역 + 회원 수 */}
            <p>
              {club.regions?.join(", ") ||
                "지역 정보 없음"}
              {" · "}
              회원 {club.current_members}명
            </p>

          </div>

        </div>

        {/* 한 줄 소개 */}
        <p className="club-detail-intro">
          {club.club_intro}
        </p>

        {/* 태그 */}
        <div className="club-detail-tags">

          {club.sports?.map(
            (sport, index) => (
              <span key={`sport-${index}`}>
                {sport}
              </span>
            )
          )}

          {club.atmospheres?.map(
            (atmosphere, index) => (
              <span
                key={`atmosphere-${index}`}
              >
                {atmosphere}
              </span>
            )
          )}

        </div>

        {/* 가입 버튼 */}
        <button
          className="club-detail-join-btn"
          onClick={handleJoinClub}
          disabled={
            memberStatus === "pending" ||
            memberStatus === "active"
          }
        >
          {memberStatus === "pending"
            ? "승인 대기 중"
            : memberStatus === "active"
            ? "가입 완료"
            : "가입 신청하기"}
        </button>

      </section>

      {/* 탭 */}
      <nav className="club-detail-tabs">

        <button className="active">
          소개
        </button>

        <button>
          활동정보
        </button>

        <button>
          일정
        </button>

        <button>
          리뷰
        </button>

      </nav>

      {/* 동호회 소개 */}
      <section className="club-detail-section">

        <h3>동호회 소개</h3>

        <p className="club-detail-description">
          {club.club_description ||
            club.club_intro}
        </p>

      </section>

      {/* 기본 정보 */}
      <section className="club-detail-section">

        <h3>기본 정보</h3>

        <div className="club-detail-info-list">

          {/* 회원 수 */}
          <div className="club-detail-info-item">

            <FiUsers />

            <div>

              <span>
                현재 회원
              </span>

              <strong>
                {club.current_members}명
                {" / "}
                최대 {club.max_members}명
              </strong>

            </div>

          </div>

          {/* 활동 강도 */}
          <div className="club-detail-info-item">

            <FiCalendar />

            <div>

              <span>
                활동 강도
              </span>

              <strong>
                {club.activity_intensity ||
                  "정보 없음"}
              </strong>

            </div>

          </div>

          {/* 활동 시간 */}
          <div className="club-detail-info-item">

            <FiClock />

            <div>

              <span>
                활동 시간
              </span>

              <strong>

                {club.schedules?.length > 0 ? (

                  club.schedules.map(
                    (schedule, index) => (

                      <span
                        key={index}
                        style={{
                          display: "block",
                        }}
                      >

                        {schedule.day_of_week}{" "}

                        {schedule.start_time.slice(
                          0,
                          5
                        )}

                        {" ~ "}

                        {schedule.end_time.slice(
                          0,
                          5
                        )}

                      </span>

                    )
                  )

                ) : (

                  "정보 없음"

                )}

              </strong>

            </div>

          </div>

          {/* 활동 장소 */}
          <div className="club-detail-info-item">

            <FiMapPin />

            <div>

              <span>
                활동 장소
              </span>

              <strong>
                {club.regions?.join(", ") ||
                  "정보 없음"}
              </strong>

            </div>

          </div>

        </div>

      </section>

      {/* 활동 일정 */}
      <section className="club-detail-section">

        <div className="club-detail-section-title">

          <h3>
            활동 일정
          </h3>

          <button>
            전체 보기 →
          </button>

        </div>

        {club.schedules?.length > 0 ? (

          club.schedules.map(
            (schedule, index) => (

              <div
                className="club-detail-schedule"
                key={index}
              >

                <div className="club-detail-date">

                  <strong>
                    {schedule.day_of_week}
                  </strong>

                </div>

                <div className="club-detail-schedule-info">

                  <strong>
                    정기 운동
                  </strong>

                  <span>
                    {schedule.start_time.slice(
                      0,
                      5
                    )}
                    {" ~ "}
                    {schedule.end_time.slice(
                      0,
                      5
                    )}
                  </span>

                  <span>
                    {club.regions?.join(", ") ||
                      "활동 지역 정보 없음"}
                  </span>

                </div>

              </div>

            )

          )

        ) : (

          <p>
            등록된 활동 일정이 없습니다.
          </p>

        )}

      </section>

      {/* -------------------------------------------------
          전체 리뷰
          활동 후기 + 탈퇴 후기
          작성 시간 기준 최신순
      ------------------------------------------------- */}
      <section className="club-detail-section">

        <div className="club-detail-section-title">

          <h3>
            리뷰
          </h3>

        </div>

        {reviewLoading ? (

          <p>
            후기를 불러오는 중...
          </p>

        ) : reviews.length === 0 ? (

          <p>
            아직 작성된 후기가 없습니다.
          </p>

        ) : (

          <div className="club-detail-reviews">

            {reviews.map((review) => (

              <div
                className="club-detail-review"
                key={
                  review.review_id
                    ? `event-${review.review_id}`
                    : `leave-${review.leave_review_id}`
                }
              >

                <div className="club-detail-review-header">

                  <span className="club-detail-review-nickname">
                    {maskNickname(
                      review.nickname
                    )}
                  </span>

                  <span className="club-detail-review-date">
                    {review.created_at
                      ? new Date(
                          review.created_at
                        ).toLocaleDateString(
                          "ko-KR"
                        )
                      : ""}
                  </span>

                </div>

                <div className="club-detail-review-rating">
                  {"⭐".repeat(
                    review.rating || 0
                  )}
                </div>

                <p className="club-detail-review-text">
                  {review.review_text ||
                    "작성된 후기가 없습니다."}
                </p>

              </div>

            ))}

          </div>

        )}

      </section>

      {/* 공통 하단 네비게이션 */}
      <BottomNav />

    </div>
  );
}

export default ClubDetail;