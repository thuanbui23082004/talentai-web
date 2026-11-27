import { apiClient } from '@/lib/api';
import { toApiError } from '@/lib/api/errors';

export async function listSubscriptionPlans(signal?: AbortSignal) {
    const response = await apiClient.GET('/plans', { signal });
    if (!response.data || response.error) throw toApiError(response.response.status, response.error);
    return response.data;
}
