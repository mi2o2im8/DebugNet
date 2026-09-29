import {
    useEffect,
    useState
} from "react";

import {
    useNavigate,
    useParams
} from "react-router-dom";

import {
    FiAlertTriangle,
    FiChevronLeft,
    FiTrash2
} from "react-icons/fi";

import {
    deleteClub,
    getClubSettings
} from "../../api/clubApi";

import "./ClubSettings.css";


function ClubDeleteSettings() {
    const { clubId } = useParams();
    const navigate = useNavigate();

    const [clubName, setClubName] =
        useState("");

    const [userRole, setUserRole] =
        useState("");

    const [confirmationText, setConfirmationText] =
        useState("");

    const [isLoading, setIsLoading] =
        useState(true);

    const [isDeleting, setIsDeleting] =
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

                setClubName(
                    result.club_name || ""
                );

                setUserRole(
                    result.user_role || ""
                );
            })
            .catch((error) => {
                if (!isActive) {
                    return;
                }

                setErrorMessage(
                    error.message ||
                    "동호회 정보를 불러오지 못했습니다."
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

    const isOwner = userRole === "owner";

    const isConfirmationMatched = (
        confirmationText.trim() === clubName
    );

    const handleDelete = async () => {
        if (!isOwner) {
            alert(
                "동호회장만 동호회를 삭제할 수 있습니다."
            );
            return;
        }

        if (!isConfirmationMatched) {
            alert(
                "동호회 이름을 정확히 입력해주세요."
            );
            return;
        }

        const confirmed = window.confirm(
            `'${clubName}' 동호회를 삭제하시겠습니까?\n\n` +
            "삭제 후 운영 화면에서 접근할 수 없습니다."
        );

        if (!confirmed) {
            return;
        }

        setIsDeleting(true);
        setErrorMessage("");

        try {
            const result = await deleteClub(
                clubId,
                confirmationText.trim()
            );

            alert(
                result.message ||
                "동호회가 삭제되었습니다."
            );

            navigate(
                "/mainhome",
                {
                    replace: true
                }
            );
        } catch (error) {
            setErrorMessage(
                error.message ||
                "동호회 삭제에 실패했습니다."
            );
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <main className="club-settings-state">
                동호회 정보를 불러오는 중입니다.
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
                    <FiChevronLeft />
                </button>

                <h1>동호회 삭제</h1>

                <span
                    className="club-settings-header-space"
                    aria-hidden="true"
                />
            </header>

            <section className="club-settings-delete-content">
                {errorMessage && (
                    <p className="club-settings-error">
                        {errorMessage}
                    </p>
                )}

                <div className="club-settings-danger-card">
                    <span className="club-settings-danger-icon">
                        <FiAlertTriangle />
                    </span>

                    <h2>동호회를 삭제할까요?</h2>

                    <p>
                        삭제하면 동호회가 검색, 추천,
                        회원 및 운영 화면에서 숨겨집니다.
                    </p>

                    <p>
                        일정, 게시글, 회원 데이터는
                        안전을 위해 바로 제거하지 않습니다.
                    </p>
                </div>

                {!isOwner && (
                    <p className="club-settings-owner-warning">
                        동호회장만 삭제할 수 있습니다.
                    </p>
                )}

                <div className="club-settings-delete-confirm">
                    <label htmlFor="club-delete-confirmation">
                        확인을 위해 아래 동호회 이름을
                        입력해주세요.
                    </label>

                    <strong>{clubName}</strong>

                    <input
                        id="club-delete-confirmation"
                        type="text"
                        className="club-settings-input"
                        value={confirmationText}
                        placeholder={clubName}
                        disabled={!isOwner || isDeleting}
                        onChange={(event) =>
                            setConfirmationText(
                                event.target.value
                            )
                        }
                    />
                </div>

                <button
                    type="button"
                    className="club-settings-delete-button"
                    disabled={
                        !isOwner
                        || !isConfirmationMatched
                        || isDeleting
                    }
                    onClick={handleDelete}
                >
                    <FiTrash2 />

                    {isDeleting
                        ? "삭제 처리 중..."
                        : "동호회 삭제"}
                </button>
            </section>
        </main>
    );
}


export default ClubDeleteSettings;