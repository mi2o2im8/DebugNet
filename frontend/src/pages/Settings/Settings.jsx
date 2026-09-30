import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import BackButton from "../../components/BackButton/BackButton";

import { supabase } from "../../../supabaseClient";
import { clearMyClubCache } from "../../api/myClubCache";
import { startLogout } from "../../api/apiClient";

import "./Settings.css";

function Settings() {
    const navigate = useNavigate();

    const [darkMode, setDarkMode] = useState(
        localStorage.getItem("darkMode") === "true"
    );

    // ⭐ 로그아웃 모달
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // ⭐ 다크모드 전체 적용
    useEffect(() => {
        document.documentElement.classList.toggle(
            "dark-mode",
            darkMode
        );

        localStorage.setItem(
            "darkMode",
            String(darkMode)
        );
    }, [darkMode]);

    // =====================================================
    // ⭐ 로그아웃
    // =====================================================

    const handleLogout = async () => {
        // 새로운 API 요청 차단 + 현재 요청 취소
        startLogout();

        try {
            // Supabase 실제 로그아웃
            await supabase.auth.signOut();
        } catch (error) {
            console.error("로그아웃 오류:", error);
        }

        // 이전 계정의 동호회 캐시 제거
        clearMyClubCache();

        // 로그인 페이지로 이동
        navigate("/login", {
            replace: true,
        });
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
                                        setDarkMode(
                                            e.target.checked
                                        )
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
                            onClick={() =>
                                navigate(
                                    "/notification-settings"
                                )
                            }
                        >
                            <span>알림 설정</span>
                            <span className="row-arrow">›</span>
                        </button>

                    </div>
                </section>

                {/* 계정 및 안전 */}
                <section className="settings-section">
                    <h3>계정 및 안전</h3>

                    <div className="settings-card">

                        <button
                            type="button"
                            className="settings-row settings-button"
                            onClick={() =>
                                navigate("/myinfoedit")
                            }
                        >
                            <span>계정 정보</span>
                            <span className="row-arrow">›</span>
                        </button>

                        <div className="settings-divider"></div>

                        <button
                            type="button"
                            className="settings-row settings-button"
                            onClick={() =>
                                navigate("/privacy")
                            }
                        >
                            <span>개인정보 관리</span>
                            <span className="row-arrow">›</span>
                        </button>

                        <div className="settings-divider"></div>

                        <button
                            type="button"
                            className="settings-row settings-button"
                            onClick={() =>
                                navigate("/blocked-users")
                            }
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
                            onClick={() =>
                                navigate("/faq")
                            }
                        >
                            <span>FAQ</span>
                            <span className="row-arrow">›</span>
                        </button>

                        <div className="settings-divider"></div>

                        <button
                            type="button"
                            className="settings-row settings-button"
                            onClick={() =>
                                navigate("/inquiry")
                            }
                        >
                            <span>문의하기</span>
                            <span className="row-arrow">›</span>
                        </button>

                        <div className="settings-divider"></div>

                        <button
                            type="button"
                            className="settings-row settings-button"
                            onClick={() =>
                                navigate("/report")
                            }
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
                    onClick={() =>
                        setShowLogoutModal(true)
                    }
                >
                    로그아웃
                </button>

            </main>

            {/* ⭐ 로그아웃 확인 모달 */}
            {showLogoutModal && (
                <div className="logout-modal-overlay">

                    <div className="logout-modal">

                        <h3>
                            로그아웃 하시겠어요?
                        </h3>

                        <p>
                            로그아웃하시면 로그인 화면으로 이동합니다.
                        </p>

                        <div className="logout-modal-buttons">

                            <button
                                type="button"
                                className="logout-cancel"
                                onClick={() =>
                                    setShowLogoutModal(false)
                                }
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