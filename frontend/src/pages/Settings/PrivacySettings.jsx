// 개인정보 관리 페이지

import {
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import BackButton from "../../components/BackButton/BackButton";

import { supabase } from "../../../supabaseClient";

import "./Settings.css";
import "./AccountSettings.css";


function PrivacySettings() {

    const navigate = useNavigate();

    // ⭐ 로그인 이메일 (아이디)
    const [email, setEmail] = useState("");


    // =========================================================
    // ⭐ 로그인 이메일 불러오기
    // =========================================================

    useEffect(() => {

        const fetchEmail = async () => {

            const { data } = await supabase.auth.getUser();

            setEmail(data?.user?.email || "");

        };

        fetchEmail();

    }, []);


    // =========================================================
    // ⭐ 회원 탈퇴 (준비 중)
    //
    // TODO: 탈퇴 정책(동호회장 탈퇴, 글/댓글 처리 등) 정한 뒤
    //       백엔드 API 만들고 연결
    // =========================================================

    const handleWithdraw = () => {

        alert("회원 탈퇴 기능은 준비 중이에요!");

    };


    return (

        <div className="settings-page account-settings-page">

            {/* =================================================
                상단
            ================================================= */}

            <header className="settings-header">
                <BackButton />
                <h2>개인정보 관리</h2>
            </header>


            <main className="settings-content">

                {/* =================================================
                    로그인 정보
                ================================================= */}

                <section className="settings-section">

                    <h3>로그인 정보</h3>

                    <div className="settings-card">

                        <div className="settings-row">

                            <span>이메일</span>

                            <span className="account-email">
                                {email || "불러오는 중..."}
                            </span>

                        </div>

                        <div className="settings-divider"></div>

                        <button
                            type="button"
                            className="settings-row settings-button"
                            onClick={() => navigate("/change-password")}
                        >
                            <span>비밀번호 변경</span>
                            <span className="row-arrow">›</span>
                        </button>

                    </div>

                </section>


                {/* =================================================
                    회원 탈퇴
                ================================================= */}

                <section className="settings-section">

                    <div className="settings-card">

                        <button
                            type="button"
                            className="settings-row settings-button"
                            onClick={handleWithdraw}
                        >
                            <span className="account-withdraw">
                                회원 탈퇴
                            </span>

                            <em className="coming-soon-badge">
                                준비 중
                            </em>
                        </button>

                    </div>

                </section>

            </main>

        </div>

    );

}

export default PrivacySettings;
