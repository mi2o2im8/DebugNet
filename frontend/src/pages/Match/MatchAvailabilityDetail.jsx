import { useNavigate, useParams } from "react-router-dom";
import {
  useEffect,
  useRef,
} from "react";
import BottomNav from "../../components/BottomNav";


import "./CSS/MatchAvailability.css";


function MatchAvailabilityDetail() {
  const navigate = useNavigate();

  const { availabilityId } = useParams();

  const mapRef = useRef(null);


  // 나중에 백엔드에서 조회
  const availability = {
    availability_id: availabilityId,

    club_name: "관악 FC",

    club_profile_image: null,

    match_date: "2026-09-26",

    start_time: "19:00",
    end_time: "21:00",

    sport_name: "축구/풋살",

    required_players: 6,

    skill_level: "중급",

    region: "관악구",

    location_name: "관악구민운동장",

    address:
      "서울특별시 관악구 낙성대로 40",

    latitude: 37.4782,
    longitude: 126.9584,

    venue_type: "실외",

    parking_available: true,

    venue_cost_negotiable: null,

    time_negotiable: true,

    intro:
      "즐겁게 경기하실 팀 찾습니다!",

    status: "OPEN",
  };

  useEffect(() => {
    if (
      !availability.latitude ||
      !availability.longitude ||
      !mapRef.current ||
      !window.kakao?.maps
    ) {
      return;
    }

    window.kakao.maps.load(() => {
      const position =
        new window.kakao.maps.LatLng(
          availability.latitude,
          availability.longitude
        );

      const map =
        new window.kakao.maps.Map(
          mapRef.current,
          {
            center: position,
            level: 4,
          }
        );

      new window.kakao.maps.Marker({
        map,
        position,
      });
    });
  }, [
    availability.latitude,
    availability.longitude,
  ]);


  const handleEdit = () => {
    navigate(
      `/matches/availability/${availabilityId}/edit`
    );
  };


  const handleDelete = () => {
    const confirmed = window.confirm(
      "등록한 경기 가능일을 삭제하시겠습니까?"
    );

    if (!confirmed) {
      return;
    }

    // 나중에 DELETE API 연결
    console.log(
      "삭제할 availability:",
      availabilityId
    );

    navigate("/matches");
  };


  const handleFindTeam = () => {
    navigate(
      `/matches/availability/${availabilityId}/teams`
    );
  };


  return (
    <div className="match-availability-container">

      {/* 상단 */}

      <header className="match-availability-header">

        <button
          type="button"
          onClick={() => navigate(-1)}
        >
          ‹
        </button>

        <h1>
          경기 가능일
        </h1>

      </header>


      <main className="match-availability-main">

        {/* ================================
            매칭 상태 + 클럽 정보
        ================================ */}

        <section className="match-detail-status">

          {/* 현재 매칭 상태 */}
          <span className="match-detail-status-badge">
            매칭 대기중
          </span>


          {/* 클럽 프로필 사진 */}
          <div className="match-detail-club-image">

            {availability.club_profile_image ? (
              <img
                src={availability.club_profile_image}
                alt={`${availability.club_name} 프로필`}
              />
            ) : (
              // 프로필 사진이 없을 때 클럽 이름 첫 글자 표시
              <div className="match-detail-club-image-fallback">
                {availability.club_name?.charAt(0)}
              </div>
            )}

          </div>


          {/* 클럽 이름 */}
          <h2 className="match-detail-club-name">
            {availability.club_name}
          </h2>


          {/* 한 줄 소개 */}
          <p className="match-detail-club-intro">
            {availability.intro}
          </p>

        </section>


        {/* 경기 정보 */}

        <section className="match-detail-section">

          <h3>
            경기 정보
          </h3>

          <div className="match-detail-row">
            <span>날짜</span>

            <strong>
              {availability.match_date}
            </strong>
          </div>


          <div className="match-detail-row">
            <span>시간</span>

            <strong>
              {availability.start_time}
              {" ~ "}
              {availability.end_time}
            </strong>
          </div>


          <div className="match-detail-row">
            <span>종목</span>

            <strong>
              {availability.sport_name}
            </strong>
          </div>


          <div className="match-detail-row">
            <span>경기 인원</span>

            <strong>
              {availability.required_players}명
            </strong>
          </div>


          <div className="match-detail-row">
            <span>실력 수준</span>

            <strong>
              {availability.skill_level}
            </strong>
          </div>

        </section>


        {/* ================================
            경기 장소
        ================================ */}

        <section className="match-detail-section">

          <h3>
            경기 장소
          </h3>


          {/* 지도 위 장소 제목 */}
          <div className="match-detail-place-heading">

            {/* 장소명 */}
            <strong>
              {availability.location_name}
            </strong>

            {/* 주소 */}
            <span>
              {availability.address}
            </span>

          </div>


          {/* 카카오 지도 */}
          <div
            ref={mapRef}
            className="match-detail-map"
          />

        </section>


        {/* 추가 조건 */}

        <section className="match-detail-section">

          <h3>
            추가 조건
          </h3>


          <div className="match-detail-tags">

            {availability.venue_type && (
              <span>
                {availability.venue_type}
              </span>
            )}


            {availability.parking_available === true && (
              <span>
                주차 가능
              </span>
            )}


            {availability.parking_available === false && (
              <span>
                주차 불가능
              </span>
            )}


            {availability.venue_cost_negotiable === true && (
              <span>
                장소 비용 협의 가능
              </span>
            )}


            {availability.venue_cost_negotiable === false && (
              <span>
                장소 비용 협의 불가
              </span>
            )}


            {availability.time_negotiable === true && (
              <span>
                시간 협의 가능
              </span>
            )}


            {availability.time_negotiable === false && (
              <span>
                시간 협의 불가
              </span>
            )}

          </div>

        </section>


        {/* 수정 / 삭제 */}

        <div className="match-detail-manage-buttons">

          <button
            type="button"
            onClick={handleEdit}
          >
            수정
          </button>

          <button
            type="button"
            onClick={handleDelete}
          >
            삭제
          </button>

        </div>


        {/* 상대팀 찾기 */}

        <button
          type="button"
          className="match-find-team-button"
          onClick={handleFindTeam}
        >
          상대팀 찾기
        </button>

      </main>


      <BottomNav />

    </div>
  );
}


export default MatchAvailabilityDetail;