"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/features/auth";
import { notificationKeys } from "../query-keys";
import { getNotifications, getUnreadCount, markAllNotificationsRead, markNotificationRead } from "../services/notifications";
import type { NotificationFilters } from "../types";

export function useNotifications(filters: NotificationFilters, enabled = true) {
    const { user } = useSession();
    return useQuery({ queryKey: notificationKeys.list(user?.id, filters), queryFn: ({ signal }) => getNotifications(filters, signal), enabled: !!user && enabled });
}

export function useUnreadCount() {
    const { user } = useSession();
    return useQuery({ queryKey: notificationKeys.count(user?.id), queryFn: ({ signal }) => getUnreadCount(signal), enabled: !!user });
}

export function useNotificationActions() {
    const { user } = useSession();
    const client = useQueryClient();
    const refresh = () => client.invalidateQueries({ queryKey: notificationKeys.all(user?.id) });
    const read = useMutation({ mutationFn: markNotificationRead, onSuccess: refresh });
    const readAll = useMutation({ mutationFn: markAllNotificationsRead, onSuccess: refresh });
    return { read, readAll };
}
