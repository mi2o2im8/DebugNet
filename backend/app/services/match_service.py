from datetime import (
    date,
    datetime,
    timezone,
)

from app.repositories.club_repository import (
    ClubRepository,
)

from app.repositories.club_event_repository import (
    ClubEventRepository,
)

from app.repositories.match_repository import (
    MatchRepository,
)
from app.schemas.matches import (
    MatchAvailabilityCreateRequest,
    MatchAvailabilityCreateResponse,
    MatchAvailabilityResponse,
    MatchAvailabilityListResponse,
    MatchAvailabilityUpdateRequest,
    MatchAvailabilityUpdateResponse,
    MatchAvailabilityDeleteResponse,
    MatchClubOptionResponse,
    MatchOptionsResponse,
    MatchSportOptionResponse,
    MyMatchAvailabilityListResponse,
    MatchRequestableClubResponse,
    MatchRequestableClubsResponse,
    MatchRequestCreateRequest,
    MatchRequestCreateResponse,
    MatchAvailabilityDetailResponse,
    MyMatchRequestResponse,
    MatchManagementSummaryResponse,
    MatchManagementListItemResponse,
    MatchManagementListResponse,
    MatchManagementDetailResponse,
    MatchManagementActionResponse,
    MatchResultSubmitRequest,
    MatchResultResponse,
    MatchReviewCreateRequest,
    MatchReviewCreateResponse,
    MatchReviewDetailResponse,
)

# =========================================================
# 경기 가능일 삭제 재확인이 필요한 경우
# =========================================================

class MatchDeleteConfirmationRequired(Exception):

    def __init__(
        self,
        request_count: int,
    ):
        self.request_count = request_count

        super().__init__(
            f"{request_count}건의 매칭 신청이 있습니다. "
            "정말 삭제하시겠습니까?"
        )


class MatchService:

    def __init__(self):

        # 기존 동호회 Repository 재사용
        self.club_repository = ClubRepository()

        # 팀매칭 전용 Repository
        self.match_repository = MatchRepository()

        # 동호회 일정 Repository
        self.club_event_repository = (
            ClubEventRepository()
        )


    # =====================================================
    # 팀매칭 등록 권한 확인
    # =====================================================
    def validate_management_permission(
        self,
        club_id: int,
        user_id: str,
    ) -> None:

        # -------------------------------------------------
        # 1. 실제 활성 동호회인지 확인
        # -------------------------------------------------
        club = self.club_repository.find_club_by_id(
            club_id
        )

        if club is None:
            raise LookupError(
                "존재하지 않거나 비활성화된 동호회입니다."
            )


        # -------------------------------------------------
        # 2. 현재 사용자의 동호회 가입 정보 확인
        #
        # status = active인 회원만 조회
        # -------------------------------------------------
        membership = (
            self.club_repository
            .find_active_membership(
                club_id=club_id,
                user_id=user_id,
            )
        )

        if membership is None:
            raise PermissionError(
                "이 동호회의 팀매칭을 등록할 권한이 없습니다."
            )


        # -------------------------------------------------
        # 3. owner / manager만 등록 가능
        # -------------------------------------------------
        if membership["role"] not in {
            "owner",
            "manager",
        }:
            raise PermissionError(
                "동호회장 또는 운영진만 "
                "팀매칭을 등록할 수 있습니다."
            )


    # =====================================================
    # 동호회 운영진에게 팀매칭 알림 보내기 (공통)
    #
    # - 알림을 발생시킨 본인은 제외
    # - 알림 저장이 실패해도 매칭 기능은 정상 처리
    # =====================================================
    def notify_club_managers(
        self,
        club_id: int,
        title: str,
        content: str,
        notification_type: str,
        exclude_user_id: str | None = None,
        link_path: str | None = None,
    ) -> None:

        try:
            manager_ids = (
                self.match_repository
                .find_club_manager_user_ids(
                    club_id=club_id,
                )
            )

            manager_ids = [
                uid for uid in manager_ids
                if uid != exclude_user_id
            ]

            self.match_repository.create_match_notifications(
                user_ids=manager_ids,
                title=title,
                content=content,
                club_id=club_id,
                notification_type=notification_type,
                link_path=link_path,
            )

        except Exception as e:
            print("팀매칭 알림 생성 실패:", e)


    # =====================================================
    # 알림 문구용 경기 날짜 ("5월 3일")
    # =====================================================
    def format_match_date_label(
        self,
        match_date,
    ) -> str:

        try:
            if isinstance(match_date, str):
                match_date = date.fromisoformat(
                    match_date[:10]
                )

            return (
                f"{match_date.month}월 "
                f"{match_date.day}일"
            )

        except Exception:
            return "예정된"


    # =========================================================
    # 팀매칭 등록 옵션 조회
    #
    # GET /api/matches/options
    #
    # 반환:
    # - 현재 사용자가 owner / manager인 동호회
    # - 각 동호회의 대표 이미지
    # - 활성 종목 목록
    # =========================================================

    def get_match_options(
        self,
        user_id: str,
    ) -> MatchOptionsResponse:

        # -----------------------------------------------------
        # 1. clubs.owner_id 기준으로
        #    내가 직접 소유한 동호회 조회
        # -----------------------------------------------------
        owned_clubs = (
            self.match_repository
            .find_owned_clubs(
                user_id=user_id,
            )
        )


        # -----------------------------------------------------
        # 2. club_members 기준으로
        #    owner / manager인 동호회 조회
        # -----------------------------------------------------
        managed_memberships = (
            self.match_repository
            .find_managed_memberships(
                user_id=user_id,
            )
        )


        # -----------------------------------------------------
        # 3. 관리 중인 동호회 ID만 추출
        # -----------------------------------------------------
        managed_club_ids = list({
            membership["club_id"]
            for membership in managed_memberships
            if membership.get("club_id") is not None
        })


        # -----------------------------------------------------
        # 4. club_members에서 찾은 club_id들의
        #    실제 동호회 정보 조회
        # -----------------------------------------------------
        managed_clubs = (
            self.match_repository
            .find_clubs_by_ids(
                club_ids=managed_club_ids,
            )
            if managed_club_ids
            else []
        )


        # -----------------------------------------------------
        # 5. owner 기준 + club_members 기준 합치기
        #
        # 같은 사람이:
        #
        # clubs.owner_id에도 들어있고
        # club_members.role = owner에도 들어있을 수 있으므로
        # club_id 기준으로 중복 제거
        # -----------------------------------------------------
        club_map = {}

        for club in owned_clubs + managed_clubs:

            club_id = int(
                club["club_id"]
            )

            club_map[club_id] = {
                "club_id": club_id,
                "club_name": club["club_name"],
            }


        # -----------------------------------------------------
        # 6. 최종 동호회 ID 목록
        # -----------------------------------------------------
        club_ids = list(
            club_map.keys()
        )


        # -----------------------------------------------------
        # 7. 각 동호회의 대표 이미지 조회
        # -----------------------------------------------------
        representative_images = (
            self.match_repository
            .find_representative_images(
                club_ids=club_ids,
            )
            if club_ids
            else []
        )


        # -----------------------------------------------------
        # 8. club_id → 대표 이미지 URL Map
        #
        # 대표 이미지가 여러 개 잡히더라도
        # 첫 번째 이미지만 사용
        # -----------------------------------------------------
        image_map = {}

        for image in representative_images:

            club_id = int(
                image["club_id"]
            )

            if club_id not in image_map:
                image_map[club_id] = image.get(
                    "image_url"
                )


        # -----------------------------------------------------
        # 9. Frontend에서 사용할 동호회 목록 생성
        # -----------------------------------------------------
        club_options = []

        for club_id, club in club_map.items():

            club_options.append(
                MatchClubOptionResponse(
                    club_id=club_id,
                    club_name=club["club_name"],
                    club_profile_image=image_map.get(
                        club_id
                    ),
                )
            )


        # 보기 편하게 동호회 이름순 정렬
        club_options.sort(
            key=lambda club: club.club_name
        )


        # -----------------------------------------------------
        # 10. 활성 종목 목록 조회
        # -----------------------------------------------------
        sports = (
            self.match_repository
            .find_active_sports()
        )


        sport_options = [
            MatchSportOptionResponse(
                sport_id=int(
                    sport["sport_id"]
                ),
                sport_name=sport["sport_name"],
            )
            for sport in sports
        ]


        # -----------------------------------------------------
        # 11. 최종 Response
        # -----------------------------------------------------
        return MatchOptionsResponse(
            clubs=club_options,
            sports=sport_options,
        )


    # =====================================================
    # 경기 가능일 등록
    # =====================================================
    def create_availability(
        self,
        user_id: str,
        request_data: MatchAvailabilityCreateRequest,
    ) -> MatchAvailabilityCreateResponse:

        # -------------------------------------------------
        # 1. 해당 동호회를 운영할 권한이 있는지 확인
        # -------------------------------------------------
        self.validate_management_permission(
            club_id=request_data.club_id,
            user_id=user_id,
        )


        # -------------------------------------------------
        # 2. 실제 활성 종목인지 확인
        # -------------------------------------------------
        sport = (
            self.match_repository
            .find_active_sport_by_id(
                sport_id=request_data.sport_id
            )
        )

        if sport is None:
            raise LookupError(
                "존재하지 않거나 비활성화된 종목입니다."
            )


        # -------------------------------------------------
        # 3. 과거 날짜 등록 방지
        # -------------------------------------------------
        if request_data.match_date < date.today():
            raise ValueError(
                "지난 날짜에는 경기 가능일을 등록할 수 없습니다."
            )


        # -------------------------------------------------
        # 4. 생성 / 수정 시간
        # -------------------------------------------------
        now = datetime.now(
            timezone.utc
        ).isoformat()


        # -------------------------------------------------
        # 5. DB 저장 데이터 구성
        # -------------------------------------------------
        availability_data = {

            "club_id":
                request_data.club_id,

            "sport_id":
                request_data.sport_id,

            "match_date":
                request_data.match_date.isoformat(),

            "start_time":
                request_data.start_time.isoformat(),

            "end_time":
                request_data.end_time.isoformat(),

            "required_players":
                request_data.required_players,

            "skill_level":
                request_data.skill_level,

            "region":
                request_data.region,

            "location_name":
                request_data.location_name,

            "address":
                request_data.address,

            "latitude":
                request_data.latitude,

            "longitude":
                request_data.longitude,

            "parking_available":
                request_data.parking_available,

            "venue_type":
                request_data.venue_type,

            "venue_cost_negotiable":
                request_data.venue_cost_negotiable,

            "time_negotiable":
                request_data.time_negotiable,

            "intro":
                request_data.intro,

            # 새 경기 가능일은 열려 있는 상태
            "status": "open",

            "created_at": now,

            "updated_at": now,
        }


        # -------------------------------------------------
        # 6. club_match_availabilities INSERT
        # -------------------------------------------------
        availability = (
            self.match_repository
            .create_availability(
                availability_data
            )
        )


        # -------------------------------------------------
        # 7. Response
        # -------------------------------------------------
        return MatchAvailabilityCreateResponse(
            availability_id=int(
                availability["availability_id"]
            ),
        )


    # =========================================================
    # 내가 등록한 경기 가능일 조회
    #
    # GET /api/matches/availabilities/my
    #
    # 정확히는:
    # 현재 사용자가 owner / manager인 동호회들이
    # 등록한 경기 가능일 목록을 조회한다.
    # =========================================================

    def get_my_availabilities(
        self,
        user_id: str,
    ) -> MyMatchAvailabilityListResponse:

        # -----------------------------------------------------
        # 1. clubs.owner_id 기준으로
        #    내가 소유한 동호회 조회
        # -----------------------------------------------------
        owned_clubs = (
            self.match_repository
            .find_owned_clubs(
                user_id=user_id,
            )
        )


        # -----------------------------------------------------
        # 2. club_members 기준으로
        #    owner / manager인 동호회 조회
        # -----------------------------------------------------
        managed_memberships = (
            self.match_repository
            .find_managed_memberships(
                user_id=user_id,
            )
        )


        managed_club_ids = list({
            membership["club_id"]
            for membership in managed_memberships
            if membership.get("club_id") is not None
        })


        managed_clubs = (
            self.match_repository
            .find_clubs_by_ids(
                club_ids=managed_club_ids,
            )
            if managed_club_ids
            else []
        )


        # -----------------------------------------------------
        # 3. owner + manager 동호회 합치기
        #    club_id 기준 중복 제거
        # -----------------------------------------------------
        club_map = {}

        for club in owned_clubs + managed_clubs:

            club_id = int(
                club["club_id"]
            )

            club_map[club_id] = {
                "club_id": club_id,
                "club_name": club["club_name"],
            }


        club_ids = list(
            club_map.keys()
        )


        # -----------------------------------------------------
        # 4. 운영 가능한 동호회가 하나도 없으면
        #    빈 목록 반환
        # -----------------------------------------------------
        if not club_ids:
            return MyMatchAvailabilityListResponse(
                items=[],
                total_count=0,
            )


        # -----------------------------------------------------
        # 5. 해당 동호회들의 경기 가능일 조회
        # -----------------------------------------------------
        availabilities = (
            self.match_repository
            .find_availabilities_by_club_ids(
                club_ids=club_ids,
            )
        )


        # -----------------------------------------------------
        # 6. 동호회 대표 이미지 조회
        # -----------------------------------------------------
        representative_images = (
            self.match_repository
            .find_representative_images(
                club_ids=club_ids,
            )
        )


        image_map = {}

        for image in representative_images:

            club_id = int(
                image["club_id"]
            )

            # 대표 이미지가 여러 개라면 첫 번째만 사용
            if club_id not in image_map:
                image_map[club_id] = image.get(
                    "image_url"
                )


        # -----------------------------------------------------
        # 7. 종목 정보 조회
        #
        # sport_id → sport_name 변환용
        # -----------------------------------------------------
        sports = (
            self.match_repository
            .find_active_sports()
        )

        sport_map = {
            int(sport["sport_id"]): sport["sport_name"]
            for sport in sports
        }


        # -----------------------------------------------------
        # 8. Frontend Response 형태로 변환
        # -----------------------------------------------------
        items = []

        for availability in availabilities:

            club_id = int(
                availability["club_id"]
            )

            sport_id = int(
                availability["sport_id"]
            )


            items.append(
                MatchAvailabilityResponse(

                    availability_id=int(
                        availability["availability_id"]
                    ),

                    # 동호회
                    club_id=club_id,

                    club_name=(
                        club_map[club_id]["club_name"]
                    ),

                    club_profile_image=(
                        image_map.get(club_id)
                    ),

                    # 종목
                    sport_id=sport_id,

                    sport_name=(
                        sport_map.get(
                            sport_id,
                            "알 수 없는 종목",
                        )
                    ),

                    # 날짜 / 시간
                    match_date=availability[
                        "match_date"
                    ],

                    start_time=availability[
                        "start_time"
                    ],

                    end_time=availability.get(
                        "end_time"
                    ),

                    # 경기 조건
                    required_players=int(
                        availability["required_players"]
                    ),

                    skill_level=availability[
                        "skill_level"
                    ],

                    # 장소
                    region=availability[
                        "region"
                    ],

                    location_name=availability[
                        "location_name"
                    ],

                    address=availability.get(
                        "address"
                    ),

                    latitude=availability.get(
                        "latitude"
                    ),

                    longitude=availability.get(
                        "longitude"
                    ),

                    # 추가 조건
                    parking_available=availability.get(
                        "parking_available"
                    ),

                    venue_type=availability.get(
                        "venue_type"
                    ),

                    venue_cost_negotiable=availability.get(
                        "venue_cost_negotiable"
                    ),

                    time_negotiable=availability.get(
                        "time_negotiable"
                    ),

                    intro=availability.get(
                        "intro"
                    ),

                    # 상태
                    status=availability[
                        "status"
                    ],

                    created_at=availability[
                        "created_at"
                    ],

                    updated_at=availability[
                        "updated_at"
                    ],
                )
            )


        # -----------------------------------------------------
        # 9. 최종 Response
        # -----------------------------------------------------
        return MyMatchAvailabilityListResponse(
            items=items,
            total_count=len(items),
        )


    # =========================================================
    # 경기 가능일 수정
    #
    # PATCH /api/matches/availabilities/{availability_id}
    # =========================================================

    def update_availability(
        self,
        availability_id: int,
        user_id: str,
        request_data: MatchAvailabilityUpdateRequest,
    ) -> MatchAvailabilityUpdateResponse:

        # -----------------------------------------------------
        # 1. 기존 경기 가능일 조회
        # -----------------------------------------------------
        availability = (
            self.match_repository
            .find_availability_by_id(
                availability_id=availability_id,
            )
        )

        if availability is None:
            raise LookupError(
                "경기 가능일을 찾을 수 없습니다."
            )


        # -----------------------------------------------------
        # 2. 해당 동호회의 owner / manager인지 확인
        #
        # 프론트에서 club_id를 받지 않고,
        # 기존 availability의 club_id를 기준으로 검사한다.
        # -----------------------------------------------------
        club_id = int(
            availability["club_id"]
        )

        self.validate_management_permission(
            club_id=club_id,
            user_id=user_id,
        )


        # -----------------------------------------------------
        # 3. PATCH로 실제 전달된 필드만 가져오기
        #
        # 보내지 않은 값은 기존 값 유지
        # -----------------------------------------------------
        update_data = request_data.model_dump(
            exclude_unset=True
        )

        if not update_data:
            raise ValueError(
                "수정할 내용이 없습니다."
            )


        # -----------------------------------------------------
        # 4. DB에서 NULL이면 안 되는 주요 값에
        #    명시적으로 null을 보내는 것 방지
        # -----------------------------------------------------
        required_fields = {
            "sport_id",
            "match_date",
            "start_time",
            "end_time",
            "required_players",
            "skill_level",
            "region",
            "location_name",
        }

        for field_name in required_fields:

            if (
                field_name in update_data
                and update_data[field_name] is None
            ):
                raise ValueError(
                    f"{field_name} 값은 비워둘 수 없습니다."
                )


        # -----------------------------------------------------
        # 5. sport_id를 수정하는 경우
        #    실제 활성 종목인지 확인
        # -----------------------------------------------------
        if "sport_id" in update_data:

            sport = (
                self.match_repository
                .find_active_sport_by_id(
                    sport_id=update_data["sport_id"],
                )
            )

            if sport is None:
                raise LookupError(
                    "존재하지 않거나 비활성화된 종목입니다."
                )


        # -----------------------------------------------------
        # 6. 수정 후 최종 날짜 계산
        #
        # PATCH에서 match_date가 안 왔다면 기존 날짜 사용
        # -----------------------------------------------------
        final_match_date = (
            update_data["match_date"]
            if "match_date" in update_data
            else date.fromisoformat(
                str(availability["match_date"])
            )
        )


        # 과거 날짜로 수정 방지
        if final_match_date < date.today():
            raise ValueError(
                "지난 날짜로 경기 가능일을 수정할 수 없습니다."
            )


        # -----------------------------------------------------
        # 7. 수정 후 최종 시작 / 종료 시간 계산
        #
        # start_time만 수정하거나
        # end_time만 수정하는 경우도 있기 때문에
        # 기존 값과 합쳐서 최종 시간을 검사한다.
        # -----------------------------------------------------
        final_start_time = (
            update_data["start_time"]
            if "start_time" in update_data
            else availability["start_time"]
        )

        final_end_time = (
            update_data["end_time"]
            if "end_time" in update_data
            else availability["end_time"]
        )


        # Supabase에서 time 값이 문자열로 들어오는 경우 처리
        if isinstance(
            final_start_time,
            str,
        ):
            final_start_time = (
                datetime.strptime(
                    final_start_time,
                    "%H:%M:%S",
                ).time()
            )


        if isinstance(
            final_end_time,
            str,
        ):
            final_end_time = (
                datetime.strptime(
                    final_end_time,
                    "%H:%M:%S",
                ).time()
            )


        if final_end_time <= final_start_time:
            raise ValueError(
                "종료 시간은 시작 시간보다 늦어야 합니다."
            )


        # -----------------------------------------------------
        # 8. Pydantic의 date / time 객체를
        #    Supabase 저장용 문자열로 변환
        # -----------------------------------------------------
        if "match_date" in update_data:
            update_data["match_date"] = (
                update_data["match_date"].isoformat()
            )

        if "start_time" in update_data:
            update_data["start_time"] = (
                update_data["start_time"].isoformat()
            )

        if "end_time" in update_data:
            update_data["end_time"] = (
                update_data["end_time"].isoformat()
            )


        # -----------------------------------------------------
        # 9. 수정 시간 갱신
        # -----------------------------------------------------
        update_data["updated_at"] = (
            datetime.now(
                timezone.utc
            ).isoformat()
        )


        # -----------------------------------------------------
        # 10. DB UPDATE
        # -----------------------------------------------------
        updated_availability = (
            self.match_repository
            .update_availability(
                availability_id=availability_id,
                update_data=update_data,
            )
        )

        if updated_availability is None:
            raise RuntimeError(
                "경기 가능일 수정에 실패했습니다."
            )


        # -----------------------------------------------------
        # 11. Response
        # -----------------------------------------------------
        return MatchAvailabilityUpdateResponse(
            availability_id=availability_id,
        )


    # =========================================================
    # 경기 가능일 삭제
    #
    # DELETE /api/matches/availabilities/{availability_id}
    #
    # confirm=false
    # → 신청이 있으면 삭제하지 않고 재확인 요청
    #
    # confirm=true
    # → 신청 삭제 후 경기 가능일 삭제
    # =========================================================

    def delete_availability(
        self,
        availability_id: int,
        user_id: str,
        confirm: bool = False,
    ) -> MatchAvailabilityDeleteResponse:

        # -----------------------------------------------------
        # 1. 경기 가능일 존재 확인
        # -----------------------------------------------------
        availability = (
            self.match_repository
            .find_availability_by_id(
                availability_id=availability_id,
            )
        )

        if availability is None:
            raise LookupError(
                "경기 가능일을 찾을 수 없습니다."
            )


        # -----------------------------------------------------
        # 2. 해당 동호회의 owner / manager인지 확인
        # -----------------------------------------------------
        club_id = int(
            availability["club_id"]
        )

        self.validate_management_permission(
            club_id=club_id,
            user_id=user_id,
        )


        # -----------------------------------------------------
        # 3. 현재 들어온 매칭 신청 수 확인
        # -----------------------------------------------------
        request_count = (
            self.match_repository
            .count_match_requests_for_availability(
                availability_id=availability_id,
            )
        )


        # -----------------------------------------------------
        # 4. 신청이 존재하지만 사용자가
        #    아직 최종 삭제 확인을 하지 않은 경우
        # -----------------------------------------------------
        if (
            request_count > 0
            and not confirm
        ):
            raise MatchDeleteConfirmationRequired(
                request_count=request_count,
            )


        # -----------------------------------------------------
        # 5. 신청이 있고 사용자가 최종 삭제를 확인한 경우
        #
        # 부모 availability를 삭제하기 전에
        # 연결된 club_matches부터 삭제한다.
        # -----------------------------------------------------
        if request_count > 0:

            self.match_repository \
                .delete_match_requests_by_availability(
                    availability_id=availability_id,
                )


        # -----------------------------------------------------
        # 6. 경기 가능일 삭제
        # -----------------------------------------------------
        deleted = (
            self.match_repository
            .delete_availability(
                availability_id=availability_id,
            )
        )

        if not deleted:
            raise RuntimeError(
                "경기 가능일 삭제에 실패했습니다."
            )


        # -----------------------------------------------------
        # 7. Response
        # -----------------------------------------------------
        return MatchAvailabilityDeleteResponse(
            availability_id=availability_id,
        )



    # =========================================================
    # 경기 가능일 상세 조회
    #
    # GET /api/matches/availabilities/{availability_id}
    #
    # 경기 상세 정보
    # +
    # 현재 사용자가 이미 신청했는지 확인
    # =========================================================

    def get_availability_detail(
        self,
        availability_id: int,
        user_id: str,
    ) -> MatchAvailabilityDetailResponse:

        # -----------------------------------------------------
        # 1. 경기 가능일 조회
        # -----------------------------------------------------
        availability = (
            self.match_repository
            .find_availability_by_id(
                availability_id=availability_id,
            )
        )

        if availability is None:
            raise LookupError(
                "경기 가능일을 찾을 수 없습니다."
            )


        club_id = int(
            availability["club_id"]
        )

        sport_id = int(
            availability["sport_id"]
        )


        # -----------------------------------------------------
        # 2. 동호회 정보 조회
        # -----------------------------------------------------
        clubs = (
            self.match_repository
            .find_clubs_by_ids(
                club_ids=[club_id],
            )
        )

        if not clubs:
            raise LookupError(
                "동호회 정보를 찾을 수 없습니다."
            )

        club = clubs[0]


        # -----------------------------------------------------
        # 3. 동호회 대표 이미지 조회
        # -----------------------------------------------------
        representative_images = (
            self.match_repository
            .find_representative_images(
                club_ids=[club_id],
            )
        )

        club_profile_image = None

        if representative_images:
            club_profile_image = (
                representative_images[0]
                .get("image_url")
            )


        # -----------------------------------------------------
        # 4. 종목 정보 조회
        # -----------------------------------------------------
        sport = (
            self.match_repository
            .find_active_sport_by_id(
                sport_id=sport_id,
            )
        )

        if sport is None:
            raise LookupError(
                "종목 정보를 찾을 수 없습니다."
            )


        # -----------------------------------------------------
        # 5. 현재 사용자가 owner인 동호회 조회
        # -----------------------------------------------------
        owned_clubs = (
            self.match_repository
            .find_owned_clubs(
                user_id=user_id,
            )
        )


        # -----------------------------------------------------
        # 6. 현재 사용자가 owner / manager로
        #    활동 중인 동호회 조회
        # -----------------------------------------------------
        managed_memberships = (
            self.match_repository
            .find_managed_memberships(
                user_id=user_id,
            )
        )


        # -----------------------------------------------------
        # 7. 현재 사용자가 관리 가능한
        #    모든 동호회 ID 수집
        # -----------------------------------------------------
        my_club_ids = {
            int(club["club_id"])
            for club in owned_clubs
        }

        my_club_ids.update(
            int(membership["club_id"])
            for membership in managed_memberships
        )


        # -----------------------------------------------------
        # 8. 이 경기 가능일에
        #    내 동호회가 보낸 신청 조회
        #
        # pending / approved만 조회됨
        # -----------------------------------------------------
        my_match_requests = (
            self.match_repository
            .find_my_match_requests(
                availability_id=availability_id,
                requester_club_ids=list(
                    my_club_ids
                ),
            )
        )


        # -----------------------------------------------------
        # 9. 매칭 신청 Response 변환
        # -----------------------------------------------------
        my_requests = [
            MyMatchRequestResponse(
                club_match_id=int(
                    match_request[
                        "club_match_id"
                    ]
                ),

                requester_club_id=int(
                    match_request[
                        "requester_club_id"
                    ]
                ),

                status=match_request[
                    "status"
                ],
            )
            for match_request in my_match_requests
        ]


        # 하나라도 pending / approved 신청이 있으면 True
        has_requested = bool(
            my_requests
        )


        # -----------------------------------------------------
        # 10. 상세 Response 반환
        # -----------------------------------------------------
        return MatchAvailabilityDetailResponse(

            availability_id=int(
                availability["availability_id"]
            ),

            # 동호회
            club_id=club_id,

            club_name=club[
                "club_name"
            ],

            club_profile_image=(
                club_profile_image
            ),

            # 종목
            sport_id=sport_id,

            sport_name=sport[
                "sport_name"
            ],

            # 날짜 / 시간
            match_date=availability[
                "match_date"
            ],

            start_time=availability[
                "start_time"
            ],

            end_time=availability.get(
                "end_time"
            ),

            # 경기 조건
            required_players=int(
                availability[
                    "required_players"
                ]
            ),

            skill_level=availability[
                "skill_level"
            ],

            # 장소
            region=availability[
                "region"
            ],

            location_name=availability[
                "location_name"
            ],

            address=availability.get(
                "address"
            ),

            latitude=availability.get(
                "latitude"
            ),

            longitude=availability.get(
                "longitude"
            ),

            # 추가 조건
            parking_available=(
                availability.get(
                    "parking_available"
                )
            ),

            venue_type=availability.get(
                "venue_type"
            ),

            venue_cost_negotiable=(
                availability.get(
                    "venue_cost_negotiable"
                )
            ),

            time_negotiable=(
                availability.get(
                    "time_negotiable"
                )
            ),

            intro=availability.get(
                "intro"
            ),

            # 상태
            status=availability[
                "status"
            ],

            created_at=availability[
                "created_at"
            ],

            updated_at=availability[
                "updated_at"
            ],

            # 현재 사용자의 신청 상태
            has_requested=has_requested,

            my_requests=my_requests,
        )


    # =========================================================
    # 상대팀 경기 가능일 목록 조회
    #
    # GET /api/matches/availabilities
    #
    # - open 상태만 조회
    # - 날짜 / 종목 / 지역 필터
    # - 내가 운영/관리하는 동호회 모집글 제외
    # =========================================================

    def get_available_matches(
        self,
        user_id: str,
        match_date: date | None = None,
        sport_id: int | None = None,
        region: str | None = None,
    ) -> MatchAvailabilityListResponse:

        # -----------------------------------------------------
        # 1. 지난 날짜 검색 방지
        # -----------------------------------------------------
        if (
            match_date is not None
            and match_date < date.today()
        ):
            raise ValueError(
                "지난 날짜의 경기 가능일은 조회할 수 없습니다."
            )


        # -----------------------------------------------------
        # 2. 지역값 정리
        # -----------------------------------------------------
        if region is not None:

            region = region.strip()

            if not region:
                region = None


        # -----------------------------------------------------
        # 3. 현재 사용자가 owner인 동호회 조회
        # -----------------------------------------------------
        owned_clubs = (
            self.match_repository
            .find_owned_clubs(
                user_id=user_id,
            )
        )


        # -----------------------------------------------------
        # 4. 현재 사용자가 owner / manager로
        #    활동 중인 동호회 조회
        # -----------------------------------------------------
        managed_memberships = (
            self.match_repository
            .find_managed_memberships(
                user_id=user_id,
            )
        )


        # -----------------------------------------------------
        # 5. 내 동호회 ID 모으기
        # -----------------------------------------------------
        my_club_ids = {
            int(club["club_id"])
            for club in owned_clubs
        }

        my_club_ids.update(
            int(membership["club_id"])
            for membership in managed_memberships
        )


        # -----------------------------------------------------
        # 6. 조건에 맞는 open 경기 가능일 조회
        # -----------------------------------------------------
        availabilities = (
            self.match_repository
            .find_open_availabilities(
                match_date=match_date,
                sport_id=sport_id,
                region=region,
            )
        )


        # -----------------------------------------------------
        # 7. 내 동호회의 모집글 제외
        # -----------------------------------------------------
        opponent_availabilities = [
            availability
            for availability in availabilities
            if int(
                availability["club_id"]
            ) not in my_club_ids
        ]


        # 상대팀 모집글이 하나도 없으면 바로 반환
        if not opponent_availabilities:

            return MatchAvailabilityListResponse(
                items=[],
                total_count=0,
            )


        # -----------------------------------------------------
        # 8. 필요한 동호회 ID 수집
        # -----------------------------------------------------
        club_ids = list({
            int(
                availability["club_id"]
            )
            for availability
            in opponent_availabilities
        })


        # -----------------------------------------------------
        # 9. 동호회 정보 조회
        # -----------------------------------------------------
        clubs = (
            self.match_repository
            .find_clubs_by_ids(
                club_ids=club_ids,
            )
        )

        club_map = {
            int(club["club_id"]): club
            for club in clubs
        }


        # -----------------------------------------------------
        # 10. 동호회 대표 이미지 조회
        # -----------------------------------------------------
        representative_images = (
            self.match_repository
            .find_representative_images(
                club_ids=club_ids,
            )
        )

        image_map = {}

        for image in representative_images:

            club_id = int(
                image["club_id"]
            )

            # display_order가 빠른 첫 번째 이미지만 사용
            if club_id not in image_map:
                image_map[club_id] = (
                    image.get("image_url")
                )


        # -----------------------------------------------------
        # 11. 종목 정보 조회
        # -----------------------------------------------------
        sports = (
            self.match_repository
            .find_active_sports()
        )

        sport_map = {
            int(sport["sport_id"]): sport
            for sport in sports
        }


        # -----------------------------------------------------
        # 12. Frontend에 줄 Response 생성
        # -----------------------------------------------------
        items = []

        for availability in opponent_availabilities:

            club_id = int(
                availability["club_id"]
            )

            current_sport_id = int(
                availability["sport_id"]
            )

            club = club_map.get(
                club_id
            )

            sport = sport_map.get(
                current_sport_id
            )

            # 활성 동호회 정보가 사라진 경우
            if club is None:
                continue

            items.append(
                MatchAvailabilityResponse(

                    availability_id=int(
                        availability[
                            "availability_id"
                        ]
                    ),

                    # 동호회
                    club_id=club_id,

                    club_name=club[
                        "club_name"
                    ],

                    club_profile_image=(
                        image_map.get(
                            club_id
                        )
                    ),

                    # 종목
                    sport_id=current_sport_id,

                    sport_name=(
                        sport["sport_name"]
                        if sport is not None
                        else "알 수 없는 종목"
                    ),

                    # 날짜 / 시간
                    match_date=availability[
                        "match_date"
                    ],

                    start_time=availability[
                        "start_time"
                    ],

                    end_time=availability.get(
                        "end_time"
                    ),

                    # 경기 조건
                    required_players=int(
                        availability[
                            "required_players"
                        ]
                    ),

                    skill_level=availability[
                        "skill_level"
                    ],

                    # 장소
                    region=availability[
                        "region"
                    ],

                    location_name=availability[
                        "location_name"
                    ],

                    address=availability.get(
                        "address"
                    ),

                    latitude=availability.get(
                        "latitude"
                    ),

                    longitude=availability.get(
                        "longitude"
                    ),

                    # 추가 조건
                    parking_available=(
                        availability.get(
                            "parking_available"
                        )
                    ),

                    venue_type=availability.get(
                        "venue_type"
                    ),

                    venue_cost_negotiable=(
                        availability.get(
                            "venue_cost_negotiable"
                        )
                    ),

                    time_negotiable=(
                        availability.get(
                            "time_negotiable"
                        )
                    ),

                    intro=availability.get(
                        "intro"
                    ),

                    status=availability[
                        "status"
                    ],

                    created_at=availability[
                        "created_at"
                    ],

                    updated_at=availability[
                        "updated_at"
                    ],
                )
            )


        # -----------------------------------------------------
        # 13. 최종 Response
        # -----------------------------------------------------
        return MatchAvailabilityListResponse(
            items=items,
            total_count=len(items),
        )


    # =========================================================
    # 매칭 신청 가능한 내 동호회 목록 조회
    #
    # GET /api/matches/requestable-clubs
    #
    # availability_id를 기준으로:
    # - 상대팀 확인
    # - 내가 owner / manager인 동호회 조회
    # - 상대팀 동호회는 제외
    # =========================================================

    def get_requestable_clubs(
        self,
        user_id: str,
        availability_id: int,
    ) -> MatchRequestableClubsResponse:

        # -----------------------------------------------------
        # 1. 신청하려는 경기 가능일 조회
        # -----------------------------------------------------
        availability = (
            self.match_repository
            .find_availability_by_id(
                availability_id=availability_id,
            )
        )

        if availability is None:
            raise LookupError(
                "경기 가능일을 찾을 수 없습니다."
            )


        # -----------------------------------------------------
        # 2. 상대팀 동호회 ID
        # -----------------------------------------------------
        target_club_id = int(
            availability["club_id"]
        )


        # -----------------------------------------------------
        # 3. 현재 사용자가 owner인 동호회 조회
        # -----------------------------------------------------
        owned_clubs = (
            self.match_repository
            .find_owned_clubs(
                user_id=user_id,
            )
        )


        # -----------------------------------------------------
        # 4. 현재 사용자가 owner / manager로
        #    활동 중인 동호회 조회
        # -----------------------------------------------------
        managed_memberships = (
            self.match_repository
            .find_managed_memberships(
                user_id=user_id,
            )
        )


        # -----------------------------------------------------
        # 5. 신청 가능한 내 동호회 ID 수집
        #
        # 상대팀 자기 자신은 제외
        # -----------------------------------------------------
        requestable_club_ids = {
            int(club["club_id"])
            for club in owned_clubs
            if int(club["club_id"]) != target_club_id
        }

        requestable_club_ids.update(
            int(membership["club_id"])
            for membership in managed_memberships
            if int(
                membership["club_id"]
            ) != target_club_id
        )


        # 신청 가능한 동호회가 없는 경우
        if not requestable_club_ids:

            return MatchRequestableClubsResponse(
                clubs=[],
            )


        # -----------------------------------------------------
        # 6. 실제 활성 동호회 정보 조회
        # -----------------------------------------------------
        clubs = (
            self.match_repository
            .find_clubs_by_ids(
                club_ids=list(
                    requestable_club_ids
                ),
            )
        )


        # -----------------------------------------------------
        # 7. Frontend Response 생성
        # -----------------------------------------------------
        result = [
            MatchRequestableClubResponse(
                club_id=int(
                    club["club_id"]
                ),
                club_name=club[
                    "club_name"
                ],
            )
            for club in clubs
        ]


        # 이름순 정렬
        result.sort(
            key=lambda club: club.club_name
        )


        return MatchRequestableClubsResponse(
            clubs=result,
        )

    # =========================================================
    # 매칭 신청 생성
    #
    # POST /api/matches/requests
    #
    # 검증:
    # - 경기 가능일 존재 여부
    # - open 상태 여부
    # - 지난 경기 여부
    # - 신청 동호회 관리 권한
    # - 자기 동호회 신청 방지
    # - 중복 신청 방지
    # =========================================================

    def create_match_request(
        self,
        user_id: str,
        request_data: MatchRequestCreateRequest,
    ) -> MatchRequestCreateResponse:

        # -----------------------------------------------------
        # 1. 신청하려는 경기 가능일 조회
        # -----------------------------------------------------
        availability = (
            self.match_repository
            .find_availability_by_id(
                availability_id=request_data.availability_id,
            )
        )

        if availability is None:
            raise LookupError(
                "경기 가능일을 찾을 수 없습니다."
            )


        # -----------------------------------------------------
        # 2. 현재 신청을 받고 있는 모집글인지 확인
        # -----------------------------------------------------
        if availability["status"] != "open":
            raise ValueError(
                "현재 매칭 신청을 받을 수 없는 경기입니다."
            )


        # -----------------------------------------------------
        # 3. 경기 날짜 확인
        # -----------------------------------------------------
        match_date = availability["match_date"]

        if isinstance(
            match_date,
            str,
        ):
            match_date = date.fromisoformat(
                match_date
            )

        if match_date < date.today():
            raise ValueError(
                "이미 지난 경기에는 매칭 신청을 할 수 없습니다."
            )


        # -----------------------------------------------------
        # 4. 상대 동호회 ID
        #
        # target_club_id는 프론트에서 받지 않는다.
        # availability의 club_id를 Backend가 직접 사용한다.
        # -----------------------------------------------------
        target_club_id = int(
            availability["club_id"]
        )

        requester_club_id = (
            request_data.requester_club_id
        )


        # -----------------------------------------------------
        # 5. 자기 동호회에 자기 동호회로 신청 방지
        # -----------------------------------------------------
        if requester_club_id == target_club_id:
            raise ValueError(
                "같은 동호회에는 매칭 신청을 할 수 없습니다."
            )


        # -----------------------------------------------------
        # 6. 신청하는 동호회에 대한
        #    현재 사용자의 owner / manager 권한 확인
        # -----------------------------------------------------
        self.validate_management_permission(
            club_id=requester_club_id,
            user_id=user_id,
        )


        # -----------------------------------------------------
        # 7. 상대 동호회가 현재 활성 동호회인지 확인
        # -----------------------------------------------------
        target_club = (
            self.club_repository
            .find_club_by_id(
                target_club_id
            )
        )

        if target_club is None:
            raise LookupError(
                "상대 동호회를 찾을 수 없거나 "
                "현재 이용할 수 없습니다."
            )


        # -----------------------------------------------------
        # 8. 동일한 동호회가 같은 모집글에
        #    이미 신청했는지 확인
        #
        # pending / approved가 존재하면 중복 신청
        # rejected만 있다면 재신청 가능
        # -----------------------------------------------------
        existing_request = (
            self.match_repository
            .find_existing_match_request(
                availability_id=(
                    request_data.availability_id
                ),
                requester_club_id=(
                    requester_club_id
                ),
            )
        )

        if existing_request is not None:

            if (
                existing_request["status"]
                == "pending"
            ):
                raise ValueError(
                    "이미 매칭 신청을 보낸 경기입니다."
                )

            if (
                existing_request["status"]
                == "approved"
            ):
                raise ValueError(
                    "이미 매칭이 승인된 경기입니다."
                )


        # -----------------------------------------------------
        # 9. club_matches INSERT 데이터 생성
        # -----------------------------------------------------
        match_request_data = {

            "availability_id": (
                request_data.availability_id
            ),

            "requester_club_id": (
                requester_club_id
            ),

            "target_club_id": (
                target_club_id
            ),

            "status": "pending",

            "created_at": (
                datetime.now(
                    timezone.utc
                ).isoformat()
            ),
        }


        # -----------------------------------------------------
        # 10. 매칭 신청 저장
        # -----------------------------------------------------
        created_match = (
            self.match_repository
            .create_match_request(
                match_request_data=(
                    match_request_data
                ),
            )
        )


        # -----------------------------------------------------
        # 10-1. 상대 동호회 운영진에게 매칭 신청 알림
        #
        # - 신청한 본인은 제외
        # - 알림 저장이 실패해도 매칭 신청은 정상 처리
        # -----------------------------------------------------
        try:
            requester_club = (
                self.club_repository
                .find_club_by_id(
                    requester_club_id
                )
            )

            requester_club_name = (
                requester_club.get("club_name")
                if requester_club
                else "다른 동호회"
            )

            manager_ids = (
                self.match_repository
                .find_club_manager_user_ids(
                    club_id=target_club_id,
                )
            )

            manager_ids = [
                uid for uid in manager_ids
                if uid != user_id
            ]

            self.match_repository.create_match_notifications(
                user_ids=manager_ids,
                title="새로운 팀 매칭 신청",
                content=(
                    f"{requester_club_name}에서 "
                    f"{match_date.month}월 {match_date.day}일 경기에 "
                    f"매칭을 신청했어요."
                ),
                club_id=target_club_id,
            )
        except Exception as e:
            print("매칭 신청 알림 생성 실패:", e)


        # -----------------------------------------------------
        # 11. Response
        # -----------------------------------------------------
        return MatchRequestCreateResponse(
            club_match_id=int(
                created_match[
                    "club_match_id"
                ]
            ),
            status=created_match.get(
                "status",
                "pending",
            ),
        )

    # =========================================================
    # 매칭 관리 메인 Summary 조회
    #
    # GET /api/matches/management/{club_id}/summary
    #
    # 반환:
    # - 받은 신청
    # - 보낸 신청
    # - 예정 경기
    # - 지난 경기
    # - 작성한 후기
    # - 받은 후기
    # =========================================================

    def get_management_summary(
        self,
        user_id: str,
        club_id: int,
    ) -> MatchManagementSummaryResponse:

        # -----------------------------------------------------
        # 1. 현재 사용자가 해당 동호회의
        #    owner / manager인지 확인
        # -----------------------------------------------------
        self.validate_management_permission(
            club_id=club_id,
            user_id=user_id,
        )


        # -----------------------------------------------------
        # 2. 받은 pending 신청 수
        #
        # 현재 동호회가 target
        # -----------------------------------------------------
        received = (
            self.match_repository
            .count_received_pending_requests(
                club_id=club_id,
            )
        )


        # -----------------------------------------------------
        # 3. 보낸 pending 신청 수
        #
        # 현재 동호회가 requester
        # -----------------------------------------------------
        sent = (
            self.match_repository
            .count_sent_pending_requests(
                club_id=club_id,
            )
        )


        # -----------------------------------------------------
        # 4. 현재 동호회가 참여한
        #    승인된 매칭 조회
        # -----------------------------------------------------
        approved_matches = (
            self.match_repository
            .find_approved_matches_by_club(
                club_id=club_id,
            )
        )


        # -----------------------------------------------------
        # 5. 승인된 매칭들의 availability_id 수집
        # -----------------------------------------------------
        availability_ids = list({
            int(match["availability_id"])
            for match in approved_matches
            if match.get("availability_id") is not None
        })


        # -----------------------------------------------------
        # 6. 경기 날짜 조회
        # -----------------------------------------------------
        availabilities = (
            self.match_repository
            .find_availabilities_by_ids(
                availability_ids=availability_ids,
            )
        )


        # availability_id → match_date
        availability_date_map = {}

        for availability in availabilities:

            availability_id = int(
                availability[
                    "availability_id"
                ]
            )

            match_date = availability[
                "match_date"
            ]

            # Supabase에서 문자열로 내려오는 경우
            if isinstance(
                match_date,
                str,
            ):
                match_date = date.fromisoformat(
                    match_date
                )

            availability_date_map[
                availability_id
            ] = match_date


        # -----------------------------------------------------
        # 7. 예정 경기 / 지난 경기 계산
        # -----------------------------------------------------
        upcoming = 0
        history = 0

        today = date.today()

        for match in approved_matches:

            availability_id = int(
                match[
                    "availability_id"
                ]
            )

            match_date = (
                availability_date_map.get(
                    availability_id
                )
            )

            # 원본 availability를 찾을 수 없는 경우
            if match_date is None:
                continue

            # 오늘 경기 포함 → 예정 경기
            if match_date >= today:
                upcoming += 1

            # 어제 이전 → 지난 경기
            else:
                history += 1


        # -----------------------------------------------------
        # 8. 내가 작성한 후기 수
        # -----------------------------------------------------
        written_reviews = (
            self.match_repository
            .count_written_reviews(
                club_id=club_id,
            )
        )


        # -----------------------------------------------------
        # 9. 내가 받은 후기 수
        # -----------------------------------------------------
        received_reviews = (
            self.match_repository
            .count_received_reviews(
                club_id=club_id,
            )
        )


        # -----------------------------------------------------
        # 10. 최종 Response
        # -----------------------------------------------------
        return MatchManagementSummaryResponse(
            received=received,
            sent=sent,
            upcoming=upcoming,
            history=history,
            written_reviews=written_reviews,
            received_reviews=received_reviews,
        )

    # =========================================================
    # 매칭 관리 목록 조회
    #
    # 지원:
    # - received : 받은 신청
    # - sent     : 보낸 신청
    # - upcoming : 예정 경기
    # - history  : 지난 경기
    #
    # 추후:
    # - writtenReviews
    # - receivedReviews
    # =========================================================

    def get_management_matches(
        self,
        user_id: str,
        club_id: int,
        match_type: str,
    ) -> MatchManagementListResponse:

        # -----------------------------------------------------
        # 1. 현재 사용자가 해당 동호회의
        #    owner / manager인지 확인
        # -----------------------------------------------------
        self.validate_management_permission(
            club_id=club_id,
            user_id=user_id,
        )


        # -----------------------------------------------------
        # 2. 목록 종류에 따라 club_matches 조회
        # -----------------------------------------------------
        if match_type == "received":

            matches = (
                self.match_repository
                .find_received_pending_matches(
                    club_id=club_id,
                )
            )

        elif match_type == "sent":

            matches = (
                self.match_repository
                .find_sent_pending_matches(
                    club_id=club_id,
                )
            )

        elif match_type in {
            "upcoming",
            "history",
        }:

            matches = (
                self.match_repository
                .find_approved_matches_by_club(
                    club_id=club_id,
                )
            )


        # -----------------------------------------------------
        # 내가 작성한 후기
        # -----------------------------------------------------
        elif match_type == "writtenReviews":

            reviews = (
                self.match_repository
                .find_written_reviews_by_club(
                    club_id=club_id,
                )
            )

            if not reviews:

                return MatchManagementListResponse(
                    items=[],
                    total_count=0,
                )


            # 후기 → club_match_id 추출
            club_match_ids = list(dict.fromkeys(
                int(review["club_match_id"])
                for review in reviews
            ))


            match_rows = (
                self.match_repository
                .find_matches_by_ids(
                    club_match_ids=club_match_ids,
                )
            )

            match_map = {
                int(
                    match["club_match_id"]
                ): match
                for match in match_rows
            }


            # 후기 작성 최신순을 그대로 유지
            matches = [
                match_map[
                    int(review["club_match_id"])
                ]
                for review in reviews
                if int(
                    review["club_match_id"]
                ) in match_map
            ]


        # -----------------------------------------------------
        # 내가 받은 후기
        # -----------------------------------------------------
        elif match_type == "receivedReviews":

            reviews = (
                self.match_repository
                .find_received_reviews_by_club(
                    club_id=club_id,
                )
            )

            if not reviews:

                return MatchManagementListResponse(
                    items=[],
                    total_count=0,
                )


            club_match_ids = list(dict.fromkeys(
                int(review["club_match_id"])
                for review in reviews
            ))


            match_rows = (
                self.match_repository
                .find_matches_by_ids(
                    club_match_ids=club_match_ids,
                )
            )

            match_map = {
                int(
                    match["club_match_id"]
                ): match
                for match in match_rows
            }


            # 받은 후기 최신순 유지
            matches = [
                match_map[
                    int(review["club_match_id"])
                ]
                for review in reviews
                if int(
                    review["club_match_id"]
                ) in match_map
            ]


        else:

            raise ValueError(
                "지원하지 않는 매칭 목록 유형입니다."
            )


        # -----------------------------------------------------
        # 3. 매칭이 하나도 없는 경우
        # -----------------------------------------------------
        if not matches:

            return MatchManagementListResponse(
                items=[],
                total_count=0,
            )


        # -----------------------------------------------------
        # 4. availability_id 모으기
        # -----------------------------------------------------
        availability_ids = list({
            int(match["availability_id"])
            for match in matches
            if match.get("availability_id") is not None
        })


        # -----------------------------------------------------
        # 5. 경기 가능일 정보 조회
        # -----------------------------------------------------
        availabilities = (
            self.match_repository
            .find_availabilities_by_ids(
                availability_ids=availability_ids,
            )
        )

        availability_map = {
            int(
                availability["availability_id"]
            ): availability
            for availability in availabilities
        }


        # -----------------------------------------------------
        # 6. upcoming / history인 경우
        #    경기 날짜 기준으로 목록 분리
        #
        # 오늘 경기 → upcoming
        # 오늘 이전 → history
        # -----------------------------------------------------
        if match_type in {
            "upcoming",
            "history",
        }:

            filtered_matches = []

            today = date.today()

            for match in matches:

                availability_id = int(
                    match["availability_id"]
                )

                availability = (
                    availability_map.get(
                        availability_id
                    )
                )

                if availability is None:
                    continue


                match_date = availability[
                    "match_date"
                ]

                if isinstance(
                    match_date,
                    str,
                ):
                    match_date = date.fromisoformat(
                        match_date
                    )


                if (
                    match_type == "upcoming"
                    and match_date >= today
                ):
                    filtered_matches.append(
                        match
                    )

                elif (
                    match_type == "history"
                    and match_date < today
                ):
                    filtered_matches.append(
                        match
                    )


            matches = filtered_matches


        # -----------------------------------------------------
        # 7. 필터 후 결과가 없는 경우
        # -----------------------------------------------------
        if not matches:

            return MatchManagementListResponse(
                items=[],
                total_count=0,
            )

        # -----------------------------------------------------
        # 8. 지난 경기인 경우 경기 결과 조회
        #
        # club_match_id → club_match_results
        # -----------------------------------------------------
        match_result_map = {}

        if match_type == "history":

            club_match_ids = [
                int(match["club_match_id"])
                for match in matches
            ]

            match_results = (
                self.match_repository
                .find_match_results_by_match_ids(
                    club_match_ids=club_match_ids,
                )
            )

            match_result_map = {
                int(
                    result["club_match_id"]
                ): result
                for result in match_results
            }

        # -----------------------------------------------------
        # 9-0. 지난 경기의 후기 작성 / 수신 여부 조회
        #
        # history 화면에서
        # has_written_review
        # has_received_review
        # 계산에 사용
        # -----------------------------------------------------
        written_review_match_ids = set()
        received_review_match_ids = set()

        if match_type == "history":

            written_reviews = (
                self.match_repository
                .find_written_reviews_by_match_ids(
                    club_id=club_id,
                    club_match_ids=club_match_ids,
                )
            )

            received_reviews = (
                self.match_repository
                .find_received_reviews_by_match_ids(
                    club_id=club_id,
                    club_match_ids=club_match_ids,
                )
            )


            # 내가 후기를 작성한 경기 ID들
            written_review_match_ids = {
                int(review["club_match_id"])
                for review in written_reviews
            }


            # 내가 후기를 받은 경기 ID들
            received_review_match_ids = {
                int(review["club_match_id"])
                for review in received_reviews
            }


        # -----------------------------------------------------
        # 9. 상대 동호회 ID 수집
        #
        # received
        # → 상대 = requester
        #
        # sent
        # → 상대 = target
        #
        # upcoming / history
        # → 현재 club_id가 아닌 쪽이 상대
        # -----------------------------------------------------
        opponent_club_ids = set()

        for match in matches:

            requester_club_id = int(
                match["requester_club_id"]
            )

            target_club_id = int(
                match["target_club_id"]
            )


            if match_type == "received":

                opponent_club_id = (
                    requester_club_id
                )

            elif match_type == "sent":

                opponent_club_id = (
                    target_club_id
                )

            else:

                if requester_club_id == club_id:
                    opponent_club_id = (
                        target_club_id
                    )
                else:
                    opponent_club_id = (
                        requester_club_id
                    )


            opponent_club_ids.add(
                opponent_club_id
            )


        # -----------------------------------------------------
        # 10. 상대 동호회 정보 조회
        # -----------------------------------------------------
        clubs = (
            self.match_repository
            .find_clubs_by_ids(
                club_ids=list(
                    opponent_club_ids
                ),
            )
        )

        club_map = {
            int(club["club_id"]): club
            for club in clubs
        }


        # -----------------------------------------------------
        # 11. 상대 동호회 대표 이미지 조회
        # -----------------------------------------------------
        representative_images = (
            self.match_repository
            .find_representative_images(
                club_ids=list(
                    opponent_club_ids
                ),
            )
        )

        image_map = {}

        for image in representative_images:

            image_club_id = int(
                image["club_id"]
            )

            if image_club_id not in image_map:

                image_map[
                    image_club_id
                ] = image.get(
                    "image_url"
                )


        # -----------------------------------------------------
        # 12. 종목 정보 조회
        # -----------------------------------------------------
        sports = (
            self.match_repository
            .find_active_sports()
        )

        sport_map = {
            int(sport["sport_id"]): sport
            for sport in sports
        }


        # -----------------------------------------------------
        # 13. Frontend용 Response Item 생성
        # -----------------------------------------------------
        items = []

        for match in matches:

            club_match_id = int(
                match["club_match_id"]
            )

            availability_id = int(
                match["availability_id"]
            )

            availability = (
                availability_map.get(
                    availability_id
                )
            )

            if availability is None:
                continue


            requester_club_id = int(
                match["requester_club_id"]
            )

            target_club_id = int(
                match["target_club_id"]
            )


            # ---------------------------------------------
            # 상대팀 결정
            # ---------------------------------------------
            if match_type == "received":

                opponent_club_id = (
                    requester_club_id
                )

            elif match_type == "sent":

                opponent_club_id = (
                    target_club_id
                )

            else:

                if requester_club_id == club_id:
                    opponent_club_id = (
                        target_club_id
                    )
                else:
                    opponent_club_id = (
                        requester_club_id
                    )


            opponent_club = (
                club_map.get(
                    opponent_club_id
                )
            )

            if opponent_club is None:
                continue


            # ---------------------------------------------
            # 종목
            # ---------------------------------------------
            sport_id = int(
                availability["sport_id"]
            )

            sport = sport_map.get(
                sport_id
            )

            # ---------------------------------------------
            # 경기 기록 상태 계산
            #
            # PlayBridge 기준:
            #
            # target_club_id    = HOME
            # requester_club_id = AWAY
            # ---------------------------------------------
            record_status = None

            if match_type == "history":

                match_result = (
                    match_result_map.get(
                        club_match_id
                    )
                )


                # -----------------------------------------
                # 경기 결과 자체가 아직 없음
                #
                # → 아무도 기록을 작성하지 않음
                # -----------------------------------------
                if match_result is None:

                    record_status = (
                        "RECORD_REQUIRED"
                    )


                else:

                    home_approval_status = (
                        match_result.get(
                            "home_approval_status"
                        )
                    )

                    away_approval_status = (
                        match_result.get(
                            "away_approval_status"
                        )
                    )

                    result_status = (
                        match_result.get(
                            "status"
                        )
                    )


                    # -------------------------------------
                    # 양 팀 결과 확인 완료
                    # -------------------------------------
                    if (
                        result_status == "completed"
                        or (
                            home_approval_status
                            == "approved"
                            and
                            away_approval_status
                            == "approved"
                        )
                    ):

                        record_status = (
                            "COMPLETED"
                        )


                    else:

                        # ---------------------------------
                        # 현재 보고 있는 동호회가
                        # target이면 HOME
                        # ---------------------------------
                        if target_club_id == club_id:

                            my_approval_status = (
                                home_approval_status
                            )

                            opponent_approval_status = (
                                away_approval_status
                            )


                        # ---------------------------------
                        # 현재 보고 있는 동호회가
                        # requester이면 AWAY
                        # ---------------------------------
                        else:

                            my_approval_status = (
                                away_approval_status
                            )

                            opponent_approval_status = (
                                home_approval_status
                            )


                        # ---------------------------------
                        # 내가 먼저 기록/확인 완료
                        #
                        # 상대팀 확인을 기다리는 상태
                        # ---------------------------------
                        if (
                            my_approval_status
                            == "approved"
                            and
                            opponent_approval_status
                            != "approved"
                        ):

                            record_status = (
                                "RECORD_PENDING"
                            )


                        # ---------------------------------
                        # 상대팀은 기록/확인했고
                        # 내가 확인해야 하는 상태
                        # ---------------------------------
                        elif (
                            my_approval_status
                            != "approved"
                            and
                            opponent_approval_status
                            == "approved"
                        ):

                            record_status = (
                                "RECORD_CONFIRM_REQUIRED"
                            )


                        # ---------------------------------
                        # 예외적인 데이터 방어
                        # ---------------------------------
                        else:

                            record_status = (
                                "RECORD_PENDING"
                            )

            # ---------------------------------------------
            # 후기 작성 / 수신 여부
            # ---------------------------------------------
            has_written_review = False
            has_received_review = False


            # 지난 경기 목록
            # → 실제 match_reviews 기준
            if match_type == "history":

                has_written_review = (
                    club_match_id
                    in written_review_match_ids
                )

                has_received_review = (
                    club_match_id
                    in received_review_match_ids
                )


            # 내가 작성한 후기 목록
            elif match_type == "writtenReviews":

                has_written_review = True


            # 내가 받은 후기 목록
            elif match_type == "receivedReviews":

                has_received_review = True


            # ---------------------------------------------
            # Response
            # ---------------------------------------------
            items.append(
                MatchManagementListItemResponse(

                    club_match_id=int(
                        match[
                            "club_match_id"
                        ]
                    ),

                    opponent_club_id=(
                        opponent_club_id
                    ),

                    opponent_club_name=(
                        opponent_club[
                            "club_name"
                        ]
                    ),

                    opponent_club_profile_image=(
                        image_map.get(
                            opponent_club_id
                        )
                    ),

                    sport_name=(
                        sport["sport_name"]
                        if sport is not None
                        else "알 수 없는 종목"
                    ),

                    match_date=availability[
                        "match_date"
                    ],

                    start_time=availability[
                        "start_time"
                    ],

                    end_time=availability.get(
                        "end_time"
                    ),

                    region=availability[
                        "region"
                    ],

                    location_name=availability[
                        "location_name"
                    ],

                    status=match[
                        "status"
                    ],

                    # 다음 단계에서
                    # club_match_results를 보고 계산
                    record_status=record_status,

                    has_written_review=(
                        has_written_review
                    ),

                    has_received_review=(
                        has_received_review
                    ),
                )
            )


        # -----------------------------------------------------
        # 14. 최종 Response
        # -----------------------------------------------------
        return MatchManagementListResponse(
            items=items,
            total_count=len(items),
        )

    # =========================================================
    # 매칭 관리 상세 조회
    #
    # GET
    # /api/matches/management/{club_id}/matches/{club_match_id}
    #
    # 현재 동호회 관점으로:
    # - 상대팀
    # - 경기 정보
    # - 신청 상태
    # - 경기 기록 상태
    # - 내 점수 / 상대 점수
    # - 후기 작성 / 수신 여부
    #
    # 를 조립한다.
    # =========================================================

    def get_management_match_detail(
        self,
        user_id: str,
        club_id: int,
        club_match_id: int,
    ) -> MatchManagementDetailResponse:

        # -----------------------------------------------------
        # 1. 현재 사용자가 해당 동호회의
        #    owner / manager인지 확인
        # -----------------------------------------------------
        self.validate_management_permission(
            club_id=club_id,
            user_id=user_id,
        )


        # -----------------------------------------------------
        # 2. club_matches 조회
        # -----------------------------------------------------
        match = (
            self.match_repository
            .find_match_by_id(
                club_match_id=club_match_id,
            )
        )

        if match is None:
            raise LookupError(
                "매칭 정보를 찾을 수 없습니다."
            )


        requester_club_id = int(
            match["requester_club_id"]
        )

        target_club_id = int(
            match["target_club_id"]
        )


        # -----------------------------------------------------
        # 3. 현재 동호회가 실제 경기 참가 동호회인지 확인
        #
        # 다른 동호회의 club_match_id를 직접 입력해서
        # 조회하는 것을 방지
        # -----------------------------------------------------
        if club_id not in {
            requester_club_id,
            target_club_id,
        }:
            raise PermissionError(
                "이 매칭을 조회할 권한이 없습니다."
            )


        # -----------------------------------------------------
        # 4. 원본 경기 가능일 조회
        # -----------------------------------------------------
        availability = (
            self.match_repository
            .find_availability_by_id(
                availability_id=int(
                    match["availability_id"]
                ),
            )
        )

        if availability is None:
            raise LookupError(
                "경기 정보를 찾을 수 없습니다."
            )


        # -----------------------------------------------------
        # 5. 경기 날짜 변환
        # -----------------------------------------------------
        match_date = availability[
            "match_date"
        ]

        if isinstance(
            match_date,
            str,
        ):
            match_date = date.fromisoformat(
                match_date
            )


        # -----------------------------------------------------
        # 6. 현재 상세 화면의 type 결정
        #
        # pending
        #   target    → received
        #   requester → sent
        #
        # approved
        #   오늘 이후 → upcoming
        #   지난 경기 → history
        # -----------------------------------------------------
        match_status = match["status"]


        # -----------------------------------------------------
        # 경기 취소 요청 상태 기본값
        # -----------------------------------------------------
        is_cancel_request_sent = False

        is_cancel_request_received = False


        # -----------------------------------------------------
        # pending 신청
        # -----------------------------------------------------
        if match_status == "pending":

            if club_id == target_club_id:

                detail_type = "received"

                status_label = (
                    "승인 대기"
                )

            else:

                detail_type = "sent"

                status_label = (
                    "응답 대기"
                )


        # -----------------------------------------------------
        # 정상 확정 경기
        # -----------------------------------------------------
        elif match_status == "approved":

            if match_date >= date.today():

                detail_type = "upcoming"

                status_label = (
                    "경기 예정"
                )

            else:

                detail_type = "history"

                status_label = (
                    "지난 경기"
                )


        # -----------------------------------------------------
        # HOME(target)이 경기 취소 요청
        # -----------------------------------------------------
        elif (
            match_status
            == "cancel_requested_by_target"
        ):

            # 현재 동호회가 target이면
            # 내가 보낸 취소 요청
            if club_id == target_club_id:

                is_cancel_request_sent = True

            # 현재 동호회가 requester이면
            # 상대에게서 받은 취소 요청
            else:

                is_cancel_request_received = True


            if match_date >= date.today():

                detail_type = "upcoming"

                status_label = (
                    "경기 취소 확인 대기"
                )

            else:

                detail_type = "history"

                status_label = (
                    "경기 취소 확인 대기"
                )


        # -----------------------------------------------------
        # AWAY(requester)가 경기 취소 요청
        # -----------------------------------------------------
        elif (
            match_status
            == "cancel_requested_by_requester"
        ):

            # 현재 동호회가 requester이면
            # 내가 보낸 취소 요청
            if club_id == requester_club_id:

                is_cancel_request_sent = True

            # 현재 동호회가 target이면
            # 상대에게서 받은 취소 요청
            else:

                is_cancel_request_received = True


            if match_date >= date.today():

                detail_type = "upcoming"

                status_label = (
                    "경기 취소 확인 대기"
                )

            else:

                detail_type = "history"

                status_label = (
                    "경기 취소 확인 대기"
                )


        else:

            raise ValueError(
                "현재 매칭관리에서 조회할 수 없는 "
                "매칭 상태입니다."
            )

        # -----------------------------------------------------
        # 7. 상대 동호회 결정
        # -----------------------------------------------------
        if club_id == target_club_id:

            opponent_club_id = (
                requester_club_id
            )

        else:

            opponent_club_id = (
                target_club_id
            )


        # -----------------------------------------------------
        # 8. 상대 동호회 정보 조회
        # -----------------------------------------------------
        clubs = (
            self.match_repository
            .find_clubs_by_ids(
                club_ids=[
                    opponent_club_id
                ],
            )
        )

        if not clubs:
            raise LookupError(
                "상대 동호회 정보를 찾을 수 없습니다."
            )

        opponent_club = clubs[0]


        # -----------------------------------------------------
        # 9. 상대 동호회 대표 이미지
        # -----------------------------------------------------
        representative_images = (
            self.match_repository
            .find_representative_images(
                club_ids=[
                    opponent_club_id
                ],
            )
        )

        opponent_club_profile_image = None

        if representative_images:

            opponent_club_profile_image = (
                representative_images[0].get(
                    "image_url"
                )
            )


        # -----------------------------------------------------
        # 10. 종목 조회
        # -----------------------------------------------------
        sport = (
            self.match_repository
            .find_active_sport_by_id(
                sport_id=int(
                    availability[
                        "sport_id"
                    ]
                ),
            )
        )

        sport_name = (
            sport["sport_name"]
            if sport is not None
            else "알 수 없는 종목"
        )


        # -----------------------------------------------------
        # 11. 경기 기록 관련 기본값
        #
        # received / sent / upcoming에서는
        # 기본적으로 경기 결과가 없다.
        # -----------------------------------------------------
        record_status = None

        my_score = None

        opponent_score = None

        has_written_review = False

        has_received_review = False


        # -----------------------------------------------------
        # 12. 지난 경기라면 결과 조회
        #
        # PlayBridge 기준
        #
        # target    = HOME
        # requester = AWAY
        # -----------------------------------------------------
        if detail_type == "history":

            match_results = (
                self.match_repository
                .find_match_results_by_match_ids(
                    club_match_ids=[
                        club_match_id
                    ],
                )
            )


            # ---------------------------------------------
            # 아직 아무도 경기 기록을 작성하지 않음
            # ---------------------------------------------
            if not match_results:

                record_status = (
                    "RECORD_REQUIRED"
                )


            else:

                match_result = (
                    match_results[0]
                )


                home_score = (
                    match_result.get(
                        "home_score"
                    )
                )

                away_score = (
                    match_result.get(
                        "away_score"
                    )
                )


                home_approval_status = (
                    match_result.get(
                        "home_approval_status"
                    )
                )

                away_approval_status = (
                    match_result.get(
                        "away_approval_status"
                    )
                )

                result_status = (
                    match_result.get(
                        "status"
                    )
                )


                # -----------------------------------------
                # 현재 동호회 기준 점수 변환
                #
                # target = HOME
                # requester = AWAY
                # -----------------------------------------
                if club_id == target_club_id:

                    my_score = home_score

                    opponent_score = (
                        away_score
                    )

                    my_approval_status = (
                        home_approval_status
                    )

                    opponent_approval_status = (
                        away_approval_status
                    )


                else:

                    my_score = away_score

                    opponent_score = (
                        home_score
                    )

                    my_approval_status = (
                        away_approval_status
                    )

                    opponent_approval_status = (
                        home_approval_status
                    )


                # -----------------------------------------
                # 양쪽 모두 경기 결과 확인 완료
                # -----------------------------------------
                if (
                    result_status
                    in {
                        "confirmed",
                        "completed",
                    }
                    or (
                        home_approval_status
                        == "approved"
                        and
                        away_approval_status
                        == "approved"
                    )
                ):

                    record_status = (
                        "COMPLETED"
                    )


                # -----------------------------------------
                # 나는 확인 완료
                # 상대 확인 대기
                # -----------------------------------------
                elif (
                    my_approval_status
                    == "approved"
                    and
                    opponent_approval_status
                    != "approved"
                ):

                    record_status = (
                        "RECORD_PENDING"
                    )


                # -----------------------------------------
                # 상대팀은 확인했지만
                # 나는 아직 확인하지 않음
                # -----------------------------------------
                elif (
                    my_approval_status
                    != "approved"
                    and
                    opponent_approval_status
                    == "approved"
                ):

                    record_status = (
                        "RECORD_CONFIRM_REQUIRED"
                    )


                else:

                    record_status = (
                        "RECORD_PENDING"
                    )


            # -------------------------------------------------
            # 13. 내가 작성한 후기 존재 여부
            # -------------------------------------------------
            written_reviews = (
                self.match_repository
                .find_written_reviews_by_match_ids(
                    club_id=club_id,
                    club_match_ids=[
                        club_match_id
                    ],
                )
            )

            has_written_review = bool(
                written_reviews
            )


            # -------------------------------------------------
            # 14. 내가 받은 후기 존재 여부
            # -------------------------------------------------
            received_reviews = (
                self.match_repository
                .find_received_reviews_by_match_ids(
                    club_id=club_id,
                    club_match_ids=[
                        club_match_id
                    ],
                )
            )

            has_received_review = bool(
                received_reviews
            )


        # -----------------------------------------------------
        # 15. 최종 Response
        # -----------------------------------------------------
        return MatchManagementDetailResponse(

            club_match_id=club_match_id,

            type=detail_type,


            # 상대 동호회
            opponent_club_id=(
                opponent_club_id
            ),

            opponent_club_name=(
                opponent_club[
                    "club_name"
                ]
            ),

            opponent_club_profile_image=(
                opponent_club_profile_image
            ),


            # 경기 정보
            sport_name=sport_name,

            match_date=match_date,

            start_time=availability[
                "start_time"
            ],

            end_time=availability.get(
                "end_time"
            ),


            # 장소
            region=availability[
                "region"
            ],

            location_name=availability[
                "location_name"
            ],

            address=availability.get(
                "address"
            ),


            # 경기 조건
            skill_level=availability[
                "skill_level"
            ],

            required_players=int(
                availability[
                    "required_players"
                ]
            ),

            venue_type=availability.get(
                "venue_type"
            ),

            parking_available=(
                availability.get(
                    "parking_available"
                )
            ),

            intro=availability.get(
                "intro"
            ),


            # 매칭 상태
            status=match_status,

            status_label=status_label,


            # 경기 기록
            record_status=record_status,

            my_score=my_score,

            opponent_score=(
                opponent_score
            ),


            # 후기
            has_written_review=(
                has_written_review
            ),

            has_received_review=(
                has_received_review
            ),
            #취소요청
            is_cancel_request_sent=(
                is_cancel_request_sent
            ),

            is_cancel_request_received=(
                is_cancel_request_received
            ),
        )

    # =========================================================
    # 승인된 팀매칭의 club_events 일정 생성
    #
    # PlayBridge 기준:
    #
    # target_club_id    = HOME
    # requester_club_id = AWAY
    #
    # 확정 경기당 club_events는 1개만 생성하고
    # HOME(target) 동호회의 일정으로 저장한다.
    # =========================================================

    def create_match_event(
        self,
        target_club_id: int,
        target_club_name: str,
        requester_club_name: str,
        availability: dict,
    ) -> int:

        # -----------------------------------------------------
        # 날짜
        # -----------------------------------------------------
        event_date = availability[
            "match_date"
        ]

        if hasattr(
            event_date,
            "isoformat",
        ):
            event_date = (
                event_date.isoformat()
            )


        # -----------------------------------------------------
        # 시작 시간
        # -----------------------------------------------------
        start_time = availability[
            "start_time"
        ]

        if hasattr(
            start_time,
            "isoformat",
        ):
            start_time = (
                start_time.isoformat()
            )


        # -----------------------------------------------------
        # 종료 시간
        # -----------------------------------------------------
        end_time = availability.get(
            "end_time"
        )

        if (
            end_time is not None
            and hasattr(
                end_time,
                "isoformat",
            )
        ):
            end_time = (
                end_time.isoformat()
            )


        # -----------------------------------------------------
        # 경기 일정 생성
        # -----------------------------------------------------
        event = (
            self.club_event_repository
            .create_event(
                {
                    # HOME 동호회 일정으로 저장
                    "club_id": target_club_id,

                    # 예:
                    # 신림 FC vs 관악 FC
                    "title": (
                        f"{target_club_name} "
                        f"vs "
                        f"{requester_club_name}"
                    ),

                    # 매칭 등록 시 작성한 한줄 소개
                    "description": (
                        availability.get(
                            "intro"
                        )
                    ),

                    "event_date": event_date,

                    "start_time": start_time,

                    "end_time": end_time,

                    # club_events에는 장소명이
                    # location 한 칸으로 존재
                    "location": (
                        availability.get(
                            "location_name"
                        )
                    ),

                    # 경기 가능일의 required_players는
                    # 매칭 조건으로 유지하고,
                    # 일정 자체의 참여 제한에는
                    # 아직 사용하지 않는다.
                    "max_participants": None,

                    # 일반 일정과 구분
                    "event_type": "match",

                    # 취소되지 않은 활성 일정
                    "status": "open",

                    "event_image_url": None,

                    # 매칭 경기는 반복 일정 아님
                    "recurrence_group_id": None,

                    "recurrence_type": "none",

                    # 일정 참여 방식
                    "participation_method": "open",

                    # 팀매칭 일정에서는
                    # 우선 게스트 모집 사용 안 함
                    "guest_allowed": False,

                    "max_guests": 0,

                    "registration_deadline": None,
                }
            )
        )

        return int(
            event["event_id"]
        )

    # =========================================================
    # 받은 매칭 신청 승인
    #
    # PATCH
    # /api/matches/management/{club_id}/matches/
    # {club_match_id}/approve
    #
    # 승인하는 동호회 = target = HOME
    # 신청한 동호회   = requester = AWAY
    # =========================================================

    def approve_match_request(
        self,
        user_id: str,
        club_id: int,
        club_match_id: int,
    ) -> MatchManagementActionResponse:

        # -----------------------------------------------------
        # 1. 현재 사용자가 해당 동호회의
        #    owner / manager인지 확인
        # -----------------------------------------------------
        self.validate_management_permission(
            club_id=club_id,
            user_id=user_id,
        )


        # -----------------------------------------------------
        # 2. 매칭 신청 조회
        # -----------------------------------------------------
        match = (
            self.match_repository
            .find_match_by_id(
                club_match_id=club_match_id,
            )
        )

        if match is None:
            raise LookupError(
                "매칭 신청을 찾을 수 없습니다."
            )


        requester_club_id = int(
            match["requester_club_id"]
        )

        target_club_id = int(
            match["target_club_id"]
        )

        availability_id = int(
            match["availability_id"]
        )


        # -----------------------------------------------------
        # 3. 받은 동호회(target)만 승인 가능
        #
        # requester가 자기 신청을 승인하거나
        # 다른 동호회가 club_match_id만 알아내서
        # 승인하는 것을 방지한다.
        # -----------------------------------------------------
        if club_id != target_club_id:

            raise PermissionError(
                "매칭 신청을 받은 동호회만 "
                "승인할 수 있습니다."
            )


        # -----------------------------------------------------
        # 4. pending 상태만 승인 가능
        # -----------------------------------------------------
        if match["status"] != "pending":

            raise ValueError(
                "승인 대기 중인 매칭 신청만 "
                "승인할 수 있습니다."
            )


        # -----------------------------------------------------
        # 5. 경기 가능일 조회
        # -----------------------------------------------------
        availability = (
            self.match_repository
            .find_availability_by_id(
                availability_id=availability_id,
            )
        )

        if availability is None:

            raise LookupError(
                "경기 가능일 정보를 찾을 수 없습니다."
            )


        # -----------------------------------------------------
        # 6. availability의 실제 등록 동호회가
        #    target과 같은지 확인
        # -----------------------------------------------------
        if int(
            availability["club_id"]
        ) != target_club_id:

            raise ValueError(
                "매칭 신청 정보와 경기 가능일 정보가 "
                "일치하지 않습니다."
            )


        # -----------------------------------------------------
        # 7. 아직 모집 중(open)인 경기만 승인 가능
        # -----------------------------------------------------
        if availability["status"] != "open":

            raise ValueError(
                "이미 상대팀이 확정되었거나 "
                "마감된 경기입니다."
            )


        # -----------------------------------------------------
        # 8. HOME / AWAY 동호회 정보 조회
        # -----------------------------------------------------
        clubs = (
            self.match_repository
            .find_clubs_by_ids(
                club_ids=[
                    target_club_id,
                    requester_club_id,
                ],
            )
        )

        club_map = {
            int(club["club_id"]): club
            for club in clubs
        }


        target_club = club_map.get(
            target_club_id
        )

        requester_club = club_map.get(
            requester_club_id
        )


        if target_club is None:

            raise LookupError(
                "경기 모집 동호회 정보를 "
                "찾을 수 없습니다."
            )


        if requester_club is None:

            raise LookupError(
                "경기 신청 동호회 정보를 "
                "찾을 수 없습니다."
            )


        # -----------------------------------------------------
        # 9. 승인 시각
        # -----------------------------------------------------
        approved_at = (
            datetime.now(
                timezone.utc
            ).isoformat()
        )


        # -----------------------------------------------------
        # 10. 승인 처리
        #
        # Supabase REST 호출 여러 개를 사용하므로
        # 중간 실패 시 최대한 원래 상태로 돌리기 위한
        # rollback용 상태값을 기록한다.
        # -----------------------------------------------------
        event_id = None

        match_approved = False

        availability_matched = False

        # 이 승인으로 자동 거절된 다른 신청들 (알림용)
        auto_rejected_matches = []


        try:

            # -------------------------------------------------
            # 10-1. 확정 경기 일정 1개 생성
            #
            # target(HOME) 동호회 일정으로 저장
            # -------------------------------------------------
            event_id = self.create_match_event(
                target_club_id=(
                    target_club_id
                ),
                target_club_name=(
                    target_club[
                        "club_name"
                    ]
                ),
                requester_club_name=(
                    requester_club[
                        "club_name"
                    ]
                ),
                availability=availability,
            )


            # -------------------------------------------------
            # 10-2. 현재 매칭 신청 승인
            #
            # pending → approved
            #
            # 생성된 event_id도 연결
            # -------------------------------------------------
            updated_match = (
                self.match_repository
                .update_match(
                    club_match_id=(
                        club_match_id
                    ),
                    update_data={
                        "status": "approved",

                        "event_id": (
                            event_id
                        ),

                        "responded_at": (
                            approved_at
                        ),

                        "approved_at": (
                            approved_at
                        ),
                    },
                )
            )

            if updated_match is None:

                raise RuntimeError(
                    "매칭 승인 상태 저장에 "
                    "실패했습니다."
                )

            match_approved = True


            # -------------------------------------------------
            # 10-3. 경기 가능일 모집 종료
            #
            # open → matched
            # -------------------------------------------------
            updated_availability = (
                self.match_repository
                .update_availability_status(
                    availability_id=(
                        availability_id
                    ),
                    availability_status=(
                        "matched"
                    ),
                )
            )

            if updated_availability is None:

                raise RuntimeError(
                    "경기 모집 상태 변경에 "
                    "실패했습니다."
                )

            availability_matched = True


            # -------------------------------------------------
            # 10-4. 같은 경기 가능일에 신청했던
            #      다른 pending 신청은 전부 rejected
            # -------------------------------------------------
            auto_rejected_matches = (
                self.match_repository
                .reject_other_pending_matches(
                    availability_id=(
                        availability_id
                    ),
                    approved_club_match_id=(
                        club_match_id
                    ),
                    responded_at=(
                        approved_at
                    ),
                )
            )


        # -----------------------------------------------------
        # 승인 도중 오류가 발생하면
        # 가능한 범위에서 이전 상태로 복구
        # -----------------------------------------------------
        except Exception:

            # availability를 matched까지 바꿨다면
            # 다시 open으로 복구
            if availability_matched:

                try:
                    self.match_repository\
                        .update_availability_status(
                            availability_id=(
                                availability_id
                            ),
                            availability_status=(
                                "open"
                            ),
                        )
                except Exception:
                    pass


            # club_match를 approved까지 바꿨다면
            # 다시 pending으로 복구
            if match_approved:

                try:
                    self.match_repository\
                        .update_match(
                            club_match_id=(
                                club_match_id
                            ),
                            update_data={
                                "status": "pending",
                                "event_id": None,
                                "responded_at": None,
                                "approved_at": None,
                            },
                        )
                except Exception:
                    pass


            # 생성한 일정이 있다면
            # soft cancel 처리
            if event_id is not None:

                try:
                    self.club_event_repository\
                        .cancel_event(
                            club_id=(
                                target_club_id
                            ),
                            event_id=event_id,
                        )
                except Exception:
                    pass


            raise


        # -----------------------------------------------------
        # 10-5. 매칭 승인 알림
        #
        # ① 승인된 신청 동호회(requester) 운영진
        #    → "매칭이 확정됐어요"
        #
        # ② 같은 경기에 신청했다가 자동 거절된 동호회 운영진
        #    → "다른 팀과 매칭이 확정됐어요"
        # -----------------------------------------------------
        match_date_label = self.format_match_date_label(
            availability.get("match_date")
        )

        self.notify_club_managers(
            club_id=requester_club_id,
            title="팀 매칭이 확정됐어요",
            content=(
                f"{target_club['club_name']}과(와)의 "
                f"{match_date_label} 경기 매칭이 승인됐어요."
            ),
            notification_type="team_matching_approved",
            exclude_user_id=user_id,
        )

        for rejected_match in auto_rejected_matches or []:

            rejected_club_id = rejected_match.get(
                "requester_club_id"
            )

            if rejected_club_id is None:
                continue

            self.notify_club_managers(
                club_id=int(rejected_club_id),
                title="팀 매칭이 성사되지 않았어요",
                content=(
                    f"{target_club['club_name']}의 "
                    f"{match_date_label} 경기는 "
                    f"다른 팀과 매칭이 확정됐어요."
                ),
                notification_type="team_matching_rejected",
                exclude_user_id=user_id,
            )


        # -----------------------------------------------------
        # 11. 최종 Response
        # -----------------------------------------------------
        return MatchManagementActionResponse(
            club_match_id=club_match_id,
            status="approved",
            event_id=event_id,
            message=(
                "매칭 신청이 승인되었습니다."
            ),
        )

    # =========================================================
    # 받은 매칭 신청 거절
    #
    # PATCH
    # /api/matches/management/{club_id}/matches/
    # {club_match_id}/reject
    #
    # 거절하는 동호회 = target = HOME
    # 신청한 동호회   = requester = AWAY
    # =========================================================

    def reject_match_request(
        self,
        user_id: str,
        club_id: int,
        club_match_id: int,
    ) -> MatchManagementActionResponse:

        # -----------------------------------------------------
        # 1. 해당 동호회의 owner / manager인지 확인
        # -----------------------------------------------------
        self.validate_management_permission(
            club_id=club_id,
            user_id=user_id,
        )


        # -----------------------------------------------------
        # 2. 매칭 신청 조회
        # -----------------------------------------------------
        match = (
            self.match_repository
            .find_match_by_id(
                club_match_id=club_match_id,
            )
        )

        if match is None:
            raise LookupError(
                "매칭 신청을 찾을 수 없습니다."
            )


        target_club_id = int(
            match["target_club_id"]
        )


        # -----------------------------------------------------
        # 3. 신청을 받은 동호회(target)만 거절 가능
        # -----------------------------------------------------
        if club_id != target_club_id:

            raise PermissionError(
                "매칭 신청을 받은 동호회만 "
                "거절할 수 있습니다."
            )


        # -----------------------------------------------------
        # 4. pending 상태만 거절 가능
        # -----------------------------------------------------
        if match["status"] != "pending":

            raise ValueError(
                "승인 대기 중인 매칭 신청만 "
                "거절할 수 있습니다."
            )


        # -----------------------------------------------------
        # 5. 응답 시각
        # -----------------------------------------------------
        responded_at = (
            datetime.now(
                timezone.utc
            ).isoformat()
        )


        # -----------------------------------------------------
        # 6. pending → rejected
        # -----------------------------------------------------
        updated_match = (
            self.match_repository
            .update_match(
                club_match_id=club_match_id,
                update_data={
                    "status": "rejected",
                    "responded_at": (
                        responded_at
                    ),
                },
            )
        )


        if updated_match is None:

            raise RuntimeError(
                "매칭 신청 거절 처리에 "
                "실패했습니다."
            )


        # -----------------------------------------------------
        # 6-1. 신청한 동호회(requester) 운영진에게 거절 알림
        # -----------------------------------------------------
        try:
            target_club = (
                self.club_repository
                .find_club_by_id(
                    target_club_id
                )
            )

            target_club_name = (
                target_club.get("club_name")
                if target_club
                else "상대 동호회"
            )

            availability = (
                self.match_repository
                .find_availability_by_id(
                    availability_id=int(
                        match["availability_id"]
                    ),
                )
            )

            match_date_label = self.format_match_date_label(
                availability.get("match_date")
                if availability
                else None
            )

            self.notify_club_managers(
                club_id=int(
                    match["requester_club_id"]
                ),
                title="팀 매칭이 거절됐어요",
                content=(
                    f"{target_club_name}이(가) "
                    f"{match_date_label} 경기 매칭 신청을 "
                    f"거절했어요."
                ),
                notification_type="team_matching_rejected",
                exclude_user_id=user_id,
            )

        except Exception as e:
            print("매칭 거절 알림 생성 실패:", e)


        # -----------------------------------------------------
        # 7. 최종 Response
        # -----------------------------------------------------
        return MatchManagementActionResponse(
            club_match_id=club_match_id,
            status="rejected",
            event_id=None,
            message=(
                "매칭 신청이 거절되었습니다."
            ),
        )

    # =========================================================
    # 보낸 매칭 신청 취소
    #
    # PATCH
    # /api/matches/management/{club_id}/matches/
    # {club_match_id}/cancel
    #
    # 신청한 동호회(requester)만
    # pending 상태의 신청을 취소할 수 있다.
    # =========================================================

    def cancel_sent_match_request(
        self,
        user_id: str,
        club_id: int,
        club_match_id: int,
    ) -> MatchManagementActionResponse:

        # -----------------------------------------------------
        # 1. 해당 동호회의 owner / manager인지 확인
        # -----------------------------------------------------
        self.validate_management_permission(
            club_id=club_id,
            user_id=user_id,
        )


        # -----------------------------------------------------
        # 2. 매칭 신청 조회
        # -----------------------------------------------------
        match = (
            self.match_repository
            .find_match_by_id(
                club_match_id=club_match_id,
            )
        )

        if match is None:
            raise LookupError(
                "매칭 신청을 찾을 수 없습니다."
            )


        requester_club_id = int(
            match["requester_club_id"]
        )


        # -----------------------------------------------------
        # 3. 신청한 동호회(requester)만 취소 가능
        # -----------------------------------------------------
        if club_id != requester_club_id:

            raise PermissionError(
                "매칭을 신청한 동호회만 "
                "신청을 취소할 수 있습니다."
            )


        # -----------------------------------------------------
        # 4. 아직 pending 상태인 신청만 취소 가능
        #
        # approved 이후의 경기 취소는
        # 나중에 별도의 '경기 취소 요청' 기능으로 처리
        # -----------------------------------------------------
        if match["status"] != "pending":

            raise ValueError(
                "응답 대기 중인 매칭 신청만 "
                "취소할 수 있습니다."
            )


        # -----------------------------------------------------
        # 5. 취소 시각
        # -----------------------------------------------------
        cancelled_at = (
            datetime.now(
                timezone.utc
            ).isoformat()
        )


        # -----------------------------------------------------
        # 6. pending → cancelled
        # -----------------------------------------------------
        updated_match = (
            self.match_repository
            .update_match(
                club_match_id=club_match_id,
                update_data={
                    "status": "cancelled",

                    # 별도 cancelled_at 컬럼이 없으므로
                    # 현재 DB에서는 responded_at 활용
                    "responded_at": (
                        cancelled_at
                    ),
                },
            )
        )


        if updated_match is None:

            raise RuntimeError(
                "매칭 신청 취소 처리에 "
                "실패했습니다."
            )


        # -----------------------------------------------------
        # 7. Response
        # -----------------------------------------------------
        return MatchManagementActionResponse(
            club_match_id=club_match_id,
            status="cancelled",
            event_id=None,
            message=(
                "매칭 신청이 취소되었습니다."
            ),
        )

    # =========================================================
    # 확정 경기 취소 요청
    #
    # HOME(target) / AWAY(requester)
    # 양쪽 모두 요청 가능
    #
    # approved
    #   ↓
    # cancel_requested_by_target
    # 또는
    # cancel_requested_by_requester
    # =========================================================

    def request_match_cancellation(
        self,
        user_id: str,
        club_id: int,
        club_match_id: int,
    ) -> MatchManagementActionResponse:

        # -----------------------------------------------------
        # 1. 해당 동호회의 owner / manager인지 확인
        # -----------------------------------------------------
        self.validate_management_permission(
            club_id=club_id,
            user_id=user_id,
        )


        # -----------------------------------------------------
        # 2. 매칭 조회
        # -----------------------------------------------------
        match = (
            self.match_repository
            .find_match_by_id(
                club_match_id=club_match_id,
            )
        )

        if match is None:
            raise LookupError(
                "매칭 정보를 찾을 수 없습니다."
            )


        requester_club_id = int(
            match["requester_club_id"]
        )

        target_club_id = int(
            match["target_club_id"]
        )


        # -----------------------------------------------------
        # 3. 실제 참가 동호회인지 확인
        # -----------------------------------------------------
        if club_id not in {
            requester_club_id,
            target_club_id,
        }:

            raise PermissionError(
                "이 경기의 참가 동호회만 "
                "취소를 요청할 수 있습니다."
            )


        # -----------------------------------------------------
        # 4. 정상 확정 경기만 취소 요청 가능
        #
        # 이미 취소 요청 중이면
        # 또 요청할 수 없음
        # -----------------------------------------------------
        if match["status"] != "approved":

            raise ValueError(
                "확정된 경기만 "
                "취소를 요청할 수 있습니다."
            )


        # -----------------------------------------------------
        # 5. 경기 날짜 확인
        #
        # 지난 경기는 경기 취소 요청 불가
        # -----------------------------------------------------
        availability = (
            self.match_repository
            .find_availability_by_id(
                availability_id=int(
                    match["availability_id"]
                ),
            )
        )

        if availability is None:

            raise LookupError(
                "경기 정보를 찾을 수 없습니다."
            )


        match_date = availability[
            "match_date"
        ]

        if isinstance(
            match_date,
            str,
        ):
            match_date = date.fromisoformat(
                match_date
            )


        if match_date < date.today():

            raise ValueError(
                "이미 종료된 경기는 "
                "취소를 요청할 수 없습니다."
            )


        # -----------------------------------------------------
        # 6. 요청한 동호회에 따라 status 결정
        #
        # target = HOME
        # requester = AWAY
        # -----------------------------------------------------
        if club_id == target_club_id:

            cancel_status = (
                "cancel_requested_by_target"
            )

        else:

            cancel_status = (
                "cancel_requested_by_requester"
            )


        # -----------------------------------------------------
        # 7. 취소 요청 상태 저장
        #
        # 아직 최종 취소가 아니므로
        # club_events는 건드리지 않는다.
        # -----------------------------------------------------
        updated_match = (
            self.match_repository
            .update_match(
                club_match_id=club_match_id,
                update_data={
                    "status": cancel_status,
                },
            )
        )


        if updated_match is None:

            raise RuntimeError(
                "경기 취소 요청 처리에 "
                "실패했습니다."
            )


        # -----------------------------------------------------
        # 8. Response
        # -----------------------------------------------------
        return MatchManagementActionResponse(
            club_match_id=club_match_id,
            status=cancel_status,
            event_id=match.get(
                "event_id"
            ),
            message=(
                "경기 취소 요청을 보냈습니다."
            ),
        )

    # =========================================================
    # 경기 취소 요청 승인
    #
    # 상대팀이 보낸 취소 요청에 동의
    #
    # cancel_requested_by_target
    # 또는
    # cancel_requested_by_requester
    #        ↓
    # cancelled
    # =========================================================

    def approve_match_cancellation(
        self,
        user_id: str,
        club_id: int,
        club_match_id: int,
    ) -> MatchManagementActionResponse:

        # -----------------------------------------------------
        # 1. 현재 동호회의 owner / manager인지 확인
        # -----------------------------------------------------
        self.validate_management_permission(
            club_id=club_id,
            user_id=user_id,
        )


        # -----------------------------------------------------
        # 2. 매칭 조회
        # -----------------------------------------------------
        match = (
            self.match_repository
            .find_match_by_id(
                club_match_id=club_match_id,
            )
        )

        if match is None:
            raise LookupError(
                "매칭 정보를 찾을 수 없습니다."
            )


        requester_club_id = int(
            match["requester_club_id"]
        )

        target_club_id = int(
            match["target_club_id"]
        )

        match_status = match["status"]


        # -----------------------------------------------------
        # 3. 실제 참가 동호회인지 확인
        # -----------------------------------------------------
        if club_id not in {
            requester_club_id,
            target_club_id,
        }:

            raise PermissionError(
                "이 경기의 참가 동호회만 "
                "취소 요청을 처리할 수 있습니다."
            )


        # -----------------------------------------------------
        # 4. 누가 취소 요청을 보냈는지 확인
        #
        # target이 요청했으면
        # requester만 승인 가능
        #
        # requester가 요청했으면
        # target만 승인 가능
        # -----------------------------------------------------
        if (
            match_status
            == "cancel_requested_by_target"
        ):

            if club_id != requester_club_id:

                raise PermissionError(
                    "취소 요청을 받은 상대 동호회만 "
                    "승인할 수 있습니다."
                )


        elif (
            match_status
            == "cancel_requested_by_requester"
        ):

            if club_id != target_club_id:

                raise PermissionError(
                    "취소 요청을 받은 상대 동호회만 "
                    "승인할 수 있습니다."
                )


        else:

            raise ValueError(
                "처리할 경기 취소 요청이 없습니다."
            )


        # -----------------------------------------------------
        # 5. 연결된 일정 확인
        # -----------------------------------------------------
        event_id = match.get(
            "event_id"
        )

        if event_id is None:

            raise LookupError(
                "연결된 경기 일정을 찾을 수 없습니다."
            )

        event_id = int(
            event_id
        )


        # -----------------------------------------------------
        # 6. club_match 최종 취소
        #
        # 먼저 match를 cancelled로 변경하고,
        # 일정 취소가 실패하면 원래 상태로 복구한다.
        # -----------------------------------------------------
        updated_match = (
            self.match_repository
            .update_match(
                club_match_id=club_match_id,
                update_data={
                    "status": "cancelled",
                },
            )
        )

        if updated_match is None:

            raise RuntimeError(
                "경기 취소 상태 저장에 "
                "실패했습니다."
            )


        # -----------------------------------------------------
        # 7. 연결된 club_event 소프트 삭제
        #
        # 실제 일정의 소유자는
        # target(HOME) 동호회
        # -----------------------------------------------------
        try:

            self.club_event_repository\
                .cancel_event(
                    club_id=target_club_id,
                    event_id=event_id,
                )

        except Exception:

            # 일정 취소에 실패하면
            # club_match 상태를 원래의
            # 취소 요청 상태로 되돌린다.
            try:

                self.match_repository\
                    .update_match(
                        club_match_id=(
                            club_match_id
                        ),
                        update_data={
                            "status": (
                                match_status
                            ),
                        },
                    )

            except Exception:
                pass

            raise


        # -----------------------------------------------------
        # 8. Response
        # -----------------------------------------------------
        return MatchManagementActionResponse(
            club_match_id=club_match_id,
            status="cancelled",
            event_id=event_id,
            message=(
                "경기가 취소되었습니다."
            ),
        )


    # =========================================================
    # 경기 취소 요청 거절
    #
    # 상대팀이 취소 요청에 동의하지 않으면
    # 다시 정상 확정 경기 상태로 복구
    #
    # cancel_requested_*
    #        ↓
    # approved
    # =========================================================

    def reject_match_cancellation(
        self,
        user_id: str,
        club_id: int,
        club_match_id: int,
    ) -> MatchManagementActionResponse:

        # -----------------------------------------------------
        # 1. 현재 동호회의 owner / manager인지 확인
        # -----------------------------------------------------
        self.validate_management_permission(
            club_id=club_id,
            user_id=user_id,
        )


        # -----------------------------------------------------
        # 2. 매칭 조회
        # -----------------------------------------------------
        match = (
            self.match_repository
            .find_match_by_id(
                club_match_id=club_match_id,
            )
        )

        if match is None:

            raise LookupError(
                "매칭 정보를 찾을 수 없습니다."
            )


        requester_club_id = int(
            match["requester_club_id"]
        )

        target_club_id = int(
            match["target_club_id"]
        )

        match_status = match["status"]


        # -----------------------------------------------------
        # 3. 취소 요청을 받은 상대팀인지 확인
        # -----------------------------------------------------
        if (
            match_status
            == "cancel_requested_by_target"
        ):

            # target이 요청
            # → requester가 응답
            if club_id != requester_club_id:

                raise PermissionError(
                    "취소 요청을 받은 상대 동호회만 "
                    "거절할 수 있습니다."
                )


        elif (
            match_status
            == "cancel_requested_by_requester"
        ):

            # requester가 요청
            # → target이 응답
            if club_id != target_club_id:

                raise PermissionError(
                    "취소 요청을 받은 상대 동호회만 "
                    "거절할 수 있습니다."
                )


        else:

            raise ValueError(
                "처리할 경기 취소 요청이 없습니다."
            )


        # -----------------------------------------------------
        # 4. 취소 요청 거절
        #
        # 다시 정상 확정 경기 상태
        # -----------------------------------------------------
        updated_match = (
            self.match_repository
            .update_match(
                club_match_id=club_match_id,
                update_data={
                    "status": "approved",
                },
            )
        )


        if updated_match is None:

            raise RuntimeError(
                "경기 취소 요청 거절 처리에 "
                "실패했습니다."
            )


        # -----------------------------------------------------
        # 5. 일정은 건드리지 않음
        #
        # 취소 요청 단계에서는 club_event를
        # 삭제하지 않았기 때문에 그대로 유지
        # -----------------------------------------------------
        return MatchManagementActionResponse(
            club_match_id=club_match_id,
            status="approved",
            event_id=match.get(
                "event_id"
            ),
            message=(
                "경기 취소 요청을 거절했습니다."
            ),
        )

    # =========================================================
    # 경기 결과 작성 / 수정 / 재제출
    #
    # PUT
    # /api/matches/management/{club_id}/matches/
    # {club_match_id}/result
    #
    # 최초 작성과
    # "기록이 달라요" 이후 재제출을
    # 같은 API로 처리한다.
    #
    # PlayBridge 기준:
    # target    = HOME
    # requester = AWAY
    # =========================================================

    def submit_match_result(
        self,
        user_id: str,
        club_id: int,
        club_match_id: int,
        request: MatchResultSubmitRequest,
    ) -> MatchResultResponse:

        # -----------------------------------------------------
        # 1. 해당 동호회의 owner / manager인지 확인
        # -----------------------------------------------------
        self.validate_management_permission(
            club_id=club_id,
            user_id=user_id,
        )


        # -----------------------------------------------------
        # 2. 매칭 조회
        # -----------------------------------------------------
        match = (
            self.match_repository
            .find_match_by_id(
                club_match_id=club_match_id,
            )
        )

        if match is None:

            raise LookupError(
                "매칭 정보를 찾을 수 없습니다."
            )


        requester_club_id = int(
            match["requester_club_id"]
        )

        target_club_id = int(
            match["target_club_id"]
        )


        # -----------------------------------------------------
        # 3. 실제 경기 참가 동호회인지 확인
        # -----------------------------------------------------
        if club_id not in {
            requester_club_id,
            target_club_id,
        }:

            raise PermissionError(
                "이 경기의 참가 동호회만 "
                "경기 결과를 작성할 수 있습니다."
            )


        # -----------------------------------------------------
        # 4. 정상 확정 경기만 결과 작성 가능
        #
        # 취소 요청 중 / 취소 완료 경기에는
        # 결과를 작성하지 못하게 한다.
        # -----------------------------------------------------
        if match["status"] != "approved":

            raise ValueError(
                "정상적으로 확정된 경기만 "
                "결과를 작성할 수 있습니다."
            )


        # -----------------------------------------------------
        # 5. 경기 날짜 조회
        # -----------------------------------------------------
        availability = (
            self.match_repository
            .find_availability_by_id(
                availability_id=int(
                    match["availability_id"]
                ),
            )
        )

        if availability is None:

            raise LookupError(
                "경기 정보를 찾을 수 없습니다."
            )


        match_date = availability[
            "match_date"
        ]

        if isinstance(
            match_date,
            str,
        ):

            match_date = date.fromisoformat(
                match_date
            )


        # -----------------------------------------------------
        # 6. 지난 경기만 결과 작성 가능
        #
        # 현재 우리 history 기준과 동일하게
        # 오늘 이전 경기만 기록 가능
        # -----------------------------------------------------
        if match_date >= date.today():

            raise ValueError(
                "아직 종료되지 않은 경기의 "
                "결과는 작성할 수 없습니다."
            )


        # -----------------------------------------------------
        # 7. 현재 동호회 기준 점수를
        #    HOME / AWAY 점수로 변환
        #
        # target    = HOME
        # requester = AWAY
        # -----------------------------------------------------

        # 현재 동호회가 HOME(target)
        if club_id == target_club_id:

            home_score = request.my_score

            away_score = (
                request.opponent_score
            )

            home_approval_status = (
                "approved"
            )

            away_approval_status = (
                "pending"
            )


        # 현재 동호회가 AWAY(requester)
        else:

            home_score = (
                request.opponent_score
            )

            away_score = request.my_score

            home_approval_status = (
                "pending"
            )

            away_approval_status = (
                "approved"
            )


        # -----------------------------------------------------
        # 8. 기존 경기 결과 확인
        # -----------------------------------------------------
        existing_result = (
            self.match_repository
            .find_match_result_by_match_id(
                club_match_id=club_match_id,
            )
        )


        # -----------------------------------------------------
        # 9. 경기 결과가 아직 없으면 최초 생성
        # -----------------------------------------------------
        if existing_result is None:

            saved_result = (
                self.match_repository
                .create_match_result(
                    {
                        "club_match_id": (
                            club_match_id
                        ),

                        "home_score": (
                            home_score
                        ),

                        "away_score": (
                            away_score
                        ),

                        "submitted_by": (
                            user_id
                        ),

                        "home_approval_status": (
                            home_approval_status
                        ),

                        "away_approval_status": (
                            away_approval_status
                        ),

                        "status": "pending",

                        "confirmed_at": None,
                    }
                )
            )

            message = (
                "경기 결과를 제출했습니다."
            )


        # -----------------------------------------------------
        # 10. 결과가 이미 존재하면 수정 / 재제출
        # -----------------------------------------------------
        else:

            # 이미 양쪽 확인까지 끝난 결과는
            # 다시 수정할 수 없다.
            if existing_result["status"] in {
                "confirmed",
                "completed",
            }:

                raise ValueError(
                    "이미 확정된 경기 결과는 "
                    "수정할 수 없습니다."
                )


            saved_result = (
                self.match_repository
                .update_match_result(
                    match_result_id=int(
                        existing_result[
                            "match_result_id"
                        ]
                    ),
                    update_data={
                        # 새로 제출한 점수로 교체
                        "home_score": (
                            home_score
                        ),

                        "away_score": (
                            away_score
                        ),

                        # 마지막으로 점수를
                        # 제출한 사용자
                        "submitted_by": (
                            user_id
                        ),

                        # 새 점수를 제출한 팀은 승인
                        # 상대팀은 다시 확인 필요
                        "home_approval_status": (
                            home_approval_status
                        ),

                        "away_approval_status": (
                            away_approval_status
                        ),

                        "status": "pending",

                        # 재제출됐으므로
                        # 기존 확정 시각 제거
                        "confirmed_at": None,
                    },
                )
            )

            if saved_result is None:

                raise RuntimeError(
                    "경기 결과 수정에 "
                    "실패했습니다."
                )

            message = (
                "경기 결과를 다시 제출했습니다."
            )


        # -----------------------------------------------------
        # 11. 현재 동호회 관점의 점수로 다시 변환
        # -----------------------------------------------------
        if club_id == target_club_id:

            my_score = int(
                saved_result["home_score"]
            )

            opponent_score = int(
                saved_result["away_score"]
            )

        else:

            my_score = int(
                saved_result["away_score"]
            )

            opponent_score = int(
                saved_result["home_score"]
            )


        # -----------------------------------------------------
        # 12. 제출한 쪽은 상대 확인을 기다리므로
        #     RECORD_PENDING
        # -----------------------------------------------------
        return MatchResultResponse(
            match_result_id=int(
                saved_result[
                    "match_result_id"
                ]
            ),

            club_match_id=club_match_id,

            my_score=my_score,

            opponent_score=(
                opponent_score
            ),

            record_status=(
                "RECORD_PENDING"
            ),

            message=message,
        )

    # =========================================================
    # 경기 결과 승인
    #
    # PATCH
    # /api/matches/management/{club_id}/matches/
    # {club_match_id}/result/approve
    #
    # 상대팀이 제출한 경기 결과를 승인한다.
    #
    # 양쪽 approval이 모두 approved가 되면
    # 경기 결과 최종 확정
    # =========================================================

    def approve_match_result(
        self,
        user_id: str,
        club_id: int,
        club_match_id: int,
    ) -> MatchResultResponse:

        # -----------------------------------------------------
        # 1. 해당 동호회의 owner / manager인지 확인
        # -----------------------------------------------------
        self.validate_management_permission(
            club_id=club_id,
            user_id=user_id,
        )


        # -----------------------------------------------------
        # 2. 매칭 조회
        # -----------------------------------------------------
        match = (
            self.match_repository
            .find_match_by_id(
                club_match_id=club_match_id,
            )
        )

        if match is None:

            raise LookupError(
                "매칭 정보를 찾을 수 없습니다."
            )


        requester_club_id = int(
            match["requester_club_id"]
        )

        target_club_id = int(
            match["target_club_id"]
        )


        # -----------------------------------------------------
        # 3. 실제 참가 동호회인지 확인
        # -----------------------------------------------------
        if club_id not in {
            requester_club_id,
            target_club_id,
        }:

            raise PermissionError(
                "이 경기의 참가 동호회만 "
                "경기 결과를 승인할 수 있습니다."
            )


        # -----------------------------------------------------
        # 4. 정상 확정 경기인지 확인
        # -----------------------------------------------------
        if match["status"] != "approved":

            raise ValueError(
                "정상적으로 확정된 경기의 "
                "결과만 승인할 수 있습니다."
            )


        # -----------------------------------------------------
        # 5. 경기 결과 조회
        # -----------------------------------------------------
        match_result = (
            self.match_repository
            .find_match_result_by_match_id(
                club_match_id=club_match_id,
            )
        )

        if match_result is None:

            raise LookupError(
                "승인할 경기 결과가 없습니다."
            )


        # -----------------------------------------------------
        # 6. 이미 최종 확정된 결과인지 확인
        # -----------------------------------------------------
        if match_result["status"] in {
            "confirmed",
            "completed",
        }:

            raise ValueError(
                "이미 확정된 경기 결과입니다."
            )


        home_approval_status = (
            match_result.get(
                "home_approval_status"
            )
        )

        away_approval_status = (
            match_result.get(
                "away_approval_status"
            )
        )


        # -----------------------------------------------------
        # 7. 현재 동호회 기준 approval 확인
        #
        # target    = HOME
        # requester = AWAY
        # -----------------------------------------------------

        # 현재 동호회 = HOME
        if club_id == target_club_id:

            my_approval_status = (
                home_approval_status
            )

            opponent_approval_status = (
                away_approval_status
            )

            my_approval_field = (
                "home_approval_status"
            )


        # 현재 동호회 = AWAY
        else:

            my_approval_status = (
                away_approval_status
            )

            opponent_approval_status = (
                home_approval_status
            )

            my_approval_field = (
                "away_approval_status"
            )


        # -----------------------------------------------------
        # 8. 내가 이미 approved라면
        #    내가 제출한 결과이므로
        #    스스로 다시 승인할 수 없음
        # -----------------------------------------------------
        if my_approval_status == "approved":

            raise ValueError(
                "상대 동호회의 경기 결과 확인을 "
                "기다리고 있습니다."
            )


        # -----------------------------------------------------
        # 9. 상대팀이 제출/승인한 결과인지 확인
        #
        # 상대팀 approval이 approved여야
        # 내가 확인할 결과가 존재하는 것
        # -----------------------------------------------------
        if opponent_approval_status != "approved":

            raise ValueError(
                "현재 승인할 수 있는 "
                "경기 결과가 없습니다."
            )


        # -----------------------------------------------------
        # 10. 현재 동호회도 approved 처리
        #
        # 상대는 이미 approved이므로
        # 이 순간 양쪽 모두 승인 완료
        # -----------------------------------------------------
        confirmed_at = (
            datetime.now(
                timezone.utc
            ).isoformat()
        )


        updated_result = (
            self.match_repository
            .update_match_result(
                match_result_id=int(
                    match_result[
                        "match_result_id"
                    ]
                ),
                update_data={
                    my_approval_field: (
                        "approved"
                    ),

                    "status": (
                        "confirmed"
                    ),

                    "confirmed_at": (
                        confirmed_at
                    ),
                },
            )
        )


        if updated_result is None:

            raise RuntimeError(
                "경기 결과 승인 처리에 "
                "실패했습니다."
            )


        # -----------------------------------------------------
        # 11. 현재 동호회 기준 점수 변환
        #
        # target    = HOME
        # requester = AWAY
        # -----------------------------------------------------
        if club_id == target_club_id:

            my_score = int(
                updated_result[
                    "home_score"
                ]
            )

            opponent_score = int(
                updated_result[
                    "away_score"
                ]
            )

        else:

            my_score = int(
                updated_result[
                    "away_score"
                ]
            )

            opponent_score = int(
                updated_result[
                    "home_score"
                ]
            )


        # -----------------------------------------------------
        # 12. 최종 Response
        # -----------------------------------------------------
        return MatchResultResponse(
            match_result_id=int(
                updated_result[
                    "match_result_id"
                ]
            ),

            club_match_id=club_match_id,

            my_score=my_score,

            opponent_score=(
                opponent_score
            ),

            record_status="COMPLETED",

            message=(
                "경기 결과가 확정되었습니다."
            ),
        )

    # =========================================================
    # 경기 후기 작성
    #
    # POST
    # /api/matches/management/{club_id}/matches/
    # {club_match_id}/review
    #
    # 경기 결과가 최종 확정된 뒤
    # 각 동호회가 상대 동호회에게
    # 한 번씩 후기를 작성한다.
    # =========================================================

    def create_match_review(
        self,
        user_id: str,
        club_id: int,
        club_match_id: int,
        request: MatchReviewCreateRequest,
    ) -> MatchReviewCreateResponse:

        # -----------------------------------------------------
        # 1. 현재 사용자가 해당 동호회의
        #    owner / manager인지 확인
        # -----------------------------------------------------
        self.validate_management_permission(
            club_id=club_id,
            user_id=user_id,
        )


        # -----------------------------------------------------
        # 2. 매칭 조회
        # -----------------------------------------------------
        match = (
            self.match_repository
            .find_match_by_id(
                club_match_id=club_match_id,
            )
        )

        if match is None:

            raise LookupError(
                "매칭 정보를 찾을 수 없습니다."
            )


        requester_club_id = int(
            match["requester_club_id"]
        )

        target_club_id = int(
            match["target_club_id"]
        )


        # -----------------------------------------------------
        # 3. 실제 경기 참가 동호회인지 확인
        # -----------------------------------------------------
        if club_id not in {
            requester_club_id,
            target_club_id,
        }:

            raise PermissionError(
                "이 경기의 참가 동호회만 "
                "후기를 작성할 수 있습니다."
            )


        # -----------------------------------------------------
        # 4. 취소되지 않은 정상 경기인지 확인
        # -----------------------------------------------------
        if match["status"] != "approved":

            raise ValueError(
                "정상적으로 완료된 경기만 "
                "후기를 작성할 수 있습니다."
            )


        # -----------------------------------------------------
        # 5. 경기 결과 조회
        # -----------------------------------------------------
        match_result = (
            self.match_repository
            .find_match_result_by_match_id(
                club_match_id=club_match_id,
            )
        )

        if match_result is None:

            raise ValueError(
                "경기 결과가 아직 등록되지 않았습니다."
            )


        # -----------------------------------------------------
        # 6. 양쪽이 경기 결과를 확인해서
        #    최종 확정된 경우에만 후기 작성 가능
        # -----------------------------------------------------
        if match_result["status"] != "confirmed":

            raise ValueError(
                "경기 결과가 최종 확정된 후 "
                "후기를 작성할 수 있습니다."
            )


        # -----------------------------------------------------
        # 7. 동일 동호회의 중복 후기 확인
        #
        # 운영자가 여러 명이어도
        # 동호회당 경기 후기 1개
        # -----------------------------------------------------
        existing_review = (
            self.match_repository
            .find_match_review_by_reviewer_club(
                club_match_id=club_match_id,
                reviewer_club_id=club_id,
            )
        )

        if existing_review is not None:

            raise ValueError(
                "이미 이 경기의 후기를 "
                "작성했습니다."
            )


        # -----------------------------------------------------
        # 8. 후기 받을 상대 동호회 결정
        #
        # 현재 club_id가 target이면
        # 상대는 requester
        #
        # 현재 club_id가 requester이면
        # 상대는 target
        # -----------------------------------------------------
        if club_id == target_club_id:

            review_target_club_id = (
                requester_club_id
            )

        else:

            review_target_club_id = (
                target_club_id
            )


        # -----------------------------------------------------
        # 9. 선택 후기 내용 정리
        #
        # ""
        # "   "
        #
        # 같은 값은 None으로 저장
        # -----------------------------------------------------
        content = request.content

        if content is not None:

            content = content.strip()

            if not content:
                content = None


        # -----------------------------------------------------
        # 10. 후기 저장
        #
        # reviewer_user_id는
        # Frontend에서 받지 않고 JWT user_id 사용
        # -----------------------------------------------------
        review = (
            self.match_repository
            .create_match_review(
                {
                    "club_match_id": (
                        club_match_id
                    ),

                    "reviewer_user_id": (
                        user_id
                    ),

                    "reviewer_club_id": (
                        club_id
                    ),

                    "target_club_id": (
                        review_target_club_id
                    ),

                    "manner_score": (
                        request.manner_score
                    ),

                    "punctuality_score": (
                        request.punctuality_score
                    ),

                    "roster_accuracy_score": (
                        request.roster_accuracy_score
                    ),

                    "safety_score": (
                        request.safety_score
                    ),

                    "game_flow_score": (
                        request.game_flow_score
                    ),

                    "rematch_score": (
                        request.rematch_score
                    ),

                    "content": content,
                }
            )
        )


        # -----------------------------------------------------
        # 11. 상대 동호회 운영진에게 활동 후기 알림
        #
        # - 후기를 받은 동호회(owner / manager)에게 보냄
        # - 알림 저장이 실패해도 후기 작성은 정상 처리
        #   (notify_club_managers 안에서 예외 처리)
        # -----------------------------------------------------
        try:
            reviewer_club = self.club_repository.find_club_by_id(
                club_id
            )

            reviewer_club_name = (
                reviewer_club.get("club_name")
                if reviewer_club
                else "상대 동호회"
            )

        except Exception:
            reviewer_club_name = "상대 동호회"

        self.notify_club_managers(
            club_id=review_target_club_id,
            title="새 경기 후기가 도착했어요",
            content=(
                f"[{reviewer_club_name}]에서 "
                "함께한 경기의 후기를 남겼어요."
            ),
            notification_type="activity_review",
            link_path=(
                f"/clubs/{review_target_club_id}/matches/"
                f"{club_match_id}/review-detail?type=received"
            ),
        )


        # -----------------------------------------------------
        # 12. Response
        # -----------------------------------------------------
        return MatchReviewCreateResponse(

            match_review_id=int(
                review["match_review_id"]
            ),

            club_match_id=club_match_id,

            reviewer_club_id=club_id,

            target_club_id=(
                review_target_club_id
            ),

            manner_score=int(
                review["manner_score"]
            ),

            punctuality_score=int(
                review["punctuality_score"]
            ),

            roster_accuracy_score=int(
                review[
                    "roster_accuracy_score"
                ]
            ),

            safety_score=int(
                review["safety_score"]
            ),

            game_flow_score=int(
                review["game_flow_score"]
            ),

            rematch_score=int(
                review["rematch_score"]
            ),

            content=review.get(
                "content"
            ),

            message=(
                "경기 후기가 작성되었습니다."
            ),
        )

    # =========================================================
    # 경기 후기 상세 조회
    #
    # GET
    # /api/matches/management/{club_id}/matches/
    # {club_match_id}/review?type=written
    #
    # GET
    # /api/matches/management/{club_id}/matches/
    # {club_match_id}/review?type=received
    # =========================================================

    def get_match_review_detail(
        self,
        user_id: str,
        club_id: int,
        club_match_id: int,
        review_type: str,
    ) -> MatchReviewDetailResponse:

        # -----------------------------------------------------
        # 1. 현재 사용자가 해당 동호회의
        #    owner / manager인지 확인
        # -----------------------------------------------------
        self.validate_management_permission(
            club_id=club_id,
            user_id=user_id,
        )


        # -----------------------------------------------------
        # 2. 매칭 조회
        # -----------------------------------------------------
        match = (
            self.match_repository
            .find_match_by_id(
                club_match_id=club_match_id,
            )
        )

        if match is None:

            raise LookupError(
                "매칭 정보를 찾을 수 없습니다."
            )


        requester_club_id = int(
            match["requester_club_id"]
        )

        target_club_id = int(
            match["target_club_id"]
        )


        # -----------------------------------------------------
        # 3. 실제 경기 참가 동호회인지 확인
        # -----------------------------------------------------
        if club_id not in {
            requester_club_id,
            target_club_id,
        }:

            raise PermissionError(
                "이 경기의 참가 동호회만 "
                "후기를 조회할 수 있습니다."
            )


        # -----------------------------------------------------
        # 4. 후기 종류에 따라 조회
        # -----------------------------------------------------
        if review_type == "written":

            # 내가 작성한 후기
            review = (
                self.match_repository
                .find_match_review_by_reviewer_club(
                    club_match_id=club_match_id,
                    reviewer_club_id=club_id,
                )
            )

            if review is None:

                raise LookupError(
                    "작성한 후기를 찾을 수 없습니다."
                )


            # 내가 작성했으므로
            # 후기 대상이 상대팀
            opponent_club_id = int(
                review["target_club_id"]
            )


        elif review_type == "received":

            # 내가 받은 후기
            review = (
                self.match_repository
                .find_received_match_review(
                    club_match_id=club_match_id,
                    target_club_id=club_id,
                )
            )

            if review is None:

                raise LookupError(
                    "받은 후기를 찾을 수 없습니다."
                )


            # 상대팀이 작성했으므로
            # reviewer가 상대팀
            opponent_club_id = int(
                review["reviewer_club_id"]
            )


        else:

            raise ValueError(
                "후기 조회 type은 "
                "written 또는 received만 가능합니다."
            )


        # -----------------------------------------------------
        # 5. 상대 동호회 정보 조회
        # -----------------------------------------------------
        clubs = (
            self.match_repository
            .find_clubs_by_ids(
                club_ids=[
                    opponent_club_id
                ],
            )
        )

        if not clubs:

            raise LookupError(
                "상대 동호회 정보를 찾을 수 없습니다."
            )

        opponent_club = clubs[0]


        # -----------------------------------------------------
        # 6. 상대 동호회 대표 이미지
        # -----------------------------------------------------
        representative_images = (
            self.match_repository
            .find_representative_images(
                club_ids=[
                    opponent_club_id
                ],
            )
        )

        opponent_club_profile_image = None

        if representative_images:

            opponent_club_profile_image = (
                representative_images[0].get(
                    "image_url"
                )
            )


        # -----------------------------------------------------
        # 7. 경기 정보 조회
        # -----------------------------------------------------
        availability = (
            self.match_repository
            .find_availability_by_id(
                availability_id=int(
                    match["availability_id"]
                ),
            )
        )

        if availability is None:

            raise LookupError(
                "경기 정보를 찾을 수 없습니다."
            )


        # -----------------------------------------------------
        # 8. 경기 결과 조회
        # -----------------------------------------------------
        match_result = (
            self.match_repository
            .find_match_result_by_match_id(
                club_match_id=club_match_id,
            )
        )

        if match_result is None:

            raise LookupError(
                "경기 결과를 찾을 수 없습니다."
            )


        # -----------------------------------------------------
        # 9. 현재 동호회 관점의 점수로 변환
        #
        # target    = HOME
        # requester = AWAY
        # -----------------------------------------------------
        if club_id == target_club_id:

            my_score = int(
                match_result["home_score"]
            )

            opponent_score = int(
                match_result["away_score"]
            )

        else:

            my_score = int(
                match_result["away_score"]
            )

            opponent_score = int(
                match_result["home_score"]
            )


        # -----------------------------------------------------
        # 10. 최종 Response
        # -----------------------------------------------------
        return MatchReviewDetailResponse(

            match_review_id=int(
                review["match_review_id"]
            ),

            club_match_id=club_match_id,

            type=review_type,


            # 상대 동호회
            opponent_club_id=(
                opponent_club_id
            ),

            opponent_club_name=(
                opponent_club[
                    "club_name"
                ]
            ),

            opponent_club_profile_image=(
                opponent_club_profile_image
            ),


            # 경기 정보
            match_date=availability[
                "match_date"
            ],

            start_time=availability[
                "start_time"
            ],

            end_time=availability.get(
                "end_time"
            ),

            location_name=availability[
                "location_name"
            ],


            # 현재 동호회 기준 점수
            my_score=my_score,

            opponent_score=(
                opponent_score
            ),


            # 후기 6개 점수
            manner_score=int(
                review["manner_score"]
            ),

            punctuality_score=int(
                review["punctuality_score"]
            ),

            roster_accuracy_score=int(
                review[
                    "roster_accuracy_score"
                ]
            ),

            safety_score=int(
                review["safety_score"]
            ),

            game_flow_score=int(
                review["game_flow_score"]
            ),

            rematch_score=int(
                review["rematch_score"]
            ),


            # 후기 내용
            content=review.get(
                "content"
            ),
        )