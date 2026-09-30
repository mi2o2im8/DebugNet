// 신뢰점수 페이지
//
// 점수 계산 규칙은 src/utils/trustScore.js 한 곳에서 관리
// (마이페이지 신뢰점수 카드와 같은 계산)

import { useEffect, useMemo, useState } from "react";

import PageHeader from "../../components/PageHeader/PageHeader";
import BottomNav from "../../components/BottomNav";

// ⭐ API
import { authenticatedRequest } from "../../api/apiClient";

// ⭐ 신뢰점수 계산
import {
    calculateTrustScore,
    TRUST_SCORE_RULES,
    WARNING_TYPE_LABELS,
} from "../../utils/trustScore";

import "./TrustScore.css";


// "2026-09-13T..." → "2026.09.13"
const formatWarningDate = (value) =>
    value ? String(value).slice(0, 10).replaceAll("-", ".") : "-";


function TrustScore() {

    // =========================================================
    // ⭐ API 데이터
    // =========================================================
    const [activities, setActivities] = useState([]);
    const [warnings, setWarnings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");


    useEffect(() => {

        let ignore = false;

        const fetchTrustData = async () => {

            try {

                const data = await authenticatedRequest(
                    "/api/users/me/activity",
                    { method: "GET" }
                );

                if (!ignore) {
                    setActivities(data.activities ?? []);
                    setWarnings(data.warnings ?? []);
                }

            } catch (error) {

                console.error("신뢰점수 조회 오류:", error);

                if (!ignore) setErrorMessage(error.message);

            } finally {

                if (!ignore) setLoading(false);

            }
        };

        fetchTrustData();

        return () => {
            ignore = true;
        };

    }, []);


    // =========================================================
    // ⭐ 점수 계산
    // =========================================================
    const trust = useMemo(
        () => calculateTrustScore(activities, warnings),
        [activities, warnings]
    );


    return (
        <div className="trust-score-page">
            <div className="trust-score-container">

                {/* ⭐ 헤더 */}
                <PageHeader title="신뢰점수" />


                {loading ? (

                    <p className="trust-message">
                        신뢰점수를 계산하는 중...
                    </p>

                ) : errorMessage ? (

                    <p className="trust-message">
                        신뢰점수를 불러오지 못했습니다.
                        <br />
                        {errorMessage}
                    </p>

                ) : (

                    <>
                        {/* ⭐ 신뢰점수 박스 */}
                        <div className="trust-score-box">

                            <div className="trust-score-number">
                                {trust.score ?? "-"}
                            </div>

                            <div className="trust-score-message">
                                {trust.level.label}
                            </div>

                            <div className="trust-score-gauge">
                                <div
                                    className="trust-score-gauge-fill"
                                    style={{ width: `${trust.score ?? 0}%` }}
                                />
                            </div>

                            {trust.score === null && (
                                <p className="trust-score-pending">
                                    투표가 열린 일정이 {trust.minRecords}개 이상 쌓이면
                                    점수가 계산돼요. (지금 {trust.eligibleCount}개)
                                </p>
                            )}

                        </div>


                        {/* ⭐ 신뢰 데이터 */}
                        <h3 className="trust-data-title">
                            신뢰 데이터
                        </h3>

                        {/* ---------------------------------------------
                            ⭐ 신뢰 데이터 항목
                            value 가 null 이면 "-" (아직 기록하지 않는 데이터)
                            나중에 데이터가 생기면 value 만 채우면 됨
                        --------------------------------------------- */}
                        <div className="trust-data-box">
                            {[
                                {
                                    label: "활동 참여율",
                                    value: trust.activityRateText,
                                },
                                {
                                    label: "투표 참여율",
                                    value: trust.voteRateText,
                                },
                                {
                                    label: `최근 ${TRUST_SCORE_RULES.recentCount}회 정상 참여`,
                                    value: trust.recentTotal > 0
                                        ? `${trust.recentAttending}회`
                                        : null,
                                },
                                {
                                    // 운영진 사후 출석 체크 기능이 생기면 연결
                                    label: "노쇼",
                                    value: null,
                                },
                                {
                                    // 응답 변경 기록이 생기면 연결
                                    label: "당일 취소",
                                    value: null,
                                },
                                {
                                    // 운영진 사후 출석 체크(지각) 기능이 생기면 연결
                                    label: "시간 준수율",
                                    value: null,
                                },
                                // ⭐ 운영진 경고 (나중에 빼려면 이 항목 주석 처리
                                //    + utils/trustScore.js 의 useWarningPenalty: false)
                                {
                                    label: "받은 경고",
                                    value: `${trust.warningCount}회`,
                                    warn: trust.warningCount > 0,
                                },
                            ].map((row) => (
                                <div className="trust-data-row" key={row.label}>
                                    <span>{row.label}</span>
                                    <strong
                                        className={
                                            row.value === null || row.value === "-"
                                                ? "empty"
                                                : row.warn
                                                    ? "warn"
                                                    : ""
                                        }
                                    >
                                        {row.value ?? "-"}
                                    </strong>
                                </div>
                            ))}
                        </div>


                        {/* ---------------------------------------------
                            ⭐ 경고 내역 (경고가 있을 때만)
                            나중에 빼려면 이 블록 주석 처리
                        --------------------------------------------- */}
                        {warnings.length > 0 && (
                            <>
                                <h3 className="trust-data-title">
                                    경고 내역
                                </h3>

                                <ul className="trust-warning-list">
                                    {warnings.map((warning) => (
                                        <li key={warning.warning_id}>
                                            <div className="trust-warning-top">
                                                <span className="trust-warning-type">
                                                    {WARNING_TYPE_LABELS[warning.warning_type] ?? "기타"}
                                                </span>
                                                <span className="trust-warning-date">
                                                    {formatWarningDate(warning.created_at)}
                                                </span>
                                            </div>

                                            <p className="trust-warning-club">
                                                {warning.club_name}
                                            </p>

                                            {warning.reason && (
                                                <p className="trust-warning-reason">
                                                    {warning.reason}
                                                </p>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}


                        {/* ⭐ 점수 계산 방법 */}
                        <div className="trust-guide">
                            <p className="trust-guide-title">
                                점수는 이렇게 계산돼요
                            </p>

                            <ul>
                                <li>
                                    투표 참여율 {Math.round(TRUST_SCORE_RULES.voteWeight * 100)}% +
                                    활동 참여율 {Math.round(TRUST_SCORE_RULES.activityWeight * 100)}%
                                    {" "}= 기본 점수 <b>{trust.baseScore}점</b>
                                </li>

                                {trust.useWarningPenalty && (
                                    <li>
                                        운영진 경고 1회당 −{TRUST_SCORE_RULES.penaltyPerWarning}점
                                        (최대 −{TRUST_SCORE_RULES.maxWarningPenalty}점)
                                    </li>
                                )}

                                <li>
                                    가입 후 열린 참석 투표만 계산하고,
                                    팀매칭 경기는 투표가 없어서 제외돼요.
                                </li>

                                <li>
                                    노쇼 · 당일 취소 · 시간 준수율은 아직 기록하지 않아서
                                    "-"로 표시돼요. 노쇼나 지각은 운영진이 남긴
                                    '출석 및 참여' 경고로 반영돼요.
                                </li>
                            </ul>
                        </div>
                    </>

                )}

            </div>


            <BottomNav />

        </div>
    );
}

export default TrustScore;
