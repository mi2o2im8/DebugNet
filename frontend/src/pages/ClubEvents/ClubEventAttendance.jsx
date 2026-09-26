import {
    useEffect,
    useState
} from "react";

import {
    useLocation,
    useNavigate,
    useParams
} from "react-router-dom";

import {
    FiCheck,
    FiChevronLeft,
    FiClock,
    FiHelpCircle,
    FiX
} from "react-icons/fi";

import {
    getClubEventAttendance,
    updateClubEventAttendance
} from "../../api/clubApi";

import "./ClubEventAttendance.css";


const ATTENDANCE_OPTIONS = [
    {
        status: "attending",
        label: "참석",
        description:
            "일정에 참여할 예정입니다.",
        icon: FiCheck
    },
    {
        status: "absent",
        label: "불참",
        description:
            "이번 일정에는 참여하지 않습니다.",
        icon: FiX
    },
    {
        status: "undecided",
        label: "미정",
        description:
            "참여 여부를 나중에 결정합니다.",
        icon: FiHelpCircle
    }
];


function ClubEventAttendance() {
    const {
        clubId,
        eventId
    } = useParams();

    const navigate = useNavigate();
    const location = useLocation();

    const eventTitle = (
        location.state?.eventTitle
        || `일정 #${eventId}`
    );

    const [attendanceStatus, setAttendanceStatus] =
        useState("undecided");

    const [participationStatus, setParticipationStatus] = 
        useState(null);

    const [isLoading, setIsLoading] =
        useState(true);

    const [savingStatus, setSavingStatus] =
        useState("");

    const [errorMessage, setErrorMessage] =
        useState("");

    // -----------------------------------------------------
    // 현재 로그인 사용자의 참석 응답 조회
    // -----------------------------------------------------
    useEffect(() => {
        let cancelled = false;

        getClubEventAttendance(
            clubId,
            eventId
        )
            .then((result) => {
                if (cancelled) {
                    return;
                }

                setAttendanceStatus(
                    result.attendance_status
                    || "undecided"
                );

                setParticipationStatus(
                    result.participation_status || null
                );

            })
            .catch((error) => {
                if (cancelled) {
                    return;
                }

                setErrorMessage(
                    error.message ||
                    "참석 응답을 불러오지 못했습니다."
                );
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [
        clubId,
        eventId
    ]);

    // -----------------------------------------------------
    // 참석 상태 변경
    // -----------------------------------------------------
    const handleAttendanceChange = async (
        nextStatus
    ) => {
        const isPendingCancellation = (
            participationStatus === "pending"
            && [
                "absent",
                "undecided"
            ].includes(nextStatus)
        );

        if (
            savingStatus
            || (
                nextStatus === attendanceStatus
                && !isPendingCancellation
            )
        ) {
            return;
        }

        setSavingStatus(nextStatus);
        setErrorMessage("");

        try {
            const result =
                await updateClubEventAttendance(
                    clubId,
                    eventId,
                    nextStatus
                );

            setAttendanceStatus(
                result.attendance_status
            );

            setParticipationStatus(
                result.participation_status || null
            );

            alert(result.message);
        } catch (error) {
            setErrorMessage(
                error.message ||
                "참석 응답을 저장하지 못했습니다."
            );
        } finally {
            setSavingStatus("");
        }
    };

    if (isLoading) {
        return (
            <main className="club-attendance-state">
                참석 정보를 불러오는 중입니다.
            </main>
        );
    }

    return (
        <main className="club-attendance-page">
            <header className="club-attendance-header">
                <button
                    type="button"
                    className="club-attendance-back-button"
                    aria-label="이전"
                    onClick={() => navigate(-1)}
                >
                    <FiChevronLeft />
                </button>

                <div className="club-attendance-header-text">
                    <h1>참석 여부</h1>
                    <p>{eventTitle}</p>
                </div>
            </header>

            <div className="club-attendance-content">
                <section className="club-attendance-guide">
                    <FiClock />

                    <div>
                        <h2>
                            참석 여부를 선택해주세요
                        </h2>

                        <p>
                            선택한 내용은 일정 시작 전까지
                            변경할 수 있습니다.
                        </p>
                    </div>
                </section>

                {errorMessage && (
                    <p className="club-attendance-error">
                        {errorMessage}
                    </p>
                )}

                {participationStatus === "pending" && (
                    <p
                        className="club-attendance-pending"
                        role="status"
                    >
                        참여 승인 대기 중입니다. 운영자가
                        승인하면 참석으로 확정됩니다.
                    </p>
                )}

                <section className="club-attendance-options">
                    {ATTENDANCE_OPTIONS.map(
                        (option) => {
                            const Icon = option.icon;

                            const isPendingAttending = (
                                participationStatus === "pending"
                                && option.status === "attending"
                            );

                            const isSelected = (
                                isPendingAttending
                                || (
                                    participationStatus !== "pending"
                                    && attendanceStatus === option.status
                                )
                            );

                            const isSaving = (
                                savingStatus === option.status
                            );

                            return (
                                <button
                                    key={option.status}
                                    type="button"
                                    className={[
                                        "club-attendance-option",
                                        option.status,
                                        isSelected
                                            ? "selected"
                                            : ""
                                    ]
                                        .filter(Boolean)
                                        .join(" ")}
                                    aria-pressed={isSelected}
                                    disabled={
                                        Boolean(savingStatus)
                                        || isPendingAttending
                                    }
                                    onClick={() =>
                                        handleAttendanceChange(
                                            option.status
                                        )
                                    }
                                >
                                    <span
                                        className={
                                            "club-attendance-"
                                            + "option-icon"
                                        }
                                    >
                                        <Icon />
                                    </span>

                                    <span
                                        className={
                                            "club-attendance-"
                                            + "option-content"
                                        }
                                    >
                                        <strong
                                            className={
                                                "club-attendance-"
                                                + "option-title"
                                            }
                                        >
                                            {option.label}
                                        </strong>

                                        <small
                                            className={
                                                "club-attendance-"
                                                + "option-description"
                                            }
                                        >
                                            {option.description}
                                        </small>
                                    </span>

                                    <span
                                        className={
                                            "club-attendance-"
                                            + "option-selected"
                                        }
                                    >
                                        {isPendingAttending
                                            ? "승인 대기"
                                            : (
                                                isSaving
                                                    ? "저장 중"
                                                    : (
                                                        isSelected
                                                            ? "선택됨"
                                                            : ""
                                                    )
                                            )}
                                    </span>
                                </button>
                            );
                        }
                    )}
                </section>
            </div>
        </main>
    );
}


export default ClubEventAttendance;