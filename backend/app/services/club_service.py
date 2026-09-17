from typing import Optional
from app.repositories.club_repository import ClubRepository

# ---------------------------------------------------------
# 동호회 관련 비즈니스 로직을 담당하는 Service
# ---------------------------------------------------------
class ClubService:
    def __init__(self):
        self.club_repository = ClubRepository()

    # -----------------------------------------------------
    # 동호회 검색
    # -----------------------------------------------------
    def search_clubs(
            self,
            keyword: Optional[str] = None,
            sport_name: Optional[str] = None,
            region: Optional[str] = None,
            day_of_week: Optional[str] = None,
            atmosphere: Optional[str] = None,
    ):
        return self.club_repository.search_clubs(
            keyword=keyword,
            sport_name=sport_name,
            region=region,
            day_of_week=day_of_week,
            atmosphere=atmosphere,
        )
    
    # -----------------------------------------------------
    # 동호회 상세 조회
    # -----------------------------------------------------
    def get_club_by_id(self, club_id: int):
        return self.club_repository.get_club_by_id(club_id)

    # -----------------------------------------------------
    # 동호회 가입 질문 조회
    # -----------------------------------------------------
    def get_join_questions(self, club_id: int):
        return self.club_repository.get_join_questions(
            club_id=club_id
        )

    # -----------------------------------------------------
    # 동호회 가입 신청
    # -----------------------------------------------------
    def create_join_request(
        self,
        club_id: int,
        user_id: str,
    ):
        return self.club_repository.create_join_request(
            club_id=club_id,
            user_id=user_id,
        )

    # -----------------------------------------------------
    # 동호회 가입 상태 조회
    # -----------------------------------------------------
    def get_member_status(
        self,
        club_id: int,
        user_id: str,
    ):
        return self.club_repository.get_member_status(
            club_id=club_id,
            user_id=user_id,
        )

    # -----------------------------------------------------
    # 동호회 가입 신청서 저장
    # -----------------------------------------------------
    def create_application(
        self,
        club_id: int,
        user_id: str,
        application_message: str,
        answers: list,
    ):
        return self.club_repository.create_application(
            club_id=club_id,
            user_id=user_id,
            application_message=application_message,
            answers=answers,
        )