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
    FiAlertTriangle,
    FiArrowLeft,
    FiCalendar,
    FiCheckCircle,
    FiClock,
    FiMail,
    FiPhone,
    FiShield,
    FiUserMinus,
    FiXCircle
} from "react-icons/fi";

import {
    getClubMemberDetail,
    removeClubMember,
    updateClubMemberRole,
    updateClubMemberStatus
} from "../../api/clubApi";

import "./ClubMemberDetail.css";


const DETAIL_TABS = [
    {
        key: "basic",
        label: "기본 정보"
    },
    {
        key: "activities",
        label: "활동 내역"
    },
    {
        key: "votes",
        label: "투표 내역"
    },
    {
        key: "warnings",
        label: "경고 내역"
    }
];


const ROLE_LABELS = {
    owner: "동호회장",
    manager: "운영진",
    member: "일반 회원"
};


const STATUS_LABELS = {
    active: "활동 중",
    inactive: "비활성",
    suspended: "활동 정지"
};


const JOIN_SOURCE_LABELS = {
    club_created: "동호회 개설",
    application: "가입 신청",
    invitation: "운영진 초대"
};


const ATTENDANCE_LABELS = {
    attending: "참석",
    absent: "불참",
    undecided: "미정"
};


function formatDate(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return new Intl.DateTimeFormat(
        "ko-KR",
        {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    ).format(date);
}


function formatDateTime(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return new Intl.DateTimeFormat(
        "ko-KR",
        {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(date);
}


function ClubMemberDetail() {
    const {
        clubId,
        clubMemberId
    } = useParams();

    const navigate = useNavigate();

    const [member, setMember] =
        useState(null);

    const [activeTab, setActiveTab] =
        useState("basic");

    const [isLoading, setIsLoading] =
        useState(true);

    const [processingAction, setProcessingAction] =
        useState("");

    const [errorMessage, setErrorMessage] =
        useState("");


    const loadMemberDetail = useCallback(
        async () => {
            setErrorMessage("");

            try {
                const result =
                    await getClubMemberDetail(
                        clubId,
                        clubMemberId
                    );

                setMember(result);
            } catch (error) {
                setErrorMessage(
                    error.message
                    || "회원 정보를 불러오지 못했습니다."
                );
            } finally {
                setIsLoading(false);
            }
        },
        [
            clubId,
            clubMemberId
        ]
    );


    useEffect(() => {
        loadMemberDetail();
    }, [loadMemberDetail]);


    const handleRoleChange = async () => {
        if (
            !member
            || processingAction
        ) {
            return;
        }

        const nextRole = (
            member.role === "manager"
                ? "member"
                : "manager"
        );

        const actionLabel = (
            nextRole === "manager"
                ? "운영진으로 지정"
                : "일반 회원으로 변경"
        );

        if (
            !window.confirm(
                `${member.nickname}님을 `
                + `${actionLabel}할까요?`
            )
        ) {
            return;
        }

        setProcessingAction("role");
        setErrorMessage("");

        try {
            const result =
                await updateClubMemberRole(
                    clubId,
                    clubMemberId,
                    nextRole
                );

            window.alert(result.message);
            await loadMemberDetail();
        } catch (error) {
            setErrorMessage(
                error.message
                || "회원 역할을 변경하지 못했습니다."
            );
        } finally {
            setProcessingAction("");
        }
    };


    const handleStatusChange = async () => {
        if (
            !member
            || processingAction
        ) {
            return;
        }

        const nextStatus = (
            member.status === "suspended"
                ? "active"
                : "suspended"
        );

        const actionLabel = (
            nextStatus === "active"
                ? "활동 상태로 복구"
                : "활동 정지"
        );

        if (
            !window.confirm(
                `${member.nickname}님을 `
                + `${actionLabel}할까요?`
            )
        ) {
            return;
        }

        setProcessingAction("status");
        setErrorMessage("");

        try {
            const result =
                await updateClubMemberStatus(
                    clubId,
                    clubMemberId,
                    nextStatus
                );

            window.alert(result.message);
            await loadMemberDetail();
        } catch (error) {
            setErrorMessage(
                error.message
                || "회원 상태를 변경하지 못했습니다."
            );
        } finally {
            setProcessingAction("");
        }
    };


    const handleRemoveMember = async () => {
        if (
            !member
            || processingAction
        ) {
            return;
        }

        const confirmed = window.confirm(
            `${member.nickname}님을 동호회에서 `
            + "내보낼까요?\n\n"
            + "회원 목록에서 제외되며 다시 가입하려면 "
            + "가입 신청이 필요합니다."
        );

        if (!confirmed) {
            return;
        }

        setProcessingAction("remove");
        setErrorMessage("");

        try {
            const result =
                await removeClubMember(
                    clubId,
                    clubMemberId
                );

            window.alert(result.message);

            navigate(
                `/clubs/${clubId}/manage/members`,
                {
                    replace: true
                }
            );
        } catch (error) {
            setErrorMessage(
                error.message
                || "회원을 내보내지 못했습니다."
            );

            setProcessingAction("");
        }
    };


    if (isLoading) {
        return (
            <main className="club-member-detail-state">
                회원 정보를 불러오는 중입니다.
            </main>
        );
    }


    if (!member) {
        return (
            <main className="club-member-detail-state">
                <p>
                    {errorMessage
                        || "회원 정보를 찾을 수 없습니다."}
                </p>

                <button
                    type="button"
                    onClick={() => navigate(-1)}
                >
                    이전 화면으로
                </button>
            </main>
        );
    }


    return (
        <main className="club-member-detail-page">
            <header className="club-member-detail-header">
                <button
                    type="button"
                    aria-label="이전 화면"
                    onClick={() => navigate(-1)}
                >
                    <FiArrowLeft />
                </button>

                <h1>회원 상세</h1>
            </header>

            <section className="club-member-detail-profile">
                <div className="club-member-detail-avatar">
                    {member.profile_image ? (
                        <img
                            src={member.profile_image}
                            alt=""
                        />
                    ) : (
                        <span>
                            {
                                (
                                    member.nickname
                                    || member.name
                                    || "?"
                                ).slice(0, 1)
                            }
                        </span>
                    )}
                </div>

                <div className="club-member-detail-name">
                    <h2>{member.nickname}</h2>
                    <p>{member.name}</p>

                    <div>
                        <span className={`role ${member.role}`}>
                            {ROLE_LABELS[member.role]}
                        </span>

                        <span className={`status ${member.status}`}>
                            {STATUS_LABELS[member.status]}
                        </span>
                    </div>
                </div>
            </section>

            <section className="club-member-detail-summary">
                <div>
                    <span>투표 참여율</span>

                    <strong>
                        {
                            member.vote_participation_rate
                            === null
                                ? "-"
                                : `${member.vote_participation_rate}%`
                        }
                    </strong>

                    <small>
                        {member.responded_vote_count}
                        /{member.eligible_vote_count}회
                    </small>
                </div>

                <div>
                    <span>참석 일정</span>

                    <strong>
                        {member.attending_count}
                    </strong>

                    <small>회</small>
                </div>

                <div>
                    <span>경고</span>

                    <strong className="warning">
                        {member.warning_count}
                    </strong>

                    <small>회</small>
                </div>
            </section>

            {errorMessage && (
                <p className="club-member-detail-error">
                    {errorMessage}
                </p>
            )}

            <nav className="club-member-detail-tabs">
                {DETAIL_TABS.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        className={
                            activeTab === tab.key
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setActiveTab(tab.key)
                        }
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>

            <section className="club-member-detail-content">
                {activeTab === "basic" && (
                    <div className="club-member-detail-info">
                        <dl>
                            <div>
                                <dt>이름</dt>
                                <dd>{member.name}</dd>
                            </div>

                            <div>
                                <dt>닉네임</dt>
                                <dd>{member.nickname}</dd>
                            </div>

                            <div>
                                <dt>
                                    <FiMail />
                                    이메일
                                </dt>
                                <dd>{member.email || "-"}</dd>
                            </div>

                            <div>
                                <dt>
                                    <FiPhone />
                                    연락처
                                </dt>
                                <dd>{member.phone || "-"}</dd>
                            </div>

                            <div>
                                <dt>가입일</dt>
                                <dd>
                                    {formatDate(member.joined_at)}
                                </dd>
                            </div>

                            <div>
                                <dt>가입 경로</dt>
                                <dd>
                                    {
                                        JOIN_SOURCE_LABELS[
                                            member.join_source
                                        ]
                                        || member.join_source
                                        || "-"
                                    }
                                </dd>
                            </div>
                        </dl>

                        <section className="club-member-detail-bio">
                            <h3>소개</h3>

                            <p>
                                {member.bio
                                    || "작성된 소개가 없습니다."}
                            </p>
                        </section>
                    </div>
                )}

                {activeTab === "activities" && (
                    <div className="club-member-detail-history">
                        {member.activities.length === 0 ? (
                            <div className="empty">
                                <FiCalendar />
                                <p>등록된 활동 내역이 없습니다.</p>
                            </div>
                        ) : (
                            member.activities.map(
                                (activity) => (
                                    <article key={activity.event_id}>
                                        <div>
                                            <strong>
                                                {activity.event_title}
                                            </strong>

                                            <span>
                                                {
                                                    formatDate(
                                                        activity.event_date
                                                    )
                                                }
                                            </span>
                                        </div>

                                        <span
                                            className={
                                                "history-status "
                                                + activity
                                                    .attendance_status
                                            }
                                        >
                                            {
                                                ATTENDANCE_LABELS[
                                                    activity
                                                        .attendance_status
                                                ]
                                            }
                                        </span>
                                    </article>
                                )
                            )
                        )}
                    </div>
                )}

                {activeTab === "votes" && (
                    <div className="club-member-detail-history">
                        {member.votes.length === 0 ? (
                            <div className="empty">
                                <FiCheckCircle />
                                <p>참여 대상 투표가 없습니다.</p>
                            </div>
                        ) : (
                            member.votes.map((vote) => (
                                <article key={vote.vote_id}>
                                    <div>
                                        <strong>
                                            {vote.vote_title}
                                        </strong>

                                        <span>
                                            {vote.event_title}
                                        </span>

                                        <small>
                                            생성일{" "}
                                            {
                                                formatDateTime(
                                                    vote.created_at
                                                )
                                            }
                                        </small>
                                    </div>

                                    <span
                                        className={
                                            vote.has_responded
                                                ? "history-status attending"
                                                : "history-status absent"
                                        }
                                    >
                                        {
                                            vote.has_responded
                                                ? "참여"
                                                : "미참여"
                                        }
                                    </span>
                                </article>
                            ))
                        )}
                    </div>
                )}

                {activeTab === "warnings" && (
                    <div className="club-member-detail-history">
                        {member.warnings.length === 0 ? (
                            <div className="empty">
                                <FiAlertTriangle />
                                <p>등록된 경고 내역이 없습니다.</p>
                            </div>
                        ) : (
                            member.warnings.map((warning) => (
                                <article key={warning.warning_id}>
                                    <div>
                                        <strong>
                                            {warning.warning_type}
                                        </strong>

                                        <span>
                                            {warning.reason
                                                || "사유 없음"}
                                        </span>

                                        <small>
                                            {
                                                formatDateTime(
                                                    warning.created_at
                                                )
                                            }
                                        </small>
                                    </div>
                                </article>
                            ))
                        )}
                    </div>
                )}
            </section>

            {
                (
                    member.can_change_role
                    || member.can_change_status
                    || member.can_remove_member
                )
                && (
                    <section className="club-member-detail-management">
                        <h2>회원 관리</h2>

                        <div>
                            {member.can_change_role && (
                                <button
                                    type="button"
                                    className="role"
                                    disabled={Boolean(
                                        processingAction
                                    )}
                                    onClick={handleRoleChange}
                                >
                                    <FiShield />

                                    {
                                        member.role === "manager"
                                            ? "운영진 해제"
                                            : "운영진 지정"
                                    }
                                </button>
                            )}

                            {member.can_change_status && (
                                <button
                                    type="button"
                                    className={
                                        member.status
                                        === "suspended"
                                            ? "restore"
                                            : "suspend"
                                    }
                                    disabled={Boolean(
                                        processingAction
                                    )}
                                    onClick={handleStatusChange}
                                >
                                    {
                                        member.status
                                        === "suspended"
                                            ? <FiCheckCircle />
                                            : <FiClock />
                                    }

                                    {
                                        member.status
                                        === "suspended"
                                            ? "활동 복구"
                                            : "활동 정지"
                                    }
                                </button>
                            )}

                            {member.can_remove_member && (
                                <button
                                    type="button"
                                    className="remove"
                                    disabled={Boolean(
                                        processingAction
                                    )}
                                    onClick={handleRemoveMember}
                                >
                                    <FiUserMinus />
                                    동호회에서 내보내기
                                </button>
                            )}
                        </div>
                    </section>
                )
            }
        </main>
    );
}


export default ClubMemberDetail;