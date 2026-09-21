
import { useNavigate, useSearchParams, } from "react-router-dom";

import BottomNav from "../../components/BottomNav";

import "./CSS/MatchTeamList.css";


function MatchTeamList() {
  // 페이지 이동을 위한 React Router 함수
  const navigate = useNavigate();

  // MatchHome에서 URL로 전달한 지역값 읽기
  const [searchParams] = useSearchParams();

  // 지역값이 없으면 전체 지역 표시
  const selectedDistrict =
    searchParams.get("district") || "전체";


  /*
    상대팀 목록
    지금은 더미데이터.
    나중에는 백엔드에서 경기 날짜, 종목, 지역,
    시간 등의 조건으로 검색해서 받아올 예정.
  */
  const teams = [
    {
      availability_id: 101,

      club_id: 11,

      club_name: "신림 FC",

      // 프로필 사진이 없으면 null
      club_profile_image: null,

      sport_name: "축구/풋살",

      skill_level: "중급",

      match_date: "2026-09-26",

      start_time: "19:00",
      end_time: "21:00",

      region: "관악구",

      location_name: "신림체육센터",

      venue_type: "실내",

      parking_available: true,

      venue_cost_negotiable: true,

      time_negotiable: false,

      intro: "매너 있게 즐겁게 경기하실 팀 찾습니다.",
    },

    {
      availability_id: 102,

      club_id: 12,

      club_name: "낙성대 유나이티드",

      club_profile_image: null,

      sport_name: "축구/풋살",

      skill_level: "중급",

      match_date: "2026-09-26",

      start_time: "19:30",
      end_time: "21:30",

      region: "관악구",

      location_name: "낙성대 풋살장",

      venue_type: "실외",

      parking_available: false,

      venue_cost_negotiable: null,

      time_negotiable: true,

      intro: "재미있는 경기 원합니다!",
    },

    {
      availability_id: 103,

      club_id: 13,

      club_name: "봉천 FC",

      club_profile_image: null,

      sport_name: "축구/풋살",

      skill_level: "초급",

      match_date: "2026-09-26",

      start_time: "20:00",
      end_time: "22:00",

      region: "관악구",

      location_name: "봉천동 풋살장",

      venue_type: "실외",

      parking_available: null,

      venue_cost_negotiable: true,

      time_negotiable: true,

      intro: "초중급 팀 환영합니다.",
    },
  ];

  // 선택한 지역에 맞는 경기만 화면에 표시
  const filteredTeams = teams.filter((team) => {
    // 전체 선택 시 모든 지역 표시
    if (selectedDistrict === "전체") {
      return true;
    }

    return team.region === selectedDistrict;
  });


  /*
    상대팀 상세보기

    targetAvailabilityId:
    상대팀이 등록한 경기 가능일 ID

    state:
    내가 어떤 경기 가능일을 기준으로
    상대팀을 찾고 있었는지도 같이 전달한다.
  */
// 상대팀이 등록한 경기 상세 페이지로 이동
const handleTeamDetail = (
  targetAvailabilityId
) => {
  navigate(
    `/matches/team/${targetAvailabilityId}`
  );
};


  return (
    <div className="match-team-list-container">

      {/* ================================
          상단 헤더
      ================================= */}

      {/* ================================
          상단 헤더
      ================================ */}
      <header className="match-team-list-header">

        {/* 뒤로가기 버튼
            이전 페이지인 MatchHome으로 돌아간다. */}
        <button
          type="button"
          className="match-team-list-back-button"
          onClick={() => navigate(-1)}
          aria-label="뒤로가기"
        >
          ‹
        </button>

        {/* 가운데 제목 */}
        <h1>
          팀 매칭
        </h1>

      </header>


      <main className="match-team-list-main">

        {/* ================================
            상대팀 목록 제목
        ================================= */}

        <section className="match-team-result-header">

          <div>
            <h2>
              경기 가능한 팀
            </h2>

            <p>
              등록한 경기 조건과 비교할 수 있는
              팀입니다.
            </p>
          </div>

          {/* 검색 결과 개수 */}
          <strong>
            {filteredTeams.length}팀
          </strong>

        </section>


        {/* ================================
            상대팀 목록
        ================================= */}

        <section className="match-team-search-list">

          {filteredTeams.map((team) => (

            <article
              key={team.availability_id}
              className="match-team-search-card"
            >

              {/* ------------------------------
                  클럽 프로필
              ------------------------------ */}

              <div className="match-team-card-header">

                {/* 클럽 프로필 이미지 */}
                {team.club_profile_image ? (

                  <img
                    className="match-team-profile-image"
                    src={team.club_profile_image}
                    alt={`${team.club_name} 프로필`}
                  />

                ) : (

                  /*
                    프로필 사진이 없는 경우
                    클럽 이름 첫 글자를 표시
                  */
                  <div className="match-team-profile-fallback">
                    {team.club_name?.charAt(0)}
                  </div>

                )}


                {/* 클럽 이름 + 기본 정보 */}
                <div className="match-team-club-info">

                  <strong>
                    {team.club_name}
                  </strong>

                  <span>
                    {team.skill_level}
                    {" · "}
                    {team.region}
                  </span>

                </div>

              </div>


              {/* ------------------------------
                  상대팀 한 줄 소개
              ------------------------------ */}

              {team.intro && (
                <p className="match-team-intro">
                  {team.intro}
                </p>
              )}


              {/* ------------------------------
                  경기 시간 / 장소
              ------------------------------ */}

              <div className="match-team-info">

                <div>
                  <span>
                    경기 시간
                  </span>

                  <strong>
                    {team.start_time}
                    {" ~ "}
                    {team.end_time}
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

              </div>


              {/* ------------------------------
                  추가 조건

                  null인 값은 표시하지 않는다.
              ------------------------------ */}

              <div className="match-team-tags">

                {/* 실내 / 실외 */}
                {team.venue_type && (
                  <span>
                    {team.venue_type}
                  </span>
                )}


                {/* 주차 여부 */}
                {team.parking_available === true && (
                  <span>
                    주차 가능
                  </span>
                )}

                {team.parking_available === false && (
                  <span>
                    주차 불가능
                  </span>
                )}


                {/* 장소 비용 협의 여부 */}
                {team.venue_cost_negotiable === true && (
                  <span>
                    비용 협의 가능
                  </span>
                )}

                {team.venue_cost_negotiable === false && (
                  <span>
                    비용 협의 불가
                  </span>
                )}


                {/* 경기 시간 협의 여부 */}
                {team.time_negotiable === true && (
                  <span>
                    시간 협의 가능
                  </span>
                )}

                {team.time_negotiable === false && (
                  <span>
                    시간 협의 불가
                  </span>
                )}

              </div>


              {/* ------------------------------
                  상대팀 상세보기
              ------------------------------ */}

              <button
                type="button"
                className="match-team-detail-button"
                onClick={() =>
                  handleTeamDetail(
                    team.availability_id
                  )
                }
              >
                상세보기
              </button>

            </article>

          ))}

        </section>

      </main>


      {/* 하단 네비게이션 */}
      <BottomNav />

    </div>
  );
}


export default MatchTeamList;