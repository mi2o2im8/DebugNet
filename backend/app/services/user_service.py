from app.repositories.user_repository import UserRepository


# ---------------------------------------------------------
# 사용자 정보 관련 비즈니스 로직
# ---------------------------------------------------------
class UserService:

    def __init__(self):
        self.user_repository = UserRepository()

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