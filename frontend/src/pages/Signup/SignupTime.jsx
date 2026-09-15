// 6. 활동 가능 시간 
 
import "./Signup.css"; 
import { useNavigate } from "react-router-dom"; 
import { useSignup } from "./SignupContext"; 
import { useState } from "react";
// 뒤로가기 버튼 소환
import backIcon from "../../assets/img/back.png";
 
function SignupTime() { 
    const navigate = useNavigate(); 
    // 회원가입 전체 데이터 가져오기 
    const { signupData, setSignupData } = useSignup(); 
 
    // --나중에 분단위 선택 해제하고 싶으면 false로 변경-- // 
    const USE_MINUTES = false; 

    // 요일 
    const days =["월","화","수","목","금","토","일"]; 

    // 시간 생성 / 분단위 사용 00분 / 30분 / 분 단위 미사용: 정시만 
    const createTimeOptions = () => { 
        const times = []; 

        for (let hour = 0; hour < 24; hour++) { 
            if (USE_MINUTES) { 
                times.push( 
                    `${String(hour).padStart(2, "0")}:00` 
                ); 
 
                times.push( 
                    `${String(hour).padStart(2, "0")}:30` 
                ); 
            } else { 
                times.push( 
                    `${String(hour).padStart(2, "0")}:00` 
                ); 
            } 
        } 

        return times; 
    }; 

    // 시간 선택 목록 
    const timeOptions = createTimeOptions(); 
    const endTimeOptions = [...timeOptions, "24:00"];
 
    // 현재 선택 중인 시간 
    const [selectedDay, setSelectedDay] = useState(""); 
    const [startTime, setStartTime] = useState(""); 
    const [endTime, setEndTime] = useState(""); 

    // 시간 선택창 표시 여부
    const [showTimeSelect, setShowTimeSelect] = useState(false);
 
    // 시간대를 분으로 환산해서 비교
    const timeToMinutes = (time) => {
    if (time === "24:00") {
        return 24 * 60;
    }

    const [hour, minute] = time.split(":").map(Number);

    return hour * 60 + minute;
    };

    // 시간대 추가 
    const handleAddTime = () => { 
        if (!selectedDay || !startTime || !endTime){ 
            alert("요일과 시간을 모두 선택해주세요."); 
            return; 
        } 
 
        // 종료 시간이 시작 시간보다 빠른 경우 
        if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
            alert("종료 시간은 시작 시간보다 늦어야 합니다.");
            return;
        }
 
        const newTime = { 
            day: selectedDay, 
            startTime: startTime, 
            endTime: endTime 
        }; 
 
        // 기존 시간대에 새로운 시간대 추가 
        setSignupData({ 
            ...signupData, 
            availableTimes: [ 
                ...(signupData.availableTimes || []), 
                newTime 
            ] 
        }); 
 
        // 추가 후 선택값 초기화 
        setSelectedDay(""); 
        setStartTime(""); 
        setEndTime(""); 

        // 시간 추가 후 선택창 닫기
        setShowTimeSelect(false);
    }; 
 
    // 시간대 삭제 
    const handleDeleteTime = (index) => { 
        const newTimes = signupData.availableTimes.filter( 
            (_, i) => i !== index 
        ); 
 
        setSignupData({ 
            ...signupData, 
            availableTimes: newTimes 
        }); 
    }; 
 
    //나중에 Supabase에 회원가입 요청을 넣으면서 await를 사용하게 되면 그때 다시 
    // const handleSignup = async () 
    const handleNext = () => { 
        if (!signupData.availableTimes || 
            signupData.availableTimes.length === 0){ 
            alert("활동 가능한 시간을 하나 이상 선택해주세요."); 
            return; 
        } 

        // 활동 빈도 선택 페이지로 이동
        navigate("/signup/basic/SignupFrequency");
    }; 
 
    return ( 
        // 헤더 
        <div>
            {/* 뒤로가기 버튼 */}
            <button
                type="button"
                className="Back-btn"
                onClick={() => navigate("/signup/basic/SignupLocation")}
            >
                뒤로가기
            </button>
            
            <h1 className="signup-level-title">활동 가능한 시간을</h1> 
            <h1 className="signup-level-title">선택해주세요</h1>
            <h4 className="time-example">(예)월19:00~22:00</h4>
             
            {/* 요일/시간 선택 */}
            <div>
                {/* 처음에는 선택창을 숨기고 + 시간대 추가 버튼만 보여줌 */}
                {!showTimeSelect && (
                    <button
                        type="button"
                        onClick={() => setShowTimeSelect(true)}
                    >
                        + 시간대 추가
                    </button>
                )}

                {/* + 시간대 추가를 눌렀을 때만 선택창 표시 */}
                {showTimeSelect && (
                    <div>

                        {/* 요일 */}
                        <select
                            value={selectedDay}
                            onChange={(e)=> setSelectedDay(e.target.value)}
                        > 
                            <option value="">요일 선택</option>

                            {days.map((day) => (
                                <option key={day} value={day}>
                                    {day}요일
                                </option>
                            ))}
                        </select>

                        {/* 시작 시간 */}
                        <select
                            value={startTime}
                            onChange={(e)=>setStartTime(e.target.value)}
                        > 
                            <option value="">시작 시간</option>

                            {timeOptions.map((time) => (
                                <option key={time} value={time}>
                                    {time}
                                </option>
                            ))}
                        </select>

                        <span> ~ </span>
                         
                        {/* 종료 시간 */}
                        <select
                            value={endTime}
                            onChange={(e)=>setEndTime(e.target.value)}
                        > 
                            <option value="">종료 시간</option>

                            {endTimeOptions.map((time) => (
                                <option key={time} value={time}>
                                    {time}
                                </option>
                            ))}
                        </select>

                        {/* 선택 완료 버튼 */}
                        <button
                            type="button"
                            onClick={handleAddTime}
                        >
                            + 시간대 추가
                        </button>

                    </div>
                )}
            </div>

            {/* 선택한 시간대 */}
            <div>
                <h3>선택한 시간대</h3>

                {(signupData.availableTimes || []).map((time, index) => (
                    <div key={index}>
                        <span>
                            {time.day} {time.startTime} ~ {time.endTime}
                        </span> 

                        <button 
                            type="button" 
                            onClick={() => handleDeleteTime(index)}
                        >
                            x
                        </button>
                    </div>
                ))}
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
export default SignupTime;