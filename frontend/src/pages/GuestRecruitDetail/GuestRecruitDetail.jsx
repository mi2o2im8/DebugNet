import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { supabase } from "../../../supabaseClient";
import "./GuestRecruitDetail.css";
import { buildApiUrl } from "../../api/apiClient";
// =====================================================
// 게스트 모집 상세 페이지
// =====================================================
function GuestRecruitDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { eventId } = useParams();

  // 이전 페이지에서 전달받은 이벤트 데이터
  const stateEvent = location.state?.event;

  const [event, setEvent] = useState(stateEvent || null);
  const [loading, setLoading] = useState(!stateEvent);
  const [error, setError] = useState("");

  const [isApplying, setIsApplying] = useState(false);

  // =====================================================
  // 날짜 표시
  // =====================================================
  const formatDate = (dateString) => {
    if (!dateString) {
      return "날짜 미정";
    }

    const date = new Date(`${dateString}T12:00:00`);

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    const weekLabels = [
      "일요일",
      "월요일",
      "화요일",
      "수요일",
      "목요일",
      "금요일",
      "토요일",
    ];

    return `${date.getMonth() + 1}월 ${date.getDate()}일 (${
      weekLabels[date.getDay()]
    })`;
  };

  // =====================================================
  // 시간 표시
  // =====================================================
  const formatTime = (timeString) => {
    if (!timeString) {
      return "시간 미정";
    }

    return String(timeString).slice(0, 5);
  };

  // =====================================================
  // 신청 마감일 표시
  // =====================================================
  const formatDeadline = (dateTimeString) => {
    if (!dateTimeString) {
      return "마감일 미정";
    }

    const date = new Date(dateTimeString);

    if (Number.isNaN(date.getTime())) {
      return dateTimeString;
    }

    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =====================================================
  // 직접 URL로 들어온 경우
  // 게스트 모집 전체 목록에서 해당 이벤트를 찾음
  //
  // 기존 일정 상세 API는 운영 권한 검사를 하기 때문에
  // 여기서는 게스트 모집 조회 API를 사용
  // =====================================================
  useEffect(() => {
    // 이미 이전 페이지에서 데이터를 전달받았다면
    // 추가 조회하지 않는다.
    if (stateEvent) {
      setEvent(stateEvent);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchEvent = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          buildApiUrl("/api/clubs/guest-recruiting"),
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            `게스트 모집 조회 실패 (HTTP ${response.status})`
          );
        }

        const data = await response.json();

        let eventList = [];

        if (Array.isArray(data)) {
          eventList = data;
        } else if (Array.isArray(data.events)) {
          eventList = data.events;
        } else if (Array.isArray(data.data)) {
          eventList = data.data;
        }

        const foundEvent = eventList.find(
          (item) =>
            String(item.event_id) === String(eventId)
        );

        if (!foundEvent) {
          throw new Error(
            "해당 게스트 모집을 찾을 수 없습니다."
          );
        }

        setEvent(foundEvent);
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }

        console.error(
          "게스트 모집 상세 조회 오류:",
          err
        );

        setError(err.message);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchEvent();

    return () => {
      controller.abort();
    };
  }, [eventId, stateEvent]);

  // =====================================================
  // 로딩
  // =====================================================
  if (loading) {
    return (
      <div className="GuestRecruitDetail-container">
        <p>게스트 모집 정보를 불러오는 중...</p>
      </div>
    );
  }
  
  // =====================================================
  // 게스트 신청
  // =====================================================
  const handleGuestApply = async () => {
    if (isApplying) return;

    try {
      setIsApplying(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        alert("로그인이 필요합니다.");
        navigate("/Login");
        return;
      }

      const response = await fetch(
        buildApiUrl(`/api/clubs/${event.club_id}/events/${event.event_id}/guest-application`),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || "게스트 신청에 실패했습니다."
        );
      }

      alert("게스트 신청이 완료되었습니다.");

    } catch (error) {
      console.error("게스트 신청 오류:", error);

      alert(error.message);
    } finally {
      setIsApplying(false);
    }
  };


  // =====================================================
  // 오류
  // =====================================================
  if (error || !event) {
    return (
      <div className="GuestRecruitDetail-container">
        <button
          type="button"
          onClick={() => navigate(-1)}
        >
          ← 뒤로가기
        </button>

        <p>
          {error || "게스트 모집 정보를 찾을 수 없습니다."}
        </p>
      </div>
    );
  }

  // =====================================================
  // 화면
  // =====================================================
  return (
    <div className="GuestRecruitDetail-container">

      {/* ================================================
          상단 헤더
      ================================================ */}
      <header className="GuestRecruitDetail-header">

        <button
          type="button"
          className="GuestRecruitDetail-back-button"
          onClick={() => navigate(-1)}
          aria-label="뒤로 가기"
        >
          ←
        </button>

        <h2>게스트 모집 상세</h2>

        <div className="GuestRecruitDetail-header-space" />

      </header>


      {/* ================================================
          이벤트 이미지
      ================================================ */}
      <section className="GuestRecruitDetail-image-section">

        {event.event_image_url ? (
          <img
            src={event.event_image_url}
            alt={
              event.title ||
              "게스트 모집 이미지"
            }
            className="GuestRecruitDetail-image"
          />
        ) : (
          <div className="GuestRecruitDetail-no-image">
            이미지 없음
          </div>
        )}

      </section>


      {/* ================================================
          기본 정보
      ================================================ */}
      <section className="GuestRecruitDetail-content">

        {/* 제목 */}
        <div className="GuestRecruitDetail-title-section">

          <span className="GuestRecruitDetail-badge">
            게스트 모집
          </span>

          <h1>
            {event.title || "게스트 모집"}
          </h1>

        </div>


        {/* ============================================
            일정 정보
        ============================================ */}
        <section className="GuestRecruitDetail-info-card">

          <div className="GuestRecruitDetail-info-row">

            <span className="GuestRecruitDetail-info-icon">
              📅
            </span>

            <div>
              <strong>활동 날짜</strong>
              <p>
                {formatDate(event.event_date)}
              </p>
            </div>

          </div>


          <div className="GuestRecruitDetail-info-row">

            <span className="GuestRecruitDetail-info-icon">
              ⏰
            </span>

            <div>
              <strong>활동 시간</strong>

              <p>
                {formatTime(event.start_time)}

                {event.end_time && (
                  <>
                    {" - "}
                    {formatTime(event.end_time)}
                  </>
                )}
              </p>
            </div>

          </div>


          <div className="GuestRecruitDetail-info-row">

            <span className="GuestRecruitDetail-info-icon">
              📍
            </span>

            <div>
              <strong>활동 장소</strong>

              <p>
                {event.location || "장소 미정"}
              </p>
            </div>

          </div>

        </section>


        {/* ============================================
            게스트 모집 정보
        ============================================ */}
        <section className="GuestRecruitDetail-recruit-card">

          <h3>게스트 모집</h3>

          <div className="GuestRecruitDetail-recruit-row">

            <span>모집 인원</span>

            <strong>
                {event.joined_guest_count ?? 0}
                {" / "}
                {event.max_guests ?? 0}
            </strong>

          </div>


          <div className="GuestRecruitDetail-recruit-row">

            <span>모집 상태</span>

            <strong className="GuestRecruitDetail-status">
              모집 중
            </strong>

          </div>


          {event.registration_deadline && (
            <div className="GuestRecruitDetail-recruit-row">

              <span>신청 마감</span>

              <strong>
                {formatDeadline(
                  event.registration_deadline
                )}
              </strong>

            </div>
          )}

        </section>


        {/* ============================================
            모집 내용
        ============================================ */}
        <section className="GuestRecruitDetail-description">

          <h3>모집 내용</h3>

          <p>
            {event.description ||
              "게스트를 모집하고 있습니다."}
          </p>

        </section>


        {/* ============================================
            참여 방식
        ============================================ */}
        {event.participation_method && (
          <section className="GuestRecruitDetail-description">

            <h3>참여 방식</h3>

            <p>
              {event.participation_method}
            </p>

          </section>
        )}


        {/* ============================================
            게스트 신청 버튼
        ============================================ */}
        <section className="GuestRecruitDetail-apply-section">

            <button
                type="button"
                className="GuestRecruitDetail-apply-button"
                onClick={handleGuestApply}
                disabled={isApplying}
            >
                {isApplying
                ? "신청 중..."
                : "게스트 신청하기"}
            </button>

        </section>

      </section>

    </div>
  );
}

export default GuestRecruitDetail;
