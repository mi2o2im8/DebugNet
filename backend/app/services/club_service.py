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