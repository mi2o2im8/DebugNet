from datetime import date
from app.core.supabase import (
    get_supabase_admin_client,
)


class MatchRepository:

    def __init__(self):

        # Secret Key 기반 Admin Client
        # Backend 내부에서만 사용한다.
        self.admin_client = (
            get_supabase_admin_client()
        )


    # =====================================================
    # 활성 종목 단건 조회
    # =====================================================
    def find_active_sport_by_id(
        self,
        sport_id: int,
    ) -> dict | None:

        response = (
            self.admin_client
            .table("sports")
            .select(
                "sport_id, sport_name, status"
            )
            .eq(
                "sport_id",
                sport_id,
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


    # =====================================================
    # 경기 가능일 등록
    # =====================================================
    def create_availability(
        self,
        availability_data: dict,
    ) -> dict:

        response = (
            self.admin_client
            .table(
                "club_match_availabilities"
            )
            .insert(
                availability_data
            )
            .execute()
        )

        if not response.data:
            raise RuntimeError(
                "경기 가능일 저장에 실패했습니다."
            )

        return response.data[0]


    # =========================================================
    # 경기 가능일 수정
    #
    # PATCH /api/matches/availabilities/{availability_id}
    # 에서 사용
    # =========================================================

    def update_availability(
        self,
        availability_id: int,
        update_data: dict,
    ) -> dict | None:

        response = (
            self.admin_client
            .table("club_match_availabilities")
            .update(
                update_data
            )
            .eq(
                "availability_id",
                availability_id,
            )
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]


    # =========================================================
    # 활성 종목 전체 조회
    # =========================================================

    def find_active_sports(
        self,
    ) -> list[dict]:

        response = (
            self.admin_client
            .table("sports")
            .select(
                "sport_id, sport_name"
            )
            .eq(
                "status",
                True,
            )
            .order(
                "sport_id"
            )
            .execute()
        )

        return response.data or []


    # =========================================================
    # clubs.owner_id 기준
    # 내가 소유한 활성 동호회 조회
    # =========================================================

    def find_owned_clubs(
        self,
        user_id: str,
    ) -> list[dict]:

        response = (
            self.admin_client
            .table("clubs")
            .select(
                "club_id, club_name"
            )
            .eq(
                "owner_id",
                user_id,
            )
            .eq(
                "status",
                True,
            )
            .execute()
        )

        return response.data or []


    # =========================================================
    # club_members 기준
    # owner / manager인 활성 동호회 ID 조회
    # =========================================================

    def find_managed_memberships(
        self,
        user_id: str,
    ) -> list[dict]:

        response = (
            self.admin_client
            .table("club_members")
            .select(
                "club_id, role"
            )
            .eq(
                "user_id",
                user_id,
            )
            .eq(
                "status",
                "active",
            )
            .in_(
                "role",
                [
                    "owner",
                    "manager",
                ],
            )
            .execute()
        )

        return response.data or []


    # =========================================================
    # club_id 목록으로 활성 동호회 조회
    # =========================================================

    def find_clubs_by_ids(
        self,
        club_ids: list[int],
    ) -> list[dict]:

        if not club_ids:
            return []

        response = (
            self.admin_client
            .table("clubs")
            .select(
                "club_id, club_name"
            )
            .in_(
                "club_id",
                club_ids,
            )
            .eq(
                "status",
                True,
            )
            .execute()
        )

        return response.data or []


    # =========================================================
    # 동호회 대표 이미지 조회
    # =========================================================

    def find_representative_images(
        self,
        club_ids: list[int],
    ) -> list[dict]:

        if not club_ids:
            return []

        response = (
            self.admin_client
            .table("club_images")
            .select(
                "club_id, image_url, display_order"
            )
            .in_(
                "club_id",
                club_ids,
            )
            .eq(
                "image_type",
                "representative",
            )
            .order(
                "display_order"
            )
            .execute()
        )

        return response.data or []

    # =========================================================
    # 여러 동호회의 경기 가능일 조회
    #
    # GET /api/matches/availabilities/my
    # 에서 사용
    # =========================================================

    def find_availabilities_by_club_ids(
        self,
        club_ids: list[int],
    ) -> list[dict]:

        if not club_ids:
            return []

        response = (
            self.admin_client
            .table("club_match_availabilities")
            .select(
                "*"
            )
            .in_(
                "club_id",
                club_ids,
            )
            .order(
                "match_date",
            )
            .order(
                "start_time",
            )
            .execute()
        )

        return response.data or []

    # =========================================================
    # 경기 가능일 상세 조회
    #
    # GET /api/matches/availabilities/{availability_id}
    # 에서 사용
    # =========================================================

    def find_availability_by_id(
        self,
        availability_id: int,
    ) -> dict | None:

        response = (
            self.admin_client
            .table("club_match_availabilities")
            .select("*")
            .eq(
                "availability_id",
                availability_id,
            )
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]


    # =========================================================
    # 해당 경기 가능일에 들어온 매칭 신청 수 조회
    #
    # 삭제 전에
    # "3건의 매칭 신청이 있습니다."
    # 같은 안내를 하기 위해 사용
    # =========================================================

    def count_match_requests_for_availability(
        self,
        availability_id: int,
    ) -> int:

        response = (
            self.admin_client
            .table("club_matches")
            .select(
                "club_match_id",
                count="exact",
            )
            .eq(
                "availability_id",
                availability_id,
            )
            .execute()
        )

        return response.count or 0


    # =========================================================
    # 해당 경기 가능일에 연결된 매칭 신청 삭제
    #
    # 사용자가 최종 삭제를 확인했을 때 사용
    # =========================================================

    def delete_match_requests_by_availability(
        self,
        availability_id: int,
    ) -> None:

        (
            self.admin_client
            .table("club_matches")
            .delete()
            .eq(
                "availability_id",
                availability_id,
            )
            .execute()
        )


    # =========================================================
    # 경기 가능일 삭제
    #
    # 연결된 매칭 신청을 정리한 뒤
    # club_match_availabilities의 원본 글 삭제
    # =========================================================

    def delete_availability(
        self,
        availability_id: int,
    ) -> bool:

        response = (
            self.admin_client
            .table("club_match_availabilities")
            .delete()
            .eq(
                "availability_id",
                availability_id,
            )
            .execute()
        )

        return bool(response.data)


    # =========================================================
    # 상대팀 경기 가능일 목록 조회
    #
    # GET /api/matches/availabilities
    #
    # 조건:
    # - 모집 중(open)
    # - 지난 경기 제외
    # - 날짜 / 종목 / 지역 선택 필터
    #
    # 내 동호회 제외 처리는 Service에서 한다.
    # =========================================================

    def find_open_availabilities(
        self,
        match_date: date | None = None,
        sport_id: int | None = None,
        region: str | None = None,
    ) -> list[dict]:

        query = (
            self.admin_client
            .table("club_match_availabilities")
            .select("*")
            .eq(
                "status",
                "open",
            )
        )

        # -----------------------------------------------------
        # 날짜
        #
        # 날짜를 선택한 경우
        # → 해당 날짜만 조회
        #
        # 날짜를 선택하지 않은 경우
        # → 오늘 이후 경기만 조회
        # -----------------------------------------------------
        if match_date is not None:

            query = query.eq(
                "match_date",
                match_date.isoformat(),
            )

        else:

            query = query.gte(
                "match_date",
                date.today().isoformat(),
            )


        # -----------------------------------------------------
        # 종목
        # -----------------------------------------------------
        if sport_id is not None:

            query = query.eq(
                "sport_id",
                sport_id,
            )


        # -----------------------------------------------------
        # 지역
        # -----------------------------------------------------
        if region is not None:

            query = query.eq(
                "region",
                region,
            )


        # -----------------------------------------------------
        # 경기 날짜 → 시작 시간 순으로 정렬
        # -----------------------------------------------------
        response = (
            query
            .order(
                "match_date",
            )
            .order(
                "start_time",
            )
            .execute()
        )

        return response.data or []


    # =========================================================
    # 같은 경기 가능일에 이미 진행 중인 신청이 있는지 확인
    #
    # pending / approved 상태가 이미 있으면
    # 중복 신청으로 본다.
    #
    # rejected 상태라면 다시 신청할 수 있도록 제외한다.
    # =========================================================

    def find_existing_match_request(
        self,
        availability_id: int,
        requester_club_id: int,
    ) -> dict | None:

        response = (
            self.admin_client
            .table("club_matches")
            .select("*")
            .eq(
                "availability_id",
                availability_id,
            )
            .eq(
                "requester_club_id",
                requester_club_id,
            )
            .in_(
                "status",
                [
                    "pending",
                    "approved",
                ],
            )
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]


    # =========================================================
    # 매칭 신청 생성
    #
    # POST /api/matches/requests
    # =========================================================

    def create_match_request(
        self,
        match_request_data: dict,
    ) -> dict:

        response = (
            self.admin_client
            .table("club_matches")
            .insert(
                match_request_data
            )
            .execute()
        )

        if not response.data:
            raise RuntimeError(
                "매칭 신청 저장에 실패했습니다."
            )

        return response.data[0]

    # =========================================================
    # 현재 사용자의 동호회들이
    # 특정 경기 가능일에 보낸 매칭 신청 조회
    #
    # 경기 상세 조회에서:
    # - has_requested
    # - my_requests
    # 를 만들 때 사용
    #
    # pending / approved만 조회
    # rejected는 재신청 가능하므로 제외
    # =========================================================

    def find_my_match_requests(
        self,
        availability_id: int,
        requester_club_ids: list[int],
    ) -> list[dict]:

        # 관리하는 동호회가 하나도 없으면
        # DB 조회 없이 바로 빈 리스트 반환
        if not requester_club_ids:
            return []

        response = (
            self.admin_client
            .table("club_matches")
            .select(
                "club_match_id,"
                "requester_club_id,"
                "status"
            )
            .eq(
                "availability_id",
                availability_id,
            )
            .in_(
                "requester_club_id",
                requester_club_ids,
            )
            .in_(
                "status",
                [
                    "pending",
                    "approved",
                ],
            )
            .order(
                "created_at",
            )
            .execute()
        )

        return response.data or []