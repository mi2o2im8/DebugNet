from fastapi import HTTPException, status

from app.repositories.block_repository import BlockRepository

from app.schemas.blocks import (
    UserBlockCreateRequest,
    UserBlockCreateResponse,
    UserBlockDeleteResponse,
    UserBlockListResponse,
)


# ---------------------------------------------------------
# PlayBridge 사용자 차단 Service
#
# Service 역할:
#
# - 자기 자신 차단 방지
# - 존재하지 않는 사용자 차단 방지
# - 중복 차단 방지
# - 차단 목록 조립
# - 차단 해제 검증
#
# 실제 Supabase CRUD는 BlockRepository가 담당한다.
# ---------------------------------------------------------
class BlockService:

    def __init__(self):

        self.block_repository = BlockRepository()


    # =====================================================
    # 1. 사용자 차단
    # =====================================================

    def create_block(
        self,
        user_id: str,
        block_data: UserBlockCreateRequest,
    ) -> UserBlockCreateResponse:

        # -------------------------------------------------
        # Pydantic UUID 객체를 DB 조회에 사용할 문자열로 변환
        # -------------------------------------------------
        blocked_user_id = str(
            block_data.blocked_user_id
        )


        # -------------------------------------------------
        # 자기 자신 차단 방지
        # -------------------------------------------------
        if user_id == blocked_user_id:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="자기 자신은 차단할 수 없습니다.",
            )


        # -------------------------------------------------
        # 차단 대상 사용자가 실제 존재하는지 확인
        # -------------------------------------------------
        if not self.block_repository.user_exists(
            user_id=blocked_user_id,
        ):

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="차단할 사용자를 찾을 수 없습니다.",
            )


        # -------------------------------------------------
        # 이미 차단한 사용자인지 확인
        # -------------------------------------------------
        if self.block_repository.is_blocked(
            user_id=user_id,
            blocked_user_id=blocked_user_id,
        ):

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="이미 차단한 사용자입니다.",
            )


        # -------------------------------------------------
        # 실제 차단 INSERT
        # -------------------------------------------------
        self.block_repository.create_block(
            user_id=user_id,
            blocked_user_id=blocked_user_id,
        )


        # -------------------------------------------------
        # Frontend 응답
        # -------------------------------------------------
        return UserBlockCreateResponse(
            blocked_user_id=blocked_user_id,
            message="사용자를 차단했습니다.",
        )


    # =====================================================
    # 2. 내가 차단한 사용자 목록
    # =====================================================

    def get_block_list(
        self,
        user_id: str,
    ) -> UserBlockListResponse:

        # -------------------------------------------------
        # user_blocks에서
        # 현재 사용자의 차단 기록 조회
        # -------------------------------------------------
        blocks = self.block_repository.get_blocks(
            user_id=user_id,
        )


        # 아무도 차단하지 않은 경우
        if not blocks:

            return UserBlockListResponse(
                blocked_users=[],
                total_count=0,
            )


        # -------------------------------------------------
        # 차단 대상 UUID 목록
        # -------------------------------------------------
        blocked_user_ids = [
            row["blocked_user_id"]
            for row in blocks
        ]


        # -------------------------------------------------
        # users에서 프로필 정보 한 번에 조회
        # -------------------------------------------------
        users = (
            self.block_repository.get_users_by_ids(
                user_ids=blocked_user_ids,
            )
        )


        # -------------------------------------------------
        # UUID → 사용자 정보
        #
        # 예:
        #
        # {
        #   "uuid-1": {...},
        #   "uuid-2": {...}
        # }
        # -------------------------------------------------
        user_by_id = {
            user["user_id"]: user
            for user in users
        }


        # -------------------------------------------------
        # user_blocks + users 조립
        # -------------------------------------------------
        blocked_users = []

        for block in blocks:

            blocked_user_id = block[
                "blocked_user_id"
            ]

            user = user_by_id.get(
                blocked_user_id
            )

            # users에서 해당 회원을 찾을 수 없는 경우
            # 목록 응답에서는 제외한다.
            #
            # 정상적인 FK 구조라면 일반적으로
            # 발생하지 않아야 한다.
            if user is None:
                continue


            blocked_users.append(
                {
                    "user_id": blocked_user_id,

                    "nickname": user["nickname"],

                    "profile_image": user.get(
                        "profile_image"
                    ),

                    "bio": user.get(
                        "bio"
                    ),

                    "blocked_at": block[
                        "created_at"
                    ],
                }
            )


        return UserBlockListResponse(
            blocked_users=blocked_users,
            total_count=len(blocked_users),
        )


    # =====================================================
    # 3. 차단 해제
    # =====================================================

    def delete_block(
        self,
        user_id: str,
        blocked_user_id: str,
    ) -> UserBlockDeleteResponse:

        # -------------------------------------------------
        # 자기 자신의 UUID가 들어와도
        # 실제 차단 관계가 없으므로 아래 확인에서 막히지만,
        # 의미를 명확하게 하기 위해 먼저 검사한다.
        # -------------------------------------------------
        if user_id == blocked_user_id:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="자기 자신에 대한 차단 정보는 없습니다.",
            )


        # -------------------------------------------------
        # 현재 사용자가 실제로 이 사용자를
        # 차단하고 있는지 확인
        # -------------------------------------------------
        if not self.block_repository.is_blocked(
            user_id=user_id,
            blocked_user_id=blocked_user_id,
        ):

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="차단 정보를 찾을 수 없습니다.",
            )


        # -------------------------------------------------
        # 실제 차단 관계 삭제
        #
        # Repository에서도:
        #
        # user_id = JWT 사용자
        # AND
        # blocked_user_id = 대상 사용자
        #
        # 조건을 모두 사용한다.
        # -------------------------------------------------
        self.block_repository.delete_block(
            user_id=user_id,
            blocked_user_id=blocked_user_id,
        )


        return UserBlockDeleteResponse(
            blocked_user_id=blocked_user_id,
            message="차단을 해제했습니다.",
        )