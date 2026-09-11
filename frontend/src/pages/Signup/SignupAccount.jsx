// 1. 이메일, 비밀번호 입력 (계정생성)
// 터미널 설치 npm install react-router-dom

import "./Signup.css";
import { use, useState } from "react";

function Signup() {
    const [showPassword, setShowPassword] = useState(false);
    return (
        // 헤더
        <div>
            <h1>계정을 생성해주세요</h1>
            <p>디버깅넷화 함께</p>
            <p>더 즐거운 운동 생활을 시작하세요.</p>

            {/* 이메일 및 비밀번호 설정 */}
            <div>
                <input
                    type="email"
                    name="email"
                    placeholder="이메일을 입력하세요"
                    className="login-input"
                />
                
                <p className="email-lavel">비밀번호</p>
                <input
                    type="password"
                    name="password"
                    placeholder="비밀번호를 입력하세요"
                    className="pw-input"
                />
            </div>
            <p className="email-lavel">비밀번호 확인</p>
                <input
                    type="password"
                    name="password"
                    placeholder="비밀번호를 입력하세요"
                    className="pw-input"
                />
            
        </div>
    )
}

// -------------
export default Signup;