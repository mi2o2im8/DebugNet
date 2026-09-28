import {
    useEffect,
    useRef,
    useState
} from "react";

import {
    FiMapPin,
    FiSearch,
    FiX
} from "react-icons/fi";

import "./ClubEventPlacePicker.css";


const extractSeoulDistrict = (address = "") => {
    const match = address.match(
        /서울(?:특별시)?\s+([가-힣]+구)/
    );

    return match
        ? match[1]
        : "";
};


function ClubEventPlacePicker({
    location,
    locationAddress,
    latitude,
    longitude,
    onChange
}) {
    const mapRef = useRef(null);

    const [
        inputMode,
        setInputMode
    ] = useState(
        latitude !== null
        && longitude !== null
            ? "map"
            : (
                location
                    ? "manual"
                    : "map"
            )
    );

    const [
        placeKeyword,
        setPlaceKeyword
    ] = useState(location || "");

    const [
        placeResults,
        setPlaceResults
    ] = useState([]);

    const [
        isSearching,
        setIsSearching
    ] = useState(false);


    // -----------------------------------------------------
    // 수정 화면의 기존 장소 정보 반영
    // -----------------------------------------------------
    useEffect(() => {
        setPlaceKeyword(location || "");

        if (
            latitude !== null
            && longitude !== null
        ) {
            setInputMode("map");
        } else if (location) {
            setInputMode("manual");
        }
    }, [
        location,
        latitude,
        longitude
    ]);


    // -----------------------------------------------------
    // 선택한 장소 지도 표시
    // -----------------------------------------------------
    useEffect(() => {
        if (
            inputMode !== "map"
            || latitude === null
            || longitude === null
            || !mapRef.current
            || !window.kakao?.maps
        ) {
            return;
        }

        window.kakao.maps.load(() => {
            const position =
                new window.kakao.maps.LatLng(
                    Number(latitude),
                    Number(longitude)
                );

            const map =
                new window.kakao.maps.Map(
                    mapRef.current,
                    {
                        center: position,
                        level: 4
                    }
                );

            new window.kakao.maps.Marker({
                map,
                position
            });
        });
    }, [
        inputMode,
        latitude,
        longitude
    ]);


    // -----------------------------------------------------
    // 입력 방식 변경
    // -----------------------------------------------------
    const handleModeChange = (nextMode) => {
        setInputMode(nextMode);
        setPlaceResults([]);

        if (nextMode === "manual") {
            onChange({
                location:
                    location || placeKeyword,
                locationAddress: "",
                latitude: null,
                longitude: null
            });
        }
    };


    // -----------------------------------------------------
    // 카카오 장소 검색
    // -----------------------------------------------------
    const handleSearchPlace = () => {
        const keyword = placeKeyword.trim();

        if (!keyword) {
            alert("장소를 검색해주세요.");
            return;
        }

        if (!window.kakao?.maps) {
            alert(
                "카카오 지도 API를 "
                + "불러오지 못했습니다."
            );
            return;
        }

        setIsSearching(true);

        window.kakao.maps.load(() => {
            const places =
                new window.kakao.maps.services.Places();

            places.keywordSearch(
                keyword,
                (result, status) => {
                    setIsSearching(false);

                    if (
                        status
                        === window.kakao.maps
                            .services.Status.OK
                    ) {
                        const seoulResults =
                            result.filter((place) => {
                                const address =
                                    place
                                        .road_address_name
                                    || place.address_name
                                    || "";

                                return Boolean(
                                    extractSeoulDistrict(
                                        address
                                    )
                                );
                            });

                        setPlaceResults(
                            seoulResults
                        );

                        if (
                            seoulResults.length === 0
                        ) {
                            alert(
                                "서울 지역의 검색 결과가 "
                                + "없습니다."
                            );
                        }

                        return;
                    }

                    setPlaceResults([]);

                    if (
                        status
                        === window.kakao.maps
                            .services.Status
                            .ZERO_RESULT
                    ) {
                        alert(
                            "검색 결과가 없습니다."
                        );

                        return;
                    }

                    alert(
                        "장소 검색에 실패했습니다."
                    );
                }
            );
        });
    };


    // -----------------------------------------------------
    // 검색 결과에서 장소 선택
    // -----------------------------------------------------
    const handleSelectPlace = (place) => {
        const address =
            place.road_address_name
            || place.address_name
            || "";

        if (!extractSeoulDistrict(address)) {
            alert(
                "현재는 서울 지역의 장소만 "
                + "선택할 수 있습니다."
            );

            return;
        }

        const selectedLocation = {
            location: place.place_name,
            locationAddress: address,
            latitude: Number(place.y),
            longitude: Number(place.x)
        };

        onChange(selectedLocation);

        setPlaceKeyword(place.place_name);
        setPlaceResults([]);
    };


    // -----------------------------------------------------
    // 직접 입력
    // -----------------------------------------------------
    const handleManualLocationChange = (
        value
    ) => {
        setPlaceKeyword(value);

        onChange({
            location: value,
            locationAddress: "",
            latitude: null,
            longitude: null
        });
    };


    // -----------------------------------------------------
    // 장소 초기화
    // -----------------------------------------------------
    const handleClearPlace = () => {
        setPlaceKeyword("");
        setPlaceResults([]);

        onChange({
            location: "",
            locationAddress: "",
            latitude: null,
            longitude: null
        });
    };


    return (
        <div className="club-event-place-picker">
            <div className="club-event-place-mode">
                <button
                    type="button"
                    className={
                        inputMode === "map"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        handleModeChange("map")
                    }
                >
                    장소 검색
                </button>

                <button
                    type="button"
                    className={
                        inputMode === "manual"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        handleModeChange("manual")
                    }
                >
                    직접 입력
                </button>
            </div>

            {inputMode === "map" ? (
                <>
                    <div className="club-event-place-search">
                        <FiSearch />

                        <input
                            type="search"
                            maxLength="100"
                            placeholder="장소 또는 주소를 검색해주세요"
                            value={placeKeyword}
                            onChange={(event) =>
                                setPlaceKeyword(
                                    event.target.value
                                )
                            }
                            onKeyDown={(event) => {
                                if (
                                    event.key === "Enter"
                                ) {
                                    event.preventDefault();
                                    handleSearchPlace();
                                }
                            }}
                        />

                        <button
                            type="button"
                            disabled={isSearching}
                            onClick={handleSearchPlace}
                        >
                            {isSearching
                                ? "검색 중"
                                : "검색"}
                        </button>
                    </div>

                    {placeResults.length > 0 && (
                        <div className="club-event-place-results">
                            {placeResults.map(
                                (place) => {
                                    const address =
                                        place
                                            .road_address_name
                                        || place.address_name;

                                    return (
                                        <button
                                            key={
                                                place.id
                                                || (
                                                    place
                                                        .place_name
                                                    + address
                                                )
                                            }
                                            type="button"
                                            onClick={() =>
                                                handleSelectPlace(
                                                    place
                                                )
                                            }
                                        >
                                            <FiMapPin />

                                            <span>
                                                <strong>
                                                    {
                                                        place
                                                            .place_name
                                                    }
                                                </strong>

                                                <small>
                                                    {address}
                                                </small>
                                            </span>
                                        </button>
                                    );
                                }
                            )}
                        </div>
                    )}

                    {
                        location
                        && latitude !== null
                        && longitude !== null
                        && (
                            <div className="club-event-selected-place">
                                <div className="club-event-place-map">
                                    <div ref={mapRef} />
                                </div>

                                <div className="club-event-selected-place-info">
                                    <FiMapPin />

                                    <span>
                                        <strong>
                                            {location}
                                        </strong>

                                        <small>
                                            {
                                                locationAddress
                                                || "주소 정보 없음"
                                            }
                                        </small>
                                    </span>

                                    <button
                                        type="button"
                                        aria-label="선택한 장소 삭제"
                                        onClick={
                                            handleClearPlace
                                        }
                                    >
                                        <FiX />
                                    </button>
                                </div>
                            </div>
                        )
                    }
                </>
            ) : (
                <label className="club-event-manual-place">
                    <span>장소 설명</span>

                    <input
                        type="text"
                        maxLength="200"
                        placeholder={
                            "예: 여의도 한강공원 "
                            + "제3주차장 앞"
                        }
                        value={location || ""}
                        onChange={(event) =>
                            handleManualLocationChange(
                                event.target.value
                            )
                        }
                    />

                    <small>
                        정확한 지도 위치가 필요하지 않은
                        경우 직접 입력할 수 있습니다.
                    </small>
                </label>
            )}
        </div>
    );
}


export default ClubEventPlacePicker;