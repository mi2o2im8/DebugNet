from typing import List, Optional

from app.core.supabase import get_supabase_admin_client


# ---------------------------------------------------------
# 동호회 관련 Supabase 작업을 담당하는 Repository
# ---------------------------------------------------------
class ClubRepository:

    def __init__(self):
        self.supabase = get_supabase_admin_client()
        self.admin_client = self.supabase

    # -----------------------------------------------------
    # 동호회 검색
    # -----------------------------------------------------
    def search_clubs(
        self,
        keyword: Optional[str] = None,
        sport_name: Optional[List[str]] = None,
        region: Optional[List[str]] = None,
        day_of_week: Optional[List[str]] = None,
        time_slot: Optional[List[str]] = None,
        atmosphere: Optional[str] = None,
    ):
        params = {
            "p_keyword": keyword,
            "p_sport_name": sport_name,
            "p_region": region,
            "p_day_of_week": day_of_week,
            "p_time_slot": time_slot,
            "p_atmosphere": atmosphere,
        }

        response = self.supabase.rpc(
            "search_clubs",
            params,
        ).execute()

        return response.data

    # -----------------------------------------------------
    # 동호회 상세 조회
    # -----------------------------------------------------
    def get_club_by_id(self, club_id: int):

        # 1. 동호회 기본 정보
        club_response = (
            self.supabase
            .table("clubs")
            .select("*")
            .eq("club_id", club_id)
            .single()
            .execute()
        )

        club = club_response.data

        if not club:
            return None

        # 2. 운동 종목 조회
        club_sports_response = (
            self.supabase
            .table("club_sports")
            .select("sport_id")
            .eq("club_id", club_id)
            .execute()
        )

        sport_ids = [
            item["sport_id"]
            for item in club_sports_response.data
        ]

        sports = []

        if sport_ids:
            sports_response = (
                self.supabase
                .table("sports")
                .select("sport_name")
                .in_("sport_id", sport_ids)
                .execute()
            )

            sports = [
                item["sport_name"]
                for item in sports_response.data
            ]

        # 3. 활동 지역 조회
        regions_response = (
            self.supabase
            .table("club_regions")
            .select("region")
            .eq("club_id", club_id)
            .execute()
        )

        regions = [
            item["region"]
            for item in regions_response.data
        ]

        # 4. 활동 시간 조회
        schedules_response = (
            self.supabase
            .table("club_schedules")
            .select(
                "day_of_week, start_time, end_time"
            )
            .eq("club_id", club_id)
            .execute()
        )

        schedules = schedules_response.data

        # 5. 동호회 분위기 조회
        atmospheres_response = (
            self.supabase
            .table("club_atmospheres")
            .select("atmosphere")
            .eq("club_id", club_id)
            .execute()
        )

        atmospheres = [
            item["atmosphere"]
            for item in atmospheres_response.data
        ]

        # 6. 동호회 이미지 조회
        images_response = (
            self.supabase
            .table("club_images")
            .select(
                "image_url, display_order, image_type"
            )
            .eq("club_id", club_id)
            .order("display_order")
            .execute()
        )

        images = images_response.data

        # 7. 상세 정보 추가
        club["sports"] = sports
        club["regions"] = regions
        club["schedules"] = schedules
        club["atmospheres"] = atmospheres
        club["images"] = images

        return club

    # -----------------------------------------------------
    # 동호회 가입 신청
    # -----------------------------------------------------
    def create_join_request(
        self,
        club_id: int,
        user_id: str,
    ):
        data = {
            "club_id": club_id,
            "user_id": user_id,
            "role": "member",
            "status": "pending",
            "join_source": "club_detail",
        }

        response = (
            self.supabase
            .table("club_members")
            .insert(data)
            .execute()
        )

        return response.data

    # -----------------------------------------------------
    # 동호회 가입 상태 조회
    # -----------------------------------------------------
    def get_member_status(
        self,
        club_id: int,
        user_id: str,
    ):
        # 1. 정식 회원인지 확인
        member_response = (
            self.supabase
            .table("club_members")
            .select("status")
            .eq("club_id", club_id)
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )

        if member_response.data:
            return member_response.data[0]["status"]

        # 2. 가입 신청 상태 확인
        application_response = (
            self.supabase
            .table("club_applications")
            .select("status")
            .eq("club_id", club_id)
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )

        if application_response.data:
            return application_response.data[0]["status"]

        # 3. 아무 기록도 없으면 아직 신청하지 않음
        return None

    # -----------------------------------------------------
    # 종목명으로 sports 조회
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
                "club_id, club_name, club_intro, "
                "max_members, activity_frequency, status"
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
    # 동호회 가입 질문 조회
    # -----------------------------------------------------
    def get_join_questions(
        self,
        club_id: int,
    ):
        response = (
            self.supabase
            .table("club_join_questions")
            .select(
                "question_id, club_id, question_text, "
                "question_type, required, display_order"
            )
            .eq("club_id", club_id)
            .order("display_order")
            .execute()
        )

        return response.data or []


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

            return response.data

    # -----------------------------------------------------
    # 동호회 가입 신청서 저장
    #
    # 1. club_applications에 가입 신청 생성
    # 2. club_join_answers에 추가 질문 답변 저장
    # -----------------------------------------------------
    def create_application(
            self,
            club_id: int,
            user_id: str,
            application_message: str,
            answers: list,
        ):

            # 1. 가입 신청 생성
            application_data = {
                "club_id": club_id,
                "user_id": user_id,
                "application_message": application_message,
                "status": "pending",
            }

            application_response = (
                self.supabase
                .table("club_applications")
                .insert(application_data)
                .execute()
            )

            if not application_response.data:
                raise ValueError(
                    "가입 신청 저장에 실패했습니다."
                )

            application = application_response.data[0]

            application_id = application["application_id"]

            # 2. 추가 질문 답변 저장
            answer_data = []

            for answer in answers:
                answer_data.append(
                    {
                        "application_id": application_id,
                        "question_id": answer["question_id"],
                        "answer_text": answer["answer_text"],
                    }
                )

            # 답변이 있을 때만 INSERT
            if answer_data:
                (
                    self.supabase
                    .table("club_join_answers")
                    .insert(answer_data)
                    .execute()
                )

            return application

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
                    "club_schedule_id, day_of_week, "
                    "start_time, end_time"
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