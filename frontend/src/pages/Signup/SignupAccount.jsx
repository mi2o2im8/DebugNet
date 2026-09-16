// 1. 이메일, 비밀번호 입력 (계정생성)
// 터미널 설치 npm install react-router-dom

import "./Signup.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSignup } from "./SignupContext";
// 눈.. 설치파일 npm install react-icons
import { FiEye, FiEyeOff } from "react-icons/fi";

// 뒤로가기 버튼 소환
import backIcon from "../../assets/img/back.png";

function Signup() {
    // 비밀번호 보여주는 함수(눈)
    const [showPassword, setShowPassword] = useState(false);

    // 이메일 중복 확인 상태
    const [emailChecked, setEmailChecked] = useState(false);
    const [emailMessage, setEmailMessage] = useState("");

    const { signupData, setSignupData } = useSignup();
    const navigate = useNavigate();


    // 이메일 입력값 변경
    const handleEmailChange = (e) => {
        setSignupData({
            ...signupData,
            email: e.target.value
        });

        // 이메일이 변경되면 기존 중복확인 결과 초기화
        setEmailChecked(false);
        setEmailMessage("");
    };


    // 이메일 중복 확인
    const handleEmailCheck = async () => {
        const email = signupData.email.trim();

        // 이메일 입력 확인
        if (!email) {
            alert("이메일을 입력해주세요.");
            return;
        }

        // 이메일 형식 확인
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            alert("올바른 이메일 형식을 입력해주세요.");
            return;
        }

        try {
            // 백엔드 이메일 중복 확인 API
            const response = await fetch(
                `http://127.0.0.1:8000/api/auth/check-email?email=${encodeURIComponent(email)}`
            );

            const data = await response.json();

            console.log("이메일 중복 확인 결과:", data);

            if (data.available) {
                // 사용 가능한 이메일
                setEmailChecked(true);
                setEmailMessage(data.message);
            } else {
                // 이미 가입된 이메일
                setEmailChecked(false);
                setEmailMessage(data.message);
            }

        } catch (error) {
            console.error("이메일 중복 확인 오류:", error);
            alert("서버와 연결할 수 없습니다.");
        }
    };


    // 다음 버튼
    const handleNext = () => {

        // 현재 Context에 저장된 이메일/비밀번호 확인
        console.log("1단계 이메일:", signupData.email);
        console.log("1단계 비밀번호:", signupData.password);


        // 이메일 확인
        if (!signupData.email) {
            alert("이메일을 입력해주세요.");
            return;
        }


        // ⭐ 이메일 중복확인 여부
        if (!emailChecked) {
            alert("이메일 중복확인을 해주세요.");
            return;
        }


        // 비밀번호 확인
        if (signupData.password.length < 8) {
            alert("비밀번호는 8자 이상 입력해주세요.");
            return;
        }


        // 영문 + 숫자 + 특수문자 확인
        if (
            !/[A-Za-z]/.test(signupData.password) ||
            !/[0-9]/.test(signupData.password) ||
            !/[!@#$%^&*]/.test(signupData.password)
        ) {
            alert("비밀번호는 영문, 숫자, 특수문자를 포함해주세요.");
            return;
        }


        // 비밀번호 확인
        if (signupData.password !== signupData.passwordConfirm) {
            alert("비밀번호가 일치하지 않습니다.");
            return;
        }


        // 모든 조건 통과
        navigate("/signup/basic");
    }


    return (
        <div className="signup-container">

            {/* 뒤로가기 버튼 */}
            <button
                type="button"
                className="Back-btn"
                onClick={() => navigate("/Login")}
                aria-label="뒤로가기"
            >
                <img src={backIcon} alt="뒤로가기" />
            </button>


            <div className="signup-header">
                <h2>계정을 생성해주세요</h2>
                <p>PlayBridge와 함께</p>
                <p>더 즐거운 운동 생활을 시작하세요.</p>
            </div>


            {/* 이메일 */}
            <div>
                <p className="email-label">이메일</p>

                {/* 이메일 + 중복확인 버튼 */}
                <div className="email-check-wrapper">

                    <input
                        type="email"
                        name="email"
                        placeholder="이메일을 입력하세요"
                        className="login-input"
                        value={signupData.email}
                        onChange={handleEmailChange}
                    />

                    <button
                        type="button"
                        className="email-check-btn"
                        onClick={handleEmailCheck}
                    >
                        중복확인
                    </button>

                </div>


                {/* 이메일 중복 확인 결과 */}
                {emailMessage && (
                    <p
                        className={
                            emailChecked
                                ? "email-check-success"
                                : "email-check-error"
                        }
                    >
                        {emailMessage}
                    </p>
                )}

            </div>


            {/* 비밀번호 */}
            <div className="password-box">

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

                <button
                    type="button"
                    className="password-eye-signup"
                    onClick={() =>
                        setShowPassword(!showPassword)
                    }
                >
                    {showPassword ? <FiEye /> : <FiEyeOff />}
                </button>
                {/* 비밀번호 확인 */}
            
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
            </div>


            {/* 비밀번호 조건 */}
            <div className="password-guide">

                <p
                    className={
                        signupData.password.length >= 8
                            ? "valid"
                            : ""
                    }
                >
                    <span>
                        {signupData.password.length >= 8 ? "✓" : ""}
                    </span>

                    8자 이상 입력해주세요
                </p>


                <p
                    className={
                        /[A-Za-z]/.test(signupData.password) &&
                        /[0-9]/.test(signupData.password) &&
                        /[!@#$%^&*]/.test(signupData.password)
                            ? "valid"
                            : ""
                    }
                >
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


                <p
                    className={
                        signupData.password &&
                        signupData.password ===
                            signupData.passwordConfirm
                            ? "valid"
                            : ""
                    }
                >
                    <span>
                        {
                            signupData.password &&
                            signupData.password ===
                                signupData.passwordConfirm
                                ? "✓"
                                : ""
                        }
                    </span>

                    비밀번호가 일치합니다.
                </p>

            </div>


            {/* 다음 버튼 */}
            <button
                className="Next-btn"
                onClick={handleNext}
            >
                다음
            </button>

        </div>
    );
}

export default Signup;