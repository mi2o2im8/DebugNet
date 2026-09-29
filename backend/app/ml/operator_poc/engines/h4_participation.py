
from pathlib import Path
import json
import math

import pandas as pd


# ============================================================
# Runtime Config
# ============================================================

PACKAGE_ROOT = (
    Path(__file__)
    .resolve()
    .parents[1]
)


CONFIG_PATH = (
    PACKAGE_ROOT
    / "config"
    / "h4_runtime_config.json"
)


with open(
    CONFIG_PATH,
    "r",
    encoding="utf-8"
) as f:

    H4_RUNTIME_CONFIG = (
        json.load(f)
    )


H4_RULES = (
    H4_RUNTIME_CONFIG[
        "runtime_rules"
    ]
)


# ============================================================
# Runtime Policy
# ============================================================

H4_ELIGIBLE_EVENTS = set(
    H4_RULES[
        "event_policy"
    ][
        "eligible_events"
    ]
)


H4_EXCLUDED_EVENTS = set(
    H4_RULES[
        "event_policy"
    ][
        "excluded_from_absence"
    ]
)


H4_SIGNAL_RULES = (
    H4_RULES[
        "signal_thresholds"
    ]
)


H4_DIMENSION_RULES = (
    H4_RULES[
        "dimension_formulas"
    ]
)


H4_AGGREGATION = (
    H4_RULES[
        "aggregation"
    ]
)


# ============================================================
# Utility
# ============================================================

def _safe_divide(
    numerator,
    denominator,
    default=0.0
):

    if denominator == 0:
        return float(default)

    return (
        float(numerator)
        /
        float(denominator)
    )


def _eligible_only(
    frame
):

    return frame[
        frame[
            "event_status"
        ].isin(
            H4_ELIGIBLE_EVENTS
        )
    ]


def _attendance_rate(
    frame
):

    eligible = (
        _eligible_only(
            frame
        )
    )


    if len(
        eligible
    ) == 0:

        return 0.0


    attended = int(
        (
            eligible[
                "event_status"
            ]
            ==
            "attended"
        ).sum()
    )


    return (
        attended
        /
        len(
            eligible
        )
    )


def _status_rate(
    frame,
    status
):

    eligible = (
        _eligible_only(
            frame
        )
    )


    if len(
        eligible
    ) == 0:

        return 0.0


    count = int(
        (
            eligible[
                "event_status"
            ]
            ==
            status
        ).sum()
    )


    return (
        count
        /
        len(
            eligible
        )
    )


# ============================================================
# Consecutive Behavior
#
# not_eligible은:
# - 결석으로 세지 않음
# - streak 계산에서도 제외
# ============================================================

def _consecutive_nonparticipation(
    frame
):

    eligible = (
        _eligible_only(
            frame
        )
    )


    count = 0


    for status in reversed(
        eligible[
            "event_status"
        ].tolist()
    ):

        if status in {
            "cancelled",
            "no_show",
        }:

            count += 1

        else:
            break


    return count


def _consecutive_no_show(
    frame
):

    eligible = (
        _eligible_only(
            frame
        )
    )


    count = 0


    for status in reversed(
        eligible[
            "event_status"
        ].tolist()
    ):

        if status == "no_show":

            count += 1

        else:
            break


    return count


# ============================================================
# Missed Eligible Opportunities Since Last Attendance
# ============================================================

def _missed_since_last_attendance(
    frame
):

    eligible = (
        _eligible_only(
            frame
        )
    )


    if len(
        eligible
    ) == 0:

        return 0


    statuses = (
        eligible[
            "event_status"
        ].tolist()
    )


    last_attended = None


    for idx in range(
        len(statuses) - 1,
        -1,
        -1
    ):

        if (
            statuses[idx]
            ==
            "attended"
        ):

            last_attended = idx
            break


    # 한 번도 참석하지 않은 경우:
    # 모든 eligible opportunity가 missed
    if last_attended is None:

        return len(
            statuses
        )


    return (
        len(statuses)
        -
        last_attended
        -
        1
    )


# ============================================================
# Feature Engineering
# ============================================================

def calculate_behavior_features(
    member_id,
    member_log,
    desired_monthly_frequency
):
    """
    최근 8개 시점 기준.

    previous 4 rows
    recent 4 rows

    각 window 안에서 not_eligible은
    attendance denominator에서 제외한다.
    """


    if member_log is None:

        member_log = pd.DataFrame(
            columns=[
                "회원_ID",
                "week",
                "event_status",
            ]
        )


    log = (
        member_log
        .copy()
    )


    if "week" in log.columns:

        log = (
            log
            .sort_values(
                "week",
                kind="stable"
            )
            .reset_index(
                drop=True
            )
        )


    recent4 = (
        log.tail(4)
    )


    previous4 = (
        log.iloc[
            max(
                0,
                len(log) - 8
            ):
            max(
                0,
                len(log) - 4
            )
        ]
    )


    previous_rate = (
        _attendance_rate(
            previous4
        )
    )


    recent_rate = (
        _attendance_rate(
            recent4
        )
    )


    attendance_delta = (
        recent_rate
        -
        previous_rate
    )


    recent_cancel_rate = (
        _status_rate(
            recent4,
            "cancelled"
        )
    )


    recent_no_show_rate = (
        _status_rate(
            recent4,
            "no_show"
        )
    )


    consecutive_nonparticipation = (
        _consecutive_nonparticipation(
            log
        )
    )


    consecutive_no_show = (
        _consecutive_no_show(
            log
        )
    )


    recent_eligible = (
        _eligible_only(
            recent4
        )
    )


    recent_attended_count = int(
        (
            recent_eligible[
                "event_status"
            ]
            ==
            "attended"
        ).sum()
    )


    desired = max(
        0.0,
        float(
            desired_monthly_frequency
        )
    )


    actual_vs_desired = (
        _safe_divide(
            recent_attended_count,
            desired,
            default=0.0
        )
        if desired > 0
        else 1.0
    )


    missed_opportunities = (
        _missed_since_last_attendance(
            log
        )
    )


    return {

        "회원_ID":
            member_id,

        "이전4주_참석률":
            round(
                previous_rate,
                3
            ),

        "최근4주_참석률":
            round(
                recent_rate,
                3
            ),

        "참석률_변화폭":
            round(
                attendance_delta,
                3
            ),

        "최근4주_취소율":
            round(
                recent_cancel_rate,
                3
            ),

        "최근4주_노쇼율":
            round(
                recent_no_show_rate,
                3
            ),

        "연속미참여횟수":
            int(
                consecutive_nonparticipation
            ),

        "연속노쇼횟수":
            int(
                consecutive_no_show
            ),

        "최근4주_eligible횟수":
            int(
                len(
                    recent_eligible
                )
            ),

        "최근4주_실제참석횟수":
            recent_attended_count,

        "희망월활동횟수":
            desired,

        "희망빈도대비_실제참여":
            round(
                actual_vs_desired,
                3
            ),

        "마지막참석후_미참여기회":
            int(
                missed_opportunities
            ),
    }


# ============================================================
# Generic Signal Rule
# ============================================================

def _evaluate_rule(
    feature_value,
    operator,
    threshold
):

    if operator == "<":
        return (
            feature_value
            <
            threshold
        )

    if operator == "<=":
        return (
            feature_value
            <=
            threshold
        )

    if operator == ">":
        return (
            feature_value
            >
            threshold
        )

    if operator == ">=":
        return (
            feature_value
            >=
            threshold
        )

    if operator == "==":
        return (
            feature_value
            ==
            threshold
        )


    raise ValueError(
        f"지원하지 않는 operator: {operator}"
    )


# ============================================================
# Risk Signal
# ============================================================

H4_SIGNAL_LABELS = {

    "급격한참여하락":
        "참석률 급락",

    "최근저참여":
        "최근 저참여",

    "노쇼발생":
        "노쇼 발생",

    "연속노쇼":
        "연속 노쇼",

    "연속미참여":
        "연속 미참여",

    "희망빈도미달":
        "희망빈도 미달",

    "반복취소":
        "반복 취소",

    "장기미참여":
        "장기 미참여",
}


def calculate_risk_signals(
    features
):

    result = {}


    for (
        rule_name,
        rule
    ) in H4_SIGNAL_RULES.items():


        feature_name = (
            rule[
                "feature"
            ]
        )


        feature_value = float(
            features[
                feature_name
            ]
        )


        triggered = (
            _evaluate_rule(

                feature_value=
                    feature_value,

                operator=
                    rule[
                        "operator"
                    ],

                threshold=
                    float(
                        rule[
                            "value"
                        ]
                    ),
            )
        )


        result[
            f"Signal_{rule_name}"
        ] = bool(
            triggered
        )


    active_labels = []


    for (
        rule_name,
        label
    ) in H4_SIGNAL_LABELS.items():

        if result.get(
            f"Signal_{rule_name}",
            False
        ):

            active_labels.append(
                label
            )


    result[
        "Risk_Signal_Count"
    ] = len(
        active_labels
    )


    result[
        "발생_Risk_Signal"
    ] = (
        ", ".join(
            active_labels
        )
        if active_labels
        else "-"
    )


    return result


# ============================================================
# Risk Dimensions
# ============================================================

def calculate_risk_dimensions(
    features
):

    recent_rate = float(
        features[
            "최근4주_참석률"
        ]
    )


    attendance_delta = float(
        features[
            "참석률_변화폭"
        ]
    )


    no_show_rate = float(
        features[
            "최근4주_노쇼율"
        ]
    )


    consecutive_no_show = float(
        features[
            "연속노쇼횟수"
        ]
    )


    cancel_rate = float(
        features[
            "최근4주_취소율"
        ]
    )


    actual_vs_desired = float(
        features[
            "희망빈도대비_실제참여"
        ]
    )


    missed = float(
        features[
            "마지막참석후_미참여기회"
        ]
    )


    # --------------------------------------------------------
    # Trend
    # --------------------------------------------------------

    trend_low = max(
        0.0,
        1.0
        -
        recent_rate
    )


    trend_drop = max(
        0.0,
        -
        attendance_delta
    )


    risk_trend = max(
        trend_low,
        trend_drop
    )


    # --------------------------------------------------------
    # No-show
    # --------------------------------------------------------

    no_show_saturation = float(

        H4_DIMENSION_RULES[
            "Risk_NoShow"
        ][
            "consecutive_no_show_saturation"
        ]
    )


    no_show_streak = min(
        1.0,
        consecutive_no_show
        /
        no_show_saturation
    )


    risk_no_show = max(
        no_show_rate,
        no_show_streak
    )


    # --------------------------------------------------------
    # Cancel
    # --------------------------------------------------------

    risk_cancel = (
        cancel_rate
    )


    # --------------------------------------------------------
    # Engagement Gap
    # --------------------------------------------------------

    risk_engagement_gap = max(
        0.0,
        1.0
        -
        actual_vs_desired
    )


    # --------------------------------------------------------
    # Inactivity
    # --------------------------------------------------------

    inactivity_saturation = float(

        H4_DIMENSION_RULES[
            "Risk_Inactivity"
        ][
            "missed_opportunity_saturation"
        ]
    )


    risk_inactivity = min(
        1.0,
        missed
        /
        inactivity_saturation
    )


    # --------------------------------------------------------
    # Recovery
    #
    # 중요:
    # Risk Score에서 차감하지 않는다.
    # --------------------------------------------------------

    recovery = max(
        0.0,
        attendance_delta
    )


    dimensions = {

        "Trend_최근저참여":
            round(
                trend_low,
                3
            ),

        "Trend_참석률하락":
            round(
                trend_drop,
                3
            ),

        "Risk_Trend":
            round(
                risk_trend,
                3
            ),

        "Noshow_Streak_Severity":
            round(
                no_show_streak,
                3
            ),

        "Risk_NoShow":
            round(
                risk_no_show,
                3
            ),

        "Risk_Cancel":
            round(
                risk_cancel,
                3
            ),

        "Risk_EngagementGap":
            round(
                risk_engagement_gap,
                3
            ),

        "Risk_Inactivity":
            round(
                risk_inactivity,
                3
            ),

        "Recovery_Strength":
            round(
                recovery,
                3
            ),
    }


    label_map = {

        "Risk_Trend":
            "참여 추세 저하",

        "Risk_NoShow":
            "노쇼 위험",

        "Risk_Cancel":
            "반복 취소",

        "Risk_EngagementGap":
            "희망 대비 참여 부족",

        "Risk_Inactivity":
            "장기 미참여",
    }


    active = {

        key:
            dimensions[
                key
            ]

        for key
        in label_map

        if (
            dimensions[
                key
            ]
            >
            0
        )
    }


    if active:

        strongest = max(
            active,
            key=active.get
        )


        dimensions[
            "최강_Risk_Dimension"
        ] = (
            label_map[
                strongest
            ]
        )


        dimensions[
            "Max_Risk_Severity"
        ] = round(
            active[
                strongest
            ],
            3
        )


    else:

        dimensions[
            "최강_Risk_Dimension"
        ] = "-"


        dimensions[
            "Max_Risk_Severity"
        ] = 0.0


    return dimensions


# ============================================================
# Risk Aggregation
#
# Risk = 0.70*Max + 0.30*Mean
#
# 확률이 아니다.
# ============================================================

def aggregate_risk(
    dimensions
):

    cols = (
        H4_AGGREGATION[
            "dimensions"
        ]
    )


    values = [

        float(
            dimensions[
                col
            ]
        )

        for col
        in cols
    ]


    risk_max = max(
        values
    )


    risk_mean = (
        sum(
            values
        )
        /
        len(
            values
        )
    )


    dominant_weight = float(
        H4_AGGREGATION[
            "dominant_weight"
        ]
    )


    breadth_weight = float(
        H4_AGGREGATION[
            "breadth_weight"
        ]
    )


    score = (

        dominant_weight
        *
        risk_max

        +

        breadth_weight
        *
        risk_mean
    )


    return {

        "Risk_Mean":
            round(
                risk_mean,
                4
            ),

        "Risk_Max":
            round(
                risk_max,
                3
            ),

        "Active_Dimension_Count":
            int(
                sum(
                    value > 0
                    for value in values
                )
            ),

        "Strong_Dimension_Count":
            int(
                sum(
                    value >= 0.5
                    for value in values
                )
            ),

        "Risk_DominantBreadth":
            round(
                score,
                5
            ),

        "Risk_Mean_100":
            round(
                risk_mean
                *
                100,
                1
            ),

        "Risk_Max_100":
            round(
                risk_max
                *
                100,
                1
            ),

        "Risk_DominantBreadth_100":
            round(
                score
                *
                100,
                1
            ),
    }


# ============================================================
# Grade
# ============================================================

def risk_grade(
    score
):

    score = float(
        score
    )


    if score < 30:
        return "정상"

    if score < 55:
        return "관찰"

    if score < 80:
        return "관리 필요"

    return "고위험"


def management_priority(
    grade
):

    mapping = {
        "고위험": 1,
        "관리 필요": 2,
        "관찰": 3,
        "정상": 4,
    }


    return mapping.get(
        grade,
        99
    )


# ============================================================
# Explainability
# ============================================================

def detected_risk_text(
    dimensions
):

    active = []


    mapping = [

        (
            "Risk_Trend",
            "참여 추세 저하"
        ),

        (
            "Risk_NoShow",
            "노쇼 위험"
        ),

        (
            "Risk_Cancel",
            "반복 취소"
        ),

        (
            "Risk_EngagementGap",
            "희망 대비 참여 부족"
        ),

        (
            "Risk_Inactivity",
            "장기 미참여"
        ),
    ]


    for (
        key,
        label
    ) in mapping:

        if (
            float(
                dimensions[
                    key
                ]
            )
            > 0
        ):

            active.append(
                label
            )


    return (
        ", ".join(
            active
        )
        if active
        else "뚜렷한 위험 신호 없음"
    )


def reason_candidates(
    grade,
    dimensions
):

    if grade == "정상":
        return []


    candidates = []


    if (
        dimensions[
            "Risk_Trend"
        ]
        >= 0.5
    ):

        candidates.append(
            "최근 참여 저하"
        )


    if (
        dimensions[
            "Risk_NoShow"
        ]
        > 0
    ):

        candidates.append(
            "노쇼 발생"
        )


    if (
        dimensions[
            "Risk_Cancel"
        ]
        >= 0.5
    ):

        candidates.append(
            "반복 취소"
        )


    if (
        dimensions[
            "Risk_EngagementGap"
        ]
        >= 0.5
    ):

        candidates.append(
            "희망 활동빈도 대비 참여 부족"
        )


    if (
        dimensions[
            "Risk_Inactivity"
        ]
        >= 0.667
    ):

        candidates.append(
            "장기 미참여"
        )


    return candidates


QUESTION_MAP = {

    "최근 참여 저하":
        "최근 활동 참여가 어려웠던 이유가 있나요?",

    "노쇼 발생":
        "최근 참석하지 못했던 일정에 특별한 이유가 있었나요?",

    "반복 취소":
        "최근 일정 취소가 반복된 이유가 있나요?",

    "희망 활동빈도 대비 참여 부족":
        "현재 활동 빈도가 원하는 수준과 맞지 않나요?",

    "장기 미참여":
        "최근 한동안 활동에 참여하지 못한 이유가 있나요?",
}


# ============================================================
# H4 Operator Action
# ============================================================

def h4_operator_action(
    grade,
    recovery_strength
):

    if grade == "고위험":

        return (
            "운영자 확인 우선 → "
            "최근 참여 의사 및 어려움 확인 → "
            "필요 시 일정·활동 재추천"
        )


    if grade == "관리 필요":

        return (
            "관리대상 표시 → "
            "참여 어려움 확인 → "
            "적합 일정 또는 활동 제안"
        )


    if grade == "관찰":

        return (
            "추가 1~2회 활동 추적 → "
            "참여저하 지속 시 원인 확인"
        )


    if (
        float(
            recovery_strength
        )
        > 0
    ):

        return (
            "현재 개입 없음 → "
            "최근 참여 회복 상태 유지 관찰"
        )


    return "개입 없음"


# ============================================================
# Public Runtime Engine
# ============================================================

def run_h4_participation_risk(
    event_log,
    member_profiles
):

    rows = []


    for member_id in sorted(
        member_profiles.keys()
    ):


        member_log = (
            event_log[
                event_log[
                    "회원_ID"
                ]
                ==
                member_id
            ]
        )


        desired = (

            member_profiles[
                member_id
            ][
                "희망월활동횟수"
            ]
        )


        features = (
            calculate_behavior_features(

                member_id=
                    member_id,

                member_log=
                    member_log,

                desired_monthly_frequency=
                    desired,
            )
        )


        signals = (
            calculate_risk_signals(
                features
            )
        )


        dimensions = (
            calculate_risk_dimensions(
                features
            )
        )


        aggregation = (
            aggregate_risk(
                dimensions
            )
        )


        score = (
            aggregation[
                "Risk_DominantBreadth_100"
            ]
        )


        grade = (
            risk_grade(
                score
            )
        )


        recovery = (
            dimensions[
                "Recovery_Strength"
            ]
        )


        detected = (
            detected_risk_text(
                dimensions
            )
        )


        reasons = (
            reason_candidates(
                grade,
                dimensions
            )
        )


        questions = [

            QUESTION_MAP[
                reason
            ]

            for reason
            in reasons

            if reason
            in QUESTION_MAP
        ]


        action = (
            h4_operator_action(
                grade,
                recovery
            )
        )


        if grade == "정상":

            if recovery > 0:

                summary = (
                    f"{member_id}: "
                    "최근 참여가 회복되고 있습니다."
                )

            else:

                summary = (
                    f"{member_id}: "
                    "현재 뚜렷한 참여저하 신호가 없습니다."
                )


        else:

            summary = (

                f"{member_id}: "
                f"{grade} "
                f"(Risk Index {score:.1f}) — "
                f"{detected}"
            )


        rows.append({

            **features,
            **signals,
            **dimensions,
            **aggregation,

            "Risk_Score":
                score,

            "Risk_Grade":
                grade,

            "Detected_Risk":
                detected,

            "Reason_Candidates":
                (
                    ", ".join(
                        reasons
                    )
                    if reasons
                    else "-"
                ),

            "Confirmation_Question":
                (
                    " / ".join(
                        questions
                    )
                    if questions
                    else "-"
                ),

            "Operator_Action":
                action,

            "Operator_Summary":
                summary,

            "관리우선순위":
                management_priority(
                    grade
                ),
        })


    return pd.DataFrame(
        rows
    )


__all__ = [

    "H4_RUNTIME_CONFIG",
    "H4_RULES",

    "calculate_behavior_features",
    "calculate_risk_signals",
    "calculate_risk_dimensions",
    "aggregate_risk",

    "risk_grade",
    "management_priority",

    "detected_risk_text",
    "reason_candidates",
    "h4_operator_action",

    "run_h4_participation_risk",
]
