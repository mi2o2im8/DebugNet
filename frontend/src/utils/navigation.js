// =========================================================
// ⭐ 안전한 뒤로가기
//
// navigate(-1)은 "브라우저 방문 기록"이 있을 때만 동작한다.
// 챗봇 버튼, 알림, 새로고침, 주소 직접 입력, 앱 첫 실행으로
// 페이지에 바로 들어오면 돌아갈 기록이 없어서 버튼이 먹통이 된다.
//
// goBack(navigate)
//   1) 방문 기록이 있으면 → navigate(-1)
//   2) 없으면 → 현재 화면의 "상위 화면"으로 이동 (replace)
//
// 사용법
//   import { goBack } from "../../utils/navigation";
//   onClick={() => goBack(navigate)}
//   onClick={() => goBack(navigate, "/clubs/all")}   // 상위 화면 직접 지정
// =========================================================


// 방문 기록 위치 (React Router v6 BrowserRouter가 history.state.idx에 저장)
export const getHistoryIndex = () => {
    try {
        return window.history.state?.idx ?? 0;
    } catch {
        return 0;
    }
};

export const canGoBack = () => getHistoryIndex() > 0;


// 앱의 첫 화면들 (여기서 더 뒤로 갈 곳이 없다)
export const ROOT_PATHS = [
    "/",
    "/Login",
    "/login",
    "/main",
    "/mainhome",
];

export const isRootPath = (pathname = window.location.pathname) =>
    ROOT_PATHS.includes(pathname);


// 내 정보 하위 화면
const MYPAGE_CHILDREN = [
    "/myschedule",
    "/schedule",
    "/my-reviews",
    "/my-applications",
    "/myactivity",
    "/trustscore",
    "/mypostcomment",
    "/favoriteClub",
    "/myinfoedit",
    "/mypage/settings",
];

// 설정 하위 화면
const SETTINGS_CHILDREN = [
    "/notification-settings",
    "/privacy",
    "/blocked-users",
    "/change-password",
    "/faq",
];


// =========================================================
// ⭐ 현재 경로 → 돌아갈 상위 화면
// =========================================================
export const getBackFallback = (pathname = window.location.pathname) => {

    const path = (pathname || "/").replace(/\/+$/, "") || "/";

    // ----- 동호회 -----
    let match = path.match(/^\/clubs\/(\d+)(\/.*)?$/);

    if (match) {
        const clubId = match[1];
        const rest = match[2] || "";

        // 운영 화면
        if (rest === "/manage") return "/mainhome";
        if (rest === "/manage/settings/basic"
            || rest === "/manage/settings/join"
            || rest === "/manage/settings/delete") {
            return `/clubs/${clubId}/manage/settings`;
        }
        if (/^\/manage\/events\/\d+\/(edit|participants)$/.test(rest)) {
            return path.replace(/\/(edit|participants)$/, "");
        }
        if (/^\/manage\/events\/(\d+|new)$/.test(rest)) {
            return `/clubs/${clubId}/manage/events`;
        }
        if (/^\/manage\/members\/\d+$/.test(rest)) {
            return `/clubs/${clubId}/manage/members`;
        }
        if (/^\/manage\/community\/.+$/.test(rest)) {
            return `/clubs/${clubId}/manage/community`;
        }
        if (rest.startsWith("/manage")) return `/clubs/${clubId}/manage`;

        // 매칭 관리 (운영진)
        if (rest === "/matches") return `/clubs/${clubId}/manage`;
        if (/^\/matches\/\d+\/.+$/.test(rest)) {
            return path.replace(/\/[^/]+$/, "");
        }
        if (rest.startsWith("/matches")) return `/clubs/${clubId}/matches`;

        // 이용자 화면
        if (rest === "/home") return "/mainhome";
        if (/^\/events\/\d+\/attendance$/.test(rest)) {
            return `/clubs/${clubId}/events`;
        }
        if (rest === "/events") return `/clubs/${clubId}/home`;
        if (/^\/community\/.+$/.test(rest)) {
            return `/clubs/${clubId}/community`;
        }
        if (rest === "/community") return `/clubs/${clubId}/home`;
        if (rest === "/application") return `/clubs/${clubId}`;

        // 동호회 상세
        return "/clubs/all";
    }

    // ----- 동호회 찾기 -----
    if (path === "/clubs/recommend/result") return "/clubs/recommend";
    if (path.startsWith("/clubs/")) return "/clubs";
    if (path === "/clubs") return "/mainhome";
    if (/^\/guest-recruit\/.+$/.test(path)) return "/guest-recruit";
    if (path === "/guest-recruit") return "/clubs";

    // ----- 커뮤니티 -----
    if (path.startsWith("/community/")) return "/community";

    // ----- 팀 매칭 -----
    if (/^\/matches\/availability\/\d+\/.+$/.test(path)) {
        return path.replace(/\/[^/]+$/, "");
    }
    if (path === "/matches/recommend/result") return "/matches/recommend";
    if (path.startsWith("/matches/")) return "/matches";

    // ----- 내 정보 / 설정 -----
    if (SETTINGS_CHILDREN.includes(path)) return "/mypage/settings";
    if (MYPAGE_CHILDREN.includes(path)) return "/mypage";

    // ----- 회원가입 -----
    if (path.startsWith("/signup/basic/")) return "/signup/basic";
    if (path.startsWith("/signup")) return "/";

    return "/mainhome";
};


// =========================================================
// ⭐ 뒤로가기
// =========================================================
export const goBack = (navigate, fallback) => {

    if (canGoBack()) {
        navigate(-1);
        return;
    }

    navigate(
        fallback || getBackFallback(window.location.pathname),
        { replace: true }
    );
};
