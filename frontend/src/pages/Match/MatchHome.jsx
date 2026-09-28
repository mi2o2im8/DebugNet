import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBell,
  FiChevronRight,
  FiClock,
  FiMapPin,
  FiPlus,
  FiUsers,
  FiZap,
} from "react-icons/fi";

import BottomNav from "../../components/BottomNav";
import CustomSelect from "../../components/common/CustomSelect";
import MatchCalendar from "./components/MatchCalendar";
import {
  getMatchOptions,
  getMyMatchAvailabilities,
  getMatchAvailabilities,
} from "./api/matchApi";

import "./CSS/MatchHome.css";


// 서울 25개 자치구
const SEOUL_DISTRICTS = [
  "전체",
  "강남구",
  "강동구",
  "강북구",
  "강서구",
  "관악구",
  "광진구",
  "구로구",
  "금천구",
  "노원구",
  "도봉구",
  "동대문구",
  "동작구",
  "마포구",
  "서대문구",
  "서초구",
  "성동구",
  "성북구",
  "송파구",
  "양천구",
  "영등포구",
  "용산구",
  "은평구",
  "종로구",
  "중구",
  "중랑구",
];

// 공용 CustomSelect에서 사용할 지역 옵션
const DISTRICT_OPTIONS = SEOUL_DISTRICTS.map((district) => ({
  value: district,
  label: district,
}));


// ========================================
// 오늘 날짜 YYYY-MM-DD
// ========================================
// UTC가 아니라 사용자 PC의 로컬 날짜를 사용한다.
const getTodayDateString = () => {
  const today = new Date();

  const year =
    today.getFullYear();

  const month =
    String(
      today.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      today.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};


// ========================================
// 백엔드 시간 표시용
// ========================================
const formatMatchTime = (time) => {
  if (!time) {
    return "";
  }

  return time.slice(0, 5);
};


const formatSelectedDate = (dateString) => {
  if (!dateString) {
    return "";
  }

  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  return `${month}월 ${day}일`;
};


function MatchHome() {
  const navigate = useNavigate();

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    getTodayDateString()
  );

  const [selectedSport, setSelectedSport] =
    useState("전체");

  // 현재 사용자가 선택한 팀매칭 검색 지역
  const [selectedDistrict, setSelectedDistrict] =
    useState("관악구");

  // ========================================
  // 백엔드에서 가져오는 팀매칭 데이터
  // ========================================

  // 내가 팀매칭을 등록할 수 있는 동호회
  const [
    myClubs,
    setMyClubs,
  ] = useState([]);


  // 내가 등록한 경기 가능일
  const [
    myAvailabilities,
    setMyAvailabilities,
  ] = useState([]);


  // 상대팀이 등록한 경기 가능일
  const [
    teams,
    setTeams,
  ] = useState([]);


  // ========================================
  // 경기 가능일 등록 - 동호회 선택 모달
  // ========================================
  const [
    isRegisterClubSelectOpen,
    setIsRegisterClubSelectOpen,
  ] = useState(false);

  // 경기 가능일을 등록할 동호회
  const [
    selectedRegisterClubId,
    setSelectedRegisterClubId,
  ] = useState("");


  // ========================================
  // 동호회 선택 드롭다운 옵션
  // ========================================
  const myClubOptions = useMemo(
    () =>
      myClubs.map((club) => ({
        value: String(
          club.club_id
        ),

        label:
          club.club_name,
      })),

    [myClubs]
  );

  // ========================================
  // 최초 팀매칭 데이터 조회
  // ========================================
  useEffect(() => {
    const loadInitialMatchData =
      async () => {

        try {
          // 등록 가능한 내 동호회와
          // 내가 등록한 경기 가능일을 동시에 조회
          const [
            optionsResponse,
            myAvailabilityResponse,
          ] = await Promise.all([
            getMatchOptions(),
            getMyMatchAvailabilities(),
          ]);


          // 내가 운영 가능한 동호회
          setMyClubs(
            optionsResponse.clubs || []
          );


          // 내가 등록한 경기 가능일
          setMyAvailabilities(
            myAvailabilityResponse.items ||
              []
          );

        } catch (error) {
          console.error(
            "팀매칭 홈 초기 데이터 조회 실패:",
            error
          );
        }
      };


    loadInitialMatchData();
  }, []);

  // ========================================
  // 상대팀 경기 가능일 조회
  // ========================================
  //
  // 날짜를 보내지 않는 이유:
  // 달력에 "상대팀 경기 있음" 날짜를
  // 전체적으로 표시해야 하기 때문.
  //
  // 선택한 지역의 앞으로 모집 중인 경기들을
  // 한 번 받아온 뒤 날짜별로 화면에서 나눈다.
  // ========================================
  useEffect(() => {
    const loadOpponentTeams =
      async () => {

        try {
          const response =
            await getMatchAvailabilities({
              region:
                selectedDistrict,
            });


          setTeams(
            response.items || []
          );

        } catch (error) {
          console.error(
            "상대팀 경기 가능일 조회 실패:",
            error
          );

          setTeams([]);
        }
      };


    loadOpponentTeams();

  }, [selectedDistrict]);



  const myAvailabilityDates =
    useMemo(
      () =>
        myAvailabilities.map(
          (item) =>
            item.match_date
        ),

      [myAvailabilities]
    );


  // ========================================
  // 상대팀이 존재하는 날짜
  // ========================================
  const opponentAvailableDates =
    useMemo(
      () => [
        ...new Set(
          teams.map(
            (team) =>
              team.match_date
          )
        ),
      ],

      [teams]
    );

  // ========================================
  // 선택한 날짜에 내가 등록한 경기들
  // ========================================
  const selectedAvailabilities =
    myAvailabilities.filter(
      (item) =>
        item.match_date === selectedDate
    );


  // ========================================
  // 선택 날짜에 존재하는 상대팀 종목
  // ========================================
  const sports = useMemo(() => {

    const sportNames = teams
      .filter(
        (team) =>
          team.match_date ===
          selectedDate
      )
      .map(
        (team) =>
          team.sport_name
      );


    return [
      "전체",
      ...new Set(
        sportNames
      ),
    ];

  }, [
    teams,
    selectedDate,
  ]);


  // ========================================
  // 현재 날짜 + 종목의 상대팀
  // ========================================
  const filteredTeams =
    teams.filter((team) => {

      // 선택 날짜
      if (
        team.match_date !==
        selectedDate
      ) {
        return false;
      }


      // 선택 종목
      if (
        selectedSport !==
          "전체" &&
        team.sport_name !==
          selectedSport
      ) {
        return false;
      }


      return true;
    });


  const handleDateSelect = (
    dateString
  ) => {
    setSelectedDate(dateString);
    setSelectedSport("전체");
  };


  // ========================================
  // 경기 가능일 등록 버튼 클릭
  // ========================================
  const handleOpenRegisterClubSelect = () => {
    // 등록 가능한 동호회가 없으면 등록 화면으로 이동하지 않음
    if (myClubs.length === 0) {
      alert(
        "팀매칭을 등록할 수 있는 동호회가 없습니다."
      );
      return;
    }

    // 모달을 열 때 이전 선택값은 항상 초기화
    setSelectedRegisterClubId("");
    setIsRegisterClubSelectOpen(true);
  };


  // ========================================
  // 동호회 선택 모달 닫기
  // ========================================
  const handleCloseRegisterClubSelect = () => {
    setIsRegisterClubSelectOpen(false);

    // X로 닫은 뒤 다시 열면
    // "어떤 팀으로 등록하시겠습니까?"부터 다시 시작
    setSelectedRegisterClubId("");
  };


  // ========================================
  // 선택한 동호회로 경기 가능일 등록 시작
  // ========================================
  const handleStartAvailabilityRegister = () => {
    if (!selectedRegisterClubId) {
      alert(
        "팀매칭을 등록할 동호회를 선택해주세요."
      );
      return;
    }

    const selectedClub = myClubs.find(
      (club) =>
        club.club_id ===
        Number(selectedRegisterClubId)
    );

    if (!selectedClub) {
      return;
    }

    // 등록 화면 상단에서 선택한 동호회 정보를 보여줄 수 있도록
    // clubId / clubName / clubProfileImage를 전달한다.
    // 종목은 등록 폼에서 별도로 선택한다.
    // 실제 백엔드 연결 후에는 clubId만 전달하고
    // 등록 화면에서 동호회 상세 정보를 조회하는 방식으로 교체할 수 있다.
    const params = new URLSearchParams({
      clubId: String(selectedClub.club_id),
      clubName: selectedClub.club_name,
      clubProfileImage:
        selectedClub.club_profile_image || "",
    });

    navigate(
      `/matches/availability/new?${params.toString()}`
    );
  };


  return (
    <div className="match-home-container">

      {/* 상단 */}
      <header className="match-home-header">

        {/* ========================================
            팀매칭 검색 지역 선택
            공용 CustomSelect 사용
        ======================================== */}
        <div className="match-home-district-select">
          <CustomSelect
            value={selectedDistrict}
            options={DISTRICT_OPTIONS}
            onChange={setSelectedDistrict}
            ariaLabel="팀매칭 지역 선택"
          />
        </div>


        <h1>
          팀 매칭
        </h1>


        <button
          type="button"
          className="match-header-icon-btn"
          aria-label="알림"
          onClick={() =>
            alert(
              "알림 기능은 공통 알림 페이지와 연결 예정입니다."
            )
          }
        >
          <FiBell />
        </button>

      </header>


      <main className="match-home-main">

        {/* 달력 */}
        <MatchCalendar
          selectedDate={selectedDate}
          onSelectDate={
            handleDateSelect
          }
          myAvailabilityDates={
            myAvailabilityDates
          }
          opponentAvailableDates={
            opponentAvailableDates
          }
        />


        {/* 경기 가능일 등록 */}
        <button
          type="button"
          className="match-create-btn"
          onClick={handleOpenRegisterClubSelect}
        >
          <FiPlus />

          <span>
            경기 가능일 등록하기
          </span>
        </button>


        {/* ========================================
            선택한 날짜에 내가 등록한 경기
        ======================================== */}
        {selectedAvailabilities.length > 0 && (

          <section className="my-match-summary">

            {/* 제목 */}
            <div className="my-match-summary-top">

              <div>
                <span className="match-section-eyebrow">
                  내가 등록한 경기
                </span>

                <h2>
                  {formatSelectedDate(
                    selectedDate
                  )} 경기 가능
                </h2>
              </div>


              {/* 선택 날짜에 등록한 경기 개수 */}
              <span className="my-match-count">
                {selectedAvailabilities.length}개
              </span>

            </div>


            {/* ========================================
                등록한 경기 가로 스크롤
            ======================================== */}
            <div className="my-match-scroll">

              {selectedAvailabilities.map(
                (availability) => (

                  <button
                    key={
                      availability.availability_id
                    }
                    type="button"
                    className="my-match-card"

                    onClick={() =>
                      navigate(
                        `/matches/availability/${availability.availability_id}`
                      )
                    }
                  >

                    {/* 종목 */}
                    <strong>
                      {availability.sport_name}
                    </strong>


                    {/* 시간 */}
                    <span>
                      {formatMatchTime(
                        availability.start_time
                      )}

                      {" ~ "}

                      {formatMatchTime(
                        availability.end_time
                      )}
                    </span>


                    {/* 지역 */}
                    <span>
                      {availability.region}
                    </span>


                    {/* 장소 */}
                    <span>
                      {availability.location_name}
                    </span>

                  </button>

                )
              )}

            </div>

          </section>

        )}


        {/* ML은 추후 연결 */}
        <section
          className="match-ai-placeholder"
          aria-disabled="true"
        >
          <div className="match-ai-icon">
            <FiZap />
          </div>

          <div>
            <strong>
              AI 상대팀 추천
            </strong>

            <p>
              Match Fit 완성 후 연결됩니다.
            </p>
          </div>

          <span className="match-coming-soon">
            준비중
          </span>
        </section>


        {/* 날짜별 상대팀 목록 */}
        <section className="match-team-section">

          <div className="match-team-section-head">

            <div>
              <span className="match-section-eyebrow">
                직접 팀 찾기
              </span>

              <h2>
                {formatSelectedDate(
                  selectedDate
                )} 경기 가능한 팀
              </h2>
            </div>


            <span className="match-team-count">
              {filteredTeams.length}팀
            </span>

          </div>


          {/* 종목 필터 */}
          <div className="match-sport-tabs">

            {sports.map((sport) => (

              <button
                key={sport}
                type="button"
                className={
                  selectedSport === sport
                    ? "match-sport-tab active"
                    : "match-sport-tab"
                }
                onClick={() =>
                  setSelectedSport(
                    sport
                  )
                }
              >
                {sport}
              </button>

            ))}

          </div>


          <div className="match-team-list">

            {filteredTeams.length > 0 ? (

              filteredTeams.map(
                (team) => (

                  <button
                    key={
                      team.availability_id
                    }
                    type="button"
                    className="match-team-card"
                    onClick={() =>
                      navigate(
                        `/matches/team/${team.availability_id}`
                      )
                    }
                  >

                    <div className="match-team-card-main">

                      <div className="match-team-card-title-row">

                        {/* 클럽 프로필 + 클럽명 */}
                        <div className="match-home-team-club">
                          {team.club_profile_image ? (
                            <img
                              className="match-home-team-profile-image"
                              src={team.club_profile_image}
                              alt={`${team.club_name} 프로필`}
                            />
                          ) : (
                            <div className="match-home-team-profile-fallback">
                              {team.club_name?.charAt(0)}
                            </div>
                          )}

                          <strong>
                            {team.club_name}
                          </strong>
                        </div>

                        <FiChevronRight />

                      </div>


                      <div className="match-team-card-tags">

                        <span>
                          {team.sport_name}
                        </span>

                        <span>
                          {team.required_players}명
                        </span>

                        <span>
                          {team.skill_level}
                        </span>

                      </div>


                      <div className="match-team-card-info">

                        <span>
                          <FiClock />

                          {formatMatchTime(
                            team.start_time
                          )}
                          {" ~ "}
                          {formatMatchTime(
                            team.end_time
                          )}
                        </span>

                        <span>
                          <FiMapPin />
                          {team.region}
                        </span>

                      </div>

                    </div>


                  </button>

                )
              )

            ) : (

              <div className="match-empty">

                <FiUsers />

                <strong>
                  경기 가능한 팀이 없습니다.
                </strong>

                <p>
                  다른 날짜를 선택해보세요.
                </p>

              </div>

            )}

          </div>


          {/* 경기 등록 여부와 관계없이 상대팀 목록으로 이동 */}
          {filteredTeams.length > 0 && (
            <button
              type="button"
              className="match-team-more-btn"
              onClick={() =>
                navigate(
                  `/matches/teams?district=${encodeURIComponent(
                    selectedDistrict
                  )}`
                )
              }
            >
              경기 가능한 팀 더보기
              <FiChevronRight />
            </button>
          )}

        </section>



      </main>


      {/* ========================================
          경기 가능일을 등록할 동호회 선택 모달
          main 영역 밖에서 렌더링해 다른 레이아웃/스크롤에 가리지 않게 한다.
      ======================================== */}
        {isRegisterClubSelectOpen && (
          <div className="match-register-club-overlay">

            <div className="match-register-club-modal">

              <div className="match-register-club-header">
                <h3>
                  팀매칭 등록
                </h3>

                {/* X로 닫으면 선택값도 초기화 */}
                <button
                  type="button"
                  className="match-register-club-close"
                  onClick={handleCloseRegisterClubSelect}
                  aria-label="닫기"
                >
                  ×
                </button>
              </div>


              {/* 신청 모달과 같은 방식으로
                  내가 등록할 동호회를 드롭다운에서 선택 */}
              <div className="match-register-club-select">
                <CustomSelect
                  value={selectedRegisterClubId}
                  options={myClubOptions}
                  onChange={setSelectedRegisterClubId}
                  placeholder="어떤 팀으로 등록하시겠습니까?"
                  ariaLabel="팀매칭 등록 동호회 선택"
                />
              </div>


              <button
                type="button"
                className="match-register-club-confirm"
                onClick={handleStartAvailabilityRegister}
              >
                등록하기
              </button>

            </div>

          </div>
        )}


      <BottomNav />

    </div>
  );
}

export default MatchHome;
