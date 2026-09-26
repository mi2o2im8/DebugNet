from app.repositories.user_repository import UserRepository
from app.schemas.users import MyProfileUpdateRequest


# ---------------------------------------------------------
# 닉네임이 이미 다른 사람에게 사용 중일 때
# Router에서 409로 변환한다.
# ---------------------------------------------------------
class NicknameAlreadyExistsError(Exception):
    pass


# ---------------------------------------------------------
# 사용자 정보 관련 비즈니스 로직
# ---------------------------------------------------------
class UserService:

    def __init__(self):
        self.user_repository = UserRepository()

    # -----------------------------------------------------
    # 로그인 사용자의 성별 조회
    # -----------------------------------------------------
    def get_my_gender(
        self,
        user_id: str,
    ) -> dict:

        saved_gender = (
            self.user_repository
            .get_user_gender(user_id)
        )

        gender_map = {
            "남성": "male",
            "남자": "male",
            "male": "male",
            "여성": "female",
            "여자": "female",
            "female": "female",
        }

        normalized_gender = gender_map.get(
            saved_gender
        )

        if normalized_gender is None:
            raise ValueError(
                f"지원하지 않는 사용자 성별입니다: "
                f"{saved_gender}"
            )

        return {
            "gender": normalized_gender
        }

    # -----------------------------------------------------
    # 내 정보 조회
    #
    # users + user_sports + user_sport_levels + sports
    # + user_regions 를 합쳐서 한 번에 반환한다.
    # -----------------------------------------------------
    def get_my_profile(
        self,
        user_id: str,
    ) -> dict:

        # 1. 기본 정보 (없으면 LookupError)
        user = self.user_repository.get_user_profile(
            user_id
        )

        # 2. 운동 종목 + 종목별 수준
        sport_ids = (
            self.user_repository
            .get_user_sport_ids(user_id)
        )

        sport_levels = (
            self.user_repository
            .get_user_sport_levels(user_id)
        )

        sport_rows = (
            self.user_repository
            .get_sports_by_ids(sport_ids)
        )

        sports = [
            {
                "sport_id": sport["sport_id"],
                "sport_name": sport["sport_name"],
                "sport_level": sport_levels.get(
                    sport["sport_id"]
                ),
            }
            for sport in sport_rows
        ]

        # 3. 활동 지역
        regions = (
            self.user_repository
            .get_user_regions(user_id)
        )

        return {
            "user_id": str(user["user_id"]),
            "name": user.get("name") or "",
            "nickname": user.get("nickname") or "",
            "email": user.get("email"),
            "profile_image": user.get("profile_image"),
            "gender": user.get("gender"),
            "birth_date": user.get("birth_date"),
            "sports": sports,
            "regions": regions,
        }

    # -----------------------------------------------------
    # 내 정보 수정
    #
    # 처리 순서
    # 1. 사용자 존재 확인
    # 2. 닉네임 중복 확인 (나 자신 제외)
    # 3. users 기본 정보 수정
    # 4. 운동 종목 + 수준 교체
    # 5. 활동 지역 교체
    # 6. 수정된 내 정보 반환
    # -----------------------------------------------------
    def update_my_profile(
        self,
        user_id: str,
        update_data: MyProfileUpdateRequest,
    ) -> dict:

        # 1. 사용자 존재 확인 (없으면 LookupError)
        current_user = self.user_repository.get_user_profile(
            user_id
        )

        # 2. 닉네임을 바꾼 경우에만 중복 확인
        if update_data.nickname != current_user.get("nickname"):

            if self.user_repository.nickname_exists_for_other_user(
                nickname=update_data.nickname,
                user_id=user_id,
            ):
                raise NicknameAlreadyExistsError(
                    "이미 사용 중인 닉네임입니다."
                )

        # 3. users 기본 정보
        self.user_repository.update_user_basic_info(
            user_id=user_id,
            update_data={
                "name": update_data.name,
                "nickname": update_data.nickname,
                "gender": update_data.gender,
                "birth_date": update_data.birth_date,
            },
        )

        # 4. 운동 종목 + 수준
        self.user_repository.replace_user_sports(
            user_id=user_id,
            sports=[
                {
                    "sport_id": sport.sport_id,
                    "sport_level": sport.sport_level,
                }
                for sport in update_data.sports
            ],
        )

        # 5. 활동 지역
        self.user_repository.replace_user_regions(
            user_id=user_id,
            regions=update_data.regions,
        )

        # 6. 저장된 결과를 다시 조회해서 반환
        return self.get_my_profile(user_id)

    # -----------------------------------------------------
    # 프로필 이미지 URL 수정
    # -----------------------------------------------------
    def update_profile_image(
        self,
        user_id: str,
        profile_image: str,
    ) -> dict:

        self.user_repository.update_profile_image(
            user_id=user_id,
            profile_image=profile_image,
        )

        return {
            "message": "프로필 이미지가 변경되었습니다.",
            "profile_image": profile_image,
        }