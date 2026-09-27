// =========================================================
// ⭐ 신뢰점수 계산 (프론트 공용)
//
// 사용하는 곳: 신뢰점수 페이지, 마이페이지 신뢰점수 카드
// 데이터:      GET /api/users/me/activity
//              → activities (지난 일정), warnings (받은 경고)
//
// 점수 = 기본 점수 (투표 40% + 활동 60%) − 경고 감점
//
// 항목을 빼거나 비율을 바꾸고 싶으면
// 아래 TRUST_SCORE_RULES 값만 수정하면 된다.
// (경고 감점을 끄려면 useWarningPenalty 를 false 로)
//
// ※ 참여율 기준은 "내 활동" 페이지와 동일
//   - 집계 대상: 가입 후 열린 참석 투표가 있는 지난 일정
//   - 투표 참여율 = 응답 / 집계 대상
//   - 활동 참여율 = 참석 / 응답
// =========================================================

export const TRUST_SCORE_RULES = {

    // -----------------------------------------------------
    // ① 기본 점수 비율 (합이 1이 되도록)
    // -----------------------------------------------------
    voteWeight: 0.4,       // 투표 참여율
    activityWeight: 0.6,   // 활동 참여율


    // -----------------------------------------------------
    // ② 운영진 경고 감점
    //
    // 팀원이 만든 멤버 경고 기록(club_member_warnings) 사용
    // 나중에 빼려면 false 로 바꾸면 됨
    // -----------------------------------------------------
    useWarningPenalty: true,
    penaltyPerWarning: 5,  // 경고 1회당 감점
    maxWarningPenalty: 30, // 최대 감점


    // -----------------------------------------------------
    // ③ 최소 기록 수
    //
    // 집계 대상 일정이 이보다 적으면 점수 대신
    // "기록이 쌓이는 중"으로 표시
    // (가입하자마자 0점 / 100점이 나오는 것 방지)
    // -----------------------------------------------------
    minRecords: 3,


    // -----------------------------------------------------
    // ④ 최근 N회 참여 표시 개수
    // -----------------------------------------------------
    recentCount: 10,
};


// ---------------------------------------------------------
// 점수 → 한 줄 평가
// ---------------------------------------------------------
export const getTrustLevel = (score) => {

    if (score === null) return { label: "기록이 쌓이는 중", short: "측정 중" };
    if (score >= 90) return { label: "매우 좋은 신뢰도", short: "매우 좋음" };
    if (score >= 75) return { label: "좋은 신뢰도", short: "좋음" };
    if (score >= 60) return { label: "보통 신뢰도", short: "보통" };

    return { label: "조금 더 노력이 필요해요", short: "노력 필요" };
};


// ---------------------------------------------------------
// 경고 종류 이름 (팀원 ClubMemberDetail 과 동일)
// ---------------------------------------------------------
export const WARNING_TYPE_LABELS = {
    attendance: "출석 및 참여",
    rule_violation: "규칙 위반",
    manner: "매너 및 태도",
    other: "기타",
};


const ratio = (numerator, denominator) =>
    denominator > 0 ? numerator / denominator : 0;

const toPercentText = (numerator, denominator) =>
    denominator > 0 ? `${Math.round(ratio(numerator, denominator) * 100)}%` : "-";


// ---------------------------------------------------------
// ⭐ 신뢰점수 계산
// ---------------------------------------------------------
export const calculateTrustScore = (
    activities = [],
    warnings = [],
    rules = TRUST_SCORE_RULES,
) => {

    // 집계 대상 (최신순으로 들어옴)
    const eligible = activities.filter((activity) => activity.vote_eligible);

    const responded = eligible.filter((activity) => Boolean(activity.my_attendance));
    const attending = eligible.filter((activity) => activity.my_attendance === "참석");

    const voteRate = ratio(responded.length, eligible.length);
    const activityRate = ratio(attending.length, responded.length);


    // ① 기본 점수
    const baseScore =
        (voteRate * rules.voteWeight + activityRate * rules.activityWeight) * 100;


    // ② 경고 감점
    const warningCount = warnings.length;

    const warningPenalty = rules.useWarningPenalty
        ? Math.min(warningCount * rules.penaltyPerWarning, rules.maxWarningPenalty)
        : 0;


    // ③ 최소 기록 수
    const hasEnoughRecords = eligible.length >= rules.minRecords;

    const score = hasEnoughRecords
        ? Math.max(0, Math.min(100, Math.round(baseScore - warningPenalty)))
        : null;


    // ④ 최근 N회
    const recent = eligible.slice(0, rules.recentCount);

    const recentAttending = recent.filter(
        (activity) => activity.my_attendance === "참석"
    ).length;


    return {
        score,
        level: getTrustLevel(score),

        eligibleCount: eligible.length,
        respondedCount: responded.length,
        attendingCount: attending.length,

        voteRateText: toPercentText(responded.length, eligible.length),
        activityRateText: toPercentText(attending.length, responded.length),

        baseScore: Math.round(baseScore),
        warningCount,
        warningPenalty,

        recentTotal: recent.length,
        recentAttending,

        minRecords: rules.minRecords,
        useWarningPenalty: rules.useWarningPenalty,
    };
};