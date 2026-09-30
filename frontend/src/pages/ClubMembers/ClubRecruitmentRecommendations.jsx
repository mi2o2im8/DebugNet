import {
    useCallback,
    useEffect,
    useState
} from "react";

import {
    FiAlertCircle,
    FiRefreshCw,
    FiTarget,
    FiUser
} from "react-icons/fi";

import {
    getClubRecruitmentRecommendations
} from "../../api/clubApi";

import "./ClubRecruitmentRecommendations.css";


const AXIS_LABELS = {
    schedule: "일정",
    skill: "실력",
    purpose: "목적",
    atmosphere: "분위기",
    activity_frequency: "활동 빈도",
    cost: "비용"
};


const ACTION_CLASS_NAMES = {
    "최우선 모집": "highest",
    "우선 모집": "priority",
    "일반 후보": "general",
    "체험 제안": "trial",
    "후순위": "low"
};


function getInitial(candidate) {
    return (candidate.nickname || "?").slice(0, 1);
}


function ClubRecruitmentRecommendations({ clubId }) {
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const loadRecommendations = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage("");

        try {
            const response =
                await getClubRecruitmentRecommendations(
                    clubId,
                    10
                );

            setResult(response);
        } catch (error) {
            setErrorMessage(
                error.message
                || "모집 추천 결과를 불러오지 못했습니다."
            );
        } finally {
            setIsLoading(false);
        }
    }, [clubId]);

    useEffect(() => {
        loadRecommendations();
    }, [loadRecommendations]);

    if (isLoading) {
        return (
            <section className="club-recruitment-state">
                <FiTarget />
                <strong>모집 후보를 분석하고 있습니다.</strong>
                <p>회원 조건과 동호회 운영 정보를 비교합니다.</p>
            </section>
        );
    }

    if (errorMessage) {
        return (
            <section className="club-recruitment-state error">
                <FiAlertCircle />
                <strong>{errorMessage}</strong>
                <button
                    type="button"
                    onClick={loadRecommendations}
                >
                    다시 시도
                </button>
            </section>
        );
    }

    const recommendations = result?.recommendations || [];

    return (
        <section className="club-recruitment-section">
            <div className="club-recruitment-intro">
                <div>
                    <span className="club-recruitment-eyebrow">
                        <FiTarget />
                        H1 모집 대상 추천
                    </span>

                    <h2>우리 동호회와 맞는 회원</h2>

                    <p>
                        아직 가입 신청하지 않은 사용자 가운데
                        운영 조건과의 적합도가 높은 순서입니다.
                    </p>
                </div>

                <button
                    type="button"
                    className="club-recruitment-refresh"
                    onClick={loadRecommendations}
                    aria-label="모집 추천 새로고침"
                >
                    <FiRefreshCw />
                    새로고침
                </button>
            </div>

            <div className="club-recruitment-summary">
                <div>
                    <span>분석 대상</span>
                    <strong>{result.candidate_pool_count}</strong>
                    <small>명</small>
                </div>

                <div>
                    <span>조건 통과</span>
                    <strong>{result.eligible_count}</strong>
                    <small>명</small>
                </div>

                <div>
                    <span>추천 표시</span>
                    <strong>{result.returned_count}</strong>
                    <small>명</small>
                </div>
            </div>

            <div className="club-recruitment-notice">
                <FiAlertCircle />
                <p>
                    현재 MVP는 운영자 확인용 추천 미리보기입니다.
                    모집 제안 수신 동의 필터와 제안 발송 기능은
                    아직 포함하지 않으며,
                    이동 조건은 활동 지역 일치를 기준으로 판단합니다.
                </p>
            </div>

            {recommendations.length === 0 ? (
                <div className="club-recruitment-empty">
                    <FiUser />
                    <strong>조건을 통과한 모집 후보가 없습니다.</strong>
                    <p>
                        종목, 정기 일정, 활동 지역 또는 모집 조건을
                        확인해주세요.
                    </p>
                </div>
            ) : (
                <div className="club-recruitment-list">
                    {recommendations.map((candidate) => (
                        <article
                            className="club-recruitment-card"
                            key={candidate.user_id}
                        >
                            <div className="club-recruitment-profile">
                                <span className="club-recruitment-rank">
                                    {candidate.rank}
                                </span>

                                <div className="club-recruitment-avatar">
                                    {candidate.profile_image ? (
                                        <img
                                            src={candidate.profile_image}
                                            alt=""
                                        />
                                    ) : (
                                        <span>{getInitial(candidate)}</span>
                                    )}
                                </div>

                                <div className="club-recruitment-name">
                                    <strong>{candidate.nickname}</strong>
                                    <span>
                                        데이터 충족률 {candidate.data_coverage}%
                                    </span>
                                </div>

                                <div className="club-recruitment-score">
                                    <strong>
                                        {Math.round(
                                            candidate.direct_match_score
                                        )}
                                    </strong>
                                    <span>점</span>
                                </div>
                            </div>

                            <div className="club-recruitment-result-row">
                                <span
                                    className={
                                        "club-recruitment-action "
                                        + (
                                            ACTION_CLASS_NAMES[
                                                candidate.action
                                            ] || "general"
                                        )
                                    }
                                >
                                    {candidate.action}
                                </span>

                                {candidate.partial_mismatch_axes.length > 0 && (
                                    <small>
                                        확인: {candidate
                                            .partial_mismatch_axes.join(", ")}
                                    </small>
                                )}

                                {candidate.severe_mismatch_axes.length > 0 && (
                                    <small>
                                        불일치: {candidate
                                            .severe_mismatch_axes.join(", ")}
                                    </small>
                                )}
                            </div>

                            <div className="club-recruitment-axes">
                                {Object.entries(
                                    candidate.axis_scores
                                ).map(([axis, score]) => (
                                    <div key={axis}>
                                        <span>{AXIS_LABELS[axis] || axis}</span>
                                        <strong>{score}</strong>
                                    </div>
                                ))}
                            </div>

                            {candidate.missing_axes.length > 0 && (
                                <p className="club-recruitment-missing">
                                    미입력 정보: {candidate
                                        .missing_axes.join(", ")}
                                </p>
                            )}
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}


export default ClubRecruitmentRecommendations;
