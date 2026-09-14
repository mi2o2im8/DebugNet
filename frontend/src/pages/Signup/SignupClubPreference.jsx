// 8. 동호회 선호 선택

import "./Signup.css"; 
import { useNavigate } from "react-router-dom";
import { useSignup } from "./SignupContext";
 
function SignupClubPreference() {
    const navigate = useNavigate();
    // 회원가입 전체 데이터 가져오기
    const { signupData, setSignupData } = useSignup();

    // 동호회 선호 선택값 변경
    const handlePreferenceChange = (e) => {
    const { value, checked } = e.target;
        setSignupData((prev) => ({
            ...prev,
            clubPreferences: checked
                ? [...prev.clubPreferences, value]
                : prev.clubPreferences.filter((item) => item !== value),
        }));
    };
 
    //나중에 Supabase에 회원가입 요청을 넣으면서 await를 사용하게 되면 그때 다시
    // const handleSignup = async ()
    const handleNext = () => {
        if (signupData.clubPreferences.length === 0){
            alert("원하는 동호회를 하나 이상 선택해주세요.");
            return;
        }

        // 동호회 선호 선택 페이지로 이동
        navigate("/signup/basic/SignupFee");
    };
 
    return (
        // 헤더
        <div>
            {/* 뒤로가기 버튼 */}
            <button
                type="button"
                className="Back-btn"
                onClick={() => navigate("/signup/basic/SignupFrequency")}
            >
                뒤로가기
            </button>
            
            <h1 className="signup-level-title">어떤 동호회를</h1>
            <h1 className="signup-level-title">원하시나요?</h1>
            <h4 className="club-preference-example">(복수 선택 가능)</h4>
             
            {/* 선호 활동 선택 */}
            <div className="club-preference-options">
                <label className="club-preference-option">
                    <input
                        type="checkbox"
                        value="친목 중심"
                        checked={signupData.clubPreferences.includes("친목 중심")}
                        onChange={handlePreferenceChange}
                    />
                    친목 중심
                </label>

                <label className="club-preference-option">
                    <input
                        type="checkbox"
                        value="실력 향상"
                        checked={signupData.clubPreferences.includes("실력 향상")}
                        onChange={handlePreferenceChange}
                    />
                    실력 향상
                </label>

                <label className="club-preference-option">
                    <input
                        type="checkbox"
                        value="경쟁적인 활동"
                        checked={signupData.clubPreferences.includes("경쟁적인 활동")}
                        onChange={handlePreferenceChange}
                    />
                    경쟁적인 활동
                </label>

                <label className="club-preference-option">
                    <input
                        type="checkbox"
                        value="가볍게 활동"
                        checked={signupData.clubPreferences.includes("가볍게 활동")}
                        onChange={handlePreferenceChange}
                    />
                    가볍게 활동
                </label>

                <label className="club-preference-option">
                    <input
                        type="checkbox"
                        value="대회/리그 활동"
                        checked={signupData.clubPreferences.includes("대회/리그 활동")}
                        onChange={handlePreferenceChange}
                    />
                    대회/리그 활동
                </label>

                <label className="club-preference-option">
                    <input
                        type="checkbox"
                        value="정기적인 활동"
                        checked={signupData.clubPreferences.includes("정기적인 활동")}
                        onChange={handlePreferenceChange}
                    />
                    정기적인 활동
                </label>

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
export default SignupClubPreference;