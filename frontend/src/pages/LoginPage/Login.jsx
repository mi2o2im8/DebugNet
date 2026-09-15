import "./Login.css";
import logo from "../../assets/img/logo.png";
import { Link } from "react-router-dom";
import { useState } from "react";
// 눈.. 설치파일 npm install react-icons
import { FiEye, FiEyeOff } from "react-icons/fi";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault(); // form submit 기본 동작 방지
    // Supabase 로그인 로직
  };

  return (
    <div className="Login-container">

      {/* 상단 로고 영역 */}
      <div className="Login-top">
        <div className="logo-title">
          <img src={logo} alt="PlayBridge 로고" className="Home-logo" />
          <h1>PlayBridge</h1>
        </div>
        <p className="Home-subtitle">
          운동으로 연결되는 가장 쉬운 방법!
        </p>
      </div>

      {/* 중단 로그인 폼 영역 */}
      <div className="Login-middle">
        <form className="login-form" onSubmit={handleLogin}>
          
          {/* 아이디 입력 그룹 */}
          <div className="input-group">
            <label className="input-label" htmlFor="email">
              아이디(이메일)
            </label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="이메일을 입력하세요"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* 비밀번호 입력 그룹 */}
          <div className="input-group">
            <div className="label-row">
              <label className="input-label" htmlFor="password">
                비밀번호
              </label>
              <a href="#" className="pw-find-link">
                비밀번호 찾기
              </a>
            </div>

            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="비밀번호를 입력하세요"
                className="pw-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-eye"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
              >
                {showPassword ? <FiEye /> : <FiEyeOff />}
              </button>
            </div>
          </div>

          {/* 로그인 버튼 */}
          <button type="submit" className="login-btn">
            로그인
          </button>

        </form>
      </div>

      {/* 하단 회원가입 링크 */}
      <div className="Login-bottom">
        <p className="signup-text">
          아직 계정이 없으신가요?
          <Link to="/signup">회원가입</Link>
        </p>
      </div>

    </div>
  );
}

export default Login;