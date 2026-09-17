from typing import Optional
from fastapi import APIRouter, Query
from app.services.club_service import ClubService

router = APIRouter(
    prefix="/api/clubs",
    tags = ["clubs"],
)

club_service = ClubService()
# ---------------------------------------------------------
# 동호회 검색
#
# GET /api/clubs/search
#
# 검색 조건:
# - keyword
# - sport_name
# - region
# - day_of_week
# - atmosphere
# ---------------------------------------------------------
@router.get("/search")
def search_clubs(
    keyword: Optional[str] = Query(default=None),
    sport_name: Optional[str] = Query(default=None),
    region: Optional[str] = Query(default=None),
    day_of_week: Optional[str] = Query(default=None),
    atmosphere: Optional[str] = Query(default=None),
):
    return club_service.search_clubs(
        keyword=keyword,
        sport_name=sport_name,
        region=region,
        day_of_week=day_of_week,
        atmosphere=atmosphere,
    )