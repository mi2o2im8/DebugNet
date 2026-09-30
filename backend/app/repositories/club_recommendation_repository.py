from __future__ import annotations

from collections import defaultdict

from app.core.supabase import get_supabase_admin_client


SUPPORTED_SPORT_ORDER = [
    "축구·풋살",
    "농구",
    "배구",
    "탁구",
    "테니스",
]


def _canonical_sport_name(value) -> str:
    text = str(value or "").strip().replace(" ", "")
    text = text.replace("ㆍ", "·").replace("/", "·")

    if text in {"축구·풋살", "풋살·축구"}:
        return "축구·풋살"
    if text == "농구":
        return "농구"
    if text == "배구":
        return "배구"
    if text == "탁구":
        return "탁구"
    if text == "테니스":
        return "테니스"

    return ""


class ClubRecommendationRepository:
    def __init__(self):
        self.admin_client = get_supabase_admin_client()

    def get_supported_sports(self) -> list[dict]:
        rows = (
            self.admin_client
            .table("sports")
            .select("sport_id, sport_name")
            .execute()
            .data
            or []
        )

        by_name = {}
        for row in rows:
            if row.get("sport_id") is None:
                continue

            canonical = _canonical_sport_name(row.get("sport_name"))
            if not canonical:
                continue

            by_name[canonical] = {
                "sport_id": int(row["sport_id"]),
                "sport_name": canonical,
            }

        return [
            by_name[name]
            for name in SUPPORTED_SPORT_ORDER
            if name in by_name
        ]

    def get_user_context(self, user_id: str) -> dict:
        user_rows = (
            self.admin_client
            .table("users")
            .select(
                "user_id, gender, birth_date, travel_distance_km, "
                "max_monthly_fee, activity_frequency"
            )
            .eq("user_id", user_id)
            .limit(1)
            .execute()
            .data
            or []
        )

        if not user_rows:
            raise LookupError("사용자 정보를 찾을 수 없습니다.")

        user = user_rows[0]

        sport_rows = (
            self.admin_client
            .table("user_sports")
            .select("sport_id")
            .eq("user_id", user_id)
            .execute()
            .data
            or []
        )
        sport_ids = [
            int(row["sport_id"])
            for row in sport_rows
            if row.get("sport_id") is not None
        ]

        sport_names = {}
        if sport_ids:
            rows = (
                self.admin_client
                .table("sports")
                .select("sport_id, sport_name")
                .in_("sport_id", sport_ids)
                .execute()
                .data
                or []
            )
            sport_names = {
                int(row["sport_id"]): _canonical_sport_name(row.get("sport_name"))
                or row.get("sport_name")
                for row in rows
            }

        level_rows = (
            self.admin_client
            .table("user_sport_levels")
            .select("sport_id, sport_level")
            .eq("user_id", user_id)
            .execute()
            .data
            or []
        )
        levels = {
            int(row["sport_id"]): row.get("sport_level")
            for row in level_rows
            if row.get("sport_id") is not None
        }

        regions = [
            row["region"]
            for row in (
                self.admin_client
                .table("user_regions")
                .select("region")
                .eq("user_id", user_id)
                .execute()
                .data
                or []
            )
            if row.get("region")
        ]

        available_times = (
            self.admin_client
            .table("user_available_times")
            .select("day_of_week, start_time, end_time")
            .eq("user_id", user_id)
            .execute()
            .data
            or []
        )

        atmospheres = [
            row["atmosphere"]
            for row in (
                self.admin_client
                .table("user_club_atmospheres")
                .select("atmosphere")
                .eq("user_id", user_id)
                .execute()
                .data
                or []
            )
            if row.get("atmosphere")
        ]

        sports = [
            {
                "sport_id": sport_id,
                "sport_name": sport_names.get(sport_id) or f"종목 {sport_id}",
                "sport_level": levels.get(sport_id),
            }
            for sport_id in sport_ids
        ]

        return {
            **user,
            "sports": sports,
            "regions": regions,
            "available_times": available_times,
            "atmospheres": atmospheres,
        }

    def get_option_values(self) -> dict:
        region_rows = (
            self.admin_client
            .table("club_regions")
            .select("region")
            .execute()
            .data
            or []
        )
        level_rows = (
            self.admin_client
            .table("club_sport_levels")
            .select("sport_level")
            .execute()
            .data
            or []
        )
        atmosphere_rows = (
            self.admin_client
            .table("club_atmospheres")
            .select("atmosphere")
            .execute()
            .data
            or []
        )
        keyword_rows = (
            self.admin_client
            .table("club_intro_keywords")
            .select("keyword")
            .execute()
            .data
            or []
        )
        frequency_rows = (
            self.admin_client
            .table("clubs")
            .select("activity_frequency")
            .eq("status", True)
            .execute()
            .data
            or []
        )

        def unique(values):
            return sorted({
                str(value).strip()
                for value in values
                if value and str(value).strip()
            })

        return {
            "sports": self.get_supported_sports(),
            "regions": unique(row.get("region") for row in region_rows),
            "skill_levels": unique(row.get("sport_level") for row in level_rows),
            "atmospheres": unique(
                [row.get("atmosphere") for row in atmosphere_rows]
                + [row.get("keyword") for row in keyword_rows]
            ),
            "activity_frequencies": unique(
                row.get("activity_frequency")
                for row in frequency_rows
            ),
        }

    def get_active_membership_club_ids(self, user_id: str) -> set[int]:
        rows = (
            self.admin_client
            .table("club_members")
            .select("club_id")
            .eq("user_id", user_id)
            .eq("status", "active")
            .execute()
            .data
            or []
        )
        return {
            int(row["club_id"])
            for row in rows
            if row.get("club_id") is not None
        }

    def get_candidate_clubs(self, sport_id: int | None) -> list[dict]:
        supported_sports = self.get_supported_sports()
        supported_by_id = {
            int(item["sport_id"]): item
            for item in supported_sports
        }
        supported_ids = set(supported_by_id)

        if not supported_ids:
            return []

        query = (
            self.admin_client
            .table("club_sports")
            .select("club_id, sport_id")
        )

        if sport_id is not None:
            if int(sport_id) not in supported_ids:
                return []
            query = query.eq("sport_id", int(sport_id))

        club_sport_rows = query.execute().data or []
        club_sport_rows = [
            row
            for row in club_sport_rows
            if row.get("club_id") is not None
            and row.get("sport_id") is not None
            and int(row["sport_id"]) in supported_ids
        ]

        club_ids = sorted({
            int(row["club_id"])
            for row in club_sport_rows
        })
        if not club_ids:
            return []

        club_sports_map = defaultdict(list)
        for row in club_sport_rows:
            club_id = int(row["club_id"])
            current_sport_id = int(row["sport_id"])
            if current_sport_id not in club_sports_map[club_id]:
                club_sports_map[club_id].append(current_sport_id)

        club_rows = (
            self.admin_client
            .table("clubs")
            .select(
                "club_id, club_name, club_intro, current_members, max_members, "
                "monthly_fee, activity_frequency, gender_rule, visibility, status"
            )
            .in_("club_id", club_ids)
            .eq("status", True)
            .execute()
            .data
            or []
        )

        club_rows = [
            row
            for row in club_rows
            if row.get("visibility") in (None, "public")
        ]

        active_ids = sorted({int(row["club_id"]) for row in club_rows})
        if not active_ids:
            return []

        def rows(table: str, select: str):
            return (
                self.admin_client
                .table(table)
                .select(select)
                .in_("club_id", active_ids)
                .execute()
                .data
                or []
            )

        region_rows = rows("club_regions", "club_id, region")
        schedule_rows = rows(
            "club_schedules",
            "club_id, day_of_week, start_time, end_time",
        )
        level_rows = rows(
            "club_sport_levels",
            "club_id, sport_id, sport_level",
        )
        atmosphere_rows = rows("club_atmospheres", "club_id, atmosphere")
        keyword_rows = rows("club_intro_keywords", "club_id, keyword")
        age_rows = rows("club_age_groups", "club_id, age_group")
        image_rows = rows(
            "club_images",
            "club_id, image_url, display_order, image_type",
        )

        maps = {
            "regions": defaultdict(list),
            "schedules": defaultdict(list),
            "sport_levels": defaultdict(list),
            "atmospheres": defaultdict(list),
            "intro_keywords": defaultdict(list),
            "age_groups": defaultdict(list),
            "images": defaultdict(list),
        }

        for row in region_rows:
            maps["regions"][int(row["club_id"])].append(row.get("region"))

        for row in schedule_rows:
            maps["schedules"][int(row["club_id"])].append({
                "day_of_week": row.get("day_of_week"),
                "start_time": row.get("start_time"),
                "end_time": row.get("end_time"),
            })

        for row in level_rows:
            row_sport_id = int(row.get("sport_id") or 0)
            if row_sport_id not in supported_ids:
                continue
            if sport_id is not None and row_sport_id != int(sport_id):
                continue
            maps["sport_levels"][int(row["club_id"])].append(row.get("sport_level"))

        for row in atmosphere_rows:
            maps["atmospheres"][int(row["club_id"])].append(row.get("atmosphere"))
        for row in keyword_rows:
            maps["intro_keywords"][int(row["club_id"])].append(row.get("keyword"))
        for row in age_rows:
            maps["age_groups"][int(row["club_id"])].append(row.get("age_group"))
        for row in image_rows:
            maps["images"][int(row["club_id"])].append(row)

        sport_order = {
            item["sport_name"]: index
            for index, item in enumerate(supported_sports)
        }

        result = []
        for club in club_rows:
            club_id = int(club["club_id"])
            club_sport_ids = club_sports_map[club_id]

            club_sport_items = [
                supported_by_id[item_id]
                for item_id in club_sport_ids
                if item_id in supported_by_id
            ]
            club_sport_items.sort(
                key=lambda item: sport_order.get(item["sport_name"], 999)
            )

            images = sorted(
                maps["images"][club_id],
                key=lambda item: (
                    0 if item.get("image_type") == "representative" else 1,
                    int(item.get("display_order") or 0),
                ),
            )

            result.append({
                **club,
                "sport_id": (
                    int(sport_id)
                    if sport_id is not None
                    else (
                        club_sport_items[0]["sport_id"]
                        if club_sport_items
                        else None
                    )
                ),
                "sport_name": " · ".join(
                    item["sport_name"]
                    for item in club_sport_items
                ),
                "sports": club_sport_items,
                "regions": [
                    value
                    for value in maps["regions"][club_id]
                    if value
                ],
                "schedules": maps["schedules"][club_id],
                "sport_levels": list(dict.fromkeys(
                    value
                    for value in maps["sport_levels"][club_id]
                    if value
                )),
                "atmospheres": [
                    value
                    for value in maps["atmospheres"][club_id]
                    if value
                ],
                "intro_keywords": [
                    value
                    for value in maps["intro_keywords"][club_id]
                    if value
                ],
                "age_groups": [
                    value
                    for value in maps["age_groups"][club_id]
                    if value
                ],
                "image_url": images[0].get("image_url") if images else None,
            })

        return result
