import type { NotificationFilters } from "./types";

export const notificationKeys = {
    all: (userId?: string) => ["notifications", userId] as const,
    list: (userId: string | undefined, filters: NotificationFilters) => [...notificationKeys.all(userId), "list", filters] as const,
    count: (userId?: string) => [...notificationKeys.all(userId), "unread-count"] as const,
};
