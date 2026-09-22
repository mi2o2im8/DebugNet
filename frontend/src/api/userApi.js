import { authenticatedRequest } from "./apiClient";

export const getMyGender = async () => {
    return authenticatedRequest(
        "/api/users/me/gender",
        {
            method: "GET"
        }
    );
};