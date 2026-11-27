import { apiClient } from '@/lib/api';
import { toApiError } from '@/lib/api/errors';
import type { CreateSubscriptionOrder, PaymentHistoryFilters } from '../types';

export const paymentApi = {
    async history(filters: PaymentHistoryFilters, signal?: AbortSignal) {
        const response = await apiClient.GET('/orders/my', { params: { query: filters }, signal });
        if (!response.data || response.error) throw toApiError(response.response.status, response.error);
        return response.data;
    },
    async create(body: CreateSubscriptionOrder, idempotencyKey: string) {
        const response = await apiClient.POST('/orders', { body, params: { header: { 'Idempotency-Key': idempotencyKey } } });
        if (!response.data || response.error) throw toApiError(response.response.status, response.error);
        return response.data;
    },
    async get(id: string, signal?: AbortSignal) {
        const response = await apiClient.GET('/orders/{id}', { params: { path: { id } }, signal });
        if (!response.data || response.error) throw toApiError(response.response.status, response.error);
        return response.data;
    },
    async status(id: string, signal?: AbortSignal) {
        const response = await apiClient.GET('/orders/{id}/status', { params: { path: { id } }, signal });
        if (!response.data || response.error) throw toApiError(response.response.status, response.error);
        return response.data;
    },
    async cancel(id: string) {
        const response = await apiClient.POST('/orders/{id}/cancel', { params: { path: { id } } });
        if (!response.data || response.error) throw toApiError(response.response.status, response.error);
        return response.data;
    },
};
