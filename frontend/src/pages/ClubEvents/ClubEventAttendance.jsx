import { BackButtonIcon } from "../../components/BackButton/BackButton";
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
    FiClock,
    FiHelpCircle,
    FiX
} from "react-icons/fi";

import {
    getClubEventAttendance,
    updateClubEventAttendance,
    getClubScheduleAttendance,
    updateClubScheduleAttendance
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

    const event = location.state?.event;

    const isRegularSchedule =
        eventId?.startsWith("regular-");

    const eventTitle =
        event?.title
        || location.state?.eventTitle
        || `일정 #${eventId}`;

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
        const loadAttendance = async () => {
            setIsLoading(true);
            setErrorMessage("");

            try {
                if (isRegularSchedule) {
                    const result =
                        await getClubScheduleAttendance(
                            clubId,
                            event.club_schedule_id,
                            event.event_date
                        );

                    setAttendanceStatus(
                        result.attendance_status
                    );

                    setIsLoading(false);
                    return;
                }

                const result =
                    await getClubEventAttendance(
                        clubId,
                        eventId
                    );

                setAttendanceStatus(
                    result.attendance_status
                );
            } catch (error) {
                setErrorMessage(
                    error.message ||
                    "참석 여부를 불러오지 못했습니다."
                );
            } finally {
                setIsLoading(false);
            }
        };

        loadAttendance();
    }, [
        clubId,
        eventId,
        isRegularSchedule,
        event
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
            let result;

            if (isRegularSchedule) {
                result =
                    await updateClubScheduleAttendance(
                        clubId,
                        event.club_schedule_id,
                        event.event_date,
                        nextStatus
                    );
            } else {
                result =
                    await updateClubEventAttendance(
                        clubId,
                        eventId,
                        nextStatus
                    );
            }

            setAttendanceStatus(
                result.attendance_status
            );

            setParticipationStatus(
                result.participation_status || null
            );

            alert(result.message);
        } catch (error) {
            console.error(
                "참석 응답 저장 실패:",
                error
            );

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
                    <BackButtonIcon />
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