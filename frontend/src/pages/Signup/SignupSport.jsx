// 3. 운동 종목 선택

import "./Signup.css";
import { useNavigate } from "react-router-dom";
import { useSignup } from "./SignupContext";
// 이미지
import soccerImg from "../../assets/img/soccer.png";
import basketballImg from "../../assets/img/basketball.png";
import volleyballImg from "../../assets/img/volleyball.png";
import tableTennisImg from "../../assets/img/table_tennis.png";
import tennisImg from "../../assets/img/tennis.png";
import otherImg from "../../assets/img/other.png";
// 뒤로가기 버튼 소환
import backIcon from "../../assets/img/back.png";

function Signup() {
    const navigate = useNavigate();
    // 회원가입 전체 데이터 가져오기
    const { signupData, setSignupData } = useSignup();
    const handleSport = (sport) => {
        // 이미 선택된 운동이면 제거
        if (signupData.sports.includes(sport)){
            setSignupData({
                ...signupData,
                sports: signupData.sports.filter((item)=> item !== sport)
            });
        }
        // 선택되지 않은 운동이면 추가
        else{
            setSignupData({
                ...signupData,
                sports: [...signupData.sports, sport]
            });
        }
    };
    //나중에 Supabase에 회원가입 요청을 넣으면서 await를 사용하게 되면 그때 다시
    // const handleSignup = async ()
    const handleNext = () => {
        // 운동 종목 선택 확인 (trim은 문자열 앞뒤 공백제거 함수)
        if (signupData.sports.length === 0){
            alert("운동 종목을 하나 이상 선택해주세요.");
            return;
        }
        // 운동 수준 선택 페이지로 이동
        navigate("/signup/basic/SignupSportLevel");
    };
    return (
        // 헤더
        <div className="signup-container">
            {/* 뒤로가기 버튼 */}
            <button
                type="button"
                className="Back-btn"
                onClick={() => navigate("/signup/basic")}
                aria-label="뒤로가기"
            >
                <img src={backIcon} alt="뒤로가기" />
            </button>

            <div className="signup-header03">
            <h2>관심 있는 운동을</h2>
            <h2>선택해주세요</h2>
            <p>(복수 선택 가능)</p>
            </div>

            {/* ----종목 선택----- */}
            <div className="sport-choice-box">
                <button
                    type="button"
                    className={signupData.sports.includes("축구ㆍ풋살")? "selected" : ""}
                    onClick={() => handleSport("축구ㆍ풋살")}
                >
                    <img src={soccerImg} alt="축구ㆍ풋살" />
                    축구ㆍ풋살
                </button>
                <button
                    type="button"
                    className={signupData.sports.includes("농구")? "selected" : ""}
                    onClick={() => handleSport("농구")}
                >
                    <img src={basketballImg} alt="농구" />
                    농구
                </button>

                <button
                    type="button"
                    className={signupData.sports.includes("배구")? "selected" : ""}
                    onClick={() => handleSport("배구")}
                >
                    <img src={volleyballImg} alt="배구" />
                    배구
                </button>

                <button
                    type="button"
                    className={signupData.sports.includes("탁구")? "selected" : ""}
                    onClick={() => handleSport("탁구")}
                >
                    <img src={tableTennisImg} alt="탁구" />
                    탁구
                </button>

                <button
                    type="button"
                    className={signupData.sports.includes("테니스")? "selected" : ""}
                    onClick={() => handleSport("테니스")}
                >
                    <img src={tennisImg} alt="테니스" />
                    테니스
                </button>

                {/* <button ---
                    type="button"
                    className={signupData.sports.includes("기타")? "selected" : ""}
                    onClick={() => handleSport("기타")}
                >
                    <img src={otherImg} alt="기타" />
                    기타
                </button> */}
            </div>

            {/* ----선택 표시칸---- */}
            <div className="select-count">
                선택된 종목 {signupData.sports.length}/5
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
export default Signup;