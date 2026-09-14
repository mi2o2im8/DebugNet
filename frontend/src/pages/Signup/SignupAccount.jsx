// 1. 이메일, 비밀번호 입력 (계정생성)
// 터미널 설치 npm install react-router-dom

import "./Signup.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSignup } from "./SignupContext";

function Signup() {
    // 비밀번호 보여주는 함수(눈)
    const [showPassword, setShowPassword] = useState(false);
    // // supabase 회원가입 연결
    // const [password, setPassword] = useState("");
    // const [email, setEmail] = useState("");
    // const [passwordConfirm, setPasswordConfirm] = useState("") 이 3개를 아래 useSignup에 합침
    const { signupData, setSignupData } = useSignup();
    const navigate = useNavigate();
    //나중에 Supabase에 회원가입 요청을 넣으면서 await를 사용하게 되면 그때 다시
    // const handleSignup = async ()
    const handleNext = () => {
        // supabase 회원가입------------------------------
        // 현재 Context에 저장된 이메일/비밀번호 확인
        console.log("1단계 이메일:", signupData.email);
        console.log("1단계 비밀번호:", signupData.password);
        // 아이디 확인
        if(!signupData.email){
            alert("이메일을 입력해주세요.");
            return;
        }
        // 비밀번호 확인-------------------------------
        if (signupData.password.length < 8){
            alert("비밀번호는 8자 이상 입력해주세요.");
            return;
        }
        if (
            !/[A-Za-z]/.test(signupData.password) ||
            !/[0-9]/.test(signupData.password) ||
            !/[!@#$%^&*]/.test(signupData.password)
        ){
            alert("비밀번호는 영문, 숫자, 특수문자를 포함해주세요.");
            return;
        }
        if (signupData.password !== signupData.passwordConfirm){
            alert("비밀번호가 일치하지 않습니다.");
            return;
        }
        navigate("/signup/basic")
    }
    return (
        // 헤더-----------------------------------
        
        <div>
            {/* 뒤로가기 버튼 */}
            <button
                type="button"
                className="Back-btn"
                onClick={() => navigate("/")}
            >
                뒤로가기
            </button>
            <div className="signup-header">
                <h2>기본 정보를</h2>
                <h2>입력해주세요</h2>
                <p>디버깅넷과 함께</p>
                <p>더 즐거운 운동 생활을 시작하세요.</p>
            </div>

            {/* 이메일 및 비밀번호 설정 */}
            <div>
                <p className="email-label">이메일</p>
                <input
                    type="email"
                    name="email"
                    placeholder="이메일을 입력하세요"
                    className="login-input"
                    value={signupData.email}
                    onChange={(e) =>
                        setSignupData({
                            ...signupData,
                            email: e.target.value
                        })
                    }
                />
                
                <p className="email-label">비밀번호</p>
                <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="비밀번호를 입력하세요"
                    className="pw-input"
                    value={signupData.password}
                    onChange={(e) =>
                        setSignupData({
                            ...signupData,
                            password: e.target.value
                        })
                    }
                />

                <button type="button" className="password-eye" onClick={()=> setShowPassword(!showPassword)}>
                    {showPassword ? "🙈" : "👁️"}
                </button>
            </div>
            <p className="email-label">비밀번호 확인</p>
                <input
                    type="password"
                    name="passwordConfirm"
                    placeholder="비밀번호를 입력하세요"
                    className="pw-input"
                    value={signupData.passwordConfirm}
                    onChange={(e) =>
                        setSignupData({
                            ...signupData,
                            passwordConfirm: e.target.value
                        })
                    }
                />
            
            <div className="password-guide">
                <p className={signupData.password.length >= 8 ? "valid" : ""}>
                    <span>{signupData.password.length >= 8 ? "✓" : ""}</span>
                    8자 이상 입력해주세요
                </p>

                <p className={
                    /[A-Za-z]/.test(signupData.password) &&
                    /[0-9]/.test(signupData.password) &&
                    /[!@#$%^&*]/.test(signupData.password)
                        ? "valid"
                        : ""
                }>
                    <span>
                        {
                            /[A-Za-z]/.test(signupData.password) &&
                            /[0-9]/.test(signupData.password) &&
                            /[!@#$%^&*]/.test(signupData.password)
                                ? "✓"
                                : ""
                        }
                    </span>
                    영문, 숫자, 특수문자를 포함해주세요.
                </p>

                <p className={
                    signupData.password &&
                    signupData.password === signupData.passwordConfirm
                        ? "valid"
                        : ""
                }>
                    <span>
                        {
                            signupData.password &&
                            signupData.password === signupData.passwordConfirm
                                ? "✓"
                                : ""
                        }
                    </span>
                    비밀번호가 일치합니다.
                </p>
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