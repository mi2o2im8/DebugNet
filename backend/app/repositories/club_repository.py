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