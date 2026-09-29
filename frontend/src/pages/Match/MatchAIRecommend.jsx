import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  FiZap,
} from "react-icons/fi";


import MatchCalendar
  from "./components/MatchCalendar";

import MatchTimePicker
  from "./components/MatchTimePicker";

import BackButton
  from "../../components/BackButton/BackButton";


import {
  getMatchOptions,
  getMatchRecommendations,
} from "./api/matchApi";


import "./CSS/MatchAvailability.css";
import "./CSS/MatchCommon.css";
import "./CSS/MatchAIRecommend.css";


// ========================================
// 서울 주소에서 자치구 추출
//
// 예:
// 서울특별시 관악구 봉천동
// → 관악구
// ========================================
const extractSeoulDistrict = (
  address = ""
) => {

  const match = address.match(
    /서울(?:특별시)?\s+([가-힣]+구)/
  );

  return match
    ? match[1]
    : "";
};


// ========================================
// 오늘 날짜
//
// 과거 날짜 추천을 막을 때 사용
// ========================================
const getTodayDateString = () => {

  const today =
    new Date();

  const year =
    today.getFullYear();

  const month =
    String(
      today.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      today.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
};


// ========================================
// 19:00 → 19:00:00
//
// FastAPI time 타입에 보내기 위한 변환
// ========================================
const toBackendTime = (
  value
) => {

  if (!value) {
    return value;
  }

  return value.length === 5
    ? `${value}:00`
    : value;
};


// ========================================
// 19:00:00 → 19:00
//
// 추천 결과 화면 표시용
// ========================================
const formatMatchTime = (
  value
) => {

  if (!value) {
    return "";
  }

  return String(
    value
  ).slice(
    0,
    5
  );
};


function MatchAIRecommend() {

  const navigate =
    useNavigate();


  // ========================================
  // 추천 조건
  // ========================================

  const [
    selectedDates,
    setSelectedDates,
  ] = useState([]);


  const [
    startTime,
    setStartTime,
  ] = useState("");


  const [
    endTime,
    setEndTime,
  ] = useState("");

  // ========================================
  // 시간 상관없음
  //
  // true이면 특정 시간을 요구하지 않고
  // 모든 시간대의 모집글을 추천 후보로 사용한다.
  // ========================================
  const [
    timeFlexible,
    setTimeFlexible,
  ] = useState(false);


  const [
    sportId,
    setSportId,
  ] = useState("");


  const [
    requiredPlayers,
    setRequiredPlayers,
  ] = useState("");


  const [
    level,
    setLevel,
  ] = useState("");


  // ========================================
  // 종목 목록
  // ========================================

  const [
    sports,
    setSports,
  ] = useState([]);


  // ========================================
  // 장소 관련
  // ========================================

  const [
    placeKeyword,
    setPlaceKeyword,
  ] = useState("");


  const [
    placeResults,
    setPlaceResults,
  ] = useState([]);


  const [
    selectedPlace,
    setSelectedPlace,
  ] = useState(null);


  const [
    isSearchingPlace,
    setIsSearchingPlace,
  ] = useState(false);


  const mapRef =
    useRef(null);


  // ========================================
  // 추천 결과
  // ========================================

  const [
    recommendations,
    setRecommendations,
  ] = useState([]);


  const [
    isRecommending,
    setIsRecommending,
  ] = useState(false);


  const [
    hasSearched,
    setHasSearched,
  ] = useState(false);


  const resultRef =
    useRef(null);


  // ========================================
  // 종목 목록 조회
  //
  // 기존 경기 등록과 같은 API 사용
  // ========================================

  useEffect(() => {

    const loadMatchOptions =
      async () => {

        try {

          const response =
            await getMatchOptions();


          setSports(
            response.sports || []
          );

        } catch (error) {

          console.error(
            "AI 추천 종목 조회 실패:",
            error
          );
        }
      };


    loadMatchOptions();

  }, []);


  // ========================================
  // 카카오 장소 검색
  // ========================================

  const handleSearchPlace = () => {

    const keyword =
      placeKeyword.trim();


    if (!keyword) {

      alert(
        "운동 장소를 검색해주세요."
      );

      return;
    }


    if (!window.kakao?.maps) {

      alert(
        "카카오 지도 API를 불러오지 못했습니다."
      );

      return;
    }


    setIsSearchingPlace(
      true
    );


    window.kakao.maps.load(
      () => {

        const places =
          new window.kakao.maps.services.Places();


        places.keywordSearch(

          keyword,

          (
            result,
            status
          ) => {

            setIsSearchingPlace(
              false
            );


            if (
              status ===
              window.kakao.maps.services.Status.OK
            ) {

              // 현재 PlayBridge는
              // 서울 지역만 사용
              const seoulResults =
                result.filter(
                  (place) => {

                    const address =
                      place.road_address_name ||
                      place.address_name ||
                      "";


                    return (
                      address.startsWith(
                        "서울"
                      )
                    );
                  }
                );


              setPlaceResults(
                seoulResults
              );


              if (
                seoulResults.length === 0
              ) {

                alert(
                  "서울 지역의 검색 결과가 없습니다."
                );
              }


              return;
            }


            if (
              status ===
              window.kakao.maps.services.Status.ZERO_RESULT
            ) {

              setPlaceResults(
                []
              );

              alert(
                "검색 결과가 없습니다."
              );

              return;
            }


            setPlaceResults(
              []
            );


            alert(
              "장소 검색에 실패했습니다."
            );
          }
        );
      }
    );
  };


  // ========================================
  // 검색한 장소 선택
  // ========================================

  const handleSelectPlace = (
    place
  ) => {

    const address =
      place.road_address_name ||
      place.address_name ||
      "";


    const district =
      extractSeoulDistrict(
        address
      );


    if (!district) {

      alert(
        "현재는 서울 지역의 장소만 선택할 수 있습니다."
      );

      return;
    }


    // Match Fit 거리 계산에 사용할
    // 지역 + 위도/경도 저장
    setSelectedPlace({

      region:
        district,

      location_name:
        place.place_name,

      address,

      latitude:
        Number(
          place.y
        ),

      longitude:
        Number(
          place.x
        ),
    });


    setPlaceKeyword(
      place.place_name
    );


    // 장소 하나를 선택하면
    // 검색목록 닫기
    setPlaceResults(
      []
    );
  };


  // ========================================
  // 선택 장소 지도 표시
  // ========================================

  useEffect(() => {

    if (
      !selectedPlace ||
      selectedPlace.latitude == null ||
      selectedPlace.longitude == null ||
      !mapRef.current ||
      !window.kakao?.maps
    ) {

      return;
    }


    window.kakao.maps.load(
      () => {

        const position =
          new window.kakao.maps.LatLng(

            selectedPlace.latitude,
            selectedPlace.longitude
          );


        const map =
          new window.kakao.maps.Map(

            mapRef.current,

            {
              center:
                position,

              level:
                4,
            }
          );


        new window.kakao.maps.Marker({
          map,
          position,
        });
      }
    );

  }, [
    selectedPlace,
  ]);


  // ========================================
  // 추천 날짜 다중 선택
  //
  // 같은 날짜를 다시 누르면 선택 해제한다.
  // 과거 날짜는 선택할 수 없다.
  // ========================================

  const handleDateSelect = (
    dateString
  ) => {

    if (
      dateString <
      getTodayDateString()
    ) {

      alert(
        "지난 날짜는 선택할 수 없습니다."
      );

      return;
    }


    setSelectedDates(
      (currentDates) => {

        if (
          currentDates.includes(
            dateString
          )
        ) {

          return currentDates.filter(
            (item) =>
              item !== dateString
          );
        }


        return [
          ...currentDates,
          dateString,
        ].sort();
      }
    );
  };


  // ========================================
  // AI 추천 실행
  // ========================================

  const handleRecommend =
    async () => {


      // -----------------------------
      // 날짜 검사
      // -----------------------------

      if (
        selectedDates.length === 0
      ) {

        alert(
          "날짜를 하나 이상 선택해주세요."
        );

        return;
      }


      if (
        selectedDates.some(
          (selectedDate) =>
            selectedDate <
            getTodayDateString()
        )
      ) {

        alert(
          "지난 날짜로는 추천받을 수 없습니다."
        );

        return;
      }


      // -----------------------------
      // 시간 검사
      // -----------------------------

      // ========================================
      // 시간 검사
      //
      // "상관없음"이면 시간 입력 검사를 하지 않는다.
      // ========================================

      if (!timeFlexible) {

        if (
          !startTime ||
          !endTime
        ) {

          alert(
            "원하는 시간대를 입력하거나 상관없음을 선택해주세요."
          );

          return;
        }


        if (
          endTime <= startTime
        ) {

          alert(
            "종료 시간은 시작 시간보다 늦어야 합니다."
          );

          return;
        }
      }


      // -----------------------------
      // 종목 검사
      // -----------------------------

      if (!sportId) {

        alert(
          "종목을 선택해주세요."
        );

        return;
      }


      // -----------------------------
      // 장소 검사
      // -----------------------------

      if (!selectedPlace) {

        alert(
          "검색 결과에서 운동 장소를 선택해주세요."
        );

        return;
      }


      // -----------------------------
      // 경기 인원 검사
      // -----------------------------

      if (
        !requiredPlayers ||
        Number(
          requiredPlayers
        ) < 1
      ) {

        alert(
          "경기 인원을 입력해주세요."
        );

        return;
      }


      // -----------------------------
      // 실력 검사
      // -----------------------------

      if (!level) {

        alert(
          "실력 수준을 선택해주세요."
        );

        return;
      }


      // ========================================
      // 백엔드 추천 Request
      //
      // 경기 등록 API와 다르게
      // club_id나 intro 등을 보내지 않는다.
      //
      // 이 정보는 DB에 INSERT되지 않고
      // Match Fit 계산에만 사용된다.
      // ========================================

      const commonRequestData = {

        sport_id:
          Number(
            sportId
          ),

        // 시간 상관없음이면
        // API 형식을 유지하기 위해 전체 시간대를 전달한다.
        // 실제 Match Fit에서는 time_flexible=true이면
        // 시간 점수를 계산에서 제외한다.
        start_time:
          timeFlexible
            ? "00:00:00"
            : toBackendTime(
                startTime
              ),

        end_time:
          timeFlexible
            ? "23:59:00"
            : toBackendTime(
                endTime
              ),

        time_flexible:
          timeFlexible,

        required_players:
          Number(
            requiredPlayers
          ),

        skill_level:
          level,

        region:
          selectedPlace.region,

        location_name:
          selectedPlace.location_name,

        address:
          selectedPlace.address,

        latitude:
          selectedPlace.latitude,

        longitude:
          selectedPlace.longitude,

        // 날짜별 상위 5개를 받아온다.
        limit:
          5,
      };


      setIsRecommending(
        true
      );

      setHasSearched(
        false
      );


      try {

        // 현재 Backend는 match_date 한 개만 받는다.
        // Frontend에서 선택한 날짜별로 추천 API를 호출한 뒤
        // 하나의 결과 목록으로 합친다.
        const responses =
          await Promise.all(

            selectedDates.map(
              (selectedDate) =>
                getMatchRecommendations({

                  ...commonRequestData,

                  match_date:
                    selectedDate,
                })
            )
          );


        const mergedRecommendations =
          responses
            .flatMap(
              (response) =>
                response.items || []
            )
            .filter(
              (
                item,
                index,
                items
              ) =>
                items.findIndex(
                  (candidate) =>
                    candidate.availability_id ===
                    item.availability_id
                ) === index
            )
            .sort(
              (a, b) =>
                Number(
                  b.match_fit_score || 0
                ) -
                Number(
                  a.match_fit_score || 0
                )
            );


        setRecommendations(
          mergedRecommendations
        );


        setHasSearched(
          true
        );


        // 입력 페이지와 결과 페이지를 분리한다.
        navigate(
          "/matches/recommend/result",
          {
            state: {
              recommendations:
                mergedRecommendations,

              selectedDates,

              searchCondition: {
                sportId:
                  Number(
                    sportId
                  ),

                sportName:
                  sports.find(
                    (sport) =>
                      sport.sport_id ===
                      Number(
                        sportId
                      )
                  )?.sport_name || "",

                startTime:
                  timeFlexible
                    ? ""
                    : startTime,

                endTime:
                  timeFlexible
                    ? ""
                    : endTime,

                timeFlexible,

                requiredPlayers:
                  Number(
                    requiredPlayers
                  ),

                level,

                startLocation:
                  selectedPlace,
              },
            },
          }
        );


      } catch (error) {

        console.error(
          "AI 상대팀 추천 실패:",
          error
        );


        setRecommendations(
          []
        );


        setHasSearched(
          false
        );


        alert(
          error.message ||
          "상대팀 추천에 실패했습니다."
        );


      } finally {

        setIsRecommending(
          false
        );
      }
    };


  // ========================================
  // 상대 경기 상세보기
  // ========================================

  const handleOpenTeamDetail = (
    availabilityId
  ) => {

    navigate(
      `/matches/team/${availabilityId}`
    );
  };


  return (

    <div className="match-availability-container">


      {/* ========================================
          상단
      ======================================== */}

      <header className="match-availability-header">

        <BackButton
          className="match-shared-back-button"
        />


        <h1>
          AI 상대팀 추천
        </h1>

      </header>


      <main className="match-availability-main">


        {/* ========================================
            기능 안내
        ======================================== */}

        <section className="match-ai-recommend-intro">

          <div className="match-ai-recommend-intro-icon">
            <FiZap />
          </div>


          <div>

            <strong>
              원하는 경기 조건을 알려주세요
            </strong>


            <p>
              현재 모집 중인 경기 중
              Match Fit 점수가 높은 상대팀을
              추천해드려요.
            </p>

          </div>

        </section>


        {/* ========================================
            날짜
        ======================================== */}

        <section className="match-form-field">

          <label>
            날짜
          </label>


          <MatchCalendar

            selectedDates={
              selectedDates
            }

            multiple={
              true
            }

            onSelectDate={
              handleDateSelect
            }

            myAvailabilityDates={
              []
            }

            opponentAvailableDates={
              []
            }

            showLegend={
              false
            }

          />


          <div className="match-ai-selected-dates">

            {selectedDates.length > 0 ? (

              selectedDates.map(
                (selectedDate) => (

                  <button
                    key={
                      selectedDate
                    }
                    type="button"
                    onClick={() =>
                      handleDateSelect(
                        selectedDate
                      )
                    }
                  >
                    {selectedDate}
                    <span>
                      ×
                    </span>
                  </button>
                )
              )

            ) : (

              <p>
                원하는 날짜를 여러 개 선택할 수 있습니다.
              </p>

            )}

          </div>

        </section>


        {/* ========================================
            원하는 시간대
        ======================================== */}

        <section className="match-form-field">

          <div className="match-ai-time-label-row">

            <label>
              원하는 시간대
            </label>


            {/* ========================================
                시간 상관없음

                선택하면 시간 입력을 사용하지 않고
                Match Fit에서도 시간 항목을 제외한다.
            ======================================== */}
            <button
              type="button"
              className={
                timeFlexible
                  ? "match-ai-time-any active"
                  : "match-ai-time-any"
              }
              onClick={() => {

                const nextValue =
                  !timeFlexible;

                setTimeFlexible(
                  nextValue
                );

                // 상관없음을 선택하면
                // 기존 시간 입력값 제거
                if (nextValue) {

                  setStartTime("");
                  setEndTime("");
                }
              }}
            >
              상관없음
            </button>

          </div>


          {/* 상관없음이 아닐 때만 시간 선택기 표시 */}
          {!timeFlexible && (

            <div className="match-time-row">

              <MatchTimePicker

                value={
                  startTime
                }

                placeholder="시작 시간"

                onChange={(
                  newStartTime
                ) => {

                  setStartTime(
                    newStartTime
                  );


                  if (
                    endTime &&
                    endTime <= newStartTime
                  ) {

                    setEndTime("");
                  }
                }}

              />


              <span className="match-time-divider">
                →
              </span>


              <MatchTimePicker

                value={
                  endTime
                }

                placeholder="종료 시간"

                minTime={
                  startTime
                }

                onChange={
                  setEndTime
                }

              />

            </div>

          )}


          {timeFlexible && (

            <div className="match-ai-time-any-guide">

              시간과 관계없이 추천받습니다.

            </div>

          )}

        </section>


        {/* ========================================
            종목
        ======================================== */}

        <section className="match-form-field">

          <label>
            종목
          </label>


          <div className="match-sport-options">

            {sports.map(
              (
                sportItem
              ) => (

                <button

                  key={
                    sportItem.sport_id
                  }

                  type="button"

                  className={
                    Number(
                      sportId
                    ) ===
                    sportItem.sport_id

                      ? "active"
                      : ""
                  }

                  onClick={() =>
                    setSportId(
                      String(
                        sportItem.sport_id
                      )
                    )
                  }

                >

                  {sportItem.sport_name}

                </button>
              )
            )}

          </div>

        </section>


        {/* ========================================
            희망 경기 장소
        ======================================== */}

        <section className="match-form-field">

          <label htmlFor="recommendPlaceKeyword">
            내 출발 위치
          </label>


          <div className="match-place-search-row">

            <input

              id="recommendPlaceKeyword"

              type="text"

              value={
                placeKeyword
              }

              placeholder="체육관, 운동장 등을 검색해주세요."

              onChange={(
                event
              ) => {

                setPlaceKeyword(
                  event.target.value
                );


                // 검색어를 직접 수정하면
                // 기존 장소선택 해제
                setSelectedPlace(
                  null
                );
              }}

              onKeyDown={(
                event
              ) => {

                if (
                  event.key ===
                  "Enter"
                ) {

                  event.preventDefault();

                  handleSearchPlace();
                }
              }}

            />


            <button

              type="button"

              onClick={
                handleSearchPlace
              }

              disabled={
                isSearchingPlace
              }

            >

              {isSearchingPlace
                ? "검색 중"
                : "검색"}

            </button>

          </div>


          {/* 장소 검색 결과 */}

          {placeResults.length > 0 && (

            <div className="match-place-results">

              {placeResults.map(
                (
                  place
                ) => (

                  <button

                    key={
                      place.id
                    }

                    type="button"

                    className="match-place-result"

                    onClick={() =>
                      handleSelectPlace(
                        place
                      )
                    }

                  >

                    <strong>
                      {place.place_name}
                    </strong>


                    <span>

                      {place.road_address_name ||
                        place.address_name}

                    </span>

                  </button>
                )
              )}

            </div>
          )}


          {/* 선택된 장소 */}

          {selectedPlace && (
            <>

              <div className="match-selected-place">

                <strong>

                  ✓{" "}
                  {selectedPlace.location_name}

                </strong>


                <span>
                  {selectedPlace.address}
                </span>


                <span>
                  {selectedPlace.region}
                </span>

              </div>


              <div
                ref={
                  mapRef
                }
                className="match-selected-place-map"
              />

            </>
          )}

        </section>


        {/* ========================================
            경기 인원
        ======================================== */}

        <section className="match-form-field">

          <label htmlFor="recommendPlayers">
            경기 인원
          </label>


          <div className="match-player-count">

            <input

              id="recommendPlayers"

              type="number"

              min="1"

              inputMode="numeric"

              value={
                requiredPlayers
              }

              placeholder="인원"

              onChange={(
                event
              ) =>
                setRequiredPlayers(
                  event.target.value
                )
              }

            />


            <span>
              명
            </span>

          </div>


          <p className="match-form-guide">
            원하는 경기 인원을 입력해주세요.
          </p>

        </section>


        {/* ========================================
            상대팀 실력
        ======================================== */}

        <section className="match-form-field">

          <label>
            원하는 상대 실력
          </label>


          <div className="match-level-options">

            {[
              "초급",
              "중급",
              "상급",
            ].map(
              (
                levelName
              ) => (

                <button

                  key={
                    levelName
                  }

                  type="button"

                  className={
                    level === levelName
                      ? "active"
                      : ""
                  }

                  onClick={() =>
                    setLevel(
                      levelName
                    )
                  }

                >

                  {levelName}

                </button>
              )
            )}

          </div>

        </section>


        {/* ========================================
            추천 버튼
        ======================================== */}

        <div className="match-ai-recommend-submit-wrap">

          <button

            type="button"

            className="match-ai-recommend-submit"

            onClick={
              handleRecommend
            }

            disabled={
              isRecommending
            }

          >

            <FiZap />


            {isRecommending
              ? "추천 중..."
              : "AI 추천하기"}

          </button>

        </div>


        {/* ========================================
            추천 결과
        ======================================== */}

        <section

          ref={
            resultRef
          }

          className="match-ai-result-section"

        >


          {/* 추천 계산 중 */}

          {isRecommending && (

            <div className="match-ai-result-empty">

              <strong>
                Match Fit을 계산하고 있어요.
              </strong>

              <p>
                입력한 조건과 모집 중인 경기를 비교합니다.
              </p>

            </div>
          )}


          {/* 추천 완료 */}

          {!isRecommending &&
            hasSearched && (
              <>

                <div className="match-ai-result-head">

                  <div>

                    <span>
                      MATCH FIT
                    </span>

                    <h2>
                      추천 상대팀
                    </h2>

                  </div>


                  <strong>

                    {recommendations.length}
                    팀

                  </strong>

                </div>


                {/* 추천 결과 없음 */}

                {recommendations.length === 0 ? (

                  <div className="match-ai-result-empty">

                    <strong>
                      조건에 맞는 모집 중인 경기가 없어요.
                    </strong>

                    <p>
                      날짜나 시간,
                      종목 조건을 바꿔
                      다시 추천받아보세요.
                    </p>

                  </div>

                ) : (

                  <div className="match-ai-result-list">


                    {recommendations.map(
                      (
                        team,
                        index
                      ) => (

                        <article

                          key={
                            team.availability_id
                          }

                          className="match-ai-result-card"

                        >


                          {/* 추천 순위 + Match Fit */}

                          <div className="match-ai-result-card-top">

                            <span className="match-ai-rank-badge">

                              추천{" "}
                              {index + 1}
                              위

                            </span>


                            <strong className="match-ai-fit-score">

                              {Math.round(
                                team.match_fit_score
                              )}
                              점

                            </strong>

                          </div>


                          {/* 동호회 정보 */}

                          <div className="match-ai-result-team">

                            {team.club_profile_image ? (

                              <img

                                src={
                                  team.club_profile_image
                                }

                                alt={`${team.club_name} 프로필`}

                              />

                            ) : (

                              <div className="match-ai-profile-fallback">

                                {team.club_name
                                  ?.charAt(0) ||
                                  "팀"}

                              </div>
                            )}


                            <div>

                              <strong>
                                {team.club_name}
                              </strong>


                              <span>

                                {team.sport_name}

                                {" · "}

                                {team.skill_level}

                                {" · "}

                                {team.region}

                              </span>

                            </div>

                          </div>


                          {/* 경기 정보 */}

                          <div className="match-ai-result-info">

                            <div>

                              <span>
                                경기 일시
                              </span>


                              <strong>

                                {team.match_date}

                                {" "}

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


                            <div>

                              <span>
                                경기 인원
                              </span>

                              <strong>
                                {team.required_players}
                                명
                              </strong>

                            </div>


                            {team.distance_km != null && (

                              <div>

                                <span>
                                  예상 거리
                                </span>


                                <strong>

                                  {team.distance_km}
                                  km

                                  {team.estimated_travel_minutes != null
                                    ? ` · 약 ${team.estimated_travel_minutes}분`
                                    : ""}

                                </strong>

                              </div>
                            )}

                          </div>


                          {/* ========================================
                              Match Fit 세부점수
                          ======================================== */}

                          <div className="match-ai-score-grid">

                            <span>

                              시간{" "}
                              {Math.round(
                                team.score_detail?.time ||
                                0
                              )}

                            </span>


                            <span>

                              거리{" "}
                              {Math.round(
                                team.score_detail?.distance ||
                                0
                              )}

                            </span>


                            <span>

                              실력{" "}
                              {Math.round(
                                team.score_detail?.skill ||
                                0
                              )}

                            </span>


                            <span>

                              인원{" "}
                              {Math.round(
                                team.score_detail?.players ||
                                0
                              )}

                            </span>

                          </div>


                          {/* 추천 이유 */}

                          {team.reasons?.length > 0 && (

                            <ul className="match-ai-reasons">

                              {team.reasons.map(
                                (
                                  reason
                                ) => (

                                  <li
                                    key={
                                      reason
                                    }
                                  >

                                    {reason}

                                  </li>
                                )
                              )}

                            </ul>
                          )}


                          {/* 상세보기 */}

                          <button

                            type="button"

                            className="match-ai-detail-button"

                            onClick={() =>
                              handleOpenTeamDetail(
                                team.availability_id
                              )
                            }

                          >

                            경기 상세보기

                          </button>

                        </article>
                      )
                    )}

                  </div>
                )}

              </>
            )}

        </section>

      </main>

    </div>
  );
}


export default MatchAIRecommend;