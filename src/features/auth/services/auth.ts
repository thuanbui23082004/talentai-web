import { apiClient } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { components } from "@/lib/api/generated/schema";
import { sessionFetch } from '@/lib/api/session-fetch';

export async function socialLogin(body: components["schemas"]["SocialLoginRequest"]) {
    const result = await apiClient.POST("/auth/social-login", { body });
    if (!result.data || result.error)
        throw toApiError(result.response.status, result.error);
    return result.data;
}

export async function forgotPassword(body: components["schemas"]["ForgotPasswordRequest"]) {
    const result = await apiClient.POST("/auth/forgot-password", { body });
    if (!result.data || result.error)
        throw toApiError(result.response.status, result.error);
    return result.data;
}

export async function resetPassword(body: components["schemas"]["ResetPasswordRequest"]) {
    const result = await apiClient.POST("/auth/reset-password", { body });
    if (!result.data || result.error)
        throw toApiError(result.response.status, result.error);
    return result.data;
}

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

export function refreshSession() {
    return sessionFetch.refresh();
}

export async function getCurrentUser() {
    const result = await apiClient.GET("/me");
    if (result.response.status === 401) return null;
    if (!result.data || result.error)
        throw toApiError(result.response.status, result.error);
    return result.data;
}
