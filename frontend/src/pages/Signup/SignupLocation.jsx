// 5. 활동 가능 지역 선택

import "./Signup.css";
import { useNavigate } from "react-router-dom";
import { useSignup } from "./SignupContext";

function SignupLocation() {
    const navigate = useNavigate();
    // 회원가입 전체 데이터 가져오기
    const { signupData, setSignupData } = useSignup();
    // 서울 구/군
    const districts = ["종로구","중구","용산구","성동구","광진구","동대문구","중랑구","성북구","강북구","도봉구",
        "노원구","은평구","서대문구","마포구","양천구","강서구","구로구","금천구","영등포구","동작구","관악구","서초구","강남구","송파구","강동구"];

    // 구/군 선택
    const handLocation = (district) => {
        if (signupData.location.includes(district)){
            // 이미 선택되어 있으면 제거
            setSignupData({
                ...signupData,
                location: signupData.location.filter(
                    (item) => item !== district
                )
            });
        } else {
            // 선택되어 있지 않으면 추가
            setSignupData({
                ...signupData,
                location: [...signupData.location, district]
            })            
        }
    }
    // 시도 선택
    const cities = ["서울특별시"]
    //나중에 Supabase에 회원가입 요청을 넣으면서 await를 사용하게 되면 그때 다시
    // const handleSignup = async ()
    const handleNext = () => {
        if (signupData.location.length === 0){
            alert("활동 지역을 하나 이상 선택해주세요.");
            return;
        }
        // 이동 가능 거리 선택 확인
        if (signupData.travel_distance_km === undefined){
            alert("이동 가능한 범위를 선택해주세요.")
            return;
        }
        // 활동 가능 시간 페이지로 이동
        navigate("/signup/basic/SignupTime");
    };
    
    // 거리 선택
    const distanceOptions = [
        { label: "1km 이내", value: 1 },
        { label: "3km 이내", value: 3 },
        { label: "5km 이내", value: 5 },
        { label: "10km 이내", value: 10 },
        { label: "거리 상관없음", value: null },
    ];
    const handleDistance = (distance) => {
        setSignupData({
            ...signupData,
            travel_distance_km: distance
        })
    }

    return (
        // 헤더
        <div>
            {/* 뒤로가기 버튼 */}
            <button
                type="button"
                className="Back-btn"
                onClick={() => navigate("/signup/basic/SignupSportLevel")}
            >
                뒤로가기
            </button>
            
            <h1>활동하고 싶은</h1>
            <h1>지역을 선택해주세요</h1>
            
            {/* 시/도 선택 */}
            <div className="location-select">
                <p>시도 선택</p>

                <select>
                    <option value="">시/도 선택</option>
                    {cities.map((city) => (
                        <option key={city} value={city}>
                            {city}
                        </option>
                    ))}
                </select>
            </div>

            {/* 구/군 선택 */}
            <div className="location-select">
                <p>구/군 선택</p>

                <select onChange={(e)=> handLocation(e.target.value)}>
                    <option value="">구/군 선택</option>
                    {districts.map((district) => (
                        <option key={district} value={district}>
                            {district}
                        </option>
                    ))}
                </select>
            </div>
            <div className="selected-location">
                <p>선택된 지역</p>

                <div className="selected-location-list">
                    {signupData.location.map((district)=> (
                        <button
                            key={district}
                            type="button"
                            className="selected-location-item"
                            onClick={()=> handLocation(district)}
                        >
                            <span>{district}</span>
                            <span className="location-remove">  x</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="location-guide">
                <span className="location-icon">📍</span>
                <p>
                    선택된 지역을 기준으로<br />
                    주변 운동을 추천해드려요
                </p>
            </div>

            {/* 이동 가능 거리 선택 */}
            <div className="distance-select">
                <p>이동 가능한 범위는 어느 정도인가요?</p>

                <div className="distance-list">
                    {distanceOptions.map((option) => (
                        <button
                            key={option.label}
                            type="button"
                            onClick={() => handleDistance(option.value)}
                            className={
                                signupData.travel_distance_km === option.value
                                    ? "selected"
                                    : ""
                            }
                        >
                            {option.label}
                            
                            {signupData.travel_distance_km === option.value && (
                                <span>✓</span>
                            )}
                        </button>
                    ))}
                </div>
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
export default SignupLocation;