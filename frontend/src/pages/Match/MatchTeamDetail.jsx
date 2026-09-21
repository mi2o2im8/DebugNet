import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import BottomNav from "../../components/BottomNav";

import "./CSS/MatchTeamDetail.css";


function MatchTeamDetail() {
  // 페이지 이동
  const navigate = useNavigate();

  // URL의 상대팀 경기 등록 ID
  // 예: /matches/team/101 → 101
  const { availabilityId } = useParams();

  // 카카오 지도를 표시할 div 참조
  const mapRef = useRef(null);

  // ========================================
  // 내 클럽 선택 드롭다운 열림 여부
  // ========================================
  const [
    isClubDropdownOpen,
    setIsClubDropdownOpen,
  ] = useState(false);

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
  // 내가 매칭을 신청할 수 있는 클럽
  // ========================================
  // 지금은 화면 확인용 더미데이터.
  // 백엔드 연결 후에는 로그인 사용자가
  // 운영하거나 매칭 권한을 가진 클럽을 조회한다.
  const myClubs = [
    {
      club_id: 1,
      club_name: "관악 FC",
    },
    {
      club_id: 2,
      club_name: "서울 플레이어스",
    },
  ];

  // 매칭 신청에 사용할 내 클럽
  const [selectedClubId, setSelectedClubId] =
    useState("");

  // ========================================
  // 현재 선택된 내 클럽 정보
  // ========================================
  const selectedClub = myClubs.find(
    (club) =>
      club.club_id === Number(selectedClubId)
  );


  /*
    상대팀 경기 등록 정보 더미데이터

    나중에는 availabilityId를 이용해
    백엔드 상세조회 API에서 받아올 예정
  */
  const match = {
    availability_id: availabilityId,

    club_id: 11,

    club_name: "신림 FC",

    // 클럽 프로필 사진
    // 실제 연결 전이므로 현재는 null
    club_profile_image: null,

    match_date: "2026-09-26",

    start_time: "19:00",
    end_time: "21:00",

    sport_name: "축구/풋살",

    required_players: 6,

    skill_level: "중급",

    region: "관악구",

    location_name: "신림체육센터",

    address:
      "서울특별시 관악구 난곡로 58길",

    // 현재는 더미 좌표
    latitude: 37.4821,
    longitude: 126.9293,

    // 추가 조건
    venue_type: "실내",

    parking_available: true,

    venue_cost_negotiable: null,

    time_negotiable: true,

    intro:
      "매너 있게 즐겁게 경기하실 팀 찾습니다.",

    status: "OPEN",
  };


  // ========================================
  // 내 클럽 선택창 열림 여부
  // ========================================
  const [
    isClubSelectOpen,
    setIsClubSelectOpen,
  ] = useState(false);


  /*
    경기장 지도 표시

    실제 DB 연결 후에는
    등록할 때 저장한 latitude / longitude를 그대로 사용
  */
  useEffect(() => {
    // 좌표 또는 지도 영역이 없으면 실행하지 않음
    if (
      !match.latitude ||
      !match.longitude ||
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
    match.latitude,
    match.longitude,
  ]);


  // ========================================
  // 매칭 신청 버튼 클릭
  // ========================================
  const handleMatchRequest = () => {
    // 신청 가능한 내 클럽이 없으면 진행하지 않음
    if (myClubs.length === 0) {
      alert(
        "매칭 신청이 가능한 내 클럽이 없습니다."
      );
      return;
    }

    // 내 클럽 선택창 열기
    setIsClubSelectOpen(true);
  };


  // ========================================
  // 내 클럽 선택 후 매칭 신청 확인
  // ========================================
  const handleConfirmClub = () => {
    // 아직 내 클럽을 선택하지 않은 경우
    if (!selectedClubId) {
      alert("매칭을 신청할 팀을 선택해주세요.");
      return;
    }

    // 선택한 클럽 정보 찾기
    const selectedClub = myClubs.find(
      (club) =>
        club.club_id === Number(selectedClubId)
    );

    if (!selectedClub) {
      return;
    }

    // 내 클럽 선택창 닫기
    setIsClubSelectOpen(false);

    // 실제 신청 전 최종 확인
    const confirmed = window.confirm(
      `${selectedClub.club_name} 팀으로 ${match.club_name} 팀에게 매칭 신청을 보내시겠습니까?`
    );

    // 취소하면 아무 작업도 하지 않음
    if (!confirmed) {
      return;
    }

    // ========================================
    // TODO: 백엔드 연결 후 실제 POST 요청
    // ========================================
    console.log({
      availability_id:
        match.availability_id,

      requester_club_id:
        selectedClub.club_id,

      target_club_id:
        match.club_id,
    });

    // 신청 완료 상태로 변경
    setRequestSent(true);

    // 클럽 선택 모달 닫기
    setIsClubSelectOpen(false);

    // 드롭다운 닫기
    setIsClubDropdownOpen(false);

    // 신청 완료 모달 열기
    setIsRequestCompleteOpen(true);
  };


  return (
    <div className="match-team-detail-container">

      {/* ================================
          상단 헤더
      ================================= */}

      <header className="match-team-detail-header">

        {/* 이전 화면 */}
        <button
          type="button"
          onClick={() => navigate(-1)}
        >
          ‹
        </button>

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
              {match.start_time}
              {" ~ "}
              {match.end_time}
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
          disabled={requestSent}
        >
          {requestSent
            ? "매칭 신청 완료"
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

                    // 열려 있던 드롭다운도 닫기
                    setIsClubDropdownOpen(false);
                  }}
                  aria-label="닫기"
                >
                  ×
                </button>
              </div>


              {/* ========================================
                  내 클럽 선택 드롭다운
              ======================================== */}
              <div className="match-club-dropdown">

                {/* 현재 선택값 / 드롭다운 열기 버튼 */}
                <button
                  type="button"
                  className="match-club-dropdown-button"
                  onClick={() =>
                    setIsClubDropdownOpen(
                      !isClubDropdownOpen
                    )
                  }
                >
                  {/* 클럽을 선택했으면 이름 표시,
                      아직 선택 전이면 안내 문구 표시 */}
                  <span
                    className={
                      selectedClub
                        ? "selected"
                        : ""
                    }
                  >
                    {selectedClub
                      ? selectedClub.club_name
                      : "어떤 팀으로 신청하시겠습니까?"}
                  </span>

                  {/* 드롭다운 화살표 */}
                  <span
                    className={
                      isClubDropdownOpen
                        ? "match-club-dropdown-arrow open"
                        : "match-club-dropdown-arrow"
                    }
                  >
                    ▾
                  </span>
                </button>


                {/* 드롭다운이 열렸을 때만 클럽 목록 표시 */}
                {isClubDropdownOpen && (
                  <div className="match-club-dropdown-menu">

                    {myClubs.map((club) => (

                      <button
                        key={club.club_id}
                        type="button"

                        className={
                          Number(selectedClubId) ===
                          club.club_id
                            ? "active"
                            : ""
                        }

                        onClick={() => {
                          // 선택한 클럽 ID 저장
                          setSelectedClubId(
                            club.club_id
                          );

                          // 선택 후 드롭다운 닫기
                          setIsClubDropdownOpen(
                            false
                          );
                        }}
                      >
                        {/* 클럽 프로필 임시 표시 */}
                        <div className="match-club-dropdown-profile">
                          {club.club_name?.charAt(0)}
                        </div>

                        {/* 클럽 이름 */}
                        <strong>
                          {club.club_name}
                        </strong>

                        {/* 현재 선택된 클럽 체크 */}
                        {Number(selectedClubId) ===
                          club.club_id && (
                          <span className="match-club-dropdown-check">
                            ✓
                          </span>
                        )}

                      </button>

                    ))}

                  </div>
                )}

              </div>


              {/* 선택한 클럽으로 매칭 신청 진행 */}
              <button
                type="button"
                className="match-club-select-confirm"
                onClick={handleConfirmClub}
              >
                신청하기
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