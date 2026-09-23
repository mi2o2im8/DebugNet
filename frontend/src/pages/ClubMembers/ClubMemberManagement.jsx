import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import {
    useNavigate,
    useParams
} from "react-router-dom";

import {
    FiArrowLeft,
    FiCheck,
    FiChevronDown,
    FiChevronRight,
    FiChevronUp,
    FiClock,
    FiShield,
    FiUser,
    FiUsers,
    FiX
} from "react-icons/fi";

import {
    decideClubApplication,
    getClubApplications,
    getClubMembers,
} from "../../api/clubApi";

import "./ClubMemberManagement.css";


const APPLICATION_TABS = [
    {
        status: "pending",
        label: "승인 대기",
        icon: FiClock
    },
    {
        status: "approved",
        label: "승인 완료",
        icon: FiCheck
    },
    {
        status: "rejected",
        label: "거절 내역",
        icon: FiX
    }
];


const APPLICATION_STATUS_LABELS = {
    pending: "승인 대기",
    approved: "승인 완료",
    rejected: "승인 거절"
};


const MEMBER_ROLE_LABELS = {
    owner: "동호회장",
    manager: "운영진",
    member: "일반 회원"
};


const MEMBER_STATUS_LABELS = {
    active: "활동 중",
    inactive: "비활성",
    suspended: "활동 정지"
};


const JOIN_SOURCE_LABELS = {
    club_created: "동호회 개설",
    application: "가입 신청",
    invitation: "운영진 초대"
};


function formatDateTime(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
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


function getProfileInitial(person) {
    return (
        person.nickname
        || person.name
        || "?"
    ).slice(0, 1);
}


function ClubMemberManagement() {
    const { clubId } = useParams();
    const navigate = useNavigate();

    const [activeSection, setActiveSection] =
        useState("applications");

    const [applications, setApplications] =
        useState([]);

    const [members, setMembers] =
        useState([]);

    const [activeStatus, setActiveStatus] =
        useState("pending");

    const [
        expandedApplicationIds,
        setExpandedApplicationIds
    ] = useState(() => new Set());

    const [
        processingApplicationId,
        setProcessingApplicationId
    ] = useState(null);

    const [isLoading, setIsLoading] =
        useState(true);

    const [errorMessage, setErrorMessage] =
        useState("");


    // -----------------------------------------------------
    // 가입 신청 및 현재 회원 목록 조회
    // -----------------------------------------------------
    const loadManagementData = useCallback(
        async () => {
            setIsLoading(true);
            setErrorMessage("");

            try {
                const [
                    applicationResult,
                    memberResult
                ] = await Promise.all([
                    getClubApplications(
                        clubId,
                        "all"
                    ),
                    getClubMembers(clubId)
                ]);

                setApplications(
                    applicationResult.applications
                    || []
                );

                setMembers(
                    memberResult.members
                    || []
                );

            } catch (error) {
                setErrorMessage(
                    error.message
                    || "회원 관리 정보를 불러오지 못했습니다."
                );
            } finally {
                setIsLoading(false);
            }
        },
        [clubId]
    );


    useEffect(() => {
        loadManagementData();
    }, [loadManagementData]);


    // -----------------------------------------------------
    // 가입 신청 상태별 집계
    // -----------------------------------------------------
    const applicationCounts = useMemo(
        () => ({
            pending: applications.filter(
                (application) =>
                    application.status === "pending"
            ).length,

            approved: applications.filter(
                (application) =>
                    application.status === "approved"
            ).length,

            rejected: applications.filter(
                (application) =>
                    application.status === "rejected"
            ).length
        }),
        [applications]
    );


    const filteredApplications = useMemo(
        () => applications.filter(
            (application) =>
                application.status === activeStatus
        ),
        [
            applications,
            activeStatus
        ]
    );


    // -----------------------------------------------------
    // 현재 회원 상태별 집계
    // -----------------------------------------------------
    const memberCounts = useMemo(
        () => ({
            total: members.length,

            active: members.filter(
                (member) =>
                    member.status === "active"
            ).length,

            managementRequired: members.filter(
                (member) =>
                    member.status === "inactive"
                    || member.status === "suspended"
            ).length
        }),
        [members]
    );


    // -----------------------------------------------------
    // 신청서 상세 열기·닫기
    // -----------------------------------------------------
    const toggleApplicationDetail = (
        applicationId
    ) => {
        setExpandedApplicationIds(
            (currentIds) => {
                const nextIds =
                    new Set(currentIds);

                if (nextIds.has(applicationId)) {
                    nextIds.delete(applicationId);
                } else {
                    nextIds.add(applicationId);
                }

                return nextIds;
            }
        );
    };


    // -----------------------------------------------------
    // 가입 신청 승인·거절
    // -----------------------------------------------------
    const handleDecision = async (
        application,
        decision
    ) => {
        if (processingApplicationId !== null) {
            return;
        }

        const isApprove =
            decision === "approve";

        const confirmed = window.confirm(
            isApprove
                ? (
                    `${application.nickname}님의 `
                    + "가입 신청을 승인할까요?"
                )
                : (
                    `${application.nickname}님의 `
                    + "가입 신청을 거절할까요?"
                )
        );

        if (!confirmed) {
            return;
        }

        setProcessingApplicationId(
            application.application_id
        );

        setErrorMessage("");

        try {
            const result =
                await decideClubApplication(
                    clubId,
                    application.application_id,
                    decision
                );

            window.alert(result.message);

            await loadManagementData();
        } catch (error) {
            setErrorMessage(
                error.message
                || "가입 신청을 처리하지 못했습니다."
            );
        } finally {
            setProcessingApplicationId(null);
        }
    };

    if (isLoading) {
        return (
            <main className="club-member-state">
                회원 관리 정보를 불러오는 중입니다.
            </main>
        );
    }


    return (
        <main className="club-member-page">
            <header className="club-member-header">
                <button
                    type="button"
                    className="club-member-back-button"
                    aria-label="이전 화면"
                    onClick={() => navigate(-1)}
                >
                    <FiArrowLeft />
                </button>

                <div className="club-member-header-text">
                    <h1>회원 관리</h1>

                    <p>
                        가입 신청과 현재 회원을
                        관리할 수 있습니다.
                    </p>
                </div>
            </header>

            <nav
                className="club-member-primary-tabs"
                aria-label="회원 관리 메뉴"
            >
                <button
                    type="button"
                    className={
                        activeSection === "applications"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setActiveSection("applications")
                    }
                >
                    <FiClock />

                    <span>가입 신청</span>

                    <strong>
                        {applicationCounts.pending}
                    </strong>
                </button>

                <button
                    type="button"
                    className={
                        activeSection === "members"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setActiveSection("members")
                    }
                >
                    <FiUsers />

                    <span>현재 회원</span>

                    <strong>
                        {memberCounts.total}
                    </strong>
                </button>
            </nav>

            {errorMessage && (
                <p className="club-member-error">
                    {errorMessage}
                </p>
            )}

            {activeSection === "applications" ? (
                <>
                    <section className="club-member-summary">
                        <div>
                            <span>전체 신청</span>

                            <strong>
                                {
                                    applicationCounts.pending
                                    + applicationCounts.approved
                                    + applicationCounts.rejected
                                }
                            </strong>
                        </div>

                        <div>
                            <span>승인 대기</span>

                            <strong className="pending">
                                {applicationCounts.pending}
                            </strong>
                        </div>

                        <div>
                            <span>승인 완료</span>

                            <strong className="approved">
                                {applicationCounts.approved}
                            </strong>
                        </div>
                    </section>

                    <nav
                        className="club-member-tabs"
                        aria-label="가입 신청 상태"
                    >
                        {APPLICATION_TABS.map(
                            (tab) => {
                                const Icon = tab.icon;

                                const isActive =
                                    activeStatus
                                    === tab.status;

                                return (
                                    <button
                                        key={tab.status}
                                        type="button"
                                        className={
                                            isActive
                                                ? "active"
                                                : ""
                                        }
                                        onClick={() =>
                                            setActiveStatus(
                                                tab.status
                                            )
                                        }
                                    >
                                        <Icon />

                                        <span>
                                            {tab.label}
                                        </span>

                                        <strong>
                                            {
                                                applicationCounts[
                                                    tab.status
                                                ]
                                            }
                                        </strong>
                                    </button>
                                );
                            }
                        )}
                    </nav>

                    <section className="club-member-list">
                        {
                            filteredApplications.length
                            === 0
                                ? (
                                    <div className="club-member-empty">
                                        <FiUser />

                                        <strong>
                                            {
                                                activeStatus
                                                === "pending"
                                                    ? "대기 중인 가입 신청이 없습니다."
                                                    : (
                                                        activeStatus
                                                        === "approved"
                                                            ? "승인한 가입 신청이 없습니다."
                                                            : "거절한 가입 신청이 없습니다."
                                                    )
                                            }
                                        </strong>

                                        <p>
                                            새로운 신청이나 처리 내역이
                                            생기면 이곳에 표시됩니다.
                                        </p>
                                    </div>
                                )
                                : filteredApplications.map(
                                    (application) => {
                                        const isExpanded =
                                            expandedApplicationIds
                                                .has(
                                                    application
                                                        .application_id
                                                );

                                        const isProcessing =
                                            processingApplicationId
                                            === application
                                                .application_id;

                                        return (
                                            <article
                                                key={
                                                    application
                                                        .application_id
                                                }
                                                className={
                                                    "club-member-card "
                                                    + application.status
                                                }
                                            >
                                                <div className="club-member-profile">
                                                    <div className="club-member-avatar">
                                                        {
                                                            application
                                                                .profile_image
                                                                ? (
                                                                    <img
                                                                        src={
                                                                            application
                                                                                .profile_image
                                                                        }
                                                                        alt=""
                                                                    />
                                                                )
                                                                : (
                                                                    <span>
                                                                        {
                                                                            getProfileInitial(
                                                                                application
                                                                            )
                                                                        }
                                                                    </span>
                                                                )
                                                        }
                                                    </div>

                                                    <div className="club-member-identity">
                                                        <strong>
                                                            {
                                                                application
                                                                    .nickname
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                application
                                                                    .name
                                                            }
                                                        </span>

                                                        <small>
                                                            신청일{" "}
                                                            {
                                                                formatDateTime(
                                                                    application
                                                                        .created_at
                                                                )
                                                            }
                                                        </small>
                                                    </div>

                                                    <span
                                                        className={
                                                            "club-member-status "
                                                            + application
                                                                .status
                                                        }
                                                    >
                                                        {
                                                            APPLICATION_STATUS_LABELS[
                                                                application
                                                                    .status
                                                            ]
                                                        }
                                                    </span>
                                                </div>

                                                <button
                                                    type="button"
                                                    className="club-member-detail-toggle"
                                                    onClick={() =>
                                                        toggleApplicationDetail(
                                                            application
                                                                .application_id
                                                        )
                                                    }
                                                >
                                                    <span>
                                                        신청서 보기
                                                    </span>

                                                    {
                                                        isExpanded
                                                            ? <FiChevronUp />
                                                            : <FiChevronDown />
                                                    }
                                                </button>

                                                {isExpanded && (
                                                    <div className="club-member-detail">
                                                        <section>
                                                            <h2>
                                                                자기소개 및 가입 이유
                                                            </h2>

                                                            <p className="club-member-message">
                                                                {
                                                                    application
                                                                        .application_message
                                                                    || "작성된 내용이 없습니다."
                                                                }
                                                            </p>
                                                        </section>

                                                        {
                                                            (
                                                                application
                                                                    .answers
                                                                || []
                                                            ).length > 0
                                                            && (
                                                                <section>
                                                                    <h2>
                                                                        추가 질문
                                                                    </h2>

                                                                    <div className="club-member-answers">
                                                                        {
                                                                            application
                                                                                .answers
                                                                                .map(
                                                                                    (
                                                                                        answer
                                                                                    ) => (
                                                                                        <div
                                                                                            key={
                                                                                                answer
                                                                                                    .question_id
                                                                                            }
                                                                                        >
                                                                                            <strong>
                                                                                                {
                                                                                                    answer
                                                                                                        .question_text
                                                                                                }
                                                                                            </strong>

                                                                                            <p>
                                                                                                {
                                                                                                    answer
                                                                                                        .answer_text
                                                                                                }
                                                                                            </p>
                                                                                        </div>
                                                                                    )
                                                                                )
                                                                        }
                                                                    </div>
                                                                </section>
                                                            )
                                                        }

                                                        {
                                                            application
                                                                .decided_at
                                                            && (
                                                                <p className="club-member-decided-at">
                                                                    처리일{" "}
                                                                    {
                                                                        formatDateTime(
                                                                            application
                                                                                .decided_at
                                                                        )
                                                                    }
                                                                </p>
                                                            )
                                                        }
                                                    </div>
                                                )}

                                                {
                                                    application.status
                                                    === "pending"
                                                    && (
                                                        <div className="club-member-actions">
                                                            <button
                                                                type="button"
                                                                className="reject"
                                                                disabled={
                                                                    processingApplicationId
                                                                    !== null
                                                                }
                                                                onClick={() =>
                                                                    handleDecision(
                                                                        application,
                                                                        "reject"
                                                                    )
                                                                }
                                                            >
                                                                <FiX />
                                                                거절
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="approve"
                                                                disabled={
                                                                    processingApplicationId
                                                                    !== null
                                                                }
                                                                onClick={() =>
                                                                    handleDecision(
                                                                        application,
                                                                        "approve"
                                                                    )
                                                                }
                                                            >
                                                                <FiCheck />

                                                                {
                                                                    isProcessing
                                                                        ? "처리 중"
                                                                        : "승인"
                                                                }
                                                            </button>
                                                        </div>
                                                    )
                                                }
                                            </article>
                                        );
                                    }
                                )
                        }
                    </section>
                </>
            ) : (
                <>
                    <section className="club-member-summary">
                        <div>
                            <span>전체 회원</span>

                            <strong>
                                {memberCounts.total}
                            </strong>
                        </div>

                        <div>
                            <span>활동 중</span>

                            <strong className="approved">
                                {memberCounts.active}
                            </strong>
                        </div>

                        <div>
                            <span>관리 필요</span>

                            <strong className="pending">
                                {
                                    memberCounts
                                        .managementRequired
                                }
                            </strong>
                        </div>
                    </section>

                    <section className="club-member-list">
                        {members.length === 0 ? (
                            <div className="club-member-empty">
                                <FiUsers />

                                <strong>
                                    등록된 회원이 없습니다.
                                </strong>

                                <p>
                                    가입이 승인된 회원이 생기면
                                    이곳에 표시됩니다.
                                </p>
                            </div>
                        ) : (
                            members.map((member) => (
                                <article
                                    key={member.club_member_id}
                                    className={
                                        "club-member-card "
                                        + `member-${member.status}`
                                    }
                                >
                                    <button
                                        type="button"
                                        className="club-member-list-link"
                                        aria-label={
                                            `${member.nickname} 회원 상세 보기`
                                        }
                                        onClick={() =>
                                            navigate(
                                                `/clubs/${clubId}/manage/members/`
                                                + member.club_member_id
                                            )
                                        }
                                    >
                                        <div className="club-member-profile">
                                            <div className="club-member-avatar">
                                                {
                                                    member.profile_image
                                                        ? (
                                                            <img
                                                                src={member.profile_image}
                                                                alt=""
                                                            />
                                                        )
                                                        : (
                                                            <span>
                                                                {
                                                                    getProfileInitial(
                                                                        member
                                                                    )
                                                                }
                                                            </span>
                                                        )
                                                }
                                            </div>

                                            <div className="club-member-identity">
                                                <strong>
                                                    {member.nickname}
                                                </strong>

                                                <span>
                                                    {member.name}
                                                </span>

                                                <small>
                                                    가입 경로 ·{" "}
                                                    {
                                                        JOIN_SOURCE_LABELS[
                                                            member.join_source
                                                        ]
                                                        || member.join_source
                                                        || "정보 없음"
                                                    }
                                                </small>
                                            </div>

                                            <div className="club-member-list-side">
                                                <div className="club-member-badges">
                                                    <span
                                                        className={
                                                            "club-member-role "
                                                            + member.role
                                                        }
                                                    >
                                                        <FiShield />

                                                        {
                                                            MEMBER_ROLE_LABELS[
                                                                member.role
                                                            ]
                                                            || member.role
                                                        }
                                                    </span>

                                                    <span
                                                        className={
                                                            "club-member-state-badge "
                                                            + member.status
                                                        }
                                                    >
                                                        {
                                                            MEMBER_STATUS_LABELS[
                                                                member.status
                                                            ]
                                                            || member.status
                                                        }
                                                    </span>
                                                </div>

                                                <FiChevronRight
                                                    className={
                                                        "club-member-list-chevron"
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <div className="club-member-quick-stats">
                                            <div className="club-member-quick-stat">
                                                <span>투표 참여율</span>

                                                <strong>
                                                    {
                                                        member.vote_participation_rate
                                                        === null
                                                            ? "-"
                                                            : (
                                                                member
                                                                    .vote_participation_rate
                                                                + "%"
                                                            )
                                                    }
                                                </strong>

                                                <small>
                                                    {member.responded_vote_count}
                                                    /
                                                    {member.eligible_vote_count}회
                                                </small>
                                            </div>

                                            <div className="club-member-quick-stat">
                                                <span>경고</span>

                                                <strong
                                                    className={
                                                        member.warning_count > 0
                                                            ? "warning"
                                                            : ""
                                                    }
                                                >
                                                    {member.warning_count}
                                                </strong>

                                                <small>회</small>
                                            </div>
                                        </div>
                                    </button>
                                </article>
                            ))
                        )}
                    </section>
                </>
            )}
        </main>
    );
}


export default ClubMemberManagement;