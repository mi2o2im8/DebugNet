from datetime import (
    date,
    datetime,
    timezone,
)

from app.repositories.club_repository import (
    ClubRepository,
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