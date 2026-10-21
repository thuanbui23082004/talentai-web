import { apiClient } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { components } from "@/lib/api/generated/schema";

export async function login(body: components["schemas"]["LoginRequest"]) {
    const result = await apiClient.POST("/auth/login", { body });
    if (!result.data || result.error)
        throw toApiError(result.response.status, result.error);
    return result.data;
}

export async function register(body: components["schemas"]["RegisterRequest"]) {
    const result = await apiClient.POST("/auth/register", { body });
    if (!result.data || result.error)
        throw toApiError(result.response.status, result.error);
    return result.data;
}

let pendingRefresh: Promise<boolean> | undefined;
export function refreshSession() {
    // Concurrent session reads share one rotation, avoiding invalidating each other.
    pendingRefresh ??= apiClient
        .POST("/auth/refresh")
        .then((result) => {
            if (result.response.status >= 500)
                throw toApiError(result.response.status, result.error);
            return !!result.data && !result.error;
        })
        .finally(() => {
            pendingRefresh = undefined;
        });
    return pendingRefresh;
}

export async function getCurrentUser() {
    let result = await apiClient.GET("/me");
    if (
        result.response.status === 401 &&
        result.error?.error.code === "SESSION_EXPIRED"
    ) {
        if (!(await refreshSession())) return null;
        result = await apiClient.GET("/me");
    }
    if (result.response.status === 401) return null;
    if (!result.data || result.error)
        throw toApiError(result.response.status, result.error);
    return result.data;
}

export async function logout() {
    let csrf = await apiClient.GET("/auth/csrf");
    if (csrf.response.status === 401) {
        const renewed = await refreshSession();
        if (!renewed) return;
        csrf = await apiClient.GET("/auth/csrf");
    }
    if (!csrf.data || csrf.error)
        throw toApiError(csrf.response.status, csrf.error);
    // A mutation is sent once, after authentication/CSRF checks; never replay it.
    const result = await apiClient.POST("/auth/logout", {
        headers: { "X-CSRF-Token": csrf.data.csrfToken },
    });
    if (!result.response.ok && result.response.status !== 401)
        throw toApiError(result.response.status, result.error);
}
