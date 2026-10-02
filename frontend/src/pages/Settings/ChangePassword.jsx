// 비밀번호 변경 페이지

import {
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import {
    FiEye,
    FiEyeOff,
} from "react-icons/fi";

import BackButton from "../../components/BackButton/BackButton";

import { supabase } from "../../../supabaseClient";

import "./Settings.css";
import "./AccountSettings.css";
import { goBack } from "../../utils/navigation";


// =========================================================
// ⭐ 비밀번호 규칙 (회원가입과 동일)
// =========================================================

const checkPasswordRules = (password) => ({
    length: password.length >= 8,
    combination:
        /[A-Za-z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[!@#$%^&*]/.test(password),
});


// =========================================================
// ⭐ 비밀번호 입력칸 (보기/숨기기 포함)
// =========================================================

function PasswordField({
    id,
    label,
    value,
    onChange,
    placeholder,
    autoComplete,
}) {

    const [visible, setVisible] = useState(false);

    return (

        <div className="pw-field">

            <label htmlFor={id}>
                {label}
            </label>

            <div className="pw-field-box">

                <input
                    id={id}
                    type={visible ? "text" : "password"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                />

                <button
                    type="button"
                    className="pw-field-eye"
                    onClick={() => setVisible(!visible)}
                    aria-label={visible ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                    {visible ? <FiEye /> : <FiEyeOff />}
                </button>

            </div>

        </div>

    );

}


// =========================================================
// ⭐ 비밀번호 변경 페이지
// =========================================================

function ChangePassword() {

    const navigate = useNavigate();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

    const [submitting, setSubmitting] = useState(false);

    const [errorMessage, setErrorMessage] = useState("");


    // ⭐ 규칙 체크 (입력하는 동안 실시간 표시)
    const rules = checkPasswordRules(newPassword);

    const isMatched =
        newPasswordConfirm.length > 0 &&
        newPassword === newPasswordConfirm;

    const canSubmit =
        currentPassword &&
        rules.length &&
        rules.combination &&
        isMatched &&
        !submitting;


    // =========================================================
    // ⭐ 변경하기
    // =========================================================

    const handleSubmit = async () => {

        setErrorMessage("");


        if (currentPassword === newPassword) {
            setErrorMessage("현재 비밀번호와 다른 비밀번호를 입력해주세요.");
            return;
        }


        try {

            setSubmitting(true);


            // -------------------------------------------------
            // 1. 로그인한 이메일 가져오기
            // -------------------------------------------------

            const { data: userData } = await supabase.auth.getUser();

            const email = userData?.user?.email;

            if (!email) {
                setErrorMessage("로그인 정보를 확인할 수 없어요. 다시 로그인해주세요.");
                return;
            }


            // -------------------------------------------------
            // 2. 현재 비밀번호 확인 (다시 로그인해보기)
            // -------------------------------------------------

            const { error: signInError } =
                await supabase.auth.signInWithPassword({
                    email,
                    password: currentPassword,
                });

            if (signInError) {
                setErrorMessage("현재 비밀번호가 올바르지 않아요.");
                return;
            }


            // -------------------------------------------------
            // 3. 새 비밀번호로 변경
            // -------------------------------------------------

            const { error: updateError } =
                await supabase.auth.updateUser({
                    password: newPassword,
                });

            if (updateError) {

                console.error("비밀번호 변경 실패:", updateError);

                if (updateError.code === "same_password") {
                    setErrorMessage("현재 비밀번호와 다른 비밀번호를 입력해주세요.");
                } else if (updateError.code === "weak_password") {
                    setErrorMessage("더 안전한 비밀번호를 입력해주세요.");
                } else {
                    setErrorMessage("비밀번호 변경에 실패했어요. 잠시 후 다시 시도해주세요.");
                }

                return;
            }


            alert("비밀번호가 변경되었어요!");

            goBack(navigate);

        } catch (error) {

            console.error("비밀번호 변경 오류:", error);

            setErrorMessage("비밀번호 변경 중 오류가 발생했어요.");

        } finally {

            setSubmitting(false);

        }

    };


    return (

        <div className="settings-page account-settings-page">

            {/* =================================================
                상단
            ================================================= */}

            <header className="settings-header">
                <BackButton />
                <h2>비밀번호 변경</h2>
            </header>


            <main className="settings-content">

                <div className="settings-card pw-card">

                    <PasswordField
                        id="current-password"
                        label="현재 비밀번호"
                        value={currentPassword}
                        onChange={setCurrentPassword}
                        placeholder="현재 비밀번호를 입력해주세요"
                        autoComplete="current-password"
                    />

                    <PasswordField
                        id="new-password"
                        label="새 비밀번호"
                        value={newPassword}
                        onChange={setNewPassword}
                        placeholder="새 비밀번호를 입력해주세요"
                        autoComplete="new-password"
                    />

                    <PasswordField
                        id="new-password-confirm"
                        label="새 비밀번호 확인"
                        value={newPasswordConfirm}
                        onChange={setNewPasswordConfirm}
                        placeholder="새 비밀번호를 한 번 더 입력해주세요"
                        autoComplete="new-password"
                    />


                    {/* ⭐ 규칙 안내 */}
                    <ul className="pw-rules">

                        <li className={rules.length ? "is-valid" : ""}>
                            8자 이상
                        </li>

                        <li className={rules.combination ? "is-valid" : ""}>
                            영문 + 숫자 + 특수문자(!@#$%^&*) 포함
                        </li>

                        <li className={isMatched ? "is-valid" : ""}>
                            새 비밀번호 일치
                        </li>

                    </ul>

                </div>


                {/* ⭐ 에러 */}
                {errorMessage && (
                    <p
                        className="pw-error"
                        role="alert"
                    >
                        {errorMessage}
                    </p>
                )}


                <button
                    type="button"
                    className="pw-submit"
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                >
                    {submitting ? "변경 중..." : "비밀번호 변경"}
                </button>

            </main>

        </div>

    );

}

export default ChangePassword;
