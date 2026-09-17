from typing import Optional
from app.core.supabase import get_supabase_admin_client
# ---------------------------------------------------------
# 동호회 관련 Supabase 작업을 담당하는 Repository
#
# 동호회 탐색 시 Supabase의 search_clubs() 함수를 호출한다.
# ---------------------------------------------------------
class ClubRepository:
    def __init__(self):
        self.supabase = get_supabase_admin_client()
        # -----------------------------------------------------
        # 동호회 검색
        #
        # 검색 조건:
        # - keyword: 동호회 이름/소개 검색
        # - sport: 운동 종목
        # - region: 활동 지역
        # - day: 활동 요일
        # - atmosphere: 동호회 분위기
        #
        # Supabase 함수:
        # search_clubs()
        # -----------------------------------------------------
        # Optional[str] = None -> 검색어로 문자열을 받을 수 있고 검색어가 없어도 된다
    def search_clubs(
        self,
        keyword: Optional[str] = None,
        sport_name: Optional[str] = None,
        region: Optional[str] = None,
        day_of_week: Optional[str] = None,
        atmosphere: Optional[str] = None,
    ):
        params = {
            "p_keyword": keyword,
            "p_sport_name": sport_name,
            "p_region": region,
            "p_day_of_week": day_of_week,
            "p_atmosphere": atmosphere,
        }
        response = self.supabase.rpc(
            "search_clubs",
            params
        ).execute()

        return response.data

    # -----------------------------------------------------
    # 동호회 상세 조회
    #
    # clubs 테이블의 기본 정보와
    # 운동 종목 / 지역 / 활동 시간 / 분위기 / 이미지를
    # 함께 조회한다.
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

        # -------------------------------------------------
        # 2. 운동 종목 조회
        # club_sports → sports
        # -------------------------------------------------
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

        # -------------------------------------------------
        # 3. 활동 지역 조회
        # -------------------------------------------------
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

        # -------------------------------------------------
        # 4. 활동 시간 조회
        # -------------------------------------------------
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

        # -------------------------------------------------
        # 5. 동호회 분위기 조회
        # -------------------------------------------------
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

        # -------------------------------------------------
        # 6. 동호회 이미지 조회
        # display_order 순서대로 가져온다.
        # -------------------------------------------------
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

        # -------------------------------------------------
        # 7. 기존 clubs 데이터에 상세 정보를 추가
        # -------------------------------------------------
        club["sports"] = sports
        club["regions"] = regions
        club["schedules"] = schedules
        club["atmospheres"] = atmospheres
        club["images"] = images

        return club

    # -----------------------------------------------------
    # 동호회 가입 신청
    #
    # 가입 신청 상태는 pending으로 저장한다.
    # 운영자가 승인하면 나중에 active로 변경한다.
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
    #
    # 특정 사용자가 특정 동호회에 가입되어 있는지 확인한다.
    # -----------------------------------------------------
    def get_member_status(self, club_id: int, user_id: str):
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
    # 동호회 가입 질문 조회
    #
    # 운영자가 해당 동호회에 설정한 가입 질문을 가져온다.
    # display_order 순서대로 정렬한다.
    # -----------------------------------------------------
    def get_join_questions(self, club_id: int):
        response = (
            self.supabase
            .table("club_join_questions")
            .select(
                "question_id, club_id, question_text, question_type, required, display_order"
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
        # ---------------------------------------------
        # 1. 가입 신청 생성
        # ---------------------------------------------
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

        application = application_response.data[0]

        application_id = application["application_id"]

        # ---------------------------------------------
        # 2. 추가 질문 답변 저장
        # ---------------------------------------------
        answer_data = []

        for answer in answers:
            answer_data.append({
                "application_id": application_id,
                "question_id": answer["question_id"],
                "answer_text": answer["answer_text"],
            })

        # 답변이 있을 때만 INSERT
        if answer_data:
            (
                self.supabase
                .table("club_join_answers")
                .insert(answer_data)
                .execute()
            )

        return application