import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import {
    FiActivity,
    FiAlertCircle,
    FiBarChart2,
    FiCheckCircle,
    FiClipboard,
    FiRefreshCw,
    FiSave,
    FiUser
} from "react-icons/fi";

import {
    getClubActivityResults,
    getClubParticipationRisks,
    saveClubActivityResults
} from "../../api/clubApi";

import "./ClubParticipationRisk.css";


const RESULT_LABELS = {
    attended: "실제 참석",
    cancelled: "사전 취소",
    no_show: "노쇼",
    not_eligible: "참여 대상 아님"
};


const GRADE_CLASS_NAMES = {
    정상: "normal",
    관찰: "observe",
    "관리 필요": "manage",
    고위험: "high"
};


function formatDate(value) {
    if (!value) {
        return "";
    }

    const parsed = new Date(`${value}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat(
        "ko-KR",
        {
            year: "numeric",
            month: "short",
            day: "numeric",
            weekday: "short"
        }
    ).format(parsed);
}


function formatPercent(value) {
    if (value === null || value === undefined) {
        return "-";
    }

    return `${Math.round(Number(value) * 100)}%`;
}


function getInitial(person) {
    return (
        person.nickname
        || person.name
        || "?"
    ).slice(0, 1);
}


function ClubParticipationRisk({ clubId }) {
    const [workspace, setWorkspace] = useState({
        members: [],
        events: []
    });
    const [riskResult, setRiskResult] = useState({
        risks: [],
        total: 0,
        analyzed_count: 0,
        insufficient_data_count: 0,
        observe_count: 0,
        management_required_count: 0,
        high_risk_count: 0,
        minimum_eligible_results: 4
    });
    const [selectedEventId, setSelectedEventId] =
        useState("");
    const [draftResults, setDraftResults] =
        useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage("");

        try {
            const [workspaceResponse, riskResponse] =
                await Promise.all([
                    getClubActivityResults(clubId),
                    getClubParticipationRisks(clubId)
                ]);

            const nextWorkspace = {
                members: workspaceResponse.members || [],
                events: workspaceResponse.events || []
            };

            setWorkspace(nextWorkspace);
            setRiskResult(riskResponse);

            setSelectedEventId((currentValue) => {
                const stillExists = nextWorkspace.events.some(
                    (event) =>
                        String(event.event_id)
                        === String(currentValue)
                );

                if (stillExists) {
                    return currentValue;
                }

                return nextWorkspace.events[0]
                    ? String(nextWorkspace.events[0].event_id)
                    : "";
            });
        } catch (error) {
            setErrorMessage(
                error.message
                || "참여 분석 정보를 불러오지 못했습니다."
            );
        } finally {
            setIsLoading(false);
        }
    }, [clubId]);


    useEffect(() => {
        // 최초 진입 시 서버 상태와 동기화한다.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadData();
    }, [loadData]);


    const selectedEvent = useMemo(
        () => workspace.events.find(
            (event) =>
                String(event.event_id)
                === String(selectedEventId)
        ) || null,
        [workspace.events, selectedEventId]
    );


    useEffect(() => {
        // 일정 전환 시 해당 일정의 저장값으로 입력 폼을 초기화한다.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDraftResults(
            selectedEvent?.results || {}
        );
    }, [selectedEvent]);


    const recordedCount = useMemo(
        () => workspace.members.filter(
            (member) => Boolean(
                draftResults[member.user_id]
            )
        ).length,
        [workspace.members, draftResults]
    );


    const fillAll = (result) => {
        setDraftResults(
            Object.fromEntries(
                workspace.members.map(
                    (member) => [
                        member.user_id,
                        result
                    ]
                )
            )
        );
    };


    const handleSave = async () => {
        if (!selectedEvent) {
            return;
        }

        const results = workspace.members
            .filter((member) =>
                Boolean(draftResults[member.user_id])
            )
            .map((member) => ({
                user_id: member.user_id,
                result: draftResults[member.user_id]
            }));

        if (results.length === 0) {
            window.alert("저장할 활동 결과를 선택해주세요.");
            return;
        }

        setIsSaving(true);
        setErrorMessage("");

        try {
            const response = await saveClubActivityResults(
                clubId,
                selectedEvent.event_id,
                results
            );

            window.alert(response.message);
            await loadData();
        } catch (error) {
            setErrorMessage(
                error.message
                || "활동 결과를 저장하지 못했습니다."
            );
        } finally {
            setIsSaving(false);
        }
    };


    if (isLoading) {
        return (
            <section className="club-risk-state">
                <FiActivity />
                <strong>참여 데이터를 분석하고 있습니다.</strong>
            </section>
        );
    }


    return (
        <section className="club-risk-page">
            <div className="club-risk-intro">
                <div>
                    <span className="club-risk-eyebrow">
                        H4 참여 저하 조기 탐지
                    </span>

                    <h2>회원 참여 위험 분석</h2>

                    <p>
                        실제 참석·취소·노쇼 기록을 바탕으로
                        운영자가 먼저 살펴볼 회원을 안내합니다.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadData}
                    aria-label="참여 분석 새로고침"
                >
                    <FiRefreshCw />
                    새로고침
                </button>
            </div>

            {errorMessage && (
                <p className="club-risk-error">
                    {errorMessage}
                </p>
            )}

            <div className="club-risk-summary">
                <div>
                    <span>분석 완료</span>
                    <strong>{riskResult.analyzed_count}</strong>
                    <small>명</small>
                </div>
                <div>
                    <span>관찰·관리</span>
                    <strong className="observe">
                        {
                            riskResult.observe_count
                            + riskResult.management_required_count
                        }
                    </strong>
                    <small>명</small>
                </div>
                <div>
                    <span>고위험</span>
                    <strong className="high">
                        {riskResult.high_risk_count}
                    </strong>
                    <small>명</small>
                </div>
            </div>

            <section className="club-risk-recorder">
                <div className="club-risk-section-heading">
                    <div>
                        <FiClipboard />
                        <div>
                            <h3>지난 일정 결과 기록</h3>
                            <p>
                                참석 의사와 별개인 실제 결과를
                                일정 종료 후 기록해주세요.
                            </p>
                        </div>
                    </div>
                </div>

                {workspace.events.length === 0 ? (
                    <div className="club-risk-empty compact">
                        <FiClipboard />
                        <strong>기록할 지난 일정이 없습니다.</strong>
                        <p>
                            종료된 일정이 생기면 이곳에서
                            실제 활동 결과를 입력할 수 있습니다.
                        </p>
                    </div>
                ) : (
                    <>
                        <label className="club-risk-event-select">
                            <span>일정 선택</span>
                            <select
                                value={selectedEventId}
                                onChange={(event) =>
                                    setSelectedEventId(
                                        event.target.value
                                    )
                                }
                            >
                                {workspace.events.map((event) => (
                                    <option
                                        key={event.event_id}
                                        value={event.event_id}
                                    >
                                        {formatDate(event.event_date)} · {event.title}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <div className="club-risk-recorder-toolbar">
                            <span>
                                {recordedCount}/{workspace.members.length}명 기록
                            </span>

                            <div>
                                <button
                                    type="button"
                                    onClick={() => fillAll("attended")}
                                >
                                    전체 참석
                                </button>
                                <button
                                    type="button"
                                    onClick={() => fillAll("not_eligible")}
                                >
                                    전체 대상 아님
                                </button>
                            </div>
                        </div>

                        <div className="club-risk-result-list">
                            {workspace.members.map((member) => (
                                <div
                                    key={member.user_id}
                                    className="club-risk-result-row"
                                >
                                    <div className="club-risk-avatar">
                                        {member.profile_image ? (
                                            <img
                                                src={member.profile_image}
                                                alt=""
                                            />
                                        ) : (
                                            <span>{getInitial(member)}</span>
                                        )}
                                    </div>

                                    <div className="club-risk-member-name">
                                        <strong>{member.nickname}</strong>
                                        <span>{member.name}</span>
                                    </div>

                                    <select
                                        value={
                                            draftResults[member.user_id]
                                            || ""
                                        }
                                        aria-label={`${member.nickname} 활동 결과`}
                                        onChange={(event) =>
                                            setDraftResults(
                                                (current) => ({
                                                    ...current,
                                                    [member.user_id]:
                                                        event.target.value
                                                })
                                            )
                                        }
                                    >
                                        <option value="">미기록</option>
                                        {Object.entries(RESULT_LABELS).map(
                                            ([value, label]) => (
                                                <option
                                                    key={value}
                                                    value={value}
                                                >
                                                    {label}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            className="club-risk-save"
                            disabled={isSaving}
                            onClick={handleSave}
                        >
                            <FiSave />
                            {isSaving ? "저장 중" : "활동 결과 저장"}
                        </button>
                    </>
                )}
            </section>

            <section className="club-risk-analysis">
                <div className="club-risk-section-heading">
                    <div>
                        <FiBarChart2 />
                        <div>
                            <h3>AI 분석 결과</h3>
                            <p>
                                최소 {riskResult.minimum_eligible_results}회의
                                참여 대상 기록부터 분석합니다.
                            </p>
                        </div>
                    </div>
                </div>

                {riskResult.risks.length === 0 ? (
                    <div className="club-risk-empty">
                        <FiUser />
                        <strong>분석할 활동 회원이 없습니다.</strong>
                    </div>
                ) : (
                    <div className="club-risk-card-list">
                        {riskResult.risks.map((risk) => {
                            const isAnalyzed =
                                risk.analysis_status === "analyzed";
                            const gradeClass = isAnalyzed
                                ? GRADE_CLASS_NAMES[risk.risk_grade]
                                : "waiting";

                            return (
                                <article
                                    key={risk.user_id}
                                    className={`club-risk-card ${gradeClass}`}
                                >
                                    <div className="club-risk-card-profile">
                                        <div className="club-risk-avatar">
                                            {risk.profile_image ? (
                                                <img
                                                    src={risk.profile_image}
                                                    alt=""
                                                />
                                            ) : (
                                                <span>{getInitial(risk)}</span>
                                            )}
                                        </div>

                                        <div>
                                            <strong>{risk.nickname}</strong>
                                            <span>{risk.name}</span>
                                        </div>

                                        <span className="club-risk-grade">
                                            {isAnalyzed
                                                ? risk.risk_grade
                                                : "분석 대기"}
                                        </span>
                                    </div>

                                    {!isAnalyzed ? (
                                        <div className="club-risk-waiting">
                                            <FiAlertCircle />
                                            <p>
                                                참여 대상 기록 {risk.eligible_result_count}회 ·
                                                {" "}{riskResult.minimum_eligible_results - risk.eligible_result_count}회 더 필요
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="club-risk-score-row">
                                                <div>
                                                    <span>위험 지수</span>
                                                    <strong>
                                                        {Math.round(risk.risk_score)}
                                                        <small>/100</small>
                                                    </strong>
                                                </div>
                                                <div>
                                                    <span>이전 4회</span>
                                                    <strong>
                                                        {formatPercent(
                                                            risk.previous_attendance_rate
                                                        )}
                                                    </strong>
                                                </div>
                                                <div>
                                                    <span>최근 4회</span>
                                                    <strong>
                                                        {formatPercent(
                                                            risk.recent_attendance_rate
                                                        )}
                                                    </strong>
                                                </div>
                                            </div>

                                            <p className="club-risk-detected">
                                                <FiActivity />
                                                {risk.detected_risk}
                                            </p>

                                            <p className="club-risk-action">
                                                {risk.operator_action}
                                            </p>

                                            {risk.confirmation_questions.length > 0 && (
                                                <div className="club-risk-questions">
                                                    <strong>확인 질문</strong>
                                                    {risk.confirmation_questions.map(
                                                        (question) => (
                                                            <p key={question}>
                                                                {question}
                                                            </p>
                                                        )
                                                    )}
                                                </div>
                                            )}

                                            {risk.risk_grade === "정상" && (
                                                <p className="club-risk-normal-note">
                                                    <FiCheckCircle />
                                                    현재 우선 개입이 필요한 신호가 없습니다.
                                                </p>
                                            )}
                                        </>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            <p className="club-risk-disclaimer">
                위험 지수는 이탈 확률이 아니라 운영 우선순위를 위한
                설명 가능한 참고 지표입니다.
            </p>
        </section>
    );
}


export default ClubParticipationRisk;
