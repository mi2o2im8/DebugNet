from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.core.security import get_current_user_id

from app.schemas.blocks import (
    UserBlockCreateRequest,
    UserBlockCreateResponse,
    UserBlockDeleteResponse,
    UserBlockListResponse,
)

from app.services.block_service import BlockService


# ---------------------------------------------------------
# PlayBridge 사용자 차단 Router
#
# Community의 "차단하기"와
# 내 정보의 "차단 사용자 관리"에서 공통으로 사용한다.
# ---------------------------------------------------------
router = APIRouter(
    prefix="/api/blocks",
    tags=["User Blocks"],
)


# =========================================================
# 1. 사용자 차단
# =========================================================

# ---------------------------------------------------------
# POST /api/blocks
#
# Request:
#
# {
#     "blocked_user_id": "상대방 UUID"
# }
#
# 현재 로그인 사용자의 user_id는
# Request에서 받지 않고 JWT에서 가져온다.
# ---------------------------------------------------------
@router.post(
    "",
    response_model=UserBlockCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_block(

    block_data: UserBlockCreateRequest,

    user_id: str = Depends(
        get_current_user_id
    ),
):

    block_service = BlockService()

    return block_service.create_block(
        user_id=user_id,
        block_data=block_data,
    )


# =========================================================
# 2. 내가 차단한 사용자 목록
# =========================================================

# ---------------------------------------------------------
# GET /api/blocks
#
# 현재 로그인 사용자가 차단한 사용자만 반환한다.
#
# 내 정보 > 차단 사용자 관리 화면에서 사용한다.
# ---------------------------------------------------------
@router.get(
    "",
    response_model=UserBlockListResponse,
)
def get_block_list(

    user_id: str = Depends(
        get_current_user_id
    ),
):

    block_service = BlockService()

    return block_service.get_block_list(
        user_id=user_id,
    )


# =========================================================
# 3. 차단 해제
# =========================================================

# ---------------------------------------------------------
# DELETE /api/blocks/{blocked_user_id}
#
# 예:
#
# DELETE /api/blocks/
# 550e8400-e29b-41d4-a716-446655440000
#
# JWT의 현재 사용자와 blocked_user_id 조합으로
# 해당 차단 관계만 삭제한다.
# ---------------------------------------------------------
@router.delete(
    "/{blocked_user_id}",
    response_model=UserBlockDeleteResponse,
)
def delete_block(

    blocked_user_id: UUID,

    user_id: str = Depends(
        get_current_user_id
    ),
):

    block_service = BlockService()

    return block_service.delete_block(
        user_id=user_id,
        blocked_user_id=str(blocked_user_id),
    )