import { apiClient } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { NotificationFilters } from "../types";

export async function getNotifications(filters: NotificationFilters, signal?: AbortSignal) {
    const { data, error, response } = await apiClient.GET("/notifications", { params: { query: filters }, signal });
    if (!data || error) throw toApiError(response.status, error);
    return data;
}

export async function getUnreadCount(signal?: AbortSignal) {
    const { data, error, response } = await apiClient.GET("/notifications/unread-count", { signal });
    if (!data || error) throw toApiError(response.status, error);
    return data.count;
}

async function csrfHeaders() {
    const { data, error, response } = await apiClient.GET("/auth/csrf");
    if (!data || error) throw toApiError(response.status, error);
    return { "X-CSRF-Token": data.csrfToken };
}

export async function markNotificationRead(notificationId: string) {
    const headers = await csrfHeaders();
    const { data, error, response } = await apiClient.PATCH("/notifications/{notificationId}/read", { params: { path: { notificationId } }, headers });
    if (!data || error) throw toApiError(response.status, error);
    return data;
}

export async function markAllNotificationsRead() {
    const headers = await csrfHeaders();
    const { error, response } = await apiClient.POST("/notifications/read-all", { headers });
    if (!response.ok) throw toApiError(response.status, error);
}
