from app.repositories.club_repository import (
    ClubRepository,
)
from app.schemas.clubs import (
    ClubCreateRequest,
    ClubCreateResponse,
    ClubDashboardResponse,
)


class ClubService:

    def __init__(self):
        self.club_repository = ClubRepository()

    # -----------------------------------------------------
    # 프론트 가입 대상값을 DB 코드로 변환
    # -----------------------------------------------------
    @staticmethod
    def normalize_gender_rule(
        join_target: str,
    ) -> str:
        gender_rule_map = {
            "모두": "all",
            "남녀 모두": "all",
            "남녀모두": "all",
            "남성만": "male",
            "여성만": "female",
            "all": "all",
            "male": "male",
            "female": "female",
        }

        normalized_value = gender_rule_map.get(
            join_target.strip()
        )

        if normalized_value is None:
            raise ValueError(
                f"지원하지 않는 가입 대상입니다: {join_target}"
            )

        return normalized_value

    # -----------------------------------------------------
    # 종목 조회 및 clubs 기본 행 생성
    # -----------------------------------------------------
    def create_base_club(
        self,
        owner_id: str,
        request_data: ClubCreateRequest,
    ) -> tuple[int, int, list]:
        # 선택한 종목이 실제 DB에 있는지 확인
        sport = (
            self.club_repository
            .find_sport_by_name(
                request_data.sport_name
            )
        )

        if sport is None:
            raise ValueError(
                "등록되지 않은 운동 종목입니다: "
                f"{request_data.sport_name}"
            )

        # 비활성화된 일정은 DB 저장 대상에서 제외
        active_schedules = [
            schedule
            for schedule in request_data.schedules
            if schedule.enabled
        ]

        if not active_schedules:
            raise ValueError(
                "하나 이상의 활동 일정을 활성화해주세요."
            )

        gender_rule = self.normalize_gender_rule(
            request_data.join_target
        )

        club = self.club_repository.create_club(
            {
                "club_name": request_data.club_name,
                "club_intro": request_data.club_intro,
                "owner_id": owner_id,
                "max_members": request_data.max_members,
                "current_members": 1,
                "activity_frequency": (
                    request_data.activity_frequency
                ),
                "gender_rule": gender_rule,
                "join_method": request_data.join_method,
                "visibility": request_data.visibility,
                "status": True,
            }
        )

        club_id = int(
            club["club_id"]
        )

        sport_id = int(
            sport["sport_id"]
        )

        return (
            club_id,
            sport_id,
            active_schedules,
        )

    # -----------------------------------------------------
    # 종목, 지역, 일정, 운동 수준, 연령대 저장
    # -----------------------------------------------------
    def save_club_conditions(
        self,
        club_id: int,
        sport_id: int,
        active_schedules: list,
        request_data: ClubCreateRequest,
    ) -> None:
        # 동호회와 종목 연결
        self.club_repository.create_club_sport(
            club_id=club_id,
            sport_id=sport_id,
        )

        # 활동 지역 저장
        region = (
            f"{request_data.city} "
            f"{request_data.district}"
        ).strip()

        self.club_repository.create_club_region(
            club_id=club_id,
            region=region,
        )

        # 활성화된 일정만 저장
        schedule_rows = [
            {
                "club_id": club_id,
                "day_of_week": (
                    schedule.day_of_week
                ),
                "start_time": (
                    schedule.start_time.isoformat()
                ),
                "end_time": (
                    schedule.end_time.isoformat()
                ),
            }
            for schedule in active_schedules
        ]

        self.club_repository.create_club_schedules(
            schedule_rows
        )

        # 선택한 운동 수준 저장
        level_rows = [
            {
                "club_id": club_id,
                "sport_id": sport_id,
                "sport_level": level,
            }
            for level in request_data.activity_levels
        ]

        self.club_repository.create_club_sport_levels(
            level_rows
        )

        # 연령 제한 없음이면 연령대 행을 생성하지 않음
        if not request_data.no_age_limit:
            age_group_rows = [
                {
                    "club_id": club_id,
                    "age_group": age_group,
                }
                for age_group in request_data.age_groups
            ]

            self.club_repository.create_club_age_groups(
                age_group_rows
            )

    # -----------------------------------------------------
    # 장소, 키워드, 이미지, 가입 질문 저장
    # -----------------------------------------------------
    def save_club_details(
        self,
        club_id: int,
        owner_id: str,
        request_data: ClubCreateRequest,
    ) -> None:
        # 실제 활동 장소 저장
        self.club_repository.create_club_venue(
            {
                "club_id": club_id,
                "venue_name": (
                    request_data.activity_place
                ),
                "address": (
                    request_data.activity_place_detail
                    or request_data.detail_location
                ),
            }
        )

        # 소개글 생성에 사용한 키워드 저장
        keyword_rows = [
            {
                "club_id": club_id,
                "keyword": keyword,
                "display_order": index,
            }
            for index, keyword in enumerate(
                request_data.intro_keywords,
                start=0,
            )
        ]

        self.club_repository.create_club_intro_keywords(
            keyword_rows
        )

        # 대표 이미지와 활동 이미지 URL 구성
        image_rows = []

        if request_data.representative_image_url:
            image_rows.append(
                {
                    "club_id": club_id,
                    "image_url": (
                        request_data
                        .representative_image_url
                    ),
                    "display_order": 0,
                    "image_type": "representative",
                }
            )

        activity_image_rows = [
            {
                "club_id": club_id,
                "image_url": image_url,
                "display_order": index,
                "image_type": "activity",
            }
            for index, image_url in enumerate(
                request_data.activity_image_urls,
                start=1,
            )
        ]

        image_rows.extend(
            activity_image_rows
        )

        self.club_repository.create_club_images(
            image_rows
        )

        # 운영자가 추가한 가입 질문 저장
        question_rows = [
            {
                "club_id": club_id,
                "question_text": (
                    question.question_text
                ),
                "question_type": (
                    question.question_type
                ),
                "required": question.required,
                "display_order": index,
            }
            for index, question in enumerate(
                request_data.join_questions,
                start=1,
            )
        ]

        self.club_repository.create_club_join_questions(
            question_rows
        )

        # 동호회 생성자를 동호회장으로 등록
        self.club_repository.create_owner_membership(
            club_id=club_id,
            user_id=owner_id,
        )

    # -----------------------------------------------------
    # 동호회 전체 생성
    # -----------------------------------------------------
    def create_club(
        self,
        owner_id: str,
        request_data: ClubCreateRequest,
    ) -> ClubCreateResponse:
        club_id = None

        # 가입 방식 검증
        allowed_join_methods = {
            "instant",
            "approval",
        }

        if (
            request_data.join_method
            not in allowed_join_methods
        ):
            raise ValueError(
                "지원하지 않는 가입 방식입니다."
            )

        # 공개 범위 검증
        allowed_visibility_values = {
            "public",
            "private",
        }

        if (
            request_data.visibility
            not in allowed_visibility_values
        ):
            raise ValueError(
                "지원하지 않는 공개 범위입니다."
            )

        try:
            (
                club_id,
                sport_id,
                active_schedules,
            ) = self.create_base_club(
                owner_id=owner_id,
                request_data=request_data,
            )

            self.save_club_conditions(
                club_id=club_id,
                sport_id=sport_id,
                active_schedules=active_schedules,
                request_data=request_data,
            )

            self.save_club_details(
                club_id=club_id,
                owner_id=owner_id,
                request_data=request_data,
            )

        except Exception:
            # clubs 행까지 생성된 이후 오류가 발생한 경우
            # CASCADE를 이용해 하위 데이터까지 함께 삭제
            if club_id is not None:
                try:
                    self.club_repository.delete_club(
                        club_id
                    )
                except Exception:
                    # 정리 오류로 원래 오류가 가려지지 않도록 함
                    pass

            raise

        return ClubCreateResponse(
            club_id=club_id,
            owner_id=owner_id,
            message="동호회가 생성되었습니다.",
        )

    # -----------------------------------------------------
    # 운영진 동호회 허브 조회
    # -----------------------------------------------------
    def get_dashboard(
        self,
        club_id: int,
        user_id: str,
    ) -> ClubDashboardResponse:
        club = self.club_repository.find_club_by_id(
            club_id
        )

        if club is None:
            raise LookupError(
                "존재하지 않거나 비활성화된 동호회입니다."
            )

        membership = (
            self.club_repository.find_active_membership(
                club_id=club_id,
                user_id=user_id,
            )
        )

        if membership is None:
            raise PermissionError(
                "이 동호회의 운영 권한이 없습니다."
            )

        user_role = membership["role"]

        if user_role not in {
            "owner",
            "manager",
        }:
            raise PermissionError(
                "동호회장 또는 운영진만 접근할 수 있습니다."
            )

        images = self.club_repository.find_club_images(
            club_id
        )

        representative_image_url = next(
            (
                image["image_url"]
                for image in images
                if image["image_type"] == "representative"
            ),
            None,
        )

        activity_image_urls = [
            image["image_url"]
            for image in images
            if image["image_type"] == "activity"
        ]

        return ClubDashboardResponse(
            club_id=club["club_id"],
            club_name=club["club_name"],
            club_intro=club.get("club_intro"),
            sport_name=(
                self.club_repository
                .find_club_sport_name(club_id)
            ),
            region=(
                self.club_repository
                .find_club_region(club_id)
            ),
            venue_name=(
                self.club_repository
                .find_club_venue(club_id)
            ),
            representative_image_url=(
                representative_image_url
            ),
            activity_image_urls=activity_image_urls,
            current_members=(
                self.club_repository
                .count_active_members(club_id)
            ),
            max_members=club.get("max_members"),
            activity_frequency=club.get(
                "activity_frequency"
            ),
            user_role=user_role,
            schedules=(
                self.club_repository
                .find_club_schedules(club_id)
            ),
        )