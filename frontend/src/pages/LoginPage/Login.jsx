import "./Login.css";
import logo from "../../assets/img/logo.png";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

// 눈 아이콘
// 설치: npm install react-icons
import { FiEye, FiEyeOff } from "react-icons/fi";

// Supabase
import { supabase } from "../../../supabaseClient";
// 홈화면
import { getMyClubShared, clearMyClubCache } from "../../api/myClubCache";


// -------------------------------------------------
// 동호회 여부에 따라 이동할 홈 경로 정하기
//
// 운영 중이거나 가입된 동호회가 있으면 → 가입 후 홈
// 없으면 → 가입 전 홈
// (BottomNav의 '활동' 버튼과 같은 기준)
// 로그인 버튼 / 자동 로그인 둘 다 이 함수를 사용
// -------------------------------------------------
async function getHomePath() {
  try {
    // 다른 계정의 이전 결과가 남아 있지 않게 비우고 새로 조회
    clearMyClubCache();

    const myClub = await getMyClubShared();

    const hasClub =
      Boolean(myClub?.operating_club) ||
      Boolean(myClub?.joined_club);

    return hasClub ? "/mainhome" : "/main";

  } catch (clubError) {
    // 동호회 조회가 실패해도 로그인은 된 상태라
    // 가입 전 홈으로 보낸다.
    console.error("동호회 조회 오류:", clubError);
    return "/main";
  }
}


// 아이디 기억하기용 localStorage 키
const SAVED_EMAIL_KEY = "savedEmail";

// 자동 로그인 여부 localStorage 키
// (supabaseClient.js에서도 같은 이름을 사용)
const AUTO_LOGIN_KEY = "autoLogin";

// 자동 로그인 설정 읽기
function getAutoLogin() {
  try {
    return localStorage.getItem(AUTO_LOGIN_KEY) === "true";
  } catch {
    return false;
  }
}

// localStorage 읽기 (오류가 나도 로그인 화면은 정상 동작하도록)
function getSavedEmail() {
  try {
    return localStorage.getItem(SAVED_EMAIL_KEY) || "";
  } catch {
    return "";
  }
}


function Login() {
  // 저장된 이메일이 있으면 처음부터 채워둔다
  const [email, setEmail] = useState(() => getSavedEmail());
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // 저장된 이메일이 있으면 체크박스도 켜둔다
  const [rememberId, setRememberId] = useState(
    () => Boolean(getSavedEmail())
  );
  // 자동 로그인 체크 여부 (지난번 선택 기억)
  const [autoLogin, setAutoLogin] = useState(() => getAutoLogin());
  const navigate = useNavigate();


  // -------------------------------------------------
  // 자동 로그인
  // 로그아웃하지 않은 사람이 로그인 페이지에 들어오면
  // 로그인 화면을 건너뛰고 바로 홈으로 보낸다
  // -------------------------------------------------
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      // 로그인 안 된 상태면 그대로 로그인 화면
      if (!data.session) return;

      const nextPath = await getHomePath();
      navigate(nextPath, { replace: true });
    };

    checkSession();
  }, [navigate]);


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

      // -------------------------------------------------
      // 아이디 기억하기
      // 체크되어 있으면 이메일 저장, 아니면 삭제
      // (로그인 성공했을 때만 저장)
      // -------------------------------------------------
      try {
        if (rememberId) {
          localStorage.setItem(SAVED_EMAIL_KEY, email.trim());
        } else {
          localStorage.removeItem(SAVED_EMAIL_KEY);
        }
      } catch (storageError) {
        console.error("아이디 저장 오류:", storageError);
      }

      // -------------------------------------------------
      // 자동 로그인
      // 체크 O → 브라우저를 닫아도 로그인 유지
      // 체크 X → 브라우저를 닫으면 로그아웃 (supabaseClient.js에서 처리)
      // -------------------------------------------------
      try {
        localStorage.setItem(AUTO_LOGIN_KEY, String(autoLogin));
      } catch (storageError) {
        console.error("자동 로그인 설정 저장 오류:", storageError);
      }

      // 동호회 여부에 따라 홈 화면 분기
      const nextPath = await getHomePath();

      navigate(nextPath, {
        replace: true,
      });

    } catch (error) {
      console.error("로그인 오류:", error);

      alert("로그인 중 오류가 발생했습니다.");
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


          {/* 아이디 기억하기 / 자동 로그인 */}
          <div className="login-options">

            <label className="remember-id">
              <input
                type="checkbox"
                checked={rememberId}
                onChange={(e) =>
                  setRememberId(e.target.checked)
                }
              />
              아이디 기억하기
            </label>

            <label className="remember-id">
              <input
                type="checkbox"
                checked={autoLogin}
                onChange={(e) =>
                  setAutoLogin(e.target.checked)
                }
              />
              자동 로그인
            </label>

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
