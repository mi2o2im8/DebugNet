import "./Login.css";
import logo from "../../assets/img/logo_name.png";

// 로그인 화면 백엔드 전달 사항 / 기능명: 로그인 / 
// 항목: 아이디(이메일), 데이터명:email, 입력형식: 이메일
// 항목: 비밀번호, 데이터명: password, 입력 형식: 비밀번호
// 로그인 API 필요

function Login() {
  return (
    // 타이틀 부분
    <div className="Login-container">
      <img src={logo} alt="로고" className="logo" />

      <h4 className="logo-title">
        운동으로 연결되는 가장 쉬운 방법!
      </h4>

      {/* 로그인 입력 */}
      <p className="email-lavel">아이디(이메일)</p>
      <input
        type="text"
        placeholder="이메일을 입력하세요"
        className="login-input"
      />
      
      <p className="email-lavel">비밀번호</p>
      <input
        type="password"
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

      <a href="%" className="pw_re">비밀번호 찾기</a>
      <p>
        아직 계정이 없으신가요?
        <a href="#">회원가입</a>
      </p>
    </div>
  );
}

export default Login;