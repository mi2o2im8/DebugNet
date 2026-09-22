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
    FiChevronUp,
    FiClock,
    FiUser,
    FiX
} from "react-icons/fi";

import {
    decideClubApplication,
    getClubApplications
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


const STATUS_LABELS = {
    pending: "승인 대기",
    approved: "승인 완료",
    rejected: "승인 거절"
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


function ClubMemberManagement() {
    const { clubId } = useParams();
    const navigate = useNavigate();

    const [applications, setApplications] =
        useState([]);

    const [activeStatus, setActiveStatus] =
        useState("pending");

    const [expandedApplicationIds, setExpandedApplicationIds] =
        useState(() => new Set());

    const [processingApplicationId, setProcessingApplicationId] =
        useState(null);

    const [isLoading, setIsLoading] =
        useState(true);

    const [errorMessage, setErrorMessage] =
        useState("");


    // -----------------------------------------------------
    // 가입 신청 전체 목록 조회
    // -----------------------------------------------------
    const loadApplications = useCallback(
        async () => {
            setIsLoading(true);
            setErrorMessage("");

            try {
                const result =
                    await getClubApplications(
                        clubId,
                        "all"
                    );

                setApplications(
                    result.applications || []
                );
            } catch (error) {
                setErrorMessage(
                    error.message ||
                    "가입 신청 목록을 불러오지 못했습니다."
                );
            } finally {
                setIsLoading(false);
            }
        },
        [clubId]
    );


    useEffect(() => {
        loadApplications();
    }, [loadApplications]);


    // -----------------------------------------------------
    // 상태별 신청 목록
    // -----------------------------------------------------
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
    // 상태별 신청 수
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

            await loadApplications();
        } catch (error) {
            setErrorMessage(
                error.message ||
                "가입 신청을 처리하지 못했습니다."
            );
        } finally {
            setProcessingApplicationId(null);
        }
    };


    if (isLoading) {
        return (
            <main className="club-member-state">
                가입 신청 목록을 불러오는 중입니다.
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
                    <p>가입 신청을 확인하고 처리할 수 있습니다.</p>
                </div>
            </header>

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
                {APPLICATION_TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive =
                        activeStatus === tab.status;

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

                            <span>{tab.label}</span>

                            <strong>
                                {
                                    applicationCounts[
                                        tab.status
                                    ]
                                }
                            </strong>
                        </button>
                    );
                })}
            </nav>

            {errorMessage && (
                <p className="club-member-error">
                    {errorMessage}
                </p>
            )}

            <section className="club-member-list">
                {filteredApplications.length === 0 ? (
                    <div className="club-member-empty">
                        <FiUser />

                        <strong>
                            {
                                activeStatus === "pending"
                                    ? "대기 중인 가입 신청이 없습니다."
                                    : (
                                        activeStatus === "approved"
                                            ? "승인한 가입 신청이 없습니다."
                                            : "거절한 가입 신청이 없습니다."
                                    )
                            }
                        </strong>

                        <p>
                            새로운 신청이나 처리 내역이 생기면
                            이곳에 표시됩니다.
                        </p>
                    </div>
                ) : (
                    filteredApplications.map(
                        (application) => {
                            const isExpanded =
                                expandedApplicationIds.has(
                                    application.application_id
                                );

                            const isProcessing =
                                processingApplicationId
                                === application.application_id;

                            const profileInitial = (
                                application.nickname
                                || application.name
                                || "?"
                            ).slice(0, 1);

                            return (
                                <article
                                    key={
                                        application.application_id
                                    }
                                    className={
                                        "club-member-card "
                                        + application.status
                                    }
                                >
                                    <div className="club-member-profile">
                                        <div className="club-member-avatar">
                                            {
                                                application.profile_image
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
                                                            {profileInitial}
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
                                                {application.name}
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
                                                + application.status
                                            }
                                        >
                                            {
                                                STATUS_LABELS[
                                                    application.status
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
                                                application.answers.length > 0
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
                                                application.decided_at
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
                                        application.status === "pending"
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
                )}
            </section>
        </main>
    );
}


export default ClubMemberManagement;