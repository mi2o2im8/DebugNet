from datetime import time

from app.core.supabase import (
    get_supabase_admin_client,
    get_supabase_auth_client,
)


# ---------------------------------------------------------
# 사용자 관련 Supabase 작업을 담당하는 Repository
#
# 회원가입 시 Supabase Auth 계정 생성과
# 사용자 관련 DB INSERT를 담당한다.
#
# 일반 로그인은 React가 Supabase Auth와 직접 처리하므로
# Repository에 로그인 함수는 두지 않는다.
# ---------------------------------------------------------
class UserRepository:

    def __init__(self):

        # 회원가입 시 Supabase Auth 계정을 만들기 위한 Client
        # Publishable Key를 사용한다.
        self.auth_client = get_supabase_auth_client()

        # public 테이블에 사용자 정보를 저장하기 위한 Client
        # Secret Key를 사용하며 React에는 절대 노출하지 않는다.
        self.admin_client = get_supabase_admin_client()

    # -----------------------------------------------------
    # Supabase Auth 회원가입
    # -----------------------------------------------------
    def create_auth_user(
        self,
        email: str,
        password: str,
    ) -> dict:

        # 이메일 + 비밀번호로 Supabase Auth 사용자 생성
        response = self.auth_client.auth.sign_up(
            {
                "email": email,
                "password": password,
            }
        )

        if response.user is None:
            raise ValueError(
                "Supabase 사용자 생성에 실패했습니다."
            )

        # Supabase Auth가 생성한 UUID
        user_id = str(response.user.id)

        # 현재 프로젝트는 Confirm email을 끈 상태를 기준으로
        # 회원가입 직후 세션이 생성되는 흐름을 사용한다.
        if response.session is None:
            raise ValueError(
                "회원가입은 완료되었지만 로그인 세션이 생성되지 않았습니다."
            )

        return {
            "user_id": user_id,
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
        }

    # -----------------------------------------------------
    # users 테이블 저장
    # -----------------------------------------------------
    def create_user(
        self,
        user_data: dict,
    ) -> None:

        data = user_data.copy()

        # Python date 객체를 DB DATE 컬럼용 문자열로 변환
        if data.get("birth_date") is not None:
            data["birth_date"] = data["birth_date"].isoformat()

        self.admin_client.table(
            "users"
        ).insert(
            data
        ).execute()

    # -----------------------------------------------------
    # user_sports 저장
    # -----------------------------------------------------
    def create_user_sport(
        self,
        user_id: str,
        sport_id: int,
    ) -> None:

        self.admin_client.table(
            "user_sports"
        ).insert(
            {
                "user_id": user_id,
                "sport_id": sport_id,
            }
        ).execute()

    # -----------------------------------------------------
    # user_sport_levels 저장
    # -----------------------------------------------------
    def create_user_sport_level(
        self,
        user_id: str,
        sport_id: int,
        sport_level: str,
    ) -> None:

        self.admin_client.table(
            "user_sport_levels"
        ).insert(
            {
                "user_id": user_id,
                "sport_id": sport_id,
                "sport_level": sport_level,
            }
        ).execute()

    # -----------------------------------------------------
    # user_regions 저장
    # -----------------------------------------------------
    def create_user_region(
        self,
        user_id: str,
        region: str,
    ) -> None:

        self.admin_client.table(
            "user_regions"
        ).insert(
            {
                "user_id": user_id,
                "region": region,
            }
        ).execute()

    # -----------------------------------------------------
    # user_available_times 저장
    # -----------------------------------------------------
    def create_user_available_time(
        self,
        user_id: str,
        day_of_week: str,
        start_time: time,
        end_time: time,
    ) -> None:

        # Python time 객체를 DB TIME 컬럼용 문자열로 변환
        start_time_string = start_time.isoformat()
        end_time_string = end_time.isoformat()

        self.admin_client.table(
            "user_available_times"
        ).insert(
            {
                "user_id": user_id,
                "day_of_week": day_of_week,
                "start_time": start_time_string,
                "end_time": end_time_string,
            }
        ).execute()

    # ---------------------------------------------------------
    # user_club_atmospheres 저장
    #
    # 사용자가 회원가입 시 선택한
    # 선호 동호회 분위기를 저장한다.
    # ---------------------------------------------------------
    def create_user_club_atmosphere(
        self,
        user_id: str,
        atmosphere: str,
    ) -> None:

        self.admin_client.table(
            "user_club_atmospheres"
        ).insert(
            {
                "user_id": user_id,
                "atmosphere": atmosphere,
            }
        ).execute()

    # ---------------------------------------------------------
    # 이메일 중복 확인
    # ---------------------------------------------------------
    def email_exists(
        self,
        email: str,
    ) -> bool:

        response = (
            self.admin_client
            .table("users")
            .select("user_id")
            .eq("email", email)
            .limit(1)
            .execute()
        )

        return len(response.data) > 0


    # ---------------------------------------------------------
    # 닉네임 중복 확인
    # ---------------------------------------------------------
    def nickname_exists(
        self,
        nickname: str,
    ) -> bool:

        response = (
            self.admin_client
            .table("users")
            .select("user_id")
            .eq("nickname", nickname)
            .limit(1)
            .execute()
        )

        return len(response.data) > 0

    # ---------------------------------------------------------
    # 로그인 사용자의 성별 조회
    # ---------------------------------------------------------
    def get_user_gender(
        self,
        user_id: str,
    ) -> str:

        response = (
            self.admin_client
            .table("users")
            .select("gender")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )

        if not response.data:
            raise LookupError(
                "사용자 정보를 찾을 수 없습니다."
            )

        gender = str(
            response.data[0].get("gender", "")
        ).strip()

        if not gender:
            raise ValueError(
                "사용자의 성별 정보가 없습니다."
            )

        return gender

    # ---------------------------------------------------------
    # 내 기본 정보 조회 (users 테이블)
    # ---------------------------------------------------------
    def get_user_profile(
        self,
        user_id: str,
    ) -> dict:

        response = (
            self.admin_client
            .table("users")
            .select(
                "user_id, name, nickname, email, "
                "profile_image, gender, birth_date"
            )
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )

        if not response.data:
            raise LookupError(
                "사용자 정보를 찾을 수 없습니다."
            )

        return response.data[0]

    # ---------------------------------------------------------
    # 내 운동 종목 ID 목록 조회 (user_sports)
    # ---------------------------------------------------------
    def get_user_sport_ids(
        self,
        user_id: str,
    ) -> list[int]:

        response = (
            self.admin_client
            .table("user_sports")
            .select("sport_id")
            .eq("user_id", user_id)
            .execute()
        )

        return [
            row["sport_id"]
            for row in (response.data or [])
            if row.get("sport_id") is not None
        ]

    # ---------------------------------------------------------
    # 내 종목별 운동 수준 조회 (user_sport_levels)
    #
    # 반환 예: {1: "초급", 3: "중급"}
    # ---------------------------------------------------------
    def get_user_sport_levels(
        self,
        user_id: str,
    ) -> dict[int, str]:

        response = (
            self.admin_client
            .table("user_sport_levels")
            .select("sport_id, sport_level")
            .eq("user_id", user_id)
            .execute()
        )

        return {
            row["sport_id"]: row.get("sport_level")
            for row in (response.data or [])
        }

    # ---------------------------------------------------------
    # sport_id 목록으로 종목명 조회 (sports)
    # ---------------------------------------------------------
    def get_sports_by_ids(
        self,
        sport_ids: list[int],
    ) -> list[dict]:

        if not sport_ids:
            return []

        response = (
            self.admin_client
            .table("sports")
            .select("sport_id, sport_name")
            .in_("sport_id", sport_ids)
            .order("sport_id")
            .execute()
        )

        return response.data or []

    # ---------------------------------------------------------
    # 내 활동 지역 조회 (user_regions)
    # ---------------------------------------------------------
    def get_user_regions(
        self,
        user_id: str,
    ) -> list[str]:

        response = (
            self.admin_client
            .table("user_regions")
            .select("region")
            .eq("user_id", user_id)
            .execute()
        )

        return [
            row["region"]
            for row in (response.data or [])
            if row.get("region")
        ]

    # ---------------------------------------------------------
    # 내 기본 정보 수정 (users 테이블)
    # ---------------------------------------------------------
    def update_user_basic_info(
        self,
        user_id: str,
        update_data: dict,
    ) -> None:

        data = update_data.copy()

        # Python date 객체를 DB DATE 컬럼용 문자열로 변환
        if data.get("birth_date") is not None:
            data["birth_date"] = data["birth_date"].isoformat()

        (
            self.admin_client
            .table("users")
            .update(data)
            .eq("user_id", user_id)
            .execute()
        )

    # ---------------------------------------------------------
    # 닉네임 중복 확인 (나 자신은 제외)
    # ---------------------------------------------------------
    def nickname_exists_for_other_user(
        self,
        nickname: str,
        user_id: str,
    ) -> bool:

        response = (
            self.admin_client
            .table("users")
            .select("user_id")
            .eq("nickname", nickname)
            .neq("user_id", user_id)
            .limit(1)
            .execute()
        )

        return len(response.data) > 0

    # ---------------------------------------------------------
    # 내 운동 종목 + 수준 통째로 교체
    #
    # 1. 기존 user_sport_levels / user_sports 삭제
    # 2. 새 목록을 한 번에 INSERT
    #
    # sports 예: [{"sport_id": 1, "sport_level": "초급"}, ...]
    # ---------------------------------------------------------
    def replace_user_sports(
        self,
        user_id: str,
        sports: list[dict],
    ) -> None:

        # 수준 → 종목 순서로 삭제
        (
            self.admin_client
            .table("user_sport_levels")
            .delete()
            .eq("user_id", user_id)
            .execute()
        )

        (
            self.admin_client
            .table("user_sports")
            .delete()
            .eq("user_id", user_id)
            .execute()
        )

        if not sports:
            return

        # 종목 → 수준 순서로 저장
        (
            self.admin_client
            .table("user_sports")
            .insert([
                {
                    "user_id": user_id,
                    "sport_id": sport["sport_id"],
                }
                for sport in sports
            ])
            .execute()
        )

        (
            self.admin_client
            .table("user_sport_levels")
            .insert([
                {
                    "user_id": user_id,
                    "sport_id": sport["sport_id"],
                    "sport_level": sport["sport_level"],
                }
                for sport in sports
            ])
            .execute()
        )

    # ---------------------------------------------------------
    # 내 활동 지역 통째로 교체 (user_regions)
    # ---------------------------------------------------------
    def replace_user_regions(
        self,
        user_id: str,
        regions: list[str],
    ) -> None:

        (
            self.admin_client
            .table("user_regions")
            .delete()
            .eq("user_id", user_id)
            .execute()
        )

        if not regions:
            return

        (
            self.admin_client
            .table("user_regions")
            .insert([
                {
                    "user_id": user_id,
                    "region": region,
                }
                for region in regions
            ])
            .execute()
        )

    # ---------------------------------------------------------
    # 프로필 이미지 URL 수정
    # ---------------------------------------------------------
    def update_profile_image(
        self,
        user_id: str,
        profile_image: str,
    ) -> None:

        self.admin_client.table(
            "users"
        ).update(
            {
                "profile_image": profile_image
            }
        ).eq(
            "user_id", user_id
        ).execute()

    # -----------------------------------------------------
    # 동호회 가입 신청
    #
    # 로그인한 사용자가 특정 동호회에 가입 신청한다.
    # status = pending → 운영자 승인 대기
    # -----------------------------------------------------
    def create_join_request(
        self,
        club_id: int,
        user_id: str,
    ):
        data = {
            "club_id": club_id,
            "user_id": user_id,
            "role": "member",
            "status": "pending",
            "join_source": "club_detail",
        }

        response = (
            self.supabase
            .table("club_members")
            .insert(data)
            .execute()
        )

        return response.data