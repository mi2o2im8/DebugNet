from app.repositories.user_repository import UserRepository
from app.schemas.auth import SignupRequest, SignupResponse


# ---------------------------------------------------------
# 회원가입 비즈니스 로직을 담당하는 Service
#
# 로그인은 React가 Supabase Auth와 직접 처리한다.
# FastAPI는 이후 React가 보내는 Access Token을 검증해
# 현재 로그인 사용자의 UUID를 확인하는 역할을 맡는다.
# ---------------------------------------------------------
class AuthService:

    def __init__(self):
        # Supabase Auth 회원 생성 및 사용자 DB 저장을 담당할 Repository
        self.user_repository = UserRepository()

    # -----------------------------------------------------
    # 회원가입
    # -----------------------------------------------------
    def signup(
        self,
        signup_data: SignupRequest,
    ) -> SignupResponse:
        """
        회원가입 처리 순서

        1. 이메일 형식 정리
        2. Supabase Auth 계정 생성
        3. Supabase 사용자 UUID 확인
        4. users 테이블 저장
        5. user_sports 저장
        6. user_sport_levels 저장
        7. user_regions 저장
        8. user_available_times 저장
        9. 회원가입 결과 반환

        일반 로그인은 이 Service에서 처리하지 않는다.
        React가 Supabase Auth의 signInWithPassword를 직접 사용한다.
        """

        # 이메일 앞뒤 공백 제거 + 소문자 통일
        email = signup_data.email.strip().lower()

        # -------------------------------------------------
        # Supabase Auth 계정 생성
        #
        # 비밀번호는 public.users에 저장하지 않고
        # Supabase Auth가 관리한다.
        # -------------------------------------------------
        auth_result = self.user_repository.create_auth_user(
            email=email,
            password=signup_data.password,
        )

        # Supabase Auth에서 생성한 사용자 UUID
        user_id = auth_result["user_id"]

        # -------------------------------------------------
        # users 테이블에 저장할 기본 회원정보
        # -------------------------------------------------
        user_data = {
            "user_id": user_id,
            "name": signup_data.name,
            "nickname": signup_data.nickname,
            "email": email,
            "profile_image": signup_data.profile_image,
            "gender": signup_data.gender,
            "birth_date": signup_data.birth_date,
            "travel_distance_km": signup_data.travel_distance_km,
            "max_monthly_fee": signup_data.max_monthly_fee,
        }

        self.user_repository.create_user(
            user_data=user_data
        )

        # -------------------------------------------------
        # 선택 종목 + 종목별 운동 수준 저장
        # -------------------------------------------------
        for sport in signup_data.sports:
            self.user_repository.create_user_sport(
                user_id=user_id,
                sport_id=sport.sport_id,
            )

            self.user_repository.create_user_sport_level(
                user_id=user_id,
                sport_id=sport.sport_id,
                sport_level=sport.sport_level,
            )

        # -------------------------------------------------
        # 활동 가능 지역 저장
        # -------------------------------------------------
        for region in signup_data.regions:
            self.user_repository.create_user_region(
                user_id=user_id,
                region=region,
            )

        # -------------------------------------------------
        # 활동 가능 시간 저장
        # -------------------------------------------------
        for available_time in signup_data.available_times:
            self.user_repository.create_user_available_time(
                user_id=user_id,
                day_of_week=available_time.day_of_week,
                start_time=available_time.start_time,
                end_time=available_time.end_time,
            )

        # -------------------------------------------------
        # 회원가입 성공 응답
        # -------------------------------------------------
        return SignupResponse(
            user_id=user_id,
            access_token=auth_result["access_token"],
            refresh_token=auth_result.get("refresh_token"),
        )
