// 내 정보 수정 페이지

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import BackButton from "../../components/BackButton/BackButton";

import profileIcon from "../../assets/img/basic_profile_img.png";

// ⭐ API
import {
    getMyProfile,
    updateMyProfile,
    updateProfileImage,
    uploadProfileImage,
} from "../../api/userApi";

import "./MyInfoEdit.css";


// =========================================================
// ⭐ 선택지 (회원가입과 같은 값 / DB sport_id 기준)
// =========================================================
const SPORT_OPTIONS = [
    { sport_id: 1, name: "축구ㆍ풋살" },
    { sport_id: 2, name: "배구" },
    { sport_id: 3, name: "농구" },
    { sport_id: 4, name: "테니스" },
    { sport_id: 5, name: "탁구" },
];

const LEVEL_OPTIONS = ["초급", "중급", "상급"];

// ⭐ 프로필 이미지 규칙 (회원가입과 동일)
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;   // 5MB

// ⭐ 시/도 → 구/군 목록
// 나중에 다른 시/도를 추가할 때는 여기에 한 줄만 추가하면 된다.
// 예) "부산광역시": ["중구", "서구", "동구", ...],
const REGION_MAP = {
    "서울특별시": [
        "종로구", "중구", "용산구", "성동구", "광진구",
        "동대문구", "중랑구", "성북구", "강북구", "도봉구",
        "노원구", "은평구", "서대문구", "마포구", "양천구",
        "강서구", "구로구", "금천구", "영등포구", "동작구",
        "관악구", "서초구", "강남구", "송파구", "강동구",
    ],
};

const CITY_OPTIONS = Object.keys(REGION_MAP);

// 이미 저장된 구/군이 어느 시/도에 속하는지 찾기
const findCityOfDistrict = (district) =>
    CITY_OPTIONS.find((city) => REGION_MAP[city].includes(district)) || "";

// DB에 "남자"/"여자"로 들어간 예전 데이터가 있어도 버튼이 선택되도록
const normalizeGender = (gender) => {
    if (gender === "남자" || gender === "male") return "남성";
    if (gender === "여자" || gender === "female") return "여성";
    return gender || "";
};


function MyInfoEdit() {

    const navigate = useNavigate();


    // =========================================================
    // ⭐ 폼 상태
    // =========================================================
    const [userId, setUserId] = useState("");
    const [profileImage, setProfileImage] = useState(null);   // DB에 저장된 URL

    // ⭐ 새로 고른 사진 (저장하기 누를 때 업로드)
    const [newImageFile, setNewImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const fileInputRef = useRef(null);

    const [name, setName] = useState("");
    const [nickname, setNickname] = useState("");
    const [gender, setGender] = useState("");
    const [birthDate, setBirthDate] = useState("");   // "YYYY-MM-DD"

    // ⭐ { [sport_id]: "초급" | "중급" | "상급" | "" }
    const [sportLevels, setSportLevels] = useState({});

    // ⭐ ["강서구", "마포구"]
    const [regions, setRegions] = useState([]);

    // ⭐ 현재 고르고 있는 시/도
    const [selectedCity, setSelectedCity] = useState("");


    // =========================================================
    // ⭐ 화면 상태
    // =========================================================
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [nicknameError, setNicknameError] = useState("");


    // =========================================================
    // ⭐ 기존 내 정보 불러오기 (마이페이지와 같은 API)
    // =========================================================
    useEffect(() => {

        const fetchMyProfile = async () => {

            try {

                const data = await getMyProfile();

                setUserId(data.user_id);
                setProfileImage(data.profile_image);
                setName(data.name ?? "");
                setNickname(data.nickname ?? "");
                setGender(normalizeGender(data.gender));
                setBirthDate(data.birth_date ?? "");

                const levels = {};
                (data.sports ?? []).forEach((sport) => {
                    levels[sport.sport_id] = sport.sport_level ?? "";
                });
                setSportLevels(levels);

                const savedRegions = data.regions ?? [];
                setRegions(savedRegions);

                // 저장된 지역이 있으면 그 시/도를 미리 선택
                if (savedRegions.length > 0) {
                    setSelectedCity(findCityOfDistrict(savedRegions[0]));
                }

            } catch (error) {

                console.error("내 정보 조회 오류:", error);
                setLoadError(error.message);

            } finally {

                setLoading(false);

            }
        };

        fetchMyProfile();

    }, []);


    // =========================================================
    // ⭐ 미리보기 URL 정리 (메모리 누수 방지)
    // =========================================================
    useEffect(() => {

        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };

    }, [previewUrl]);


    // =========================================================
    // ⭐ 프로필 사진 선택
    //
    // 고르자마자 업로드하지 않고 미리보기만 보여준다.
    // → 저장 안 하고 뒤로 가면 사진도 안 바뀐다.
    // =========================================================
    const handleImageChange = (e) => {

        const file = e.target.files?.[0];

        // 같은 파일을 다시 골라도 onChange가 동작하도록 초기화
        e.target.value = "";

        if (!file) return;

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            alert("JPG, PNG, WEBP 이미지만 등록할 수 있습니다.");
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            alert("프로필 이미지는 5MB 이하만 등록할 수 있습니다.");
            return;
        }

        setNewImageFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };


    // =========================================================
    // ⭐ 종목 선택 / 해제
    // =========================================================
    const handleSportToggle = (sportId) => {

        setSportLevels((prev) => {

            const next = { ...prev };

            if (sportId in next) {
                delete next[sportId];
            } else {
                next[sportId] = "";   // 수준은 아래에서 고르기
            }

            return next;
        });
    };


    // =========================================================
    // ⭐ 종목별 수준 선택
    // =========================================================
    const handleLevelChange = (sportId, level) => {

        setSportLevels((prev) => ({
            ...prev,
            [sportId]: level,
        }));
    };


    // =========================================================
    // ⭐ 구/군 추가 (select에서 고르면 목록에 추가)
    // =========================================================
    const handleDistrictSelect = (district) => {

        if (!district) return;

        setRegions((prev) =>
            prev.includes(district) ? prev : [...prev, district]
        );
    };


    // =========================================================
    // ⭐ 선택된 지역 삭제 (x 버튼)
    // =========================================================
    const handleRegionRemove = (district) => {

        setRegions((prev) => prev.filter((item) => item !== district));
    };


    // =========================================================
    // ⭐ 저장
    // =========================================================
    const handleSave = async () => {

        // ---------- 프론트 1차 검사 ----------
        if (!name.trim()) {
            alert("이름을 입력해주세요.");
            return;
        }

        if (nickname.trim().length < 2) {
            alert("닉네임은 2글자 이상 입력해주세요.");
            return;
        }

        if (!gender) {
            alert("성별을 선택해주세요.");
            return;
        }

        if (!birthDate) {
            alert("생년월일을 입력해주세요.");
            return;
        }

        const selectedSportIds = Object.keys(sportLevels).map(Number);

        if (selectedSportIds.length === 0) {
            alert("운동 종목을 하나 이상 선택해주세요.");
            return;
        }

        const missingLevel = SPORT_OPTIONS.find(
            (sport) =>
                selectedSportIds.includes(sport.sport_id) &&
                !sportLevels[sport.sport_id]
        );

        if (missingLevel) {
            alert(`${missingLevel.name}의 운동 수준을 선택해주세요.`);
            return;
        }

        if (regions.length === 0) {
            alert("활동 지역을 하나 이상 선택해주세요.");
            return;
        }


        // ---------- 백엔드로 보낼 데이터 ----------
        const payload = {
            name: name.trim(),
            nickname: nickname.trim(),
            gender,
            birth_date: birthDate,
            sports: selectedSportIds
                .sort((a, b) => a - b)
                .map((sportId) => ({
                    sport_id: sportId,
                    sport_level: sportLevels[sportId],
                })),
            regions,
        };


        try {

            setSaving(true);
            setNicknameError("");

            // 1. 기본 정보 저장
            //    (닉네임 중복이면 여기서 멈춰서 사진은 올라가지 않음)
            await updateMyProfile(payload);

            // 2. 새 사진을 골랐다면 업로드 + URL 저장
            if (newImageFile) {

                try {

                    const imageUrl = await uploadProfileImage(
                        userId,
                        newImageFile
                    );

                    await updateProfileImage(imageUrl);

                } catch (imageError) {

                    console.error("프로필 이미지 저장 오류:", imageError);

                    alert(
                        "정보는 저장되었지만 프로필 사진 변경에 실패했습니다.\n" +
                        imageError.message
                    );

                    navigate("/mypage");
                    return;
                }
            }

            alert("내 정보가 수정되었습니다.");
            navigate("/mypage");

        } catch (error) {

            console.error("내 정보 수정 오류:", error);

            // ⭐ 닉네임 중복은 입력칸 아래에 표시
            if (error.status === 409) {
                setNicknameError(error.message);
                return;
            }

            alert(error.message || "내 정보 수정에 실패했습니다.");

        } finally {

            setSaving(false);

        }
    };


    // =========================================================
    // ⭐ 로딩 / 에러
    // =========================================================
    if (loading) {
        return (
            <div className="my-info-edit-page">
                <p className="edit-status-text">정보를 불러오는 중...</p>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="my-info-edit-page">
                <header className="my-info-edit-header">
                    <BackButton />
                    <h1>내 정보 수정</h1>
                </header>
                <p className="edit-status-text">
                    내 정보를 불러오지 못했습니다.
                    <br />
                    {loadError}
                </p>
            </div>
        );
    }


    return (
        <div className="my-info-edit-page">

            {/* ⭐ 상단 */}
            <header className="my-info-edit-header">
                <BackButton />
                <h1>내 정보 수정</h1>
            </header>

            {/* ⭐ 프로필 */}
            <section className="edit-profile-section">
                <img
                    src={previewUrl || profileImage || profileIcon}
                    alt="프로필"
                    className="edit-profile-image"
                />

                {/* 실제 파일 선택창은 숨기고 버튼으로 연다 */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    hidden
                />

                <button
                    type="button"
                    className="profile-image-btn"
                    onClick={() => fileInputRef.current?.click()}
                >
                    프로필 사진 변경
                </button>

                {newImageFile && (
                    <p className="profile-image-hint">
                        저장하기를 눌러야 사진이 변경돼요
                    </p>
                )}
            </section>

            {/* ⭐ 기본 정보 */}
            <section className="edit-section">
                <h2>기본 정보</h2>

                <div className="edit-item">
                    <label htmlFor="edit-name">이름</label>
                    <input
                        id="edit-name"
                        type="text"
                        value={name}
                        maxLength={50}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div className="edit-item">
                    <label htmlFor="edit-nickname">닉네임</label>
                    <input
                        id="edit-nickname"
                        type="text"
                        value={nickname}
                        maxLength={20}
                        className={nicknameError ? "input-error" : ""}
                        onChange={(e) => {
                            setNickname(e.target.value);
                            setNicknameError("");
                        }}
                    />
                    {nicknameError && (
                        <p className="edit-error-text">{nicknameError}</p>
                    )}
                </div>

                <div className="edit-item">
                    <label>성별</label>

                    <div className="gender-buttons">
                        <button
                            type="button"
                            className={gender === "여성" ? "active" : ""}
                            onClick={() => setGender("여성")}
                        >
                            여성
                        </button>

                        <button
                            type="button"
                            className={gender === "남성" ? "active" : ""}
                            onClick={() => setGender("남성")}
                        >
                            남성
                        </button>
                    </div>
                </div>

                <div className="edit-item">
                    <label htmlFor="edit-birth">생년월일</label>
                    <input
                        id="edit-birth"
                        type="date"
                        value={birthDate}
                        max={new Date().toISOString().slice(0, 10)}
                        onChange={(e) => setBirthDate(e.target.value)}
                    />
                </div>
            </section>

            {/* ⭐ 운동 종목 + 수준 */}
            <section className="edit-section">
                <h2>운동 종목</h2>
                <p className="edit-section-desc">
                    복수 선택 가능 · 종목마다 수준을 골라주세요
                </p>

                <div className="edit-chip-list">
                    {SPORT_OPTIONS.map((sport) => (
                        <button
                            key={sport.sport_id}
                            type="button"
                            className={
                                sport.sport_id in sportLevels
                                    ? "edit-chip active"
                                    : "edit-chip"
                            }
                            onClick={() => handleSportToggle(sport.sport_id)}
                        >
                            {sport.name}
                        </button>
                    ))}
                </div>

                {SPORT_OPTIONS
                    .filter((sport) => sport.sport_id in sportLevels)
                    .map((sport) => (
                        <div key={sport.sport_id} className="sport-level-row">

                            <span className="sport-level-name">
                                {sport.name}
                            </span>

                            <div className="sport-level-buttons">
                                {LEVEL_OPTIONS.map((level) => (
                                    <button
                                        key={level}
                                        type="button"
                                        className={
                                            sportLevels[sport.sport_id] === level
                                                ? "active"
                                                : ""
                                        }
                                        onClick={() =>
                                            handleLevelChange(sport.sport_id, level)
                                        }
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>

                        </div>
                    ))}
            </section>

            {/* ⭐ 활동 지역 (시/도 → 구/군) */}
            <section className="edit-section">
                <h2>활동 지역</h2>
                <p className="edit-section-desc">
                    시/도를 고른 뒤 구/군을 추가해주세요 (복수 선택 가능)
                </p>

                <div className="region-select-row">

                    {/* 시/도 */}
                    <div className="edit-item region-select-item">
                        <label htmlFor="edit-city">시/도</label>
                        <select
                            id="edit-city"
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                        >
                            <option value="">시/도 선택</option>

                            {CITY_OPTIONS.map((city) => (
                                <option key={city} value={city}>
                                    {city}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 구/군 */}
                    <div className="edit-item region-select-item">
                        <label htmlFor="edit-district">구/군</label>
                        <select
                            id="edit-district"
                            // 항상 "구/군 선택"으로 돌아가서
                            // 같은 구를 지웠다가 다시 골라도 동작하게 함
                            value=""
                            disabled={!selectedCity}
                            onChange={(e) => handleDistrictSelect(e.target.value)}
                        >
                            <option value="">구/군 선택</option>

                            {(REGION_MAP[selectedCity] ?? []).map((district) => (
                                <option
                                    key={district}
                                    value={district}
                                    disabled={regions.includes(district)}
                                >
                                    {district}
                                    {regions.includes(district) ? " (선택됨)" : ""}
                                </option>
                            ))}
                        </select>
                    </div>

                </div>

                {/* 선택된 지역 */}
                <div className="selected-region-box">
                    <p className="selected-region-title">
                        선택된 지역 {regions.length}개
                    </p>

                    {regions.length === 0 ? (
                        <p className="selected-region-empty">
                            아직 선택한 지역이 없어요
                        </p>
                    ) : (
                        <div className="edit-chip-list">
                            {regions.map((district) => (
                                <button
                                    key={district}
                                    type="button"
                                    className="edit-chip active region-chip"
                                    onClick={() => handleRegionRemove(district)}
                                    aria-label={`${district} 삭제`}
                                >
                                    {district}
                                    <span className="region-chip-remove">✕</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ⭐ 저장 버튼 */}
            <button
                type="button"
                className="my-info-save-btn"
                onClick={handleSave}
                disabled={saving}
            >
                {saving ? "저장 중..." : "저장하기"}
            </button>

        </div>
    );
}

export default MyInfoEdit;
