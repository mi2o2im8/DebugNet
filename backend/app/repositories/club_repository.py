from app.core.supabase import (
    get_supabase_admin_client,
)


class ClubRepository:

    def __init__(self):
        # Secret Key를 사용하는 서버 전용 Supabase Client
        self.admin_client = (
            get_supabase_admin_client()
        )

    # -----------------------------------------------------
    # 종목명으로 sports 데이터 조회
    # -----------------------------------------------------
    def find_sport_by_name(
        self,
        sport_name: str,
    ) -> dict | None:
        response = (
            self.admin_client
            .table("sports")
            .select(
                "sport_id, sport_name, status"
            )
            .eq(
                "sport_name",
                sport_name,
            )
            .eq(
                "status",
                True,
            )
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    # -----------------------------------------------------
    # clubs 기본 정보 저장
    # -----------------------------------------------------
    def create_club(
        self,
        club_data: dict,
    ) -> dict:
        response = (
            self.admin_client
            .table("clubs")
            .insert(club_data)
            .execute()
        )

        if not response.data:
            raise ValueError(
                "동호회 기본 정보 저장에 실패했습니다."
            )

        return response.data[0]

    # -----------------------------------------------------
    # 동호회 종목 연결
    # -----------------------------------------------------
    def create_club_sport(
        self,
        club_id: int,
        sport_id: int,
    ) -> None:
        self.admin_client.table(
            "club_sports"
        ).insert(
            {
                "club_id": club_id,
                "sport_id": sport_id,
            }
        ).execute()

    # -----------------------------------------------------
    # 동호회 활동 지역 저장
    # -----------------------------------------------------
    def create_club_region(
        self,
        club_id: int,
        region: str,
    ) -> None:
        self.admin_client.table(
            "club_regions"
        ).insert(
            {
                "club_id": club_id,
                "region": region,
            }
        ).execute()

    # -----------------------------------------------------
    # 활동 일정 저장
    # -----------------------------------------------------
    def create_club_schedules(
        self,
        schedule_rows: list[dict],
    ) -> None:
        if not schedule_rows:
            return

        self.admin_client.table(
            "club_schedules"
        ).insert(
            schedule_rows
        ).execute()

    # -----------------------------------------------------
    # 동호회 운동 수준 저장
    # -----------------------------------------------------
    def create_club_sport_levels(
        self,
        level_rows: list[dict],
    ) -> None:
        if not level_rows:
            return

        self.admin_client.table(
            "club_sport_levels"
        ).insert(
            level_rows
        ).execute()

    # -----------------------------------------------------
    # 가입 가능 연령대 저장
    # -----------------------------------------------------
    def create_club_age_groups(
        self,
        age_group_rows: list[dict],
    ) -> None:
        if not age_group_rows:
            return

        self.admin_client.table(
            "club_age_groups"
        ).insert(
            age_group_rows
        ).execute()

    # -----------------------------------------------------
    # 동호회 활동 장소 저장
    # -----------------------------------------------------
    def create_club_venue(
        self,
        venue_data: dict,
    ) -> None:
        self.admin_client.table(
            "club_venues"
        ).insert(
            venue_data
        ).execute()

    # -----------------------------------------------------
    # 동호회 소개 키워드 저장
    # -----------------------------------------------------
    def create_club_intro_keywords(
        self,
        keyword_rows: list[dict],
    ) -> None:
        if not keyword_rows:
            return

        self.admin_client.table(
            "club_intro_keywords"
        ).insert(
            keyword_rows
        ).execute()

    # -----------------------------------------------------
    # 동호회 이미지 URL 저장
    # -----------------------------------------------------
    def create_club_images(
        self,
        image_rows: list[dict],
    ) -> None:
        if not image_rows:
            return

        self.admin_client.table(
            "club_images"
        ).insert(
            image_rows
        ).execute()

    # -----------------------------------------------------
    # 가입 질문 저장
    # -----------------------------------------------------
    def create_club_join_questions(
        self,
        question_rows: list[dict],
    ) -> None:
        if not question_rows:
            return

        self.admin_client.table(
            "club_join_questions"
        ).insert(
            question_rows
        ).execute()

    # -----------------------------------------------------
    # 동호회 생성자를 동호회장으로 등록
    # -----------------------------------------------------
    def create_owner_membership(
        self,
        club_id: int,
        user_id: str,
    ) -> None:
        self.admin_client.table(
            "club_members"
        ).insert(
            {
                "club_id": club_id,
                "user_id": user_id,
                "role": "owner",
                "status": "active",
                "join_source": "club_created",
            }
        ).execute()

    # -----------------------------------------------------
    # 동호회 생성 실패 시 생성 데이터 정리
    # -----------------------------------------------------
    def delete_club(
        self,
        club_id: int,
    ) -> None:
        self.admin_client.table(
            "clubs"
        ).delete().eq(
            "club_id",
            club_id,
        ).execute()

    # -----------------------------------------------------
    # 동호회 허브 기본 정보 조회
    # -----------------------------------------------------
    def find_club_by_id(
        self,
        club_id: int,
    ) -> dict | None:
        response = (
            self.admin_client
            .table("clubs")
            .select(
                (
                    "club_id, club_name, club_intro, "
                    "max_members, activity_frequency, status"
                )
            )
            .eq("club_id", club_id)
            .eq("status", True)
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    # -----------------------------------------------------
    # 로그인 사용자의 동호회 권한 조회
    # -----------------------------------------------------
    def find_active_membership(
        self,
        club_id: int,
        user_id: str,
    ) -> dict | None:
        response = (
            self.admin_client
            .table("club_members")
            .select("role, status")
            .eq("club_id", club_id)
            .eq("user_id", user_id)
            .eq("status", "active")
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    # -----------------------------------------------------
    # 동호회 종목명 조회
    # -----------------------------------------------------
    def find_club_sport_name(
        self,
        club_id: int,
    ) -> str | None:
        club_sport_response = (
            self.admin_client
            .table("club_sports")
            .select("sport_id")
            .eq("club_id", club_id)
            .limit(1)
            .execute()
        )

        if not club_sport_response.data:
            return None

        sport_id = club_sport_response.data[0]["sport_id"]

        sport_response = (
            self.admin_client
            .table("sports")
            .select("sport_name")
            .eq("sport_id", sport_id)
            .limit(1)
            .execute()
        )

        if not sport_response.data:
            return None

        return sport_response.data[0]["sport_name"]

    # -----------------------------------------------------
    # 동호회 대표 지역 조회
    # -----------------------------------------------------
    def find_club_region(
        self,
        club_id: int,
    ) -> str | None:
        response = (
            self.admin_client
            .table("club_regions")
            .select("region")
            .eq("club_id", club_id)
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]["region"]

    # -----------------------------------------------------
    # 동호회 활동 장소 조회
    # -----------------------------------------------------
    def find_club_venue(
        self,
        club_id: int,
    ) -> str | None:
        response = (
            self.admin_client
            .table("club_venues")
            .select("venue_name")
            .eq("club_id", club_id)
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]["venue_name"]

    # -----------------------------------------------------
    # 동호회 이미지 조회
    # -----------------------------------------------------
    def find_club_images(
        self,
        club_id: int,
    ) -> list[dict]:
        response = (
            self.admin_client
            .table("club_images")
            .select(
                "image_url, image_type, display_order"
            )
            .eq("club_id", club_id)
            .order("display_order")
            .execute()
        )

        return response.data or []

    # -----------------------------------------------------
    # 동호회 정기 일정 조회
    # -----------------------------------------------------
    def find_club_schedules(
        self,
        club_id: int,
    ) -> list[dict]:
        response = (
            self.admin_client
            .table("club_schedules")
            .select(
                (
                    "club_schedule_id, day_of_week, "
                    "start_time, end_time"
                )
            )
            .eq("club_id", club_id)
            .order("club_schedule_id")
            .execute()
        )

        return response.data or []

    # -----------------------------------------------------
    # 활동 중인 회원 수 조회
    # -----------------------------------------------------
    def count_active_members(
        self,
        club_id: int,
    ) -> int:
        response = (
            self.admin_client
            .table("club_members")
            .select(
                "club_member_id",
                count="exact",
            )
            .eq("club_id", club_id)
            .eq("status", "active")
            .execute()
        )

        if response.count is not None:
            return response.count

        return len(response.data or [])