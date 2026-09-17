from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


# =========================================================
# 1. 사용자 차단 Request
# =========================================================

# ---------------------------------------------------------
# POST /api/blocks
#
# Frontend에서는 차단할 상대방 UUID만 보낸다.
#
# 현재 로그인 사용자의 user_id는
# Request Body에서 받지 않는다.
#
# JWT Bearer Token에서 가져온다.
# ---------------------------------------------------------
class UserBlockCreateRequest(BaseModel):

    blocked_user_id: UUID


# =========================================================
# 2. 사용자 차단 성공 Response
# =========================================================

# ---------------------------------------------------------
# POST /api/blocks 성공 응답
# ---------------------------------------------------------
class UserBlockCreateResponse(BaseModel):

    blocked_user_id: UUID

    message: str = "사용자를 차단했습니다."


# =========================================================
# 3. 차단 사용자 1명 정보
# =========================================================

# ---------------------------------------------------------
# GET /api/blocks
#
# 내 정보 > 차단 사용자 관리 화면에서
# 차단한 사용자 1명을 표시할 때 사용하는 형태
#
# 데이터 출처:
#
# user_blocks
# - blocked_user_id
# - created_at
#
# users
# - nickname
# - profile_image
# - bio
# ---------------------------------------------------------
class BlockedUserResponse(BaseModel):

    user_id: UUID

    nickname: str

    profile_image: str | None = None

    bio: str | None = None

    blocked_at: datetime


# =========================================================
# 4. 차단 사용자 목록 Response
# =========================================================

# ---------------------------------------------------------
# GET /api/blocks
#
# 현재 로그인 사용자가 차단한 사용자 목록
# ---------------------------------------------------------
class UserBlockListResponse(BaseModel):

    blocked_users: list[BlockedUserResponse]

    total_count: int


# =========================================================
# 5. 차단 해제 Response
# =========================================================

# ---------------------------------------------------------
# DELETE /api/blocks/{blocked_user_id}
#
# 차단 해제 성공 응답
# ---------------------------------------------------------
class UserBlockDeleteResponse(BaseModel):

    blocked_user_id: UUID

    message: str = "차단을 해제했습니다."