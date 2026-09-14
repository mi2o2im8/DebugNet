import "./Login.css";
import logo from "../../assets/img/logo_name.png";
import {Link, useNavigate} from "react-router-dom"
import { useState } from "react";

// supabase설치 npm install @supabase/supabase-js

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // 뒤로가기
  const navigate = useNavigate();
  const handleLogin = async () => {
  // Supabase 로그인 실제 사용할때
    // const { data, error } = await supabase.auth.signInWithPassword({
    //   email: email,
    //   password: password,
    // });

    // if (error) {
    //   alert("로그인에 실패했습니다.");
    //   return;
    // }

    // console.log("로그인 성공:", data);
  
  };
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
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      
      <p className="email-lavel">비밀번호</p>
      <input
        type="password"
        name="password"
        placeholder="비밀번호를 입력하세요"
        className="pw-input"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {/* 로그인 버튼 */}
      
      <button className="login-btn" onClick={handleLogin}>
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