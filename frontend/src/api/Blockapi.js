import { authenticatedRequest } from "./apiClient";

// =========================================================
// 사용자 차단 API
//
// Backend: app/routers/blocks.py (prefix: /api/blocks)
// =========================================================


// =========================================================
// 사용자 차단
//
// POST /api/blocks
// body: { blocked_user_id }
// 응답: { blocked_user_id, message }
// =========================================================
export const blockUser = async (blockedUserId) => {
    return authenticatedRequest(
        "/api/blocks",
        {
            method: "POST",
            body: {
                blocked_user_id: blockedUserId
            }
        }
    );
};


// =========================================================
// 내가 차단한 사용자 목록
//
// GET /api/blocks
// 응답: { blocked_users: [{ user_id, nickname,
//                           profile_image, bio,
//                           blocked_at }],
//         total_count }
// =========================================================
export const getMyBlockedUsers = async () => {
    return authenticatedRequest(
        "/api/blocks",
        {
            method: "GET"
        }
    );
};


// =========================================================
// 차단 해제
//
// DELETE /api/blocks/{blocked_user_id}
// 응답: { blocked_user_id, message }
// =========================================================
export const unblockUser = async (blockedUserId) => {
    return authenticatedRequest(
        `/api/blocks/${blockedUserId}`,
        {
            method: "DELETE"
        }
    );
};