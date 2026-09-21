import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import MatchCalendar from "./components/MatchCalendar";
import MatchTimePicker from "./components/MatchTimePicker";


import "./CSS/MatchAvailability.css";

const extractSeoulDistrict = (address = "") => {
  const match = address.match(
    /서울(?:특별시)?\s+([가-힣]+구)/
  );

  return match
    ? match[1]
    : "";
};

function MatchAvailabilityForm() {
  const navigate = useNavigate();

  const { availabilityId } =
    useParams();

  // /new면 등록
  // /:availabilityId/edit이면 수정
  const isEditMode =
    Boolean(availabilityId);


  // =========================
  // 입력값
  // =========================

  const [date, setDate] =
    useState("");

  const [startTime, setStartTime] =
    useState("");

  const [endTime, setEndTime] =
    useState("");

  const [sport, setSport] =
    useState("");

  // 장소 검색어
  const [placeKeyword, setPlaceKeyword] =
    useState("");

  // 장소 검색 결과
  const [placeResults, setPlaceResults] =
    useState([]);

  // 실제 선택한 장소
  const [selectedPlace, setSelectedPlace] =
    useState(null);

  const mapRef = useRef(null);

  // 장소 검색 중
  const [isSearchingPlace, setIsSearchingPlace] =
    useState(false);

  const [requiredPlayers, setRequiredPlayers] =
    useState("");

  const [level, setLevel] =
    useState("");

  const [intro, setIntro] =
    useState("");

  const [parkingAvailable, setParkingAvailable] =
    useState(null);

  const [venueType, setVenueType] =
    useState(null);

  const [venueCostNegotiable, setVenueCostNegotiable] =
    useState(null);

  const [timeNegotiable, setTimeNegotiable] =
    useState(null);


  const sports = [
    "축구/풋살",
    "농구",
    "배구",
    "탁구",
  ];

  // =========================
  // 장소 검색
  // =========================
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


    setIsSearchingPlace(true);


    window.kakao.maps.load(() => {

      const places =
        new window.kakao.maps.services.Places();


      places.keywordSearch(
        keyword,

        (result, status) => {

          setIsSearchingPlace(false);


          if (
            status ===
            window.kakao.maps.services.Status.OK
          ) {
            const seoulResults =
              result.filter((place) => {
                const address =
                  place.road_address_name ||
                  place.address_name ||
                  "";

                return address.startsWith("서울");
              });

            setPlaceResults(seoulResults);

            if (seoulResults.length === 0) {
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
            setPlaceResults([]);

            alert(
              "검색 결과가 없습니다."
            );

            return;
          }


          setPlaceResults([]);

          alert(
            "장소 검색에 실패했습니다."
          );
        }
      );

    });
  };


  // =========================
  // 장소 선택
  // =========================
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


    // 현재 PlayBridge 팀매칭 범위는 서울
    if (!district) {
      alert(
        "현재는 서울 지역의 장소만 선택할 수 있습니다."
      );

      return;
    }


    setSelectedPlace({
      region: district,

      location_name:
        place.place_name,

      address,

      latitude:
        Number(place.y),

      longitude:
        Number(place.x),
    });


    setPlaceKeyword(
      place.place_name
    );


    // 선택 후 검색결과 닫기
    setPlaceResults([]);
  };

  // =========================
  // 선택한 장소 지도 표시
  // =========================
  useEffect(() => {
    if (
      !selectedPlace ||
      !mapRef.current ||
      !window.kakao?.maps
    ) {
      return;
    }

    window.kakao.maps.load(() => {
      const position =
        new window.kakao.maps.LatLng(
          selectedPlace.latitude,
          selectedPlace.longitude
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
  }, [selectedPlace]);



  // =========================
  // 등록 / 수정
  // =========================
  const handleSubmit = () => {
    if (!date) {
      alert("날짜를 선택해주세요.");
      return;
    }

    if (!startTime || !endTime) {
      alert(
        "가능한 시간대를 입력해주세요."
      );
      return;
    }

    if (endTime <= startTime) {
      alert("종료 시간은 시작 시간보다 늦어야 합니다.");
      return;
    }

    if (!sport) {
      alert("종목을 선택해주세요.");
      return;
    }

    if (!selectedPlace) {
      alert(
        "검색 결과에서 운동 장소를 선택해주세요."
      );
      return;
    }

    if (
      !requiredPlayers ||
      Number(requiredPlayers) < 1
    ) {
      alert(
        "경기 인원을 입력해주세요."
      );
      return;
    }

    if (!level) {
      alert(
        "실력 수준을 선택해주세요."
      );
      return;
    }


    const formData = {
      match_date: date,
      start_time: startTime,
      end_time: endTime,

      // sport_id는 나중에 실제 sports DB 연결 후 변경
      sport,

      required_players:
        Number(requiredPlayers),

      skill_level: level,

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

      parking_available:
        parkingAvailable,

      venue_type:
        venueType || null,

      venue_cost_negotiable:
        venueCostNegotiable,

      time_negotiable:
        timeNegotiable,

      intro,
    };


    console.log(
      "경기 가능일 입력값:",
      formData
    );


    // TODO:
    // 백엔드 연결 후 POST / PATCH

    alert(
      isEditMode
        ? "수정 테스트 완료"
        : "등록 테스트 완료"
    );
  };


  return (
    <div className="match-availability-container">

      {/* =========================
          상단
      ========================= */}
      <header className="match-availability-header">

        <button
          type="button"
          onClick={() =>
            navigate(-1)
          }
        >
          ←
        </button>


        <h1>
          {isEditMode
            ? "경기 가능일 수정"
            : "경기 가능일 등록"}
        </h1>

      </header>


      <main className="match-availability-main">

        {/* 날짜 */}
        <section className="match-form-field">

          <label htmlFor="matchDate">
            날짜
          </label>

          <MatchCalendar
            selectedDate={date}
            onSelectDate={setDate}
            myAvailabilityDates={[]}
            opponentAvailableDates={[]}
            showLegend={false}
          />

        </section>


        {/* 가능한 시간대 */}
        <section className="match-form-field">

          <label>
            가능한 시간대
          </label>

          <div className="match-time-row">

            <MatchTimePicker
              value={startTime}
              placeholder="시작 시간"
              onChange={(newStartTime) => {
                setStartTime(newStartTime);

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
              value={endTime}
              placeholder="종료 시간"
              minTime={startTime}
              onChange={setEndTime}
            />

          </div>

        </section>


        {/* 종목 */}
        <section className="match-form-field">

          <label>
            종목
          </label>

          <div className="match-sport-options">

            {sports.map(
              (sportName) => (

                <button
                  key={sportName}
                  type="button"
                  className={
                    sport === sportName
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setSport(
                      sportName
                    )
                  }
                >
                  {sportName}
                </button>

              )
            )}

          </div>

        </section>


        {/* 운동 장소 */}
        <section className="match-form-field">

          <label htmlFor="placeKeyword">
            운동 장소
          </label>


          <div className="match-place-search-row">

            <input
              id="placeKeyword"
              type="text"
              value={placeKeyword}
              placeholder="체육관, 운동장 등을 검색해주세요."
              onChange={(e) => {
                setPlaceKeyword(
                  e.target.value
                );

                // 장소명을 직접 다시 수정하면
                // 기존 선택은 취소
                setSelectedPlace(
                  null
                );
              }}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter"
                ) {
                  e.preventDefault();

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


          {/* 검색 결과 */}
          {placeResults.length > 0 && (

            <div className="match-place-results">

              {placeResults.map(
                (place) => (

                  <button
                    key={place.id}
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


          {/* 선택 완료 */}
          {selectedPlace && (
            <>
              <div className="match-selected-place">

                <strong>
                  ✓ {selectedPlace.location_name}
                </strong>

                <span>
                  {selectedPlace.address}
                </span>

                <span>
                  {selectedPlace.region}
                </span>

              </div>


              {/* 선택한 장소 지도 */}
              <div
                ref={mapRef}
                className="match-selected-place-map"
              />
            </>
          )}

        </section>


        {/* 경기 인원 */}
        <section className="match-form-field">

          <label htmlFor="requiredPlayers">
            경기 인원
          </label>

          <div className="match-player-count">

            <input
              id="requiredPlayers"
              type="number"
              min="1"
              inputMode="numeric"
              value={requiredPlayers}
              placeholder="인원"
              onChange={(e) =>
                setRequiredPlayers(
                  e.target.value
                )
              }
            />

            <span>
              명
            </span>

          </div>

          <p className="match-form-guide">
            우리 팀에서 경기할 인원을 입력해주세요.
          </p>

        </section>


        {/* 실력 수준 */}
        <section className="match-form-field">

          <label htmlFor="matchLevel">
            실력 수준
          </label>

          <div className="match-level-options">

            {["초급", "중급", "상급"].map(
              (levelName) => (

                <button
                  key={levelName}
                  type="button"
                  className={
                    level === levelName
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setLevel(levelName)
                  }
                >
                  {levelName}
                </button>

              )
            )}

          </div>

        </section>


        {/* 추가 조건 */}
        <section className="match-form-field">

          <label>
            추가 조건
          </label>

          {/* 경기 장소 실/내외 */}
          <div className="match-condition-item">

            <span className="match-condition-label">
              경기 장소
            </span>

            <div className="match-condition-options">
              <button
                type="button"
                className={
                  venueType === "실내"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setVenueType(
                    venueType === "실내"
                      ? null
                      : "실내"
                  )
                }
              >
                실내
              </button>

              <button
                type="button"
                className={
                  venueType === "실외"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setVenueType(
                    venueType === "실외"
                      ? null
                      : "실외"
                  )
                }
              >
                실외
              </button>
            </div>

          </div>


          {/* 주차 */}
          <div className="match-condition-item">

            <span className="match-condition-label">
              주차
            </span>

            <div className="match-condition-options">
              <button
                type="button"
                className={
                  parkingAvailable === true
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setParkingAvailable(
                    parkingAvailable === true
                      ? null
                      : true
                  )
                }
              >
                가능
              </button>

              <button
                type="button"
                className={
                  parkingAvailable === false
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setParkingAvailable(
                    parkingAvailable === false
                      ? null
                      : false
                  )
                }
              >
                불가능
              </button>
            </div>

          </div>


          {/* 장소 비용 */}
          <div className="match-condition-item">

            <span className="match-condition-label">
              장소 비용
            </span>

            <div className="match-condition-options">
              <button
                type="button"
                className={
                  venueCostNegotiable === true
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setVenueCostNegotiable(
                    venueCostNegotiable === true
                      ? null
                      : true
                  )
                }
              >
                협의 가능
              </button>

              <button
                type="button"
                className={
                  venueCostNegotiable === false
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setVenueCostNegotiable(
                    venueCostNegotiable === false
                      ? null
                      : false
                  )
                }
              >
                협의 불가
              </button>
            </div>

          </div>


          {/* 시간 협의 */}
          <div className="match-condition-item">

            <span className="match-condition-label">
              경기 시간
            </span>

            <div className="match-condition-options">
              <button
                type="button"
                className={
                  timeNegotiable === true
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setTimeNegotiable(
                    timeNegotiable === true
                      ? null
                      : true
                  )
                }
              >
                협의 가능
              </button>

              <button
                type="button"
                className={
                  timeNegotiable === false
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setTimeNegotiable(
                    timeNegotiable === false
                      ? null
                      : false
                  )
                }
              >
                협의 불가
              </button>
            </div>

          </div>

        </section>


        {/* 한 줄 소개 */}
        <section className="match-form-field">

          <label htmlFor="matchIntro">
            한 줄 소개
          </label>

          <input
            id="matchIntro"
            type="text"
            value={intro}
            placeholder="우리 팀을 간단히 소개해주세요."
            maxLength={50}
            onChange={(e) =>
              setIntro(
                e.target.value
              )
            }
          />

          <span>
            {intro.length}/50
          </span>

        </section>


        {/* 하단 버튼 */}
        <div className="match-form-actions">

          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
          >
            취소
          </button>


          <button
            type="button"
            onClick={
              handleSubmit
            }
          >
            {isEditMode
              ? "수정 완료"
              : "등록하기"}
          </button>

        </div>

      </main>

    </div>
  );
}

export default MatchAvailabilityForm;