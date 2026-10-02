import {
    useEffect,
    useState
} from "react";

import {
    useNavigate,
    useParams
} from "react-router-dom";

import {
    FiSave
} from "react-icons/fi";

import {
    getClubSettings,
    updateClubSettings
} from "../../api/clubApi";

import {
    BackButtonIcon
} from "../../components/BackButton/BackButton";

import "./ClubSettings.css";


const MAX_INTRO_LENGTH = 2000;


function ClubIntroductionSettings() {
    const { clubId } = useParams();
    const navigate = useNavigate();

    const [clubIntro, setClubIntro] =
        useState("");

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

                setClubIntro(
                    result.club_intro ?? ""
                );
            })
            .catch((error) => {
                if (!isActive) {
                    return;
                }

                setErrorMessage(
                    error.message ||
                    "동호회 소개를 불러오지 못했습니다."
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
                    clubIntro: clubIntro.trim()
                }
            );

            alert(
                result.message ||
                "동호회 소개가 수정되었습니다."
            );

            navigate(
                `/clubs/${clubId}/manage/settings`
            );
        } catch (error) {
            setErrorMessage(
                error.message ||
                "동호회 소개 수정에 실패했습니다."
            );
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <main className="club-settings-state">
                동호회 소개를 불러오는 중입니다.
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

                <h1>동호회 소개 수정</h1>

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
                        <label htmlFor="settings-club-intro">
                            동호회 소개
                        </label>

                        <textarea
                            id="settings-club-intro"
                            className="club-settings-textarea"
                            maxLength={MAX_INTRO_LENGTH}
                            value={clubIntro}
                            placeholder={
                                "동호회의 활동 방식과 분위기를 "
                                + "소개해주세요."
                            }
                            onChange={(event) =>
                                setClubIntro(
                                    event.target.value
                                )
                            }
                        />

                        <div className="club-settings-textarea-footer">
                            <small>
                                가입을 고민하는 이용자에게
                                표시되는 소개글입니다.
                            </small>

                            <span>
                                {clubIntro.length}
                                /{MAX_INTRO_LENGTH}
                            </span>
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


export default ClubIntroductionSettings;