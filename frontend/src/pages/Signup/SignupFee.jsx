// 9. 최대 가능 회비

import "./Signup.css";
import { useNavigate } from "react-router-dom";
import { useSignup } from "./SignupContext";
import { supabase } from "../../../supabaseClient";

function SignupFee() {
    const navigate = useNavigate();

    const { signupData, setSignupData } = useSignup();

    // 회원가입 완료
    const handleNext = async () => {
        if (signupData.max_monthly_fee === null) {
            alert("최대 가능 회비를 선택해주세요.");
            return;
        }
        try {
            // Supabase Auth에 전달되는 이메일 확인
            console.log("회원가입 이메일:", signupData.email);
            console.log("비밀번호 입력 여부:", !!signupData.password);

            // 이메일 또는 비밀번호가 비어 있으면 회원가입 중단
            if (!signupData.email || !signupData.password) {
                alert("이메일 또는 비밀번호가 입력되지 않았습니다.");
                return;
            }
            // Supabase Auth 회원가입
            const { data, error } = await supabase.auth.signUp({
                email: signupData.email,
                password: signupData.password,
            });

            // 회원가입 실패
            if (error) {
                console.error("회원가입 오류:", error);
                alert(error.message);
                return;
            }

            // Supabase에서 생성된 UUID 확인
            if (!data.user) {
                alert("회원가입은 되었지만 사용자 정보를 확인할 수 없습니다.");
                return;
            }

            // Supabase에서 생성된 UUID
            const userId = data.user.id;

            console.log("생성된 UUID:", userId);
            console.log("회원가입 정보:", signupData);

            // 여기서 나중에 백엔드 API 호출
            // 현재는 Supabase Auth 회원가입까지만 연결된 상태

            alert("회원가입이 완료되었습니다.");

            navigate("/Login");

        } catch (error) {
            console.error("회원가입 오류:", error);
            alert("회원가입 중 오류가 발생했습니다.");
        }
    };

    return (
        <div>
            {/* 뒤로가기 버튼 */}
            <button
                type="button"
                className="Back-btn"
                onClick={() => navigate("/signup/basic/SignupClubPreference")}
            >
                뒤로가기
            </button>
            
            <h1 className="signup-level-title">월 회비는 최대</h1>
            <h1 className="signup-level-title">얼마까지 낼 수 있나요?</h1>

            <div className="frequency-options">

                <label className="frequency-option">
                    <input
                        type="radio"
                        name="fee"
                        value="10000"
                        checked={signupData.max_monthly_fee === 10000}
                        onChange={(e) =>
                            setSignupData({
                                ...signupData,
                                max_monthly_fee: Number(e.target.value)
                            })
                        }
                    />
                    1만원 이하
                </label>

                <label className="frequency-option">
                    <input
                        type="radio"
                        name="fee"
                        value="20000"
                        checked={signupData.max_monthly_fee === 20000}
                        onChange={(e) =>
                            setSignupData({
                                ...signupData,
                                max_monthly_fee: Number(e.target.value)
                            })
                        }
                    />
                    2만원 이하
                </label>

                <label className="frequency-option">
                    <input
                        type="radio"
                        name="fee"
                        value="30000"
                        checked={signupData.max_monthly_fee === 30000}
                        onChange={(e) =>
                            setSignupData({
                                ...signupData,
                                max_monthly_fee: Number(e.target.value)
                            })
                        }
                    />
                    3만원 이하
                </label>

                <label className="frequency-option">
                    <input
                        type="radio"
                        name="fee"
                        value="50000"
                        checked={signupData.max_monthly_fee === 50000}
                        onChange={(e) =>
                            setSignupData({
                                ...signupData,
                                max_monthly_fee: Number(e.target.value)
                            })
                        }
                    />
                    5만원 이하
                </label>

                <label className="frequency-option">
                    <input
                        type="radio"
                        name="fee"
                        value="100000"
                        checked={signupData.max_monthly_fee === 100000}
                        onChange={(e) =>
                            setSignupData({
                                ...signupData,
                                max_monthly_fee: Number(e.target.value)
                            })
                        }
                    />
                    10만원 이하
                </label>

                <label className="frequency-option">
                    <input
                        type="radio"
                        name="fee"
                        value="0"
                        checked={signupData.max_monthly_fee === 0}
                        onChange={() =>
                            setSignupData({
                                ...signupData,
                                max_monthly_fee: 0
                            })
                        }
                    />
                    상관없음
                </label>

            </div>

            <button
                className="Next-btn"
                onClick={handleNext}
            >
                회원가입 완료
            </button>
        </div>
    );
}

export default SignupFee;