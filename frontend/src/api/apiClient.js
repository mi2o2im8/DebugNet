import { supabase } from "../../supabaseClient";

// =========================================================
// ⭐ 로그아웃 / API 요청 상태 관리
// =========================================================

// 현재 실행 중인 API 요청의 AbortController
const pendingControllers = new Set();

// 로그아웃 진행 중인지 여부
let logoutInProgress = false;

// ---------------------------------------------------------
// 로그아웃 시작
// 1. 앞으로 새로운 인증 요청 막기
// 2. 현재 실행 중인 fetch 전부 취소
// ---------------------------------------------------------
export const startLogout = () => {
    logoutInProgress = true;

    pendingControllers.forEach((controller) => {
        try {
            controller.abort();
        } catch (error) {
            console.error("API 요청 취소 오류:", error);
        }
    });

    pendingControllers.clear();
};

// ---------------------------------------------------------
// 로그인 성공 후 로그아웃 상태 해제
// ---------------------------------------------------------
export const finishLogin = () => {
    logoutInProgress = false;
};

// ---------------------------------------------------------
// 진행 중인 API 요청만 취소
// ---------------------------------------------------------
export const abortAllApiRequests = () => {
    pendingControllers.forEach((controller) => {
        try {
            controller.abort();
        } catch (error) {
            console.error("API 요청 취소 오류:", error);
        }
    });

    pendingControllers.clear();
};

// =========================================================
// API 주소
// =========================================================

const API_BASE_URL = (
    import.meta.env.DEV
        ? import.meta.env.VITE_API_BASE_URL
        : import.meta.env.VITE_API_BASE_URL_PROD
)?.replace(/\/$/, "") ?? "";

export const buildApiUrl = (path) =>
    `${API_BASE_URL}${path}`;

// =========================================================
// 에러 메시지
// =========================================================

const getErrorMessage = (status, data) => {
    if (Array.isArray(data?.detail)) {
        const firstError = data.detail[0];

        return (
            firstError?.msg ||
            "입력한 정보를 확인해주세요."
        );
    }

    if (typeof data?.detail === "string") {
        return data.detail;
    }

    // FastAPI HTTPException에서
    // detail이 객체 형태로 오는 경우
    if (
        typeof data?.detail?.message === "string"
    ) {
        return data.detail.message;
    }

    if (typeof data?.message === "string") {
        return data.message;
    }

    switch (status) {
        case 400:
            return "입력한 정보를 확인해주세요.";

        case 401:
            return "로그인이 필요하거나 인증이 만료되었습니다.";

        case 403:
            return "요청할 권한이 없습니다.";

        case 404:
            return "요청한 정보를 찾을 수 없습니다.";

        case 409:
            return "이미 등록된 정보가 있습니다.";

        case 422:
            return "입력값 형식을 확인해주세요.";

        case 500:
            return "서버 오류가 발생했습니다.";

        default:
            return `요청 처리 중 오류가 발생했습니다. (${status})`;
    }
};

// =========================================================
// ⭐ 토큰 갱신
// 여러 요청이 동시에 401이어도 refresh는 한 번만 실행
// =========================================================

let refreshPromise = null;

const refreshSessionOnce = async () => {
    // 로그아웃 중이면 refresh하지 않음
    if (logoutInProgress) {
        throw new Error("로그아웃 중입니다.");
    }

    if (!refreshPromise) {
        refreshPromise = supabase.auth
            .refreshSession()
            .finally(() => {
                refreshPromise = null;
            });
    }

    const { data, error } = await refreshPromise;

    if (
        error ||
        !data?.session?.access_token
    ) {
        throw new Error(
            "로그인이 만료되었습니다. 다시 로그인해주세요."
        );
    }

    return data.session;
};

// =========================================================
// 현재 인증 세션 가져오기
// =========================================================

export const getAuthenticatedSession = async () => {
    // 로그아웃 중이면 요청 자체 차단
    if (logoutInProgress) {
        const error = new Error("로그아웃 중입니다.");
        error.name = "AbortError";
        throw error;
    }

    const {
        data,
        error,
    } = await supabase.auth.getSession();

    if (error) {
        throw new Error(
            `로그인 정보를 확인할 수 없습니다: ${error.message}`
        );
    }

    if (!data.session?.access_token) {
        throw new Error("로그인이 필요합니다.");
    }

    // getSession() 기다리는 동안 로그아웃했을 수도 있음
    if (logoutInProgress) {
        const error = new Error("로그아웃 중입니다.");
        error.name = "AbortError";
        throw error;
    }

    return data.session;
};

// =========================================================
// 인증 API 요청
// =========================================================

export const authenticatedRequest = async (
    path,
    {
        body,
        headers,
        ...options
    } = {}
) => {
    // 로그아웃 중이면 새로운 요청을 만들지 않음
    if (logoutInProgress) {
        const error = new Error("로그아웃 중입니다.");
        error.name = "AbortError";
        throw error;
    }

    const session = await getAuthenticatedSession();

    // 세션을 가져오는 동안 로그아웃했을 경우
    if (logoutInProgress) {
        const error = new Error("로그아웃 중입니다.");
        error.name = "AbortError";
        throw error;
    }

    return sendRequest(
        path,
        {
            body,
            headers,
            ...options,
        },
        session,
        false
    );
};

// =========================================================
// 실제 fetch
// =========================================================

const sendRequest = async (
    path,
    {
        body,
        headers,
        ...options
    },
    session,
    isRetry
) => {
    // 로그아웃 중이면 fetch 실행하지 않음
    if (logoutInProgress) {
        const error = new Error("로그아웃 중입니다.");
        error.name = "AbortError";
        throw error;
    }

    const requestHeaders = new Headers(headers);

    requestHeaders.set(
        "Authorization",
        `Bearer ${session.access_token}`
    );

    let requestBody = body;

    if (
        body !== undefined &&
        body !== null &&
        !(body instanceof FormData)
    ) {
        requestHeaders.set(
            "Content-Type",
            "application/json"
        );

        requestBody =
            typeof body === "string"
                ? body
                : JSON.stringify(body);
    }

    // =====================================================
    // ⭐ 요청별 AbortController
    // =====================================================

    const controller = new AbortController();

    pendingControllers.add(controller);

    let requestSignal = controller.signal;

    // 기존 호출에서 signal을 직접 넘긴 경우
    // 기존 signal + 로그아웃 signal 둘 다 반영
    if (options.signal) {
        if (typeof AbortSignal !== "undefined" &&
            typeof AbortSignal.any === "function") {
            requestSignal = AbortSignal.any([
                options.signal,
                controller.signal,
            ]);
        }
    }

    let response;

    try {
        response = await fetch(
            `${API_BASE_URL}${path}`,
            {
                ...options,
                headers: requestHeaders,
                body: requestBody,
                signal: requestSignal,
            }
        );
    } catch (error) {
        // 로그아웃 등에 의해 취소된 요청
        if (error?.name === "AbortError") {
            throw error;
        }

        throw error;
    } finally {
        // 성공 / 실패 / 취소 모두 제거
        pendingControllers.delete(controller);
    }

    // =====================================================
    // ⭐ 401이면 현재 세션 확인 후 한 번만 재시도
    // 로그아웃 중에는 절대 재시도하지 않음
    // =====================================================

    if (
        response.status === 401 &&
        !isRetry &&
        !logoutInProgress
    ) {
        try {
            const {
                data: sessionData,
            } = await supabase.auth.getSession();

            let currentSession =
                sessionData?.session;

            // 현재 세션이 없거나,
            // 방금 거절당한 토큰과 같은 토큰이면 refresh
            // (같은 토큰으로 다시 보내면 또 401이 나기 때문)
            if (
                (
                    !currentSession?.access_token ||
                    currentSession.access_token === session.access_token
                ) &&
                !logoutInProgress
            ) {
                currentSession =
                    await refreshSessionOnce();
            }

            // 로그아웃 시작했으면 재시도하지 않음
            if (logoutInProgress) {
                const error = new Error("로그아웃 중입니다.");
                error.name = "AbortError";
                throw error;
            }

            return sendRequest(
                path,
                {
                    body,
                    headers,
                    ...options,
                },
                currentSession,
                true
            );
        } catch (error) {
            // 로그아웃 중 취소라면 그대로 전달
            if (error?.name === "AbortError") {
                throw error;
            }

            // refresh 실패 시 아래에서 원래 401 처리
        }
    }

    // =====================================================
    // 응답 데이터 읽기
    // =====================================================

    const contentType =
        response.headers.get("content-type") || "";

    let data = null;

    if (
        contentType.includes("application/json")
    ) {
        data = await response.json();
    } else {
        const text = await response.text();
        data = text || null;
    }

    // =====================================================
    // HTTP 에러 처리
    // =====================================================

    if (!response.ok) {
        const error = new Error(
            getErrorMessage(
                response.status,
                data
            )
        );

        error.status =
            response.status;

        error.data =
            data;

        throw error;
    }

    return data;
};