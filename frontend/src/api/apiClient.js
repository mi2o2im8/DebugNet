import { supabase } from "../../supabaseClient";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:8000";

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
// ⭐ 토큰 갱신 (여러 요청이 동시에 와도 한 번만)
//
// 자동 로그인으로 예전 세션을 그대로 쓰면 access token이
// 이미 만료된 상태일 수 있다 (기본 1시간).
// Supabase가 앱 시작 직후 백그라운드에서 갱신하는데,
// 그 전에 여러 API가 한꺼번에 나가면 일부만 401이 난다.
// → 만료가 가까우면 먼저 갱신하고, 401이면 한 번 갱신 후 재시도
// =========================================================
let refreshPromise = null;

const refreshSessionOnce = async () => {
    if (!refreshPromise) {
        refreshPromise = supabase.auth
            .refreshSession()
            .finally(() => {
                refreshPromise = null;
            });
    }

    const { data, error } = await refreshPromise;

    if (error || !data?.session?.access_token) {
        throw new Error("로그인이 만료되었습니다. 다시 로그인해주세요.");
    }

    return data.session;
};

// 만료 60초 전부터는 미리 갱신
const TOKEN_REFRESH_MARGIN_MS = 60 * 1000;

export const getAuthenticatedSession = async () => {
    const {
        data,
        error
    } = await supabase.auth.getSession();

    if (error) {
        throw new Error(
            `로그인 정보를 확인할 수 없습니다: ${error.message}`
        );
    }

    if (!data.session?.access_token) {
        throw new Error("로그인이 필요합니다.");
    }

    const expiresAtMs = (data.session.expires_at || 0) * 1000;

    if (
        expiresAtMs &&
        expiresAtMs - Date.now() < TOKEN_REFRESH_MARGIN_MS
    ) {
        return refreshSessionOnce();
    }

    return data.session;
};

export const authenticatedRequest = async (
    path,
    {
        body,
        headers,
        ...options
    } = {}
) => {
    const session = await getAuthenticatedSession();

    return sendRequest(path, { body, headers, ...options }, session, false);
};

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

    const response = await fetch(
        `${API_BASE_URL}${path}`,
        {
            ...options,
            headers: requestHeaders,
            body: requestBody
        }
    );

    // ⭐ 토큰이 만료돼서 401이면 한 번만 갱신 후 다시 요청
    if (response.status === 401 && !isRetry) {
        try {
            const newSession = await refreshSessionOnce();

            return sendRequest(
                path,
                { body, headers, ...options },
                newSession,
                true
            );
        } catch {
            // 갱신도 실패하면 아래에서 원래 401 에러를 그대로 던진다
        }
    }

    const contentType =
        response.headers.get("content-type") || "";

    let data = null;

    if (contentType.includes("application/json")) {
        data = await response.json();
    } else {
        const text = await response.text();
        data = text || null;
    }

    if (!response.ok) {
        // ========================================
        // HTTP 에러 정보 보존
        // ========================================
        // 단순 message만 던지면
        // 409인지, 404인지 구분할 수 없으므로
        // status와 실제 응답 data도 같이 보관한다.
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