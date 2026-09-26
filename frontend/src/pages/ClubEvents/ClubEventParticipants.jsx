import {
    useCallback,
    useEffect,
    useState
} from "react";

import {
    useNavigate,
    useParams
} from "react-router-dom";

import {
    FiCheck,
    FiChevronLeft,
    FiClock,
    FiUser,
    FiUsers,
    FiX
} from "react-icons/fi";

import {
    decideClubEventParticipant,
    getClubEventParticipants,
    updateClubEventParticipantAttendance
} from "../../api/clubApi";

import "./ClubEventParticipants.css";


const ATTENDANCE_LABELS = {
    attending: "참석",
    absent: "불참",
    undecided: "미정"
};

const STATUS_LABELS = {
    pending: "승인 대기",
    joined: "참여 확정",
    rejected: "승인 거절",
    cancelled: "참여 취소"
};


function ParticipantItem({
    participant,
    isProcessing,
    onDecision,
    onAttendanceChange
}) {
    const displayName =
        participant.nickname ||
        participant.name ||
        "사용자";

    const initial =
        displayName.trim().slice(0, 1);

    return (
        <article className="event-participant-item">
            <div className="event-participant-profile">
                {participant.profile_image ? (
                    <img
                        src={participant.profile_image}
                        alt=""
                    />
                ) : (
                    <span>{initial}</span>
                )}
            </div>

            <div className="event-participant-information">
                <strong>{displayName}</strong>

                <span>
                    {participant.name}
                    {" · "}
                    {participant.participant_type === "guest"
                        ? "게스트"
                        : (
                            MEMBER_ROLE_LABELS[
                                participant.member_role
                            ] || "회원"
                        )}
                </span>

                <div className="event-participant-badges">
                    <small
                        className={
                            participant.participation_status
                        }
                    >
                        {
                            STATUS_LABELS[
                                participant
                                    .participation_status
                            ]
                        }
                    </small>

                    {participant.attendance_status && (
                        <small className="attendance">
                            <FiClock />

                            {
                                ATTENDANCE_LABELS[
                                    participant
                                        .attendance_status
                                ]
                            }
                        </small>
                    )}
                </div>
            </div>
            
            {participant.participation_status ===
                "joined" && (
                <label className="event-participant-attendance-control">
                    <span>참석 상태</span>

                    <select
                        value={
                            participant.attendance_status
                            || "undecided"
                        }
                        disabled={isProcessing}
                        onChange={(event) =>
                            onAttendanceChange(
                                participant
                                    .event_participant_id,
                                event.target.value
                            )
                        }
                    >
                        <option value="attending">
                            참석
                        </option>

                        <option value="absent">
                            불참
                        </option>

                        <option value="undecided">
                            미정
                        </option>
                    </select>
                </label>
            )}

            {participant.participation_status ===
                "pending" && (
                <div className="event-participant-actions">
                    <button
                        type="button"
                        className="approve"
                        disabled={isProcessing}
                        onClick={() =>
                            onDecision(
                                participant,
                                "approve"
                            )
                        }
                    >
                        <FiCheck />
                        승인
                    </button>

                    <button
                        type="button"
                        className="reject"
                        disabled={isProcessing}
                        onClick={() =>
                            onDecision(
                                participant,
                                "reject"
                            )
                        }
                    >
                        <FiX />
                        거절
                    </button>
                </div>
            )}
        </article>
    );
}


function ClubEventParticipants() {
    const {
        clubId,
        eventId
    } = useParams();

    const navigate = useNavigate();

    const [participantData, setParticipantData] =
        useState(null);

    const [isLoading, setIsLoading] =
        useState(true);

    const [processingId, setProcessingId] =
        useState(null);

    const [errorMessage, setErrorMessage] =
        useState("");

    const [noticeMessage, setNoticeMessage] =
        useState("");

    const loadParticipants = useCallback(
        async (showLoading = true) => {
            if (showLoading) {
                setIsLoading(true);
            }

            setErrorMessage("");

            try {
                const result =
                    await getClubEventParticipants(
                        clubId,
                        eventId
                    );

                setParticipantData(result);
            } catch (error) {
                console.error(
                    "참가자 목록 조회 실패:",
                    error
                );

                setErrorMessage(
                    error.message ||
                    "참가자를 불러오지 못했습니다."
                );
            } finally {
                if (showLoading) {
                    setIsLoading(false);
                }
            }
        },
        [clubId, eventId]
    );

    useEffect(() => {
        loadParticipants();
    }, [loadParticipants]);

    const handleDecision = async (
        participant,
        decision
    ) => {
        const actionLabel =
            decision === "approve"
                ? "승인"
                : "거절";

        const participantLabel =
            participant.participant_type === "guest"
                ? "게스트"
                : "회원";

        const confirmed = window.confirm(
            `이 ${participantLabel} 참여 신청을 `
            + `${actionLabel}하시겠습니까?`
        );

        if (!confirmed) {
            return;
        }

        const eventParticipantId =
            participant.event_participant_id;

        setProcessingId(eventParticipantId);
        setErrorMessage("");
        setNoticeMessage("");

        try {
            const result =
                await decideClubEventParticipant(
                    clubId,
                    eventId,
                    eventParticipantId,
                    decision
                );

            setNoticeMessage(result.message);

            await loadParticipants(false);
        } catch (error) {
            console.error(
                "참가 신청 처리 실패:",
                error
            );

            setErrorMessage(
                error.message ||
                "참가 신청을 처리하지 못했습니다."
            );
        } finally {
            setProcessingId(null);
        }
    };

    const handleAttendanceChange = async (
        eventParticipantId,
        attendanceStatus
    ) => {
        setProcessingId(eventParticipantId);
        setErrorMessage("");
        setNoticeMessage("");

        try {
            const result =
                await updateClubEventParticipantAttendance(
                    clubId,
                    eventId,
                    eventParticipantId,
                    attendanceStatus
                );

            setNoticeMessage(result.message);

            await loadParticipants(false);
        } catch (error) {
            console.error(
                "참가자 참석 상태 변경 실패:",
                error
            );

            setErrorMessage(
                error.message ||
                "참석 상태를 변경하지 못했습니다."
            );
        } finally {
            setProcessingId(null);
        }
    };

    if (isLoading) {
        return (
            <main className="event-participants-page state">
                참가자를 불러오는 중입니다.
            </main>
        );
    }

    if (!participantData) {
        return (
            <main className="event-participants-page state error">
                {errorMessage}
            </main>
        );
    }

    const pendingParticipants =
        participantData.participants.filter(
            (participant) =>
                participant.participation_status ===
                    "pending"
        );

    const joinedParticipants =
        participantData.participants.filter(
            (participant) =>
                participant.participation_status ===
                "joined"
        );

    const applicationHistory =
        participantData.participants.filter(
            (participant) =>
                ["rejected", "cancelled"].includes(
                    participant.participation_status
                )
        );

    return (
        <main className="event-participants-page">
            <header>
                <button
                    type="button"
                    aria-label="일정 목록으로 돌아가기"
                    onClick={() =>
                        navigate(
                            `/clubs/${clubId}/manage/events`
                        )
                    }
                >
                    <FiChevronLeft />
                </button>

                <div>
                    <h1>참가자 관리</h1>
                    <span>일정 #{eventId}</span>
                </div>
            </header>

            <section className="event-participant-summary">
                <div>
                    <FiUsers />

                    <strong>
                        {
                            participantData
                                .joined_member_count
                        }
                    </strong>

                    <span>참여 회원</span>
                </div>

                <div>
                    <FiUser />

                    <strong>
                        {
                            participantData
                                .joined_guest_count
                        }
                    </strong>

                    <span>승인 게스트</span>
                </div>

                <div className="pending">
                    <FiClock />

                    <strong>
                        {
                            Number(
                                participantData
                                    .pending_member_count || 0
                            )
                            +
                            Number(
                                participantData
                                    .pending_guest_count || 0
                            )
                        }
                    </strong>

                    <span>승인 대기</span>
                </div>
            </section>

            {noticeMessage && (
                <p
                    className="event-participant-notice"
                    role="status"
                >
                    {noticeMessage}
                </p>
            )}

            {errorMessage && (
                <p
                    className="event-participant-error"
                    role="alert"
                >
                    {errorMessage}
                </p>
            )}

            <section className="event-participant-section">
                <div className="event-participant-section-title">
                    <h2>승인 대기</h2>

                    <span>
                        {pendingParticipants.length}명
                    </span>
                </div>

                {pendingParticipants.length === 0 ? (
                    <p className="event-participant-empty">
                        대기 중인 참여 신청이 없습니다.
                    </p>
                ) : (
                    pendingParticipants.map(
                        (participant) => (
                            <ParticipantItem
                                key={
                                    participant
                                        .event_participant_id
                                }
                                participant={participant}
                                isProcessing={
                                    processingId ===
                                    participant
                                        .event_participant_id
                                }
                                onDecision={
                                    handleDecision
                                }
                                onAttendanceChange={
                                    handleAttendanceChange
                                }
                            />
                        )
                    )
                )}
            </section>

            <section className="event-participant-section">
                <div className="event-participant-section-title">
                    <h2>참여 확정</h2>
                    <span>
                        {joinedParticipants.length}명
                    </span>
                </div>

                {joinedParticipants.length === 0 ? (
                    <p className="event-participant-empty">
                        참여가 확정된 인원이 없습니다.
                    </p>
                ) : (
                    joinedParticipants.map(
                        (participant) => (
                            <ParticipantItem
                                key={
                                    participant
                                        .event_participant_id
                                }
                                participant={participant}
                                isProcessing={
                                    processingId ===
                                    participant.event_participant_id
                                }
                                onDecision={
                                    handleDecision
                                }
                                onAttendanceChange={handleAttendanceChange}
                            />
                        )
                    )
                )}
            </section>

            {applicationHistory.length > 0 && (
                <section className="event-participant-section">
                    <div className="event-participant-section-title">
                        <h2>처리 내역</h2>
                        <span>
                            {applicationHistory.length}명
                        </span>
                    </div>

                    {applicationHistory.map(
                        (participant) => (
                            <ParticipantItem
                                key={
                                    participant
                                        .event_participant_id
                                }
                                participant={participant}
                                isProcessing={false}
                                onDecision={
                                    handleDecision
                                }
                                onAttendanceChange={handleAttendanceChange}
                            />
                        )
                    )}
                </section>
            )}
        </main>
    );
}

export default ClubEventParticipants;