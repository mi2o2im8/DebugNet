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

    # =========================================================
    # 받은 pending 매칭 신청 수
    #
    # 현재 동호회가 target인 신청
    # =========================================================

    def count_received_pending_requests(
        self,
        club_id: int,
    ) -> int:

        response = (
            self.admin_client
            .table("club_matches")
            .select(
                "club_match_id",
                count="exact",
            )
            .eq(
                "target_club_id",
                club_id,
            )
            .eq(
                "status",
                "pending",
            )
            .execute()
        )

        return response.count or 0


    # =========================================================
    # 보낸 pending 매칭 신청 수
    #
    # 현재 동호회가 requester인 신청
    # =========================================================

    def count_sent_pending_requests(
        self,
        club_id: int,
    ) -> int:

        response = (
            self.admin_client
            .table("club_matches")
            .select(
                "club_match_id",
                count="exact",
            )
            .eq(
                "requester_club_id",
                club_id,
            )
            .eq(
                "status",
                "pending",
            )
            .execute()
        )

        return response.count or 0


    # =========================================================
    # 현재 동호회가 참여하는 확정 경기 조회
    #
    # approved
    # + 취소 요청 진행 중인 경기
    #
    # 취소 요청 중이라고 해서 경기 자체가
    # 확정 목록 / 캘린더에서 사라지면 안 된다.
    # =========================================================

    def find_approved_matches_by_club(
        self,
        club_id: int,
    ) -> list[dict]:

        response = (
            self.admin_client
            .table("club_matches")
            .select(
                "club_match_id,"
                "availability_id,"
                "requester_club_id,"
                "target_club_id,"
                "event_id,"
                "status"
            )
            .in_(
                "status",
                [
                    "approved",
                    "cancel_requested_by_target",
                    "cancel_requested_by_requester",
                ],
            )
            .or_(
                f"requester_club_id.eq.{club_id},"
                f"target_club_id.eq.{club_id}"
            )
            .execute()
        )

        return response.data or []


    # =========================================================
    # availability 여러 건 한 번에 조회
    #
    # Summary:
    # - match_date 확인
    #
    # 매칭관리 목록:
    # - 종목
    # - 날짜 / 시간
    # - 지역 / 장소
    #
    # 에서 공통 사용
    # =========================================================

    def find_availabilities_by_ids(
        self,
        availability_ids: list[int],
    ) -> list[dict]:

        if not availability_ids:
            return []

        response = (
            self.admin_client
            .table("club_match_availabilities")
            .select(
                "availability_id,"
                "club_id,"
                "sport_id,"
                "match_date,"
                "start_time,"
                "end_time,"
                "region,"
                "location_name"
            )
            .in_(
                "availability_id",
                availability_ids,
            )
            .execute()
        )

        return response.data or []

    # =========================================================
    # 현재 동호회가 작성한 후기 수
    # =========================================================

    def count_written_reviews(
        self,
        club_id: int,
    ) -> int:

        response = (
            self.admin_client
            .table("match_reviews")
            .select(
                "match_review_id",
                count="exact",
            )
            .eq(
                "reviewer_club_id",
                club_id,
            )
            .execute()
        )

        return response.count or 0


    # =========================================================
    # 현재 동호회가 받은 후기 수
    # =========================================================

    def count_received_reviews(
        self,
        club_id: int,
    ) -> int:

        response = (
            self.admin_client
            .table("match_reviews")
            .select(
                "match_review_id",
                count="exact",
            )
            .eq(
                "target_club_id",
                club_id,
            )
            .execute()
        )

        return response.count or 0

    # =========================================================
    # 받은 매칭 신청 목록 조회
    #
    # 현재 동호회가 target인
    # pending 신청만 조회
    # =========================================================

    def find_received_pending_matches(
        self,
        club_id: int,
    ) -> list[dict]:

        response = (
            self.admin_client
            .table("club_matches")
            .select(
                "club_match_id,"
                "availability_id,"
                "requester_club_id,"
                "target_club_id,"
                "event_id,"
                "status,"
                "created_at"
            )
            .eq(
                "target_club_id",
                club_id,
            )
            .eq(
                "status",
                "pending",
            )
            .order(
                "created_at",
                desc=True,
            )
            .execute()
        )

        return response.data or []


    # =========================================================
    # 보낸 매칭 신청 목록 조회
    #
    # 현재 동호회가 requester인
    # pending 신청만 조회
    # =========================================================

    def find_sent_pending_matches(
        self,
        club_id: int,
    ) -> list[dict]:

        response = (
            self.admin_client
            .table("club_matches")
            .select(
                "club_match_id,"
                "availability_id,"
                "requester_club_id,"
                "target_club_id,"
                "event_id,"
                "status,"
                "created_at"
            )
            .eq(
                "requester_club_id",
                club_id,
            )
            .eq(
                "status",
                "pending",
            )
            .order(
                "created_at",
                desc=True,
            )
            .execute()
        )

        return response.data or []

    # =========================================================
    # 여러 매칭의 경기 결과 조회
    #
    # upcoming / history 목록에서
    # 경기 기록 상태를 계산할 때 사용
    #
    # club_match_id 기준으로 club_match_results 조회
    # =========================================================

    def find_match_results_by_match_ids(
        self,
        club_match_ids: list[int],
    ) -> list[dict]:

        # 조회할 매칭이 없으면
        # DB 호출 없이 빈 리스트 반환
        if not club_match_ids:
            return []

        response = (
            self.admin_client
            .table("club_match_results")
            .select(
                "match_result_id,"
                "club_match_id,"
                "home_score,"
                "away_score,"
                "submitted_by,"
                "home_approval_status,"
                "away_approval_status,"
                "status,"
                "created_at,"
                "confirmed_at"
            )
            .in_(
                "club_match_id",
                club_match_ids,
            )
            .execute()
        )

        return response.data or []

    # =========================================================
    # 내가 작성한 경기 후기 목록 조회
    #
    # reviewer_club_id = 현재 동호회
    # =========================================================

    def find_written_reviews_by_club(
        self,
        club_id: int,
    ) -> list[dict]:

        response = (
            self.admin_client
            .table("match_reviews")
            .select(
                "match_review_id,"
                "club_match_id,"
                "reviewer_user_id,"
                "reviewer_club_id,"
                "target_club_id,"
                "created_at"
            )
            .eq(
                "reviewer_club_id",
                club_id,
            )
            .order(
                "created_at",
                desc=True,
            )
            .execute()
        )

        return response.data or []


    # =========================================================
    # 내가 받은 경기 후기 목록 조회
    #
    # target_club_id = 현재 동호회
    # =========================================================

    def find_received_reviews_by_club(
        self,
        club_id: int,
    ) -> list[dict]:

        response = (
            self.admin_client
            .table("match_reviews")
            .select(
                "match_review_id,"
                "club_match_id,"
                "reviewer_user_id,"
                "reviewer_club_id,"
                "target_club_id,"
                "created_at"
            )
            .eq(
                "target_club_id",
                club_id,
            )
            .order(
                "created_at",
                desc=True,
            )
            .execute()
        )

        return response.data or []


    # =========================================================
    # club_match_id 여러 개로 매칭 정보 조회
    #
    # 후기 목록
    # → review
    # → club_match_id
    # → club_matches
    # → availability_id
    #
    # 연결에 사용
    # =========================================================

    def find_matches_by_ids(
        self,
        club_match_ids: list[int],
    ) -> list[dict]:

        if not club_match_ids:
            return []

        response = (
            self.admin_client
            .table("club_matches")
            .select(
                "club_match_id,"
                "availability_id,"
                "requester_club_id,"
                "target_club_id,"
                "event_id,"
                "status,"
                "created_at,"
                "responded_at,"
                "approved_at"
            )
            .in_(
                "club_match_id",
                club_match_ids,
            )
            .execute()
        )

        return response.data or []

    # =========================================================
    # 여러 경기 중
    # 현재 동호회가 작성한 후기 조회
    #
    # history 목록의
    # has_written_review 계산용
    # =========================================================

    def find_written_reviews_by_match_ids(
        self,
        club_id: int,
        club_match_ids: list[int],
    ) -> list[dict]:

        if not club_match_ids:
            return []

        response = (
            self.admin_client
            .table("match_reviews")
            .select(
                "match_review_id,"
                "club_match_id,"
                "reviewer_club_id,"
                "target_club_id"
            )
            .eq(
                "reviewer_club_id",
                club_id,
            )
            .in_(
                "club_match_id",
                club_match_ids,
            )
            .execute()
        )

        return response.data or []


    # =========================================================
    # 여러 경기 중
    # 현재 동호회가 받은 후기 조회
    #
    # history 목록의
    # has_received_review 계산용
    # =========================================================

    def find_received_reviews_by_match_ids(
        self,
        club_id: int,
        club_match_ids: list[int],
    ) -> list[dict]:

        if not club_match_ids:
            return []

        response = (
            self.admin_client
            .table("match_reviews")
            .select(
                "match_review_id,"
                "club_match_id,"
                "reviewer_club_id,"
                "target_club_id"
            )
            .eq(
                "target_club_id",
                club_id,
            )
            .in_(
                "club_match_id",
                club_match_ids,
            )
            .execute()
        )

        return response.data or []

    # =========================================================
    # 매칭 관리 상세용
    # club_match_id 단건 조회
    #
    # GET
    # /api/matches/management/{club_id}/matches/{club_match_id}
    #
    # 여기서는 club_matches의 연결 정보만 가져오고,
    # 경기 가능일 / 동호회 / 종목 / 결과 / 후기 정보는
    # Service에서 각각 조합한다.
    # =========================================================

    def find_match_by_id(
        self,
        club_match_id: int,
    ) -> dict | None:

        response = (
            self.admin_client
            .table("club_matches")
            .select(
                "club_match_id,"
                "availability_id,"
                "requester_club_id,"
                "target_club_id,"
                "event_id,"
                "status,"
                "created_at,"
                "responded_at,"
                "approved_at"
            )
            .eq(
                "club_match_id",
                club_match_id,
            )
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    # =========================================================
    # 매칭 신청 상태 / 연결 정보 수정
    #
    # 승인:
    # - status = approved
    # - event_id 저장
    # - responded_at 저장
    # - approved_at 저장
    #
    # 거절:
    # - status = rejected
    # - responded_at 저장
    # =========================================================

    def update_match(
        self,
        club_match_id: int,
        update_data: dict,
    ) -> dict | None:

        response = (
            self.admin_client
            .table("club_matches")
            .update(
                update_data
            )
            .eq(
                "club_match_id",
                club_match_id,
            )
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]


    # =========================================================
    # 경기 가능일 모집 상태 변경
    #
    # 매칭이 승인되면
    # open → matched
    #
    # 더 이상 다른 팀이 신청할 수 없게 한다.
    # =========================================================

    def update_availability_status(
        self,
        availability_id: int,
        availability_status: str,
    ) -> dict | None:

        response = (
            self.admin_client
            .table(
                "club_match_availabilities"
            )
            .update(
                {
                    "status": availability_status,
                }
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
    # 승인된 신청을 제외한
    # 같은 경기 가능일의 나머지 pending 신청 거절
    #
    # 예:
    #
    # A팀 신청 pending
    # B팀 신청 pending  ← 승인
    # C팀 신청 pending
    #
    # 승인 후:
    #
    # A팀 rejected
    # B팀 approved
    # C팀 rejected
    # =========================================================

    def reject_other_pending_matches(
        self,
        availability_id: int,
        approved_club_match_id: int,
        responded_at: str,
    ) -> list[dict]:

        response = (
            self.admin_client
            .table("club_matches")
            .update(
                {
                    "status": "rejected",
                    "responded_at": responded_at,
                }
            )
            .eq(
                "availability_id",
                availability_id,
            )
            .eq(
                "status",
                "pending",
            )
            .neq(
                "club_match_id",
                approved_club_match_id,
            )
            .execute()
        )

        return response.data or []

    # =========================================================
    # 경기 결과 단건 조회
    #
    # 한 경기(club_match_id)에는
    # 하나의 club_match_results를 사용한다.
    # =========================================================

    def find_match_result_by_match_id(
        self,
        club_match_id: int,
    ) -> dict | None:

        response = (
            self.admin_client
            .table("club_match_results")
            .select(
                "match_result_id,"
                "club_match_id,"
                "home_score,"
                "away_score,"
                "submitted_by,"
                "home_approval_status,"
                "away_approval_status,"
                "status,"
                "created_at,"
                "confirmed_at"
            )
            .eq(
                "club_match_id",
                club_match_id,
            )
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]


    # =========================================================
    # 경기 결과 최초 생성
    #
    # 아직 club_match_results가 없는 경기에서 사용
    # =========================================================

    def create_match_result(
        self,
        result_data: dict,
    ) -> dict:

        response = (
            self.admin_client
            .table("club_match_results")
            .insert(
                result_data
            )
            .execute()
        )

        if not response.data:

            raise RuntimeError(
                "경기 결과 저장에 실패했습니다."
            )

        return response.data[0]


    # =========================================================
    # 경기 결과 수정 / 재제출 / 승인
    #
    # 기존 match_result_id 한 건을 수정한다.
    # =========================================================

    def update_match_result(
        self,
        match_result_id: int,
        update_data: dict,
    ) -> dict | None:

        response = (
            self.admin_client
            .table("club_match_results")
            .update(
                update_data
            )
            .eq(
                "match_result_id",
                match_result_id,
            )
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    # =========================================================
    # 특정 경기에서
    # 현재 동호회가 이미 작성한 후기인지 확인
    #
    # 한 경기당 한 동호회는 후기 1개만 작성
    # =========================================================

    def find_match_review_by_reviewer_club(
        self,
        club_match_id: int,
        reviewer_club_id: int,
    ) -> dict | None:

        response = (
            self.admin_client
            .table("match_reviews")
            .select(
                "match_review_id,"
                "club_match_id,"
                "reviewer_user_id,"
                "reviewer_club_id,"
                "target_club_id,"
                "manner_score,"
                "punctuality_score,"
                "roster_accuracy_score,"
                "safety_score,"
                "game_flow_score,"
                "rematch_score,"
                "content,"
                "created_at"
            )
            .eq(
                "club_match_id",
                club_match_id,
            )
            .eq(
                "reviewer_club_id",
                reviewer_club_id,
            )
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    # =========================================================
    # 특정 경기에서
    # 현재 동호회가 받은 후기 단건 조회
    #
    # received 후기 상세 조회용
    #
    # target_club_id = 현재 동호회
    # =========================================================

    def find_received_match_review(
        self,
        club_match_id: int,
        target_club_id: int,
    ) -> dict | None:

        response = (
            self.admin_client
            .table("match_reviews")
            .select(
                "match_review_id,"
                "club_match_id,"
                "reviewer_user_id,"
                "reviewer_club_id,"
                "target_club_id,"
                "manner_score,"
                "punctuality_score,"
                "roster_accuracy_score,"
                "safety_score,"
                "game_flow_score,"
                "rematch_score,"
                "content,"
                "created_at"
            )
            .eq(
                "club_match_id",
                club_match_id,
            )
            .eq(
                "target_club_id",
                target_club_id,
            )
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]


    # =========================================================
    # 경기 후기 생성
    # =========================================================

    def create_match_review(
        self,
        review_data: dict,
    ) -> dict:

        response = (
            self.admin_client
            .table("match_reviews")
            .insert(
                review_data
            )
            .execute()
        )

        if not response.data:

            raise RuntimeError(
                "경기 후기 저장에 실패했습니다."
            )

        return response.data[0]


    # =========================================================
    # 동호회 운영진(owner / manager) user_id 목록 조회
    # =========================================================

    def find_club_manager_user_ids(
        self,
        club_id: int,
    ) -> list[str]:

        response = (
            self.admin_client
            .table("club_members")
            .select("user_id")
            .eq("club_id", club_id)
            .eq("status", "active")
            .in_("role", ["owner", "manager"])
            .execute()
        )

        return [
            row["user_id"]
            for row in (response.data or [])
            if row.get("user_id")
        ]


    # =========================================================
    # 팀매칭 알림 생성 (여러 명에게 한 번에)
    #
    # notification_type
    # - team_matching           : 매칭 신청 받음
    # - team_matching_approved  : 내 신청이 승인됨
    # - team_matching_rejected  : 내 신청이 거절됨
    # - activity_review         : 상대 동호회가 경기 후기를 남김
    # =========================================================

    def create_match_notifications(
        self,
        user_ids: list[str],
        title: str,
        content: str,
        club_id: int,
        notification_type: str = "team_matching",
        link_path: str | None = None,
    ) -> None:

        if not user_ids:
            return

        rows = []

        for uid in user_ids:
            row = {
                "user_id": uid,
                "notification_type": notification_type,
                "title": title,
                "content": content,
                "related_type": "club",
                "related_id": club_id,
                "is_read": False,
            }

            # 이동 경로를 직접 지정하는 알림만 link_path 저장
            if link_path:
                row["link_path"] = link_path

            rows.append(row)

        self.admin_client.table("notifications").insert(rows).execute()