import "./Login.css";
import logo from "../../assets/img/logo.png";

import {
    Link,
    useNavigate,
} from "react-router-dom";

import {
    useEffect,
    useState,
} from "react";

import {
    FiEye,
    FiEyeOff,
} from "react-icons/fi";

// Supabase
import { supabase } from "../../../supabaseClient";

// 홈화면
import {
    getMyClubShared,
    clearMyClubCache,
} from "../../api/myClubCache";

// ⭐ 로그인 시 로그아웃 상태 해제
import {
    finishLogin,
} from "../../api/apiClient";

// =================================================
// 동호회 여부에 따라 이동할 홈 경로 정하기
// =================================================

async function getHomePath() {
    try {
        // 다른 계정의 이전 결과가 남아 있지 않게 비우고 새로 조회
        clearMyClubCache();

        const myClub =
            await getMyClubShared();

        const hasClub =
            Boolean(
                myClub?.operating_club
            ) ||
            Boolean(
                myClub?.joined_club
            );

        return hasClub
            ? "/mainhome"
            : "/main";

    } catch (clubError) {
        console.error(
            "동호회 조회 오류:",
            clubError
        );

        return "/main";
    }
}

// =================================================
// localStorage 키
// =================================================

const SAVED_EMAIL_KEY =
    "savedEmail";

const AUTO_LOGIN_KEY =
    "autoLogin";

// =================================================
// 자동 로그인 설정 읽기
// =================================================

function getAutoLogin() {
    try {
        return (
            localStorage.getItem(
                AUTO_LOGIN_KEY
            ) === "true"
        );
    } catch {
        return false;
    }
}

// =================================================
// 저장된 이메일 읽기
// =================================================

function getSavedEmail() {
    try {
        return (
            localStorage.getItem(
                SAVED_EMAIL_KEY
            ) || ""
        );
    } catch {
        return "";
    }
}

// =================================================
// Login
// =================================================

function Login() {
    const [
        email,
        setEmail,
    ] = useState(
        () => getSavedEmail()
    );

    const [
        password,
        setPassword,
    ] = useState("");

    const [
        showPassword,
        setShowPassword,
    ] = useState(false);

    const [
        rememberId,
        setRememberId,
    ] = useState(
        () =>
            Boolean(
                getSavedEmail()
            )
    );

    const [
        autoLogin,
        setAutoLogin,
    ] = useState(
        () => getAutoLogin()
    );

    const navigate =
        useNavigate();

    // =================================================
    // 자동 로그인
    // =================================================

    useEffect(() => {
        const checkSession =
            async () => {
                const {
                    data,
                } =
                    await supabase.auth.getSession();

                if (
                    !data.session
                ) {
                    return;
                }

                // 기존 로그아웃 상태 해제
                finishLogin();

                const nextPath =
                    await getHomePath();

                navigate(
                    nextPath,
                    {
                        replace: true,
                    }
                );
            };

        checkSession();
    }, [navigate]);

    // =================================================
    // 로그인
    // =================================================

    const handleLogin =
        async (e) => {
            e.preventDefault();

            // 이메일 확인
            if (!email.trim()) {
                alert(
                    "이메일을 입력해주세요."
                );
                return;
            }

            // 비밀번호 확인
            if (!password) {
                alert(
                    "비밀번호를 입력해주세요."
                );
                return;
            }

            try {
                // =============================================
                // Supabase Auth 로그인
                // =============================================

                const {
                    data,
                    error,
                } =
                    await supabase.auth.signInWithPassword(
                        {
                            email:
                                email.trim(),
                            password:
                                password,
                        }
                    );

                // 로그인 실패
                if (error) {
                    console.error(
                        "로그인 실패:",
                        error
                    );

                    if (
                        error.message ===
                        "Invalid login credentials"
                    ) {
                        alert(
                            "이메일 또는 비밀번호가 올바르지 않습니다."
                        );
                    } else {
                        alert(
                            `로그인에 실패했습니다.\n${error.message}`
                        );
                    }

                    return;
                }

                // =============================================
                // ⭐ 로그인 성공
                // =============================================

                console.log(
                    "로그인 성공:",
                    data
                );

                console.log(
                    "로그인 사용자:",
                    data.user
                );

                console.log(
                    "로그인 세션:",
                    data.session
                );

                // ⭐ 로그아웃 차단 상태 해제
                finishLogin();

                // =============================================
                // 아이디 기억하기
                // =============================================

                try {
                    if (
                        rememberId
                    ) {
                        localStorage.setItem(
                            SAVED_EMAIL_KEY,
                            email.trim()
                        );
                    } else {
                        localStorage.removeItem(
                            SAVED_EMAIL_KEY
                        );
                    }
                } catch (
                    storageError
                ) {
                    console.error(
                        "아이디 저장 오류:",
                        storageError
                    );
                }

                // =============================================
                // 자동 로그인 설정
                // =============================================

                try {
                    localStorage.setItem(
                        AUTO_LOGIN_KEY,
                        String(
                            autoLogin
                        )
                    );
                } catch (
                    storageError
                ) {
                    console.error(
                        "자동 로그인 설정 저장 오류:",
                        storageError
                    );
                }

                // =============================================
                // 동호회 여부에 따라 홈 이동
                // =============================================

                const nextPath =
                    await getHomePath();

                navigate(
                    nextPath,
                    {
                        replace: true,
                    }
                );

            } catch (error) {
                console.error(
                    "로그인 오류:",
                    error
                );

                alert(
                    "로그인 중 오류가 발생했습니다."
                );
            }
        };

    // =================================================
    // 화면
    // =================================================

    return (
        <div className="Login-container">

            {/* 상단 로고 */}
            <div className="Login-top">

                <div className="logo-title">

                    <img
                        src={logo}
                        alt="PlayBridge 로고"
                        className="Home-logo"
                    />

                    <h1>
                        PlayBridge
                    </h1>

                </div>

                <p className="Home-subtitle">
                    운동으로 연결되는 가장 쉬운 방법!
                </p>

            </div>

            {/* 로그인 폼 */}
            <div className="Login-middle">

                <form
                    className="login-form"
                    onSubmit={handleLogin}
                >

                    {/* 이메일 */}
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
                                setEmail(
                                    e.target.value
                                )
                            }
                        />

                    </div>

                    {/* 비밀번호 */}
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
                                    setPassword(
                                        e.target.value
                                    )
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
                                    ? (
                                        <FiEye />
                                    )
                                    : (
                                        <FiEyeOff />
                                    )}
                            </button>

                        </div>

                    </div>

                    {/* 로그인 옵션 */}
                    <div className="login-options">

                        <label className="remember-id">

                            <input
                                type="checkbox"
                                checked={rememberId}
                                onChange={(e) =>
                                    setRememberId(
                                        e.target.checked
                                    )
                                }
                            />

                            아이디 기억하기

                        </label>

                        <label className="remember-id">

                            <input
                                type="checkbox"
                                checked={autoLogin}
                                onChange={(e) =>
                                    setAutoLogin(
                                        e.target.checked
                                    )
                                }
                            />

                            자동 로그인

                        </label>

                    </div>

                    {/* 로그인 */}
                    <button
                        type="submit"
                        className="login-btn"
                    >
                        로그인
                    </button>

                </form>

            </div>

            {/* 회원가입 */}
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