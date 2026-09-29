
from pathlib import Path
import json
import math

import joblib
import numpy as np
import pandas as pd


# ============================================================
# Runtime Resources
# ============================================================

PACKAGE_ROOT = (
    Path(__file__)
    .resolve()
    .parents[1]
)

CONFIG_PATH = (
    PACKAGE_ROOT
    / "config"
    / "h3_runtime_config.json"
)

POLICY_PATH = (
    PACKAGE_ROOT
    / "config"
    / "h3_routing_policy.json"
)

BUNDLE_PATH = (
    PACKAGE_ROOT
    / "models"
    / "h3_runtime_bundle.joblib"
)


with open(
    CONFIG_PATH,
    "r",
    encoding="utf-8"
) as f:

    H3_CONFIG = json.load(f)


with open(
    POLICY_PATH,
    "r",
    encoding="utf-8"
) as f:

    H3_ROUTING_POLICY = json.load(f)


H3_RUNTIME_BUNDLE = joblib.load(
    BUNDLE_PATH
)


H3_MODEL = (
    H3_RUNTIME_BUNDLE[
        "model"
    ]
)


H3_MODEL_FEATURES = list(
    H3_RUNTIME_BUNDLE[
        "model_features"
    ]
)


H3_VERIFIED_SPORTS = list(
    H3_RUNTIME_BUNDLE[
        "verified_sports"
    ]
)


# ============================================================
# Utility
# ============================================================

def _as_list(value):

    if value is None:
        return []

    if isinstance(
        value,
        (
            list,
            tuple,
            set,
        )
    ):
        return list(value)

    return [value]


def normalize_schedule_slot(
    value
):

    if value is None:
        return None

    text = str(value).strip()

    # legacy "+"
    text = text.replace(
        "+",
        "|"
    )

    # 양옆 공백 canonical
    parts = [
        x.strip()
        for x in text.split("|")
    ]

    if len(parts) == 2:
        return (
            f"{parts[0]} | "
            f"{parts[1]}"
        )

    return text


# ============================================================
# Sport Normalization
# ============================================================

H3_SPORT_ALIASES = {
    "축구":
        "축구·풋살",

    "풋살":
        "축구·풋살",

    "축구, 풋살":
        "축구·풋살",

    "축구·풋살":
        "축구·풋살",

    "축구/풋살":
        "축구·풋살",

    "농구":
        "농구",

    "배구":
        "배구",

    "탁구":
        "탁구",

    "테니스":
        "테니스",
}


def normalize_sport(
    sport
):

    value = str(
        sport
    ).strip()

    return H3_SPORT_ALIASES.get(
        value,
        value
    )


# ============================================================
# Prior Table Utility
# ============================================================

def _prior_table_from_bundle(
    value
):
    """
    H3 Runtime Bundle 내부 Prior를
    canonical DataFrame으로 변환.

    지원:
    1) DataFrame
    2) list[dict]
    3) dict of columns
    4) {schedule: score}
    5) {schedule: {score/rank...}}
    """

    # --------------------------------------------------------
    # DataFrame
    # --------------------------------------------------------

    if isinstance(
        value,
        pd.DataFrame
    ):

        df = value.copy()


    # --------------------------------------------------------
    # List / Tuple
    # --------------------------------------------------------

    elif isinstance(
        value,
        (
            list,
            tuple,
        )
    ):

        df = pd.DataFrame(
            value
        )


    # --------------------------------------------------------
    # Dict
    # --------------------------------------------------------

    elif isinstance(
        value,
        dict
    ):

        if len(value) == 0:

            raise ValueError(
                "Prior dict가 비어 있습니다."
            )


        values = list(
            value.values()
        )


        # ----------------------------------------------------
        # Case A
        # {schedule: scalar_score}
        # ----------------------------------------------------

        scalar_types = (
            str,
            int,
            float,
            bool,
            np.integer,
            np.floating,
        )


        if all(
            (
                v is None
                or
                isinstance(
                    v,
                    scalar_types
                )
            )
            for v in values
        ):

            df = pd.DataFrame({

                "schedule":
                    list(
                        value.keys()
                    ),

                "prior_score":
                    list(
                        value.values()
                    ),
            })


        # ----------------------------------------------------
        # Case B
        # {schedule: {prior_score: ..., prior_rank: ...}}
        # ----------------------------------------------------

        elif all(
            isinstance(
                v,
                dict
            )
            for v in values
        ):

            rows = []

            for schedule, info in (
                value.items()
            ):

                row = {
                    "schedule":
                        schedule
                }

                row.update(
                    info
                )

                rows.append(
                    row
                )


            df = pd.DataFrame(
                rows
            )


        # ----------------------------------------------------
        # Case C
        # 일반적인 column-oriented dict
        # ----------------------------------------------------

        else:

            try:

                df = pd.DataFrame(
                    value
                )

            except ValueError:

                df = (
                    pd.DataFrame
                    .from_dict(
                        value,
                        orient="index"
                    )
                    .reset_index()
                    .rename(
                        columns={
                            "index":
                                "schedule"
                        }
                    )
                )


    else:

        raise TypeError(
            "지원하지 않는 Prior 자료형: "
            f"{type(value)}"
        )


    # ========================================================
    # Canonical Column 탐색
    # ========================================================

    schedule_candidates = [
        "schedule",
        "일정",
        "Schedule",
        "schedule_slot",
        "일정슬롯",
    ]


    score_candidates = [
        "prior_score",
        "score",
        "비율",
        "ratio",
        "probability",
        "확률",
        "value",
    ]


    rank_candidates = [
        "prior_rank",
        "rank",
        "순위",
    ]


    schedule_col = next(
        (
            col
            for col
            in schedule_candidates
            if col in df.columns
        ),
        None
    )


    score_col = next(
        (
            col
            for col
            in score_candidates
            if col in df.columns
        ),
        None
    )


    rank_col = next(
        (
            col
            for col
            in rank_candidates
            if col in df.columns
        ),
        None
    )


    if schedule_col is None:

        raise KeyError(
            "Prior schedule 컬럼을 찾지 못했습니다. "
            f"현재 컬럼: {list(df.columns)}"
        )


    # --------------------------------------------------------
    # Score 컬럼 자동 추론
    # --------------------------------------------------------

    if score_col is None:

        numeric_cols = [

            col

            for col
            in df.columns

            if (
                col != schedule_col

                and

                pd.api.types.is_numeric_dtype(
                    df[col]
                )
            )
        ]


        # rank가 numeric이면 score로 잘못 잡지 않도록 제외
        if rank_col in numeric_cols:

            numeric_cols.remove(
                rank_col
            )


        if not numeric_cols:

            raise KeyError(
                "Prior score 컬럼을 찾지 못했습니다. "
                f"현재 컬럼: {list(df.columns)}"
            )


        score_col = (
            numeric_cols[0]
        )


    # ========================================================
    # Canonical DataFrame 생성
    # ========================================================

    result = pd.DataFrame({

        "schedule": [
            normalize_schedule_slot(
                x
            )
            for x in
            df[
                schedule_col
            ]
        ],

        "prior_score":
            pd.to_numeric(
                df[
                    score_col
                ],
                errors="coerce"
            ),
    })


    # ========================================================
    # Rank
    # ========================================================

    if rank_col is not None:

        result[
            "prior_rank"
        ] = pd.to_numeric(
            df[
                rank_col
            ],
            errors="coerce"
        )


    else:

        # 점수 높은 순서로 Prior Rank 생성
        result["_stable"] = np.arange(
            len(result)
        )


        result = (
            result
            .sort_values(
                [
                    "prior_score",
                    "_stable",
                ],
                ascending=[
                    False,
                    True,
                ],
                kind="stable"
            )
            .reset_index(
                drop=True
            )
        )


        result[
            "prior_rank"
        ] = np.arange(
            1,
            len(result) + 1
        )


        result = result.drop(
            columns=[
                "_stable"
            ]
        )


    return (
        result[
            [
                "schedule",
                "prior_rank",
                "prior_score",
            ]
        ]
        .dropna(
            subset=[
                "schedule",
                "prior_score",
            ]
        )
        .drop_duplicates(
            subset=[
                "schedule"
            ],
            keep="first"
        )
        .reset_index(
            drop=True
        )
    )
# ============================================================
# Global / Tennis Prior
# ============================================================

H3_GLOBAL_PRIOR = (
    _prior_table_from_bundle(
        H3_RUNTIME_BUNDLE[
            "global_prior"
        ]
    )
)


H3_TENNIS_PRIOR = (
    _prior_table_from_bundle(
        H3_RUNTIME_BUNDLE[
            "tennis_prior"
        ]
    )
)


# ============================================================
# Existing 4 Sports Context + Sport Prior
# ============================================================

def h3_context_sport_prior(
    region,
    frequency,
    service_sport
):

    normalized_sport = (
        normalize_sport(
            service_sport
        )
    )


    official_mapping = (
        H3_ROUTING_POLICY.get(
            "service_to_official_sport",
            {}
        )
    )


    official_sport = (
        official_mapping.get(
            normalized_sport,
            normalized_sport
        )
    )


    row = {

        "응답자_지역_광역":
            region,

        "주운동_참여빈도":
            frequency,

        "현재동호회_주종목":
            official_sport,
    }


    X = pd.DataFrame(
        [row],
        columns=
            H3_MODEL_FEATURES,
    )


    probability = (
        H3_MODEL
        .predict_proba(
            X
        )[0]
    )


    result = pd.DataFrame({

        "schedule": [
            normalize_schedule_slot(
                value
            )
            for value in
            H3_MODEL.classes_
        ],

        "prior_score":
            probability,
    })


    result["_stable"] = np.arange(
        len(result)
    )


    result = (
        result
        .sort_values(
            [
                "prior_score",
                "_stable",
            ],
            ascending=[
                False,
                True,
            ],
            kind="stable"
        )
        .reset_index(
            drop=True
        )
    )


    result[
        "prior_rank"
    ] = np.arange(
        1,
        len(result) + 1
    )


    return result[
        [
            "schedule",
            "prior_rank",
            "prior_score",
        ]
    ]


# ============================================================
# Routing
# ============================================================

def route_h3_prior(
    sport,
    region=None,
    frequency=None
):

    normalized_sport = (
        normalize_sport(
            sport
        )
    )


    # --------------------------------------------------------
    # Tennis
    # --------------------------------------------------------

    if normalized_sport == "테니스":

        return {

            "sport":
                normalized_sport,

            "verified":
                True,

            "source":
                "sport_only_empirical",

            "strength":
                "weak",

            "usage":
                "tie_break",

            "prior":
                H3_TENNIS_PRIOR.copy(),
        }


    # --------------------------------------------------------
    # Existing 4 sports
    # --------------------------------------------------------

    existing_four = {
        "축구·풋살",
        "농구",
        "배구",
        "탁구",
    }


    if normalized_sport in existing_four:

        prior = (
            h3_context_sport_prior(

                region=
                    region,

                frequency=
                    frequency,

                service_sport=
                    normalized_sport,
            )
        )


        return {

            "sport":
                normalized_sport,

            "verified":
                True,

            "source":
                "context_plus_sport_model",

            "strength":
                "normal",

            "usage":
                "supplemental_prior",

            "prior":
                prior,
        }


    # --------------------------------------------------------
    # Unverified sport
    # --------------------------------------------------------

    return {

        "sport":
            normalized_sport,

        "verified":
            False,

        "source":
            "global_unverified_sport",

        "strength":
            "weak",

        "usage":
            "fallback_only",

        "prior":
            H3_GLOBAL_PRIOR.copy(),
    }


# ============================================================
# Public Routing Output
# ============================================================

def get_h3_prior_top(
    sport,
    region=None,
    frequency=None,
    top_k=3
):

    routed = route_h3_prior(
        sport=sport,
        region=region,
        frequency=frequency,
    )


    prior = (
        routed[
            "prior"
        ]
        .sort_values(
            [
                "prior_rank",
                "prior_score",
            ],
            ascending=[
                True,
                False,
            ],
            kind="stable"
        )
        .head(
            int(top_k)
        )
        .copy()
    )


    prior[
        "source"
    ] = routed[
        "source"
    ]

    prior[
        "strength"
    ] = routed[
        "strength"
    ]

    prior[
        "usage"
    ] = routed[
        "usage"
    ]

    prior[
        "verified"
    ] = routed[
        "verified"
    ]


    return prior.reset_index(
        drop=True
    )


# ============================================================
# Schedule Engine
# ============================================================

def run_h3_schedule(
    club,
    members,
    venues,
    top_k=None
):
    """
    Public H3 Runtime API.

    Ranking priority:
    1. minimum participants satisfied
    2. guest needed asc
    3. reachable member count desc
    4. availability ratio desc
    5. official prior rank asc
    6. official prior score desc
    7. stable
    """


    sport = normalize_sport(
        club.get(
            "sport"
        )
    )


    region = club.get(
        "region"
    )


    activity_frequency = (
        club.get(
            "activity_frequency"
        )
    )


    minimum_participants = int(
        club.get(
            "minimum_participants",
            1
        )
    )


    guest_allowed = bool(
        club.get(
            "guest_allowed",
            False
        )
    )


    if top_k is None:

        top_k = int(
            H3_CONFIG.get(
                "output",
                {}
            ).get(
                "top_k",
                3
            )
        )


    routed = route_h3_prior(

        sport=
            sport,

        region=
            region,

        frequency=
            activity_frequency,
    )


    prior = (
        routed[
            "prior"
        ]
        .copy()
    )


    # schedule → prior
    prior_map = {

        row["schedule"]: {
            "prior_rank":
                int(
                    row[
                        "prior_rank"
                    ]
                ),

            "prior_score":
                float(
                    row[
                        "prior_score"
                    ]
                ),
        }

        for _, row
        in prior.iterrows()
    }


    total_members = len(
        members
    )


    # --------------------------------------------------------
    # Venue schedule 후보 생성
    # --------------------------------------------------------

    candidate_rows = []

    stable_index = 0


    for venue in venues:

        venue_id = venue.get(
            "venue_id"
        )


        venue_slots = [
            normalize_schedule_slot(
                x
            )
            for x in _as_list(
                venue.get(
                    "available_slots"
                )
            )
        ]


        for schedule in venue_slots:

            reachable_members = []


            # ------------------------------------------------
            # Member hard constraints
            # ------------------------------------------------

            for member in members:

                member_slots = set(
                    normalize_schedule_slot(
                        x
                    )
                    for x in _as_list(
                        member.get(
                            "available_slots"
                        )
                    )
                )


                # schedule hard constraint
                if schedule not in member_slots:
                    continue


                max_travel = float(
                    member.get(
                        "max_travel_minutes",
                        math.inf
                    )
                )


                travel_map = (
                    member.get(
                        "travel_minutes_by_venue",
                        {}
                    )
                )


                travel = float(
                    travel_map.get(
                        venue_id,
                        math.inf
                    )
                )


                # travel hard constraint
                if travel > max_travel:
                    continue


                reachable_members.append(
                    member.get(
                        "member_id"
                    )
                )


            reachable_count = len(
                reachable_members
            )


            if total_members > 0:

                availability_ratio = (
                    reachable_count
                    /
                    total_members
                )

            else:
                availability_ratio = 0.0


            minimum_satisfied = (
                reachable_count
                >=
                minimum_participants
            )


            if minimum_satisfied:

                guest_needed = 0
                operation_status = (
                    "normal"
                )

            else:

                guest_needed = (
                    minimum_participants
                    -
                    reachable_count
                )


                if not guest_allowed:
                    continue


                operation_status = (
                    "guest_fallback"
                )


            prior_info = (
                prior_map.get(
                    schedule,
                    {
                        "prior_rank":
                            999999,

                        "prior_score":
                            0.0,
                    }
                )
            )


            candidate_rows.append({

                "schedule":
                    schedule,

                "venue_id":
                    venue_id,

                "reachable_count":
                    reachable_count,

                "total_members":
                    total_members,

                "availability_ratio":
                    round(
                        availability_ratio,
                        4
                    ),

                "guest_needed":
                    guest_needed,

                "operation_status":
                    operation_status,

                "reachable_members":
                    reachable_members,

                "prior_rank":
                    int(
                        prior_info[
                            "prior_rank"
                        ]
                    ),

                "prior_score":
                    float(
                        prior_info[
                            "prior_score"
                        ]
                    ),

                "source":
                    routed[
                        "source"
                    ],

                "strength":
                    routed[
                        "strength"
                    ],

                "usage":
                    routed[
                        "usage"
                    ],

                "verified":
                    routed[
                        "verified"
                    ],

                "_minimum_satisfied":
                    minimum_satisfied,

                "_stable":
                    stable_index,
            })


            stable_index += 1


    if not candidate_rows:

        return pd.DataFrame(
            columns=[
                "rank",
                "schedule",
                "venue_id",
                "reachable_count",
                "total_members",
                "availability_ratio",
                "guest_needed",
                "operation_status",
                "reachable_members",
                "prior_rank",
                "prior_score",
                "source",
                "strength",
                "usage",
                "verified",
            ]
        )


    result = pd.DataFrame(
        candidate_rows
    )


    # --------------------------------------------------------
    # 같은 일정에 Venue가 여러 개라면
    # Ranking 후 최적 Venue 하나만 유지
    # --------------------------------------------------------

    result = (
        result
        .sort_values(
            [
                "_minimum_satisfied",
                "guest_needed",
                "reachable_count",
                "availability_ratio",
                "prior_rank",
                "prior_score",
                "_stable",
            ],
            ascending=[
                False,
                True,
                False,
                False,
                True,
                False,
                True,
            ],
            kind="stable"
        )
    )


    result = (
        result
        .drop_duplicates(
            subset=[
                "schedule"
            ],
            keep="first"
        )
        .head(
            int(top_k)
        )
        .reset_index(
            drop=True
        )
    )


    result[
        "rank"
    ] = np.arange(
        1,
        len(result) + 1
    )


    return result[
        [
            "rank",
            "schedule",
            "venue_id",
            "reachable_count",
            "total_members",
            "availability_ratio",
            "guest_needed",
            "operation_status",
            "reachable_members",
            "prior_rank",
            "prior_score",
            "source",
            "strength",
            "usage",
            "verified",
        ]
    ]


__all__ = [
    "H3_CONFIG",
    "H3_ROUTING_POLICY",
    "H3_RUNTIME_BUNDLE",
    "H3_MODEL",
    "H3_MODEL_FEATURES",
    "H3_VERIFIED_SPORTS",

    "normalize_schedule_slot",
    "normalize_sport",

    "h3_context_sport_prior",
    "route_h3_prior",
    "get_h3_prior_top",

    "run_h3_schedule",
]
