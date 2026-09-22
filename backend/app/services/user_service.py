from app.repositories.user_repository import UserRepository


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