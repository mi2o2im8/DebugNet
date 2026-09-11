import "./Login.css";
import logo from "../../assets/img/logo_name.png";
import {Link} from "react-router-dom"
// ==============================
// 로그인 API 전달 항목
// 기능명 : 로그인
// HTTP Method : POST
// URL : /login
//
// Request Body
// {
//    email: 사용자 이메일,
//    password: 사용자 비밀번호
// }
// ==============================

function Login() {
  return (
    // 타이틀 부분
    <div className="Login-container">
      <img src={logo} alt="로고" className="logo" />

      <h4 className="logo-title">
        운동으로 연결되는 가장 쉬운 방법!
      </h4>

      {/* 로그인 입력 */}
      <p className="email-label">아이디(이메일)</p>
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

      {/* 로그인 버튼 */}
      <button className="login-btn">
        로그인
      </button>

      {/* --------추후 업그레이드 방향--------- */}
      {/* <button>네이버 로그인</button>
      <button>카카오 로그인</button> */}

      <a href="#" className="pw_re">비밀번호 찾기</a>
      <p>
        아직 계정이 없으신가요?
        <Link to="/signup">회원가입</Link>
      </p>
    </div>
  );
}

export default Login;