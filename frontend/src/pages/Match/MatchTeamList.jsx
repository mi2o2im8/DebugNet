import {
  useEffect,
  useState,
} from "react";
import { useNavigate, useSearchParams, } from "react-router-dom";
import {
  getMatchAvailabilities,
} from "./api/matchApi";

import BottomNav from "../../components/BottomNav";
import BackButton from "../../components/BackButton/BackButton";

import "./CSS/MatchTeamList.css";
import "./CSS/MatchCommon.css";

// ========================================
// 백엔드 시간 표시
// ========================================
const formatMatchTime = (time) => {
  if (!time) {
    return "";
  }

  return time.slice(0, 5);
};

function MatchTeamList() {
  // 페이지 이동을 위한 React Router 함수
  const navigate = useNavigate();

  // MatchHome에서 URL로 전달한 지역값 읽기
  const [searchParams] = useSearchParams();

  // 지역값이 없으면 전체 지역 표시
  const selectedDistrict =
    searchParams.get("district") || "전체";


  // ========================================
  // 실제 상대팀 경기 목록
  // ========================================
  const [
    teams,
    setTeams,
  ] = useState([]);

  const [
    totalCount,
    setTotalCount,
  ] = useState(0);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  // ========================================
  // 상대팀 경기 가능일 목록 조회
  // ========================================
  useEffect(() => {

    const loadTeams = async () => {

      setIsLoading(true);

      try {

        // MatchHome에서 선택한 지역을 기준으로
        // 실제 상대팀 경기 목록 조회
        const response =
          await getMatchAvailabilities({
            region: selectedDistrict,
          });


        setTeams(
          response.items || []
        );

        setTotalCount(
          response.total_count || 0
        );

      } catch (error) {

        console.error(
          "상대팀 목록 조회 실패:",
          error
        );

        setTeams([]);
        setTotalCount(0);

      } finally {

        setIsLoading(false);
      }
    };


    loadTeams();

  }, [selectedDistrict]);


  // ========================================
  // 상대팀 경기 상세 페이지로 이동
  // ========================================
  // targetAvailabilityId는 상대팀이 등록한
  // club_match_availabilities의 ID다.
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
      <header className="match-team-list-header">

        {/* 공용 뒤로가기 버튼 */}
        <BackButton className="match-shared-back-button" />

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
              {selectedDistrict === "전체"
                ? "서울 전체에서 매칭을 등록한 팀입니다."
                : `${selectedDistrict}에서 매칭을 등록한 팀입니다.`}
            </p>
          </div>

          {/* 검색 결과 개수 */}
          <strong>
            {totalCount}팀
          </strong>

        </section>


        {/* ================================
            상대팀 목록
        ================================= */}

        <section className="match-team-search-list">

          {isLoading ? (

            <div className="match-team-search-empty">
              <strong>
                경기 가능한 팀을 불러오는 중입니다.
              </strong>
            </div>

          ) : teams.length > 0 ? (

            teams.map((team) => (

            <article
              key={team.availability_id}
              className="match-team-search-card"
            >

              {/* ------------------------------
                  클럽 프로필
              ------------------------------ */}

              <div className="match-team-search-card-header">

                {/* 클럽 프로필 이미지 */}
                {team.club_profile_image ? (

                  <img
                    className="match-team-search-profile-image"
                    src={team.club_profile_image}
                    alt={`${team.club_name} 프로필`}
                  />

                ) : (

                  /*
                    프로필 사진이 없는 경우
                    클럽 이름 첫 글자를 표시
                  */
                  <div className="match-team-search-profile-fallback">
                    {team.club_name?.charAt(0)}
                  </div>

                )}


                {/* 클럽 이름 + 기본 정보 */}
                <div className="match-team-search-club-info">

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
                <p className="match-team-search-intro">
                  {team.intro}
                </p>
              )}


              {/* ------------------------------
                  경기 시간 / 장소
              ------------------------------ */}

              <div className="match-team-search-info">

                {/* 경기 날짜 */}
                <div>
                  <span>
                    경기 날짜
                  </span>

                  <strong>
                    {team.match_date}
                  </strong>
                </div>


                {/* 경기 시간 */}
                <div>
                  <span>
                    경기 시간
                  </span>

                  <strong>
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

              </div>


              {/* ------------------------------
                  추가 조건

                  null인 값은 표시하지 않는다.
              ------------------------------ */}

              <div className="match-team-search-tags">

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
                className="match-team-search-detail-button"
                onClick={() =>
                  handleTeamDetail(
                    team.availability_id
                  )
                }
              >
                상세보기
              </button>

            </article>

            ))
          ) : (
            <div className="match-team-search-empty">
              <strong>등록된 경기가 없습니다.</strong>
              <span>다른 지역에서 찾아보세요.</span>
            </div>
          )}

        </section>

      </main>


      {/* 하단 네비게이션 */}
      <BottomNav />

    </div>
  );
}


export default MatchTeamList;