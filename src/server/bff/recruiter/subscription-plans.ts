import type { components } from '@/lib/api/generated/schema';
import { subscriptionPlansSchema } from '@/lib/api/subscription-schemas';
import { mockSubscriptionPlans } from '@/mocks/fixtures/subscription-plans';
import { apiError } from '../responses';

export async function handleSubscriptionPlans(request: Request, gatewayUrl?: string): Promise<Response> {
    if (request.method !== 'GET') return apiError(405, 'BAD_REQUEST', 'Phương thức không được hỗ trợ.');
    if (new URL(request.url).search) return apiError(422, 'VALIDATION_FAILED', 'Yêu cầu danh sách gói không hợp lệ.');
    const headers = { 'Cache-Control': 'no-store' };
    if (!gatewayUrl) {
        const scenario = request.headers.get('x-mock-scenario');
        if (scenario === 'error') return apiError(503, 'SERVICE_UNAVAILABLE', 'Chưa thể tải các gói dịch vụ.');
        if (scenario === 'slow') await new Promise(resolve => setTimeout(resolve, 1500));
        return Response.json(scenario === 'empty' ? [] : mockSubscriptionPlans, { headers });
    }
    try {
        // Plan catalog is public; do not forward a user's token or cookies.
        const response = await fetch(`${gatewayUrl.replace(/\/$/, '')}/plans`, {
            headers: { Accept: 'application/json' },
            cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) return apiError(503, 'SERVICE_UNAVAILABLE', 'Chưa thể tải các gói dịch vụ.');
        const plans = subscriptionPlansSchema.parse(await response.json()) satisfies components['schemas']['SubscriptionPlan'][];
        return Response.json(plans, { headers });
    } catch {
        return apiError(503, 'SERVICE_UNAVAILABLE', 'Chưa thể tải các gói dịch vụ. Vui lòng thử lại.');
    }
}
