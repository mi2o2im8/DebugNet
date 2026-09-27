import { getMyClub } from "./clubApi";

// =========================================================
// ⭐ 내 동호회 조회 공유 (중복 호출 방지)
//
// 로그인 → MainHome(진입 확인, 일정) → BottomNav 가
// 거의 동시에 GET /api/clubs/my 를 부르고 있어서
// 같은 요청이 여러 번 나가던 문제를 막는다.
//
// - 요청이 진행 중이면 새로 보내지 않고 그 결과를 같이 기다린다.
// - 받은 결과는 CACHE_TIME_MS 동안만 재사용한다.
//   (동호회 가입·생성 직후 오래된 값이 남지 않도록 짧게 유지)
// - 실패한 요청은 저장하지 않는다. 다음 호출 때 다시 요청한다.
//
// 기존 clubApi.js의 getMyClub()은 그대로 두고,
// 여러 화면에서 같이 쓰는 곳만 이 함수를 사용한다.
// =========================================================

const CACHE_TIME_MS = 3000;

let cachedResult = null;
let cachedAt = 0;
let pendingRequest = null;


export const getMyClubShared = async () => {

    // ⭐ 최근에 받은 결과가 있으면 재사용
    if (
        cachedResult &&
        Date.now() - cachedAt < CACHE_TIME_MS
    ) {
        return cachedResult;
    }

    // ⭐ 이미 요청 중이면 같은 요청을 기다림
    if (pendingRequest) {
        return pendingRequest;
    }

    pendingRequest = getMyClub()
        .then((result) => {
            cachedResult = result;
            cachedAt = Date.now();

            return result;
        })
        .finally(() => {
            pendingRequest = null;
        });

    return pendingRequest;
};


// =========================================================
// ⭐ 저장된 결과 비우기
//
// 로그인 직후, 동호회 가입·탈퇴·생성 직후처럼
// 반드시 최신 값을 받아야 할 때 호출한다.
// =========================================================
export const clearMyClubCache = () => {
    cachedResult = null;
    cachedAt = 0;
    pendingRequest = null;
};
