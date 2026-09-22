// 내 정보 수정 페이지

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import BackButton from "../../components/BackButton/BackButton";

import profileIcon from "../../assets/img/basic_profile_img.png";

import "./MyInfoEdit.css";

function MyInfoEdit() {
    const navigate = useNavigate();
    // ⭐ 기존 사용자 정보
    const [name, setName] = useState("사용자 이름");
    const [nickname, setNickname] = useState("축구ㆍ농구");
    const [gender, setGender] = useState("여성");
    const [birthDate, setBirthDate] = useState("2000.01.01");
    const [region, setRegion] = useState("서울특별시 강서구");

    // ⭐ 저장
    const handleSave = () => {
        // 추후 백엔드 API 연결
        alert("내 정보가 수정되었습니다.");
        navigate("/mypage");
    };

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
                    src={profileIcon}
                    alt="프로필"
                    className="edit-profile-image"
                />

                <button className="profile-image-btn">
                    프로필 사진 변경
                </button>
            </section>

            {/* ⭐ 기본 정보 */}
            <section className="edit-section">
                <h2>기본 정보</h2>

                <div className="edit-item">
                    <label>이름</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div className="edit-item">
                    <label>닉네임</label>
                    <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                    />
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
                    <label>생년월일</label>
                    <input
                        type="text"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        placeholder="YYYY.MM.DD"
                    />
                </div>
            </section>

            {/* ⭐ 활동 지역 */}
            <section className="edit-section">
                <h2>활동 지역</h2>

                <div className="edit-item">
                    <label>활동 지역</label>

                    <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                    >
                        <option>서울특별시 강서구</option>
                        <option>서울특별시 강남구</option>
                        <option>서울특별시 마포구</option>
                        <option>서울특별시 영등포구</option>
                        <option>서울특별시 종로구</option>
                        <option>서울특별시 송파구</option>
                    </select>
                </div>
            </section>

            {/* ⭐ 저장 버튼 */}
            <button
                type="button"
                className="my-info-save-btn"
                onClick={handleSave}
            >
                저장하기
            </button>

        </div>
    );
}

export default MyInfoEdit;