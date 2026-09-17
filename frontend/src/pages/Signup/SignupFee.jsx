// 9. 최대 가능 회비 
 
import "./Signup.css"; 
import { useNavigate } from "react-router-dom"; 
import { useSignup } from "./SignupContext"; 
import backIcon from "../../assets/img/back.png"; 
 
function SignupFee() { 
    const navigate = useNavigate(); 
 
    const { signupData, setSignupData } = useSignup(); 
 
    // 회비 선택 확인 후 최종 정보 확인 페이지로 이동 
    const handleNext = () => { 
        if (signupData.max_monthly_fee === null) { 
            alert("최대 가능 회비를 선택해주세요."); 
            return; 
        } 
 
        navigate("/signup/basic/review"); 
    }; 
 
    return (
        <div className="signup-container"> 
            <button 
                type="button" 
                className="Back-btn" 
                onClick={() => navigate("/signup/basic/SignupClubPreference")} 
                aria-label="뒤로가기" 
            > 
                <img src={backIcon} alt="뒤로가기" /> 
            </button> 
 
            <div className="signup-header07">
                <h2>월 회비는 최대</h2>
                <h2>얼마까지 낼 수 있나요?</h2>
            </div> 
 
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
                    <span className="check-box"></span>
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
                    <span className="check-box"></span>
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
                    <span className="check-box"></span>
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
                    <span className="check-box"></span>
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
                    <span className="check-box"></span>
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
                    <span className="check-box"></span>
                    상관없음 
                </label> 
 
            </div> 
 
            <button 
                className="Next-btn" 
                onClick={handleNext} 
            > 
                다음 
            </button> 
        </div> 
    ); 
} 
 
export default SignupFee; 