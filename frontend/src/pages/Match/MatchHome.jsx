import { useMemo, useState } from "react";
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
import MatchCalendar from "./components/MatchCalendar";
import "./CSS/MatchHome.css";


// TODO: 백엔드 연결 후 GET /api/... 결과로 교체
const SAMPLE_MY_AVAILABILITIES = [
  {
    id: 1,
    date: "2026-09-21",
    sport: "배구",
    time: "19:00 ~ 21:00",
    region: "서울 관악구",
  },
  {
    id: 2,
    date: "2026-09-27",
    sport: "축구/풋살",
    time: "18:00 ~ 20:00",
    region: "서울 관악구",
  },
];


// TODO: 백엔드 연결 후 선택 날짜 기준 상대팀 목록 API로 교체
const SAMPLE_TEAMS = [
  {
    availabilityId: 101,
    date: "2026-09-21",
    clubName: "대한 스포츠 클럽",
    sport: "배구",
    people: "6 vs 6",
    level: "중급",
    time: "19:00 ~ 21:00",
    region: "서울 관악구",
    distance: "3.2km",
  },
  {
    availabilityId: 102,
    date: "2026-09-21",
    clubName: "A 배구팀",
    sport: "배구",
    people: "6 vs 6",
    level: "초중급",
    time: "20:00 ~ 22:00",
    region: "서울 동작구",
    distance: "4.8km",
  },
  {
    availabilityId: 103,
    date: "2026-09-21",
    clubName: "관악 풋살 크루",
    sport: "축구/풋살",
    people: "5 vs 5",
    level: "중급",
    time: "18:00 ~ 20:00",
    region: "서울 관악구",
    distance: "2.1km",
  },
  {
    availabilityId: 104,
    date: "2026-09-24",
    clubName: "서울 농구 모임",
    sport: "농구",
    people: "5 vs 5",
    level: "초급",
    time: "19:30 ~ 21:30",
    region: "서울 서초구",
    distance: "6.4km",
  },
];


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

  const [selectedDate, setSelectedDate] =
    useState("2026-09-21");

  const [selectedSport, setSelectedSport] =
    useState("전체");


  const myAvailabilityDates =
    useMemo(
      () =>
        SAMPLE_MY_AVAILABILITIES.map(
          (item) => item.date
        ),
      []
    );


  const opponentAvailableDates =
    useMemo(
      () =>
        [
          ...new Set(
            SAMPLE_TEAMS.map(
              (team) => team.date
            )
          ),
        ],
      []
    );


  const selectedAvailability =
    SAMPLE_MY_AVAILABILITIES.find(
      (item) =>
        item.date === selectedDate
    );


  const sports = useMemo(() => {
    const names =
      SAMPLE_TEAMS
        .filter(
          (team) =>
            team.date === selectedDate
        )
        .map(
          (team) => team.sport
        );

    return [
      "전체",
      ...new Set(names),
    ];
  }, [selectedDate]);


  const filteredTeams =
    SAMPLE_TEAMS.filter((team) => {
      if (
        team.date !== selectedDate
      ) {
        return false;
      }

      if (
        selectedSport !== "전체" &&
        team.sport !== selectedSport
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


  return (
    <div className="match-home-container">

      {/* 상단 */}
      <header className="match-home-header">

        <button
          type="button"
          className="match-region-btn"
        >
          서울
          <span className="match-region-arrow">
            ▾
          </span>
        </button>


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
          onClick={() =>
            navigate(
              "/matches/availability/new"
            )
          }
        >
          <FiPlus />

          <span>
            경기 가능일 등록하기
          </span>
        </button>


        {/* 선택한 날짜에 내가 등록한 일정 */}
        {selectedAvailability && (

          <section className="my-match-summary">

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


              <button
                type="button"
                className="match-text-link"
                onClick={() =>
                  navigate(
                    `/matches/availability/${selectedAvailability.id}`
                  )
                }
              >
                등록 내용 보기
                <FiChevronRight />
              </button>

            </div>


            <div className="my-match-summary-info">

              <span>
                {selectedAvailability.sport}
              </span>

              <span>
                {selectedAvailability.time}
              </span>

              <span>
                {selectedAvailability.region}
              </span>

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


          {/* 지역/시간 필터는 다음 MatchTeamList에서 확장 */}
          <div className="match-mini-filters">

            <button
              type="button"
              disabled
            >
              지역 전체
            </button>

            <button
              type="button"
              disabled
            >
              시간 전체
            </button>

          </div>


          <div className="match-team-list">

            {filteredTeams.length > 0 ? (

              filteredTeams.map(
                (team) => (

                  <button
                    key={
                      team.availabilityId
                    }
                    type="button"
                    className="match-team-card"
                    onClick={() =>
                      navigate(
                        `/matches/team/${team.availabilityId}`
                      )
                    }
                  >

                    <div className="match-team-card-main">

                      <div className="match-team-card-title-row">

                        <strong>
                          {team.clubName}
                        </strong>

                        <FiChevronRight />

                      </div>


                      <div className="match-team-card-tags">

                        <span>
                          {team.sport}
                        </span>

                        <span>
                          {team.people}
                        </span>

                        <span>
                          {team.level}
                        </span>

                      </div>


                      <div className="match-team-card-info">

                        <span>
                          <FiClock />
                          {team.time}
                        </span>

                        <span>
                          <FiMapPin />
                          {team.region}
                        </span>

                      </div>

                    </div>


                    <div className="match-team-distance">
                      {team.distance}
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


          {filteredTeams.length > 0 && (
            <button
              type="button"
              className="match-team-more-btn"
              onClick={() => {
                const availabilityId =
                  selectedAvailability?.id;

                if (!availabilityId) {
                  alert(
                    "먼저 해당 날짜의 경기 가능일을 등록해주세요."
                  );
                  return;
                }

                navigate(
                  `/matches/availability/${availabilityId}/teams`
                );
              }}
            >
              경기 가능한 팀 더보기
              <FiChevronRight />
            </button>
          )}

        </section>

      </main>


      <BottomNav />

    </div>
  );
}

export default MatchHome;
