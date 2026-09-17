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
        throw new Error(
            getErrorMessage(response.status, data)
        );
    }

    return data;
};