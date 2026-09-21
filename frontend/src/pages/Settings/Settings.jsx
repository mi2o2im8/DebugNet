import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import BackButton from "../../components/BackButton/BackButton";

import "./Settings.css";

function Settings() {
    const navigate = useNavigate();

    const [darkMode, setDarkMode] = useState(
        localStorage.getItem("darkMode") === "true"
    );

    const [chatNotification, setChatNotification] = useState(
        localStorage.getItem("chatNotification") !== "false"
    );

    // ⭐ 로그아웃 모달
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // ⭐ 다크모드 전체 적용
    useEffect(() => {
        document.documentElement.classList.toggle("dark-mode", darkMode);
        localStorage.setItem("darkMode", darkMode);
    }, [darkMode]);

    // ⭐ 채팅 알림 저장
    useEffect(() => {
        localStorage.setItem("chatNotification", chatNotification);
    }, [chatNotification]);

    // ⭐ 로그아웃 확인
    const handleLogout = () => {
        navigate("/login");
    };

    return (
        <div className="settings-page">

            {/* 상단 */}
            <header className="settings-header">
                <BackButton />
                <h2>설정</h2>
            </header>

            <main className="settings-content">

                {/* 화면 */}
                <section className="settings-section">
                    <h3>화면</h3>

                    <div className="settings-card">
                        <div className="settings-row">
                            <span>라이트 / 다크모드</span>

                            <label className="settings-switch">
                                <input
                                    type="checkbox"
                                    checked={darkMode}
                                    onChange={(e) =>
                                        setDarkMode(e.target.checked)
                                    }
                                />
                                <span className="switch-slider"></span>
                            </label>
                        </div>
                    </div>
                </section>

                {/* 알림 */}
                <section className="settings-section">
                    <h3>알림</h3>

                    <div className="settings-card">

                        <button
                            type="button"
                            className="settings-row settings-button"
                            onClick={() => navigate("/notification-settings")}
                        >
                            <span>알림 설정</span>
                            <span className="row-arrow">›</span>
                        </button>

                        <div className="settings-divider"></div>

                        <div className="settings-row">
                            <span>채팅 알림</span>

                            <label className="settings-switch">
                                <input
                                    type="checkbox"
                                    checked={chatNotification}
                                    onChange={(e) =>
                                        setChatNotification(e.target.checked)
                                    }
                                />
                                <span className="switch-slider"></span>
                            </label>
                        </div>

                    </div>
                </section>
  
                {/* 계정 및 안전 */}
                <section className="settings-section">
                    <h3>계정 및 안전</h3>

                    <div className="settings-card">

                        <button
                            type="button"
                            className="settings-row settings-button"
                            onClick={() => navigate("/account")}
                        >
                            <span>계정 정보</span>
                            <span className="row-arrow">›</span>
                        </button>

                        <div className="settings-divider"></div>

                        <button
                            type="button"
                            className="settings-row settings-button"
                            onClick={() => navigate("/privacy")}
                        >
                            <span>개인정보 관리</span>
                            <span className="row-arrow">›</span>
                        </button>

                        <div className="settings-divider"></div>

                        <button
                            type="button"
                            className="settings-row settings-button"
                            onClick={() => navigate("/blocked-users")}
                        >
                            <span>차단회원 관리</span>
                            <span className="row-arrow">›</span>
                        </button>

                    </div>
                </section>

                {/* 도움말 */}
                <section className="settings-section">
                    <h3>도움말</h3>

                    <div className="settings-card">

                        <button
                            type="button"
                            className="settings-row settings-button"
                            onClick={() => navigate("/faq")}
                        >
                            <span>FAQ</span>
                            <span className="row-arrow">›</span>
                        </button>

                        <div className="settings-divider"></div>

                        <button
                            type="button"
                            className="settings-row settings-button"
                            onClick={() => navigate("/inquiry")}
                        >
                            <span>문의하기</span>
                            <span className="row-arrow">›</span>
                        </button>

                        <div className="settings-divider"></div>

                        <button
                            type="button"
                            className="settings-row settings-button"
                            onClick={() => navigate("/report")}
                        >
                            <span>오류 신고</span>
                            <span className="row-arrow">›</span>
                        </button>

                    </div>
                </section>

                {/* 로그아웃 */}
                <button
                    type="button"
                    className="logout-button"
                    onClick={() => setShowLogoutModal(true)}
                >
                    로그아웃
                </button>

            </main>

            {/* ⭐ 로그아웃 확인 모달 */}
            {showLogoutModal && (
                <div className="logout-modal-overlay">
                    <div className="logout-modal">

                        <h3>로그아웃 하시겠어요?</h3>

                        <p>
                            로그아웃하시면 로그인 화면으로 이동합니다.
                        </p>

                        <div className="logout-modal-buttons">
                            <button
                                type="button"
                                className="logout-cancel"
                                onClick={() => setShowLogoutModal(false)}
                            >
                                취소
                            </button>

                            <button
                                type="button"
                                className="logout-confirm"
                                onClick={handleLogout}
                            >
                                로그아웃
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}

export default Settings;
