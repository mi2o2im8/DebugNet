// 9. 최대 가능 회비

import "./Signup.css";
import { useNavigate } from "react-router-dom";
import { useSignup } from "./SignupContext";

function SignupFee() {
    const navigate = useNavigate();

    const { signupData, setSignupData } = useSignup();

    // ⭐ 회원가입 완료
    const handleNext = async () => {

        // 최대 가능 회비 선택 확인
        if (signupData.max_monthly_fee === null) {
            alert("최대 가능 회비를 선택해주세요.");
            return;
        }

        try {
            // ⭐ sports와 levels 실제 데이터 확인
            console.log("최종 signupData:", signupData);
            console.log("signupData.sports:", signupData.sports);
            console.log("signupData.levels:", signupData.levels);

            // ⭐ 운동 이름 → 백엔드 sport_id 변환
            const sportIdMap = {
                "축구ㆍ풋살": 1,
                "배구": 2,
                "농구": 3,
                "테니스": 4,
                "탁구": 5
            };

            // ⭐ 백엔드가 요구하는 형식으로 변환
            const formattedSports = signupData.sports.map((sportName) => {

                const sportId = sportIdMap[sportName];

                if (!sportId) {
                    throw new Error(`등록되지 않은 운동 종목입니다: ${sportName}`);
                }

                return {
                    sport_id: sportId,
                    sport_level: signupData.levels[sportName]
                };
            });

            console.log("formattedSports:", formattedSports);

            // ⭐ 백엔드에 보낼 최종 데이터
            const requestData = {
                email: signupData.email,
                password: signupData.password,

                name: signupData.name,
                nickname: signupData.nickname,
                gender: signupData.gender,

                birth_date: signupData.birth_date
                    ? signupData.birth_date.toISOString().split("T")[0]
                    : null,

                travel_distance_km: signupData.travel_distance_km,
                max_monthly_fee: signupData.max_monthly_fee,

                sports: formattedSports,

                regions: signupData.regions,

                available_times: signupData.availableTimes,

                frequency: signupData.frequency,
                club_preferences: signupData.clubPreferences
            };
            console.log(
                "백엔드 전송 데이터:",
                JSON.stringify(requestData, null, 2)
            );

            // ⭐ 백엔드 회원가입 API 호출
            const response = await fetch(
                "http://127.0.0.1:8000/api/auth/signup",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(requestData)
                }
            );

            // ⭐ 백엔드 응답
            const data = await response.json();

            console.log(
                "백엔드 응답 상세:",
                JSON.stringify(data, null, 2)
            );

            // ⭐ 회원가입 실패
            if (!response.ok) {
                alert(data.detail || data.message || "회원가입에 실패했습니다.");
                return;
            }

            // ⭐ 회원가입 성공
            alert("회원가입이 완료되었습니다.");

        } catch (error) {
            console.error("회원가입 오류:", error);
            alert("서버와 연결할 수 없습니다.");
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