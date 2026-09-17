import { useState } from "react";
import CustomSelect from "../../components/common/CustomSelect";

import {
    FiChevronDown,
    FiImage,
    FiMapPin,
    FiUploadCloud
} from "react-icons/fi";

import footballIcon from "../../assets/img/sports/ball.png";
import basketballIcon from "../../assets/img/sports/basketball.png";
import volleyballIcon from "../../assets/img/sports/volleyball-ball.png";
import pingPongIcon from "../../assets/img/sports/ping-pong.png";
import tennisIcon from "../../assets/img/sports/tennis-ball.png";

const SPORT_OPTIONS = [
        {
            value: "축구·풋살",
            label: "축구/풋살",
            icon: footballIcon
        },
        {
            value: "농구",
            label: "농구",
            icon: basketballIcon
        },
        {
            value: "배구",
            label: "배구",
            icon: volleyballIcon
        },
        {
            value: "탁구",
            label: "탁구",
            icon: pingPongIcon
        },
        {
            value: "테니스",
            label: "테니스",
            icon: tennisIcon
        }
    ];

    const CITY_OPTIONS = [
        {
            value: "서울특별시",
            label: "서울특별시"
        }
    ];

    const DISTRICT_OPTIONS = [
        { value: "마포구", label: "마포구" },
        { value: "영등포구", label: "영등포구" },
        { value: "용산구", label: "용산구" },
        { value: "성동구", label: "성동구" }
    ];

function BasicInfoStep({ formData, onChange }) {

    const [isSportOpen, setIsSportOpen] = useState(false);

    const selectedSport = SPORT_OPTIONS.find(
        (sport) => sport.value === formData.sport
    );

    // 대표 이미지 선택
    const handleImageChange = (event) => {
        const file = event.target.files[0];

        if (!file) {
            return;
        }

        // 이미지 파일 확인
        if (!file.type.startsWith("image/")) {
            alert("이미지 파일만 선택할 수 있습니다.");
            return;
        }

        // 최대 5MB 확인
        if (file.size > 5 * 1024 * 1024) {
            alert("5MB 이하의 이미지를 선택해주세요.");
            return;
        }

        onChange("representativeImageFile", file);

        const reader = new FileReader();

        reader.onload = () => {
            onChange("representativeImage", reader.result);
        };

        reader.readAsDataURL(file);
    };



    return (
        <div className="club-basic-step">

            {/* 페이지 제목 */}
            <div className="club-basic-heading">
                <h2>기본 정보를 입력해주세요.</h2>
                <p>동호회의 첫인상을 결정하는 정보예요.</p>
            </div>

            {/* 대표 이미지 */}
            <label
                htmlFor="clubRepresentativeImage"
                className="club-basic-image-upload"
            >
                <input
                    id="clubRepresentativeImage"
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleImageChange}
                />

                {formData.representativeImage ? (
                    <img
                        src={formData.representativeImage}
                        alt="선택한 동호회 대표 이미지"
                    />
                ) : (
                    <>
                        <span className="club-basic-image-icon">
                            <FiImage />
                        </span>

                        <strong>
                            <FiUploadCloud />
                            대표 이미지 추가
                        </strong>

                        <small>JPG, PNG (최대 5MB)</small>
                    </>
                )}
            </label>

            {/* 동호회 이름 */}
            <div className="club-create-field">
                <label htmlFor="clubName">
                    동호회 이름 <em>*</em>
                </label>

                <div className="club-create-input-wrapper">
                    <input
                        id="clubName"
                        type="text"
                        className="club-create-input"
                        placeholder="예) 한강 러닝 클럽"
                        maxLength={20}
                        value={formData.clubName}
                        onChange={(event) =>
                            onChange("clubName", event.target.value)
                        }
                    />

                    <span className="club-create-input-count">
                        {formData.clubName.length}/20
                    </span>
                </div>
            </div>

            {/* 운동 종목 */}
            <div className="club-create-field">
                <label>
                    운동 종목 <em>*</em>
                </label>

                <CustomSelect
                    value={formData.sport}
                    options={SPORT_OPTIONS}
                    placeholder="운동 종목을 선택해주세요"
                    ariaLabel="운동 종목 선택"
                    onChange={(value) => onChange("sport", value)}
                />
            </div>

            {/* 주요 활동 지역 */}
            <div className="club-create-field">
                <label>
                    주요 활동 지역 <em>*</em>
                </label>

                <div className="club-basic-region-row">
                    <CustomSelect
                        value={formData.city}
                        options={CITY_OPTIONS}
                        placeholder="시·도 선택"
                        ariaLabel="시도 선택"
                        onChange={(value) => onChange("city", value)}
                    />

                    <CustomSelect
                        value={formData.district}
                        options={DISTRICT_OPTIONS}
                        placeholder="구·군 선택"
                        ariaLabel="구군 선택"
                        onChange={(value) => onChange("district", value)}
                    />
                </div>

                <div className="club-create-icon-input">
                    <FiMapPin />

                    <input
                        type="text"
                        className="club-create-input"
                        placeholder="상세 활동 장소 (선택)"
                        value={formData.detailLocation}
                        onChange={(event) =>
                            onChange(
                                "detailLocation",
                                event.target.value
                            )
                        }
                    />
                </div>
            </div>

            {/* 운영자 정보 */}
            <div className="club-create-field">
                <label>
                    운영자 정보 <em>*</em>
                </label>

                <div className="club-basic-operator-card">
                    <span className="club-basic-operator-avatar">
                        김
                    </span>

                    <strong>김성우</strong>

                    <span className="club-basic-operator-badge">
                        운영자
                    </span>
                </div>
            </div>

        </div>
    );
}

export default BasicInfoStep;