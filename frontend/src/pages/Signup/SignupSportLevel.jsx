// 4. 종목별 운동 수준

import "./Signup.css";
import { useNavigate } from "react-router-dom";
import { useSignup } from "./SignupContext";
// 뒤로가기 버튼 소환
import backIcon from "../../assets/img/back.png";

function SignupSportLevel() {
    const navigate = useNavigate();
    // 회원가입 전체 데이터 가져오기
    const { signupData, setSignupData } = useSignup();
    // 종목별 운동 수준 선택
    const handleLevel = (sport, level) => {
        if (signupData.sports.includes(sport)) {
            setSignupData((prev) => ({
                ...prev,
                levels: {
                    ...prev.levels,
                    [sport]: level
                }
            }));
        }
    };
    //나중에 Supabase에 회원가입 요청을 넣으면서 await를 사용하게 되면 그때 다시
    // const handleSignup = async ()
    const handleNext = () => {
        const allLevelSelcted = signupData.sports.every(
            (sport) => signupData.levels[sport]
        );
        if (!allLevelSelcted){
            alert("모든 운동의 수준을 선택해주세요.");
            return;
        }
        // 운동 수준 선택 페이지로 이동
        navigate("/signup/basic/SignupLocation");
    };
    return (
        // 헤더
        <div className="signup-container">
            {/* 뒤로가기 버튼 */}
            <button
                type="button"
                className="Back-btn"
                onClick={() => navigate("/signup/basic/sport")}
                aria-label="뒤로가기"
            >
                <img src={backIcon} alt="뒤로가기" />
            </button>
            
            <div className="signup-header04">
                <h2>운동 수준을</h2>
                <h2>선택해주세요</h2>
            </div>

            {/* 선택한 종목별 운동 수준 */}
            {signupData.sports.map((sport) => (
                <div className="sport-level-box" key={sport}>

                    {/* 운동 종목 이름 */}
                    <h3>{sport}</h3>

                    <div className="level-box">

                        {/* 초급 */}
                        <button
                            type="button"
                            className={
                                signupData.levels[sport] === "초급"
                                    ? "selected"
                                    : ""
                            }
                            onClick={() => handleLevel(sport, "초급")}
                        >
                            <span className="check-box">
                                {signupData.levels[sport] === "초급" && "✓"}
                            </span>

                            <div>
                                <strong>초급</strong>
                                <p>(운동을 처음 시작했어요)</p>
                            </div>
                        </button>

                        {/* 중급 */}
                        <button
                            type="button"
                            className={
                                signupData.levels[sport] === "중급"
                                    ? "selected"
                                    : ""
                            }
                            onClick={() => handleLevel(sport, "중급")}
                        >
                            <span className="check-box">
                                {signupData.levels[sport] === "중급" && "✓"}
                            </span>

                            <div>
                                <strong>중급</strong>
                                <p>(기본적인 경험이 있어요)</p>
                            </div>
                        </button>

                        {/* 상급 */}
                        <button
                            type="button"
                            className={
                                signupData.levels[sport] === "상급"
                                    ? "selected"
                                    : ""
                            }
                            onClick={() => handleLevel(sport, "상급")}
                        >
                            <span className="check-box">
                                {signupData.levels[sport] === "상급" && "✓"}
                            </span>

                            <div>
                                <strong>상급</strong>
                                <p>(꾸준히 운동하고 있어요)</p>
                            </div>
                        </button>

                    </div>
                </div>
            ))}
            
            
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
export default SignupSportLevel;