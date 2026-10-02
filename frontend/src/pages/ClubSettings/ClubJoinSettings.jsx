import { BackButtonIcon } from "../../components/BackButton/BackButton";
import {
    useEffect,
    useState
} from "react";

import {
    useNavigate,
    useParams
} from "react-router-dom";

import {
    FiCheck,
    FiSave,
    FiShield,
    FiUserPlus,
    FiUserX,
    FiZap
} from "react-icons/fi";

import {
    getClubSettings,
    updateClubSettings
} from "../../api/clubApi";

import "./ClubSettings.css";


const JOIN_METHOD_OPTIONS = [
    {
        value: "instant",
        title: "누구나 바로 가입",
        description: "신청 즉시 동호회 회원으로 가입됩니다.",
        icon: FiZap
    },
    {
        value: "approval",
        title: "가입 신청 후 승인",
        description: "운영진이 신청서를 확인한 후 승인합니다.",
        icon: FiShield
    }
];

const RECRUITING_OPTIONS = [
    {
        value: true,
        title: "회원 모집 중",
        description:
            "신규 회원의 가입 신청을 받고 모집 목록에 표시합니다.",
        icon: FiUserPlus
    },
    {
        value: false,
        title: "회원 모집 불필요",
        description:
            "현재 회원 중심으로 운영하며 신규 가입 신청을 받지 않습니다.",
        icon: FiUserX
    }
];


function ClubJoinSettings() {
    const { clubId } = useParams();
    const navigate = useNavigate();

    const [joinMethod, setJoinMethod] =
        useState("approval");

    const [isRecruiting, setIsRecruiting] =
        useState(true);

    const [isLoading, setIsLoading] =
        useState(true);

    const [isSaving, setIsSaving] =
        useState(false);

    const [errorMessage, setErrorMessage] =
        useState("");

    useEffect(() => {
        let isActive = true;

        getClubSettings(clubId)
            .then((result) => {
                if (!isActive) {
                    return;
                }

                setJoinMethod(
                    result.join_method || "approval"
                );

                setIsRecruiting(
                    result.is_recruiting ?? true
                );
            })
            .catch((error) => {
                if (!isActive) {
                    return;
                }

                setErrorMessage(
                    error.message ||
                    "가입 설정을 불러오지 못했습니다."
                );
            })
            .finally(() => {
                if (isActive) {
                    setIsLoading(false);
                }
            });

        return () => {
            isActive = false;
        };
    }, [clubId]);

    const handleSave = async () => {
        setIsSaving(true);
        setErrorMessage("");

        try {
            const result = await updateClubSettings(
                clubId,
                {
                    joinMethod,
                    isRecruiting
                }
            );

            alert(
                result.message ||
                "가입 방식이 수정되었습니다."
            );

            navigate(
                `/clubs/${clubId}/manage/settings`
            );
        } catch (error) {
            setErrorMessage(
                error.message ||
                "가입 방식 수정에 실패했습니다."
            );
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <main className="club-settings-state">
                가입 설정을 불러오는 중입니다.
            </main>
        );
    }

    return (
        <main className="club-settings-page">
            <header className="club-settings-header">
                <button
                    type="button"
                    className="club-settings-back-button"
                    aria-label="동호회 설정으로 돌아가기"
                    onClick={() =>
                        navigate(
                            `/clubs/${clubId}/manage/settings`
                        )
                    }
                >
                    <BackButtonIcon />
                </button>

                <h1>가입 방식 설정</h1>

                <span
                    className="club-settings-header-space"
                    aria-hidden="true"
                />
            </header>

            <section className="club-settings-form-content">
                {errorMessage && (
                    <p className="club-settings-error">
                        {errorMessage}
                    </p>
                )}

                <div className="club-settings-form-card">
                    <div className="club-settings-field">
                        <label>가입 방식</label>

                        <div className="club-settings-choice-list">
                            {JOIN_METHOD_OPTIONS.map(
                                (option) => {
                                    const Icon = option.icon;
                                    const isSelected =
                                        joinMethod === option.value;

                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            className={[
                                                "club-settings-choice",
                                                isSelected
                                                    ? "selected"
                                                    : ""
                                            ]
                                                .filter(Boolean)
                                                .join(" ")}
                                            onClick={() =>
                                                setJoinMethod(
                                                    option.value
                                                )
                                            }
                                        >
                                            <span className="club-settings-choice-icon">
                                                <Icon />
                                            </span>

                                            <span className="club-settings-choice-text">
                                                <strong>
                                                    {option.title}
                                                </strong>

                                                <small>
                                                    {option.description}
                                                </small>
                                            </span>

                                            <span className="club-settings-choice-check">
                                                {isSelected && (
                                                    <FiCheck />
                                                )}
                                            </span>
                                        </button>
                                    );
                                }
                            )}
                        </div>
                    </div>

                    <div className="club-settings-field">
                        <label>회원 모집 상태</label>

                        <div className="club-settings-choice-list">
                            {RECRUITING_OPTIONS.map(
                                (option) => {
                                    const Icon = option.icon;
                                    const isSelected =
                                        isRecruiting === option.value;

                                    return (
                                        <button
                                            key={String(option.value)}
                                            type="button"
                                            className={[
                                                "club-settings-choice",
                                                isSelected
                                                    ? "selected"
                                                    : ""
                                            ]
                                                .filter(Boolean)
                                                .join(" ")}
                                            onClick={() =>
                                                setIsRecruiting(
                                                    option.value
                                                )
                                            }
                                        >
                                            <span className="club-settings-choice-icon">
                                                <Icon />
                                            </span>

                                            <span className="club-settings-choice-text">
                                                <strong>
                                                    {option.title}
                                                </strong>

                                                <small>
                                                    {option.description}
                                                </small>
                                            </span>

                                            <span className="club-settings-choice-check">
                                                {isSelected && (
                                                    <FiCheck />
                                                )}
                                            </span>
                                        </button>
                                    );
                                }
                            )}
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    className="club-settings-save-button"
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    <FiSave />

                    {isSaving
                        ? "저장 중..."
                        : "변경사항 저장"}
                </button>
            </section>
        </main>
    );
}


export default ClubJoinSettings;