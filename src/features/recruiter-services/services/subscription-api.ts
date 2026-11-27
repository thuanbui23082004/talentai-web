import { apiClient } from '@/lib/api';
import { toApiError } from '@/lib/api/errors';

export const subscriptionApi = {
    async current(signal?: AbortSignal) {
        const response = await apiClient.GET('/subscriptions/me', { signal });
        if (!response.data || response.error) throw toApiError(response.response.status, response.error);
        return response.data;
    },
};
