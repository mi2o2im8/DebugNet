// 7. 활동 빈도 선택

import "./Signup.css";
import { useNavigate } from "react-router-dom";
import { useSignup } from "./SignupContext";

// 뒤로가기 버튼 소환
import backIcon from "../../assets/img/back.png";

function SignupFrequency() {
    const navigate = useNavigate();

    // 회원가입 전체 데이터 가져오기
    const { signupData, setSignupData } = useSignup();

    // 다음 버튼
    const handleNext = () => {
        if (!signupData.frequency) {
            alert("활동 빈도를 선택해주세요.");
            return;
        }

        // 동호회 선호 선택 페이지로 이동
        navigate("/signup/basic/SignupClubPreference");
    };

    return (
        <div className="signup-container">

            {/* 뒤로가기 버튼 */}
            <button
                type="button"
                className="Back-btn"
                onClick={() => navigate("/signup/basic/SignupTime")}
                aria-label="뒤로가기"
            >
                <img src={backIcon} alt="뒤로가기" />
            </button>

            <div className="signup-header06">
                <h2>얼마나 자주</h2>
                <h2>활동하고 싶나요?</h2>
            </div>

            {/* 활동 빈도 선택 */}
            <div className="frequency-options">

                <label className="frequency-option">
                    <input
                        type="radio"
                        name="frequency"
                        value="주 1회 이하"
                        checked={signupData.frequency === "주 1회 이하"}
                        onChange={(e) =>
                            setSignupData({
                                ...signupData,
                                frequency: e.target.value
                            })
                        }
                    />

                    <span className="check-box">
                        {signupData.frequency === "주 1회 이하" && "✓"}
                    </span>

                    주 1회 이하
                </label>


                <label className="frequency-option">
                    <input
                        type="radio"
                        name="frequency"
                        value="주 1~2회"
                        checked={signupData.frequency === "주 1~2회"}
                        onChange={(e) =>
                            setSignupData({
                                ...signupData,
                                frequency: e.target.value
                            })
                        }
                    />

                    <span className="check-box">
                        {signupData.frequency === "주 1~2회" && "✓"}
                    </span>

                    주 1~2회
                </label>


                <label className="frequency-option">
                    <input
                        type="radio"
                        name="frequency"
                        value="주 3~4회"
                        checked={signupData.frequency === "주 3~4회"}
                        onChange={(e) =>
                            setSignupData({
                                ...signupData,
                                frequency: e.target.value
                            })
                        }
                    />

                    <span className="check-box">
                        {signupData.frequency === "주 3~4회" && "✓"}
                    </span>

                    주 3~4회
                </label>


                <label className="frequency-option">
                    <input
                        type="radio"
                        name="frequency"
                        value="주 5회 이상"
                        checked={signupData.frequency === "주 5회 이상"}
                        onChange={(e) =>
                            setSignupData({
                                ...signupData,
                                frequency: e.target.value
                            })
                        }
                    />

                    <span className="check-box">
                        {signupData.frequency === "주 5회 이상" && "✓"}
                    </span>

                    주 5회 이상
                </label>


                <label className="frequency-option">
                    <input
                        type="radio"
                        name="frequency"
                        value="상관없음"
                        checked={signupData.frequency === "상관없음"}
                        onChange={(e) =>
                            setSignupData({
                                ...signupData,
                                frequency: e.target.value
                            })
                        }
                    />

                    <span className="check-box">
                        {signupData.frequency === "상관없음" && "✓"}
                    </span>

                    상관없음
                </label>

            </div>

            {/* 다음 버튼 */}
            <p></p>

            <button className="Next-btn" onClick={handleNext}>
                다음
            </button>

        </div>
    );
}

export default SignupFrequency;