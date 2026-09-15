// 2. 기본정보 입력 페이지

// npm install react-datepicker 설치
import "./Signup.css";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSignup } from "./SignupContext";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css"
import basicProfileImg from "../../assets/img/basic_profile_img.png";

// 뒤로가기 버튼 소환
import backIcon from "../../assets/img/back.png";

function Signup() {
    const navigate = useNavigate();
    // 회원가입 전체 데이터 가져오기
    const { signupData,
    setSignupData,
    profileImageFile,
    setProfileImageFile 
    } = useSignup();
    
    //선택한 사진 있으면 선택한 사진 보여주고 없으면 기본이미지 보여주기
    const [profilePreview, setProfilePreview] = useState(
    profileImageFile
        ? URL.createObjectURL(profileImageFile)
        : basicProfileImg
    );

    const profileInputRef = useRef(null);

    //닉네임 중복확인
    const [nicknameCheckMessage, setNicknameCheckMessage] = useState("");
    const [isNicknameChecked, setIsNicknameChecked] = useState(false);

    //생년월일 등록
    const birthParts = signupData.birth_date
    ? signupData.birth_date.split("-")
    : ["", "", ""];

    const [birthYear, setBirthYear] = useState(
    birthParts[0] || ""
    );

    const [birthMonth, setBirthMonth] = useState(
        birthParts[1]
            ? String(Number(birthParts[1]))
            : ""
    );

    const [birthDay, setBirthDay] = useState(
        birthParts[2]
            ? String(Number(birthParts[2]))
            : ""
    );
    const currentYear = new Date().getFullYear();

    const years = Array.from(
        { length: currentYear - 1940 + 1 },
        (_, index) => currentYear - index
    );

    const months = Array.from(
        { length: 12 },
        (_, index) => index + 1
    );

    const getDaysInMonth = (year, month) => {
        if (!year || !month) {
            return 31;
        }

        return new Date(
            Number(year),
            Number(month),
            0
        ).getDate();
        };

    const daysInMonth = getDaysInMonth(birthYear, birthMonth);

    const days = Array.from(
        { length: daysInMonth },
        (_, index) => index + 1
    );

    const updateBirthDate = (year, month, day) => {
    if (!year || !month || !day) {
        setSignupData((prev) => ({
            ...prev,
            birth_date: ""
        }));
        return;
    }

    const formattedMonth = String(month).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");

    setSignupData((prev) => ({
        ...prev,
        birth_date: `${year}-${formattedMonth}-${formattedDay}`
    }));
    };


    // 프로필 이미지
    const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
        alert("JPG, PNG, WEBP 이미지만 등록할 수 있습니다.");
        e.target.value = "";
        return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
        alert("프로필 이미지는 5MB 이하만 등록할 수 있습니다.");
        e.target.value = "";
        return;
    }

    setProfileImageFile(file);

    const previewUrl = URL.createObjectURL(file);
    setProfilePreview(previewUrl);
    };

    //프로필 이미지 초기화
    const handleRemoveProfileImage = () => {
    if (profilePreview.startsWith("blob:")) {
        URL.revokeObjectURL(profilePreview);
    }

    setProfileImageFile(null);
    setProfilePreview(basicProfileImg);

    if (profileInputRef.current) {
        profileInputRef.current.value = "";
    }
    };

    //닉네임 중복 검사
    const handleNicknameCheck = async () => {
    const nickname = signupData.nickname?.trim();

    if (!nickname) {
        alert("닉네임을 입력해주세요.");
        return;
    }

    try {
        const response = await fetch(
            `http://127.0.0.1:8000/api/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`
        );

        if (!response.ok) {
            throw new Error("닉네임 중복확인 요청에 실패했습니다.");
        }

        const data = await response.json();

        if (data.available) {
            setNicknameCheckMessage("사용 가능한 닉네임입니다.");
            setIsNicknameChecked(true);
        } else {
            setNicknameCheckMessage("이미 사용 중인 닉네임입니다.");
            setIsNicknameChecked(false);
        }
    } catch (error) {
        console.error(error);
        alert("닉네임 중복확인 중 오류가 발생했습니다.");
        setIsNicknameChecked(false);
    }
    };

    //나중에 Supabase에 회원가입 요청을 넣으면서 await를 사용하게 되면 그때 다시
    // const handleSignup = async ()
    const handleNext = () => {
        // 닉네임 입력 확인 (trim은 문자열 앞뒤 공백제거 함수)
        if (!signupData.name.trim()){
            alert("이름을 입력해주세요.");
            return;
        }
        if (!signupData.nickname.trim()){
            alert("닉네임을 입력해주세요.");
            return;
        }

        // 닉네임 중복체크 확인
        if (!isNicknameChecked) {
            alert("닉네임 중복확인을 해주세요.");
            return;
        }
        // 생년월일 입력 확인
        if (!birthYear || !birthMonth || !birthDay) {
            alert("생년월일을 선택해주세요.");
            return;
        }
        // 성별 선택 확인
        if (!signupData.gender){
            alert("성별을 선택해주세요.");
            return;
        }
        // 운동 종목 페이지로 이동
        navigate("/signup/basic/sport");
    };
    return (
        // 헤더
        <div>
            {/* 뒤로가기 버튼 */}
            <button
                type="button"
                className="Back-btn"
                onClick={() => navigate("/signup")}
            >
                뒤로가기
            </button>
            
            <h1>기본 정보를</h1>
            <h1>입력해주세요</h1>
            <p>나에게 맞는 동호회 추천을</p>
            <p>위해 필요한 정보에.</p>

            {/* ---- 프로필 입력 ---- */}
            {/* ---- 프로필 이미지 ---- */}
            <div
            style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
            }}
            >
                <div
                    style={{
                        position: "relative",
                        width: "100px",
                        height: "100px"
                    }}
                >
                    <img
                        src={profilePreview}
                        alt="프로필 미리보기"
                        width="100"
                        height="100"
                        style={{
                            borderRadius: "50%",
                            objectFit: "cover"
                        }}
                    />

                    {profileImageFile && (
                        <button
                            type="button"
                            onClick={handleRemoveProfileImage}
                            aria-label="프로필 이미지 삭제"
                            style={{
                                position: "absolute",
                                top: "0",
                                left: "0"
                            }}
                        >
                            ×
                        </button>
                    )}
                </div>

                <div>
                    <label htmlFor="profile-image">
                        프로필 사진 선택
                    </label>

                    <input
                        ref={profileInputRef}
                        id="profile-image"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageChange}
                    />
                </div>
            </div>

            {/* ----이름 입력칸---- */}
            <div className="name-box">
                <p className="name-label">성명</p>
                <input
                    type="text"
                    name="name"
                    placeholder="이름을 입력하세요"
                    className="login-input"
                    value={signupData.name}
                    onChange={(e) =>
                        setSignupData({
                            ...signupData,
                            name: e.target.value
                        })
                    }
                />
            </div>

            {/* ----닉네임입력칸---- */}
            <div className="nickname-box">
                <p className="nickname-label">닉네임</p>

                <div>
                    <input
                        type="text"
                        name="nickname"
                        placeholder="닉네임을 입력하세요"
                        className="login-input"
                        value={signupData.nickname}
                        onChange={(e) => {
                            setSignupData({
                                ...signupData,
                                nickname: e.target.value
                            });

                            setIsNicknameChecked(false);
                            setNicknameCheckMessage("");
                        }}
                    />

                    <button
                        type="button"
                        onClick={handleNicknameCheck}
                    >
                        중복확인
                    </button>
                </div>

                {nicknameCheckMessage && (
                    <p>{nicknameCheckMessage}</p>
                )}
            </div>
            
            {/* ---생년월일 입력칸--- */}
            <div className="birth-box">
                <p>생년월일</p>

                <div>
                    <select
                        value={birthYear}
                        onChange={(e) => {
                            const year = e.target.value;

                            setBirthYear(year);
                            updateBirthDate(year, birthMonth, birthDay);
                        }}
                    >
                        <option value="">년도</option>

                        {years.map((year) => (
                            <option
                                key={year}
                                value={year}
                            >
                                {year}년
                            </option>
                        ))}
                    </select>

                    <select
                        value={birthMonth}
                        onChange={(e) => {
                        const month = e.target.value;

                        setBirthMonth(month);

                        const maxDay = getDaysInMonth(birthYear, month);

                        if (Number(birthDay) > maxDay) {
                            setBirthDay("");
                            return;
                        }

                        updateBirthDate(birthYear, month, birthDay);
                    }}
                    >
                        <option value="">월</option>

                        {months.map((month) => (
                            <option
                                key={month}
                                value={month}
                            >
                                {month}월
                            </option>
                        ))}
                    </select>

                    <select
                        value={birthDay}
                        onChange={(e) => {
                            const day = e.target.value;

                            setBirthDay(day);
                            updateBirthDate(birthYear, birthMonth, day);
                        }}
                    >
                        <option value="">일</option>

                        {days.map((day) => (
                            <option
                                key={day}
                                value={day}
                            >
                                {day}일
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            

            {/* ----성별 선택----- */}
            <p className="gender-title">성별</p>
            <div className="gender-box">
                <button
                    type="button"
                    className={signupData.gender === "남성" ? "selected" : ""}
                    onClick={() =>
                        setSignupData({
                            ...signupData,
                            gender:"남성"
                        })
                    }
                >
                    남성
                </button>
                <button
                    type="button"
                    className={signupData.gender === "여성" ? "selected" : ""}
                    onClick={() =>
                        setSignupData({
                            ...signupData,
                            gender: "여성"
                        })
                    }
                >
                    여성
                </button>
            </div>
            
            
            {/* ---------------다음버튼 -----------------*/}
            {/* 단순히 페이지 이동하는 버튼 → <Link>
            조건 검사 후 이동하는 버튼 → useNavigate() */}
            <button className="Next-btn" onClick={handleNext}>
                다음
            </button>
            
        </div>
    )
}

// -------------
export default Signup