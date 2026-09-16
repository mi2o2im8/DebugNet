import "./Login.css";
import logo from "../../assets/img/logo.png";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

// 눈 아이콘
// 설치: npm install react-icons
import { FiEye, FiEyeOff } from "react-icons/fi";

// Supabase
import { supabase } from "../../../supabaseClient";


function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();


  // 로그인
  const handleLogin = async (e) => {
    e.preventDefault();

    // 이메일 입력 확인
    if (!email.trim()) {
      alert("이메일을 입력해주세요.");
      return;
    }

    // 비밀번호 입력 확인
    if (!password) {
      alert("비밀번호를 입력해주세요.");
      return;
    }

    try {
      // Supabase Auth 로그인
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

      // 로그인 실패
      if (error) {
        console.error("로그인 실패:", error);

        if (error.message === "Invalid login credentials") {
          alert("이메일 또는 비밀번호가 올바르지 않습니다.");
        } else {
          alert(`로그인에 실패했습니다.\n${error.message}`);
        }

        return;
      }

      // 로그인 성공
      console.log("로그인 성공:", data);
      console.log("로그인 사용자:", data.user);
      console.log("로그인 세션:", data.session);
      console.log(
        "Access Token:",
        data.session?.access_token
      );

      // 메인 화면으로 이동
      navigate("/main", {
        replace: true,
      });

    } catch (error) {
      console.error("로그인 오류:", error);

      alert(
        "로그인 중 오류가 발생했습니다."
      );
    }
  };


  return (
    <div className="Login-container">

      {/* 상단 로고 영역 */}
      <div className="Login-top">
        <div className="logo-title">
          <img
            src={logo}
            alt="PlayBridge 로고"
            className="Home-logo"
          />

          <h1>PlayBridge</h1>
        </div>

        <p className="Home-subtitle">
          운동으로 연결되는 가장 쉬운 방법!
        </p>
      </div>


      {/* 중단 로그인 폼 영역 */}
      <div className="Login-middle">

        <form
          className="login-form"
          onSubmit={handleLogin}
        >

          {/* 아이디 입력 그룹 */}
          <div className="input-group">

            <label
              className="input-label"
              htmlFor="email"
            >
              아이디(이메일)
            </label>

            <input
              id="email"
              type="email"
              name="email"
              placeholder="이메일을 입력하세요"
              className="login-input"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

          </div>


          {/* 비밀번호 입력 그룹 */}
          <div className="input-group">

            <div className="label-row">

              <label
                className="input-label"
                htmlFor="password"
              >
                비밀번호
              </label>

              <a
                href="#"
                className="pw-find-link"
              >
                비밀번호 찾기
              </a>

            </div>


            <div className="password-input-wrapper">

              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                name="password"
                placeholder="비밀번호를 입력하세요"
                className="pw-input"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
              />

              <button
                type="button"
                className="password-eye"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                aria-label={
                  showPassword
                    ? "비밀번호 숨기기"
                    : "비밀번호 보기"
                }
              >
                {showPassword
                  ? <FiEye />
                  : <FiEyeOff />
                }
              </button>

            </div>

          </div>


          {/* 로그인 버튼 */}
          <button
            type="submit"
            className="login-btn"
          >
            로그인
          </button>

        </form>

      </div>


      {/* 하단 회원가입 링크 */}
      <div className="Login-bottom">

        <p className="signup-text">

          아직 계정이 없으신가요?

          <Link to="/signup">
            회원가입
          </Link>

        </p>

      </div>

    </div>
  );
}

export default Login;