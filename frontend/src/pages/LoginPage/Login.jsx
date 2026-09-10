import "./Login.css";
import logo from "../../assets/img/logo_name.png";

function Login() {
  return (
    <div className="Login-container">
      <img src={logo} alt="로고" className="logo" />

      <h4 className="logo-title">
        운동으로 연결되는 가장 쉬운 방법!
      </h4>

      <input
        type="text"
        placeholder="아이디"
        className="login-input"
      />

      <input
        type="password"
        placeholder="비밀번호"
        className="pw-input"
      />

      <button className="login-btn">
        로그인
      </button>

      {/* --------추후 업그레이드 방향--------- */}
      {/* <button>네이버 로그인</button>
      <button>카카오 로그인</button> */}

      <a href="%" className="pw_re">비밀번호 찾기</a>
      <p>
        아직 계정이 없으신가요?
        <a href="#">회원가입</a>
      </p>
    </div>
  );
}

export default Login;