import { useNavigate, useParams } from "react-router-dom";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import BottomNav from "../../components/BottomNav";
import BackButton from "../../components/BackButton/BackButton";
import {
  getMatchAvailabilityDetail,
  deleteMatchAvailability,
} from "./api/matchApi";


import "./CSS/MatchAvailability.css";
import "./CSS/MatchCommon.css";

// ========================================
// 시간 표시
// ========================================
const formatMatchTime = (time) => {
  if (!time) {
    return "";
  }

  return time.slice(0, 5);
};


function MatchAvailabilityDetail() {
  const navigate = useNavigate();

  const { availabilityId } = useParams();

  const mapRef = useRef(null);


  // ========================================
  // 경기 가능일 상세 데이터
  // ========================================
  // 백엔드 상세조회 API 결과를 저장한다.
  const [
    availability,
    setAvailability,
  ] = useState(null);


  // 상세 데이터를 불러오는 중인지 확인
  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  // ========================================
  // 경기 가능일 상세 조회
  // ========================================
  useEffect(() => {

    const loadAvailabilityDetail =
      async () => {

        try {

          // URL의 availabilityId로
          // 실제 경기 가능일 상세 데이터 조회
          const data =
            await getMatchAvailabilityDetail(
              availabilityId
            );

          // 조회한 데이터를 화면에서 사용
          setAvailability(data);

        } catch (error) {

          console.error(
            "경기 가능일 상세 조회 실패:",
            error
          );

          alert(
            error.message ||
            "경기 정보를 불러오지 못했습니다."
          );

        } finally {

          // 성공/실패 여부와 상관없이
          // 로딩 상태 종료
          setIsLoading(false);
        }
      };


    loadAvailabilityDetail();

  }, [availabilityId]);

  useEffect(() => {
    // 상세 데이터가 아직 없거나
    // 좌표가 없는 경우 지도 생성하지 않음
    if (
      !availability ||
      availability.latitude == null ||
      availability.longitude == null ||
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
    availability?.latitude,
    availability?.longitude,
  ]);


  // ========================================
  // 수정 화면 이동
  // ========================================
  const handleEdit = () => {
    // 수정 화면에서 availabilityId로
    // 실제 상세 데이터를 다시 조회한다.
    navigate(
      `/matches/availability/${availabilityId}/edit`
    );
  };


  // ========================================
  // 경기 가능일 삭제
  // ========================================
  const handleDelete = async () => {

    // ----------------------------------------
    // 1차 삭제 확인
    // ----------------------------------------
    const confirmed =
      window.confirm(
        "등록한 경기 가능일을 삭제하시겠습니까?"
      );

    // 취소하면 종료
    if (!confirmed) {
      return;
    }


    try {

      // ----------------------------------------
      // 일반 삭제 요청
      //
      // 매칭 신청이 없는 경우:
      // → 바로 삭제
      //
      // 매칭 신청이 있는 경우:
      // → 백엔드에서 409 반환
      // ----------------------------------------
      const response =
        await deleteMatchAvailability(
          availabilityId,
          false
        );


      alert(
        response.message ||
        "경기 가능일이 삭제되었습니다."
      );


      // 삭제된 상세페이지에 남아있지 않고
      // 팀매칭 홈으로 이동
      navigate("/matches");


    } catch (error) {

      // ========================================
      // 매칭 신청이 들어온 경기인 경우
      // ========================================
      if (
        error.status === 409 &&
        error.data?.detail?.requires_confirmation
      ) {

        // 백엔드에서 전달한 현재 매칭 신청 건수
        const requestCount =
          error.data.detail.request_count;


        // 실제 신청 건수까지 사용자에게 안내
        const finalConfirmed =
          window.confirm(
            `현재 이 경기에는 매칭 신청이 ${requestCount}건 있습니다.\n\n`
            + "경기 등록을 삭제하면 해당 매칭 신청도 함께 삭제됩니다.\n"
            + "정말 삭제하시겠습니까?"
          );


        // 최종 삭제 취소
        if (!finalConfirmed) {
          return;
        }


        try {

          // 사용자가 다시 확인했으므로
          // confirm=true로 최종 삭제
          const response =
            await deleteMatchAvailability(
              availabilityId,
              true
            );


          alert(
            response.message ||
            "경기 가능일이 삭제되었습니다."
          );


          // 삭제 후 팀매칭 홈으로 이동
          navigate("/matches");


        } catch (
          confirmDeleteError
        ) {

          console.error(
            "경기 가능일 최종 삭제 실패:",
            confirmDeleteError
          );


          alert(
            confirmDeleteError.message ||
            "경기 가능일 삭제에 실패했습니다."
          );
        }


        return;
      }


      // ========================================
      // 409 이외의 일반 오류
      // ========================================
      console.error(
        "경기 가능일 삭제 실패:",
        error
      );


      alert(
        error.message ||
        "경기 가능일 삭제에 실패했습니다."
      );
    }
  };


  const handleFindTeam = () => {
    // 현재 등록한 경기의 지역을 기준으로
    // 상대팀 목록 화면으로 이동
    navigate(
      `/matches/teams?district=${encodeURIComponent(
        availability.region
      )}`
    );
  };

  // ========================================
  // 상세 데이터 로딩 중
  // ========================================
  if (isLoading) {
    return (
      <div className="match-availability-container">

        <header className="match-availability-header">

          <BackButton
            to="/matches"
            className="match-shared-back-button"
          />

          <h1>
            경기 가능일
          </h1>

        </header>


        <main className="match-availability-main">

          <p>
            경기 정보를 불러오는 중입니다.
          </p>

        </main>


        <BottomNav />

      </div>
    );
  }


  // 조회 실패 등으로 데이터가 없는 경우
  if (!availability) {
    return (
      <div className="match-availability-container">

        <header className="match-availability-header">

          <BackButton
            to="/matches"
            className="match-shared-back-button"
          />

          <h1>
            경기 가능일
          </h1>

        </header>


        <main className="match-availability-main">

          <p>
            경기 정보를 불러올 수 없습니다.
          </p>

        </main>


        <BottomNav />

      </div>
    );
  }


  return (
    <div className="match-availability-container">

      {/* 상단 */}

      <header className="match-availability-header">

        {/* 공용 뒤로가기 버튼 */}
        <BackButton to="/matches" className="match-shared-back-button" />

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
              {formatMatchTime(
                availability.start_time
              )}

              {" ~ "}

              {formatMatchTime(
                availability.end_time
              )}
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