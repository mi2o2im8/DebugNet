// 2. 기본정보 입력 페이지

// npm install react-datepicker 설치
import "./Signup.css";
import { useNavigate } from "react-router-dom";
import { useSignup } from "./SignupContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"

function Signup() {
    const navigate = useNavigate();
    // 회원가입 전체 데이터 가져오기
    const { signupData, setSignupData } = useSignup();
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
        // 생년월일 입력 확인
        if (!signupData.birth_date){
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
                <input
                    type="text"
                    name="nickname"
                    placeholder="닉네임을 입력하세요"
                    className="login-input"
                    value={signupData.nickname}
                    onChange={(e) =>
                        setSignupData({
                            ...signupData,
                            nickname: e.target.value
                        })
                    }
                />
            </div>
            
            {/* ---생년월일 입력칸--- */}
            <div className="birth-box">
                <p>생년월일</p>

                <DatePicker
                    selected={signupData.birth_date}
                    onChange={(date) =>
                        setSignupData({
                            ...signupData,
                            birth_date: date
                        })
                    }
                    dateFormat="yyyy-MM-dd"
                    placeholderText="YYYY-MM-DD"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    minDate={new Date(1900, 0, 1)}
                    maxDate={new Date()}
                />
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