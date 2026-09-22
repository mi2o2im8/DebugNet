import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  getMatchAvailabilityDetail,
  getRequestableClubs,
  createMatchRequest,
} from "./api/matchApi";

import { useParams } from "react-router-dom";

import BottomNav from "../../components/BottomNav";
import BackButton from "../../components/BackButton/BackButton";
import CustomSelect from "../../components/common/CustomSelect";

import "./CSS/MatchTeamDetail.css";
import "./CSS/MatchCommon.css";

const formatMatchTime = (time) => {
  if (!time) {
    return "";
  }

  return time.slice(0, 5);
};

function MatchTeamDetail() {
  // URL의 상대팀 경기 등록 ID
  // 예: /matches/team/101 → 101
  const { availabilityId } = useParams();

  // 카카오 지도를 표시할 div 참조
  const mapRef = useRef(null);


  // ========================================
  // 매칭 신청 완료 모달 열림 여부
  // ========================================
  const [
    isRequestCompleteOpen,
    setIsRequestCompleteOpen,
  ] = useState(false);


  // ========================================
  // 현재 경기의 매칭 신청 완료 여부
  // ========================================
  // 지금은 프론트에서만 관리.
  // 백엔드 연결 후에는 club_matches 상태값으로 판단한다.
  const [
    requestSent,
    setRequestSent,
  ] = useState(false);


  // ========================================
  // 매칭 신청 가능한 내 동호회
  // ========================================
  const [
    myClubs,
    setMyClubs,
  ] = useState([]);


  // 신청 가능한 동호회 조회 중
  const [
    isClubLoading,
    setIsClubLoading,
  ] = useState(false);


  // 실제 신청 요청 중
  const [
    isRequestSubmitting,
    setIsRequestSubmitting,
  ] = useState(false);

  // ========================================
  // 매칭 신청용 내 동호회 드롭다운
  // ========================================
  const myClubOptions =
    myClubs.map((club) => ({
      value:
        String(club.club_id),

      label:
        club.club_name,
    }));

  // 매칭 신청에 사용할 내 클럽
  const [selectedClubId, setSelectedClubId] =
    useState("");


  // ========================================
  // 상대팀 경기 상세
  // ========================================
  const [
    match,
    setMatch,
  ] = useState(null);


  // 상세 조회 로딩
  const [
    isLoading,
    setIsLoading,
  ] = useState(true);


  // ========================================
  // 내 클럽 선택창 열림 여부
  // ========================================
  const [
    isClubSelectOpen,
    setIsClubSelectOpen,
  ] = useState(false);

  // ========================================
  // 상대팀 경기 상세 조회
  // ========================================
  useEffect(() => {

    const loadMatchDetail =
      async () => {

        // URL에 availabilityId가 없으면
        // 잘못된 API 요청을 보내지 않는다.
        if (!availabilityId) {
          console.error(
            "availabilityId가 없습니다."
          );

          setIsLoading(false);

          return;
        }

        try {

          const data =
            await getMatchAvailabilityDetail(
              availabilityId
            );

          // ========================================
          // 상세 데이터 저장
          // ========================================
          setMatch(data);


          // ========================================
          // 기존 매칭 신청 여부 복원
          // ========================================
          // 백엔드에서 현재 로그인 사용자가
          // 이미 이 경기에 신청했는지 알려준다.
          //
          // pending 또는 approved 신청이 있으면 true
          // rejected만 있으면 false
          setRequestSent(
            data.has_requested === true
          );

        } catch (error) {

          console.error(
            "상대팀 경기 상세 조회 실패:",
            error
          );

          alert(
            error.message ||
            "경기 정보를 불러오지 못했습니다."
          );

        } finally {

          setIsLoading(false);
        }
      };


    loadMatchDetail();

  }, [availabilityId]);


  /*
    경기장 지도 표시

    실제 DB 연결 후에는
    등록할 때 저장한 latitude / longitude를 그대로 사용
  */
  useEffect(() => {
    // 좌표 또는 지도 영역이 없으면 실행하지 않음
    if (
      !match ||
      match.latitude == null ||
      match.longitude == null ||
      !mapRef.current ||
      !window.kakao?.maps
    ) {
      return;
    }

    window.kakao.maps.load(() => {
      // 저장된 좌표로 지도 위치 생성
      const position =
        new window.kakao.maps.LatLng(
          match.latitude,
          match.longitude
        );

      // 지도 생성
      const map =
        new window.kakao.maps.Map(
          mapRef.current,
          {
            center: position,
            level: 4,
          }
        );

      // 경기장 위치에 마커 표시
      new window.kakao.maps.Marker({
        map,
        position,
      });
    });
  }, [
    match?.latitude,
    match?.longitude,
  ]);


  // ========================================
  // 매칭 신청 버튼 클릭
  // ========================================
  const handleMatchRequest =
    async () => {

      setIsClubLoading(true);

      try {

        // 현재 상대 경기 기준으로
        // 내가 신청 가능한 동호회 조회
        const response =
          await getRequestableClubs(
            availabilityId
          );


        const clubs =
          response.clubs || [];


        // 신청 가능한 동호회가 없는 경우
        if (clubs.length === 0) {

          alert(
            "매칭 신청이 가능한 내 동호회가 없습니다."
          );

          return;
        }


        setMyClubs(clubs);

        // 이전 선택값 초기화
        setSelectedClubId("");

        // 동호회 선택 모달 열기
        setIsClubSelectOpen(true);


      } catch (error) {

        console.error(
          "매칭 신청 가능 동호회 조회 실패:",
          error
        );

        alert(
          error.message ||
          "신청 가능한 동호회를 불러오지 못했습니다."
        );

      } finally {

        setIsClubLoading(false);
      }
    };


  // ========================================
  // 내 동호회 선택 후 실제 매칭 신청
  // ========================================
  const handleConfirmClub =
    async () => {

      if (!selectedClubId) {
        alert(
          "매칭을 신청할 팀을 선택해주세요."
        );
        return;
      }


      const selectedClub =
        myClubs.find(
          (club) =>
            club.club_id ===
            Number(selectedClubId)
        );


      if (!selectedClub) {
        return;
      }


      const confirmed =
        window.confirm(
          `${selectedClub.club_name} 팀으로 ${match.club_name} 팀에게 매칭 신청을 보내시겠습니까?`
        );


      if (!confirmed) {
        return;
      }


      setIsRequestSubmitting(true);


      try {

        const response =
          await createMatchRequest({
            availabilityId:
              Number(availabilityId),

            requesterClubId:
              selectedClub.club_id,
          });


        // 신청 성공
        setRequestSent(true);

        // 선택 모달 닫기
        setIsClubSelectOpen(false);

        // 선택값 초기화
        setSelectedClubId("");

        // 완료 모달 표시
        setIsRequestCompleteOpen(true);


        console.log(
          "매칭 신청 완료:",
          response
        );


      } catch (error) {

        console.error(
          "매칭 신청 실패:",
          error
        );


        alert(
          error.message ||
          "매칭 신청에 실패했습니다."
        );

      } finally {

        setIsRequestSubmitting(false);
      }
    };

    // ========================================
    // 상세 조회 중
    // ========================================
    if (isLoading) {
      return (
        <div className="match-team-detail-container">

          <header className="match-team-detail-header">
            <BackButton
              to="/matches"
              className="match-shared-back-button"
            />

            <h1>
              경기 상세
            </h1>
          </header>


          <main className="match-team-detail-main">
            <p>
              경기 정보를 불러오는 중입니다.
            </p>
          </main>


          <BottomNav />

        </div>
      );
    }


    // ========================================
    // 상세 데이터가 없는 경우
    // ========================================
    if (!match) {
      return (
        <div className="match-team-detail-container">

          <header className="match-team-detail-header">
            <BackButton
              to="/matches"
              className="match-shared-back-button"
            />

            <h1>
              경기 상세
            </h1>
          </header>


          <main className="match-team-detail-main">
            <p>
              경기 정보를 불러올 수 없습니다.
            </p>
          </main>


          <BottomNav />

        </div>
      );
    }


  return (
    <div className="match-team-detail-container">

      {/* ================================
          상단 헤더
      ================================= */}

      <header className="match-team-detail-header">

        {/* 공용 뒤로가기 버튼 */}
        <BackButton to="/matches" className="match-shared-back-button" />

        <h1>
          경기 상세
        </h1>

      </header>


      <main className="match-team-detail-main">

        {/* ================================
            클럽 정보
        ================================= */}

        <section className="match-team-detail-club">

          {/* 현재 모집 상태 */}
          <span className="match-team-detail-status">
            매칭 모집중
          </span>


          {/* 클럽 프로필 사진 */}
          <div className="match-team-detail-profile">

            {match.club_profile_image ? (
              <img
                src={match.club_profile_image}
                alt={`${match.club_name} 프로필`}
              />
            ) : (
              // 프로필 사진이 없으면
              // 클럽 이름 첫 글자 표시
              <div className="match-team-detail-profile-fallback">
                {match.club_name?.charAt(0)}
              </div>
            )}

          </div>


          {/* 클럽 이름 */}
          <h2>
            {match.club_name}
          </h2>


          {/* 한 줄 소개 */}
          {match.intro && (
            <p>
              {match.intro}
            </p>
          )}

        </section>


        {/* ================================
            경기 정보
        ================================= */}

        <section className="match-team-detail-section">

          <h3>
            경기 정보
          </h3>


          {/* 경기 날짜 */}
          <div className="match-team-detail-row">
            <span>날짜</span>

            <strong>
              {match.match_date}
            </strong>
          </div>


          {/* 경기 시간 */}
          <div className="match-team-detail-row">
            <span>시간</span>

            <strong>
              {formatMatchTime(
                match.start_time
              )}

              {" ~ "}

              {formatMatchTime(
                match.end_time
              )}
            </strong>
          </div>


          {/* 종목 */}
          <div className="match-team-detail-row">
            <span>종목</span>

            <strong>
              {match.sport_name}
            </strong>
          </div>


          {/* 경기 인원 */}
          <div className="match-team-detail-row">
            <span>경기 인원</span>

            <strong>
              {match.required_players}명
            </strong>
          </div>


          {/* 실력 수준 */}
          <div className="match-team-detail-row">
            <span>실력 수준</span>

            <strong>
              {match.skill_level}
            </strong>
          </div>

        </section>


        {/* ================================
            경기 장소
        ================================= */}

        <section className="match-team-detail-section">

          <h3>
            경기 장소
          </h3>


          {/* 장소 이름 / 주소 */}
          <div className="match-team-detail-place-heading">

            <strong>
              {match.location_name}
            </strong>

            <span>
              {match.address}
            </span>

          </div>


          {/* 카카오 지도 */}
          <div
            ref={mapRef}
            className="match-team-detail-map"
          />

        </section>


        {/* ================================
            추가 조건
        ================================= */}

        <section className="match-team-detail-section">

          <h3>
            추가 조건
          </h3>


          <div className="match-team-detail-tags">

            {/* 실내 / 실외 */}
            {match.venue_type && (
              <span>
                {match.venue_type}
              </span>
            )}


            {/* 주차 여부 */}
            {match.parking_available === true && (
              <span>
                주차 가능
              </span>
            )}

            {match.parking_available === false && (
              <span>
                주차 불가능
              </span>
            )}


            {/* 장소 비용 협의 여부 */}
            {match.venue_cost_negotiable === true && (
              <span>
                장소 비용 협의 가능
              </span>
            )}

            {match.venue_cost_negotiable === false && (
              <span>
                장소 비용 협의 불가
              </span>
            )}


            {/* 경기 시간 협의 여부 */}
            {match.time_negotiable === true && (
              <span>
                경기 시간 협의 가능
              </span>
            )}

            {match.time_negotiable === false && (
              <span>
                경기 시간 협의 불가
              </span>
            )}

          </div>

        </section>


        {/* ========================================
            매칭 신청 버튼
        ======================================== */}
        <button
          type="button"
          className={
            requestSent
              ? "match-team-request-button completed"
              : "match-team-request-button"
          }
          onClick={handleMatchRequest}

          // 이미 신청했다면 다시 신청하지 못하게 막음
          disabled={
            requestSent ||
            isClubLoading ||
            match?.status !== "open"
          }
        >
          {requestSent
            ? "매칭 신청 완료"
            : isClubLoading
              ? "불러오는 중..."
              : match?.status !== "open"
                ? "매칭 모집 마감"
                : "매칭 신청"}
        </button>

        {/* ========================================
            매칭 신청할 내 클럽 선택 모달
        ======================================== */}

        {isClubSelectOpen && (
          <div className="match-club-select-overlay">

            <div className="match-club-select-modal">

              {/* 모달 제목 */}
              <div className="match-club-select-header">
                <h3>
                  매칭 신청
                </h3>

                {/* 모달 닫기
                    닫을 때 선택한 팀도 초기화 */}
                <button
                  type="button"
                  onClick={() => {
                    // 모달 닫기
                    setIsClubSelectOpen(false);

                    // 선택한 클럽 초기화
                    setSelectedClubId("");

                  }}
                  aria-label="닫기"
                >
                  ×
                </button>
              </div>


              {/* ========================================
                  내 클럽 선택 드롭다운
                  공용 CustomSelect 사용
              ======================================== */}
              <div className="match-club-select-custom">
                <CustomSelect
                  value={selectedClubId}
                  options={myClubOptions}
                  onChange={setSelectedClubId}
                  placeholder="어떤 팀으로 신청하시겠습니까?"
                  ariaLabel="매칭 신청 팀 선택"
                />
              </div>

              {/* 선택한 클럽으로 매칭 신청 진행 */}
              <button
                type="button"
                className="match-club-select-confirm"
                onClick={handleConfirmClub}
                disabled={isRequestSubmitting}
              >
                {isRequestSubmitting
                  ? "신청 중..."
                  : "신청하기"}
              </button>

            </div>

          </div>
        )}


        {/* ========================================
            매칭 신청 완료 모달
        ======================================== */}
        {isRequestCompleteOpen && (
          <div className="match-request-complete-overlay">

            <div className="match-request-complete-modal">

              {/* 완료 표시 */}
              <div className="match-request-complete-icon">
                ✓
              </div>


              {/* 제목 */}
              <h3>
                매칭 신청 완료
              </h3>


              {/* 안내 문구 */}
              <p>
                {match.club_name} 팀에게
                <br />
                매칭 신청을 보냈습니다.
              </p>


              {/* 완료 모달 닫기 */}
              <button
                type="button"
                onClick={() =>
                  setIsRequestCompleteOpen(false)
                }
              >
                확인
              </button>

            </div>

          </div>
        )}

      </main>


      {/* 하단 네비게이션 */}
      <BottomNav />

    </div>
  );
}


export default MatchTeamDetail;