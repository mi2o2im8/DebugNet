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