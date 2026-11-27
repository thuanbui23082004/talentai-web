import { z } from 'zod';
import { createSubscriptionOrderSchema, currentSubscriptionSchema, subscriptionOrderSchema, subscriptionOrderStatusSchema } from '@/lib/api/subscription-schemas';
import { readRequestIdentity } from '../auth/session';
import { hasValidCsrf, isTrustedOrigin } from '../auth/cookies';
import { apiError } from '../responses';
import { handleMockCheckout, readMockSubscription } from './subscription-checkout-mock';
import { handlePaymentHistory } from './payment-history';

export async function handleCurrentSubscription(request: Request, baseUrl?: string): Promise<Response> {
    if (request.method !== 'GET') return apiError(405, 'BAD_REQUEST', 'Phương thức không được hỗ trợ.');
    const identity = await readRequestIdentity(request);
    if (!identity) return apiError(401, 'UNAUTHENTICATED', 'Vui lòng đăng nhập.');
    if (identity.user.role !== 'recruiter') return apiError(403, 'FORBIDDEN', 'Chức năng dành cho nhà tuyển dụng.');
    const headers = { 'Cache-Control': 'private, no-store' };
    if (!baseUrl) {
        const scenario = request.headers.get('x-mock-scenario');
        if (scenario === 'error') return apiError(503, 'SERVICE_UNAVAILABLE', 'Chưa thể tải gói hiện tại.');
        await new Promise(resolve => setTimeout(resolve, scenario === 'slow' ? 1500 : 200));
        return Response.json(scenario === 'empty' ? {} : readMockSubscription(identity.userId), { headers });
    }
    try {
        const response = await fetch(`${baseUrl.replace(/\/$/, '')}/subscriptions/me`, {
            headers: { Accept: 'application/json', Authorization: `Bearer ${identity.access}` },
            cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000),
        });
        if (response.status === 401) return apiError(401, 'SESSION_EXPIRED', 'Phiên đăng nhập đã hết hạn.');
        if (response.status === 403) return apiError(403, 'FORBIDDEN', 'Bạn không có quyền xem gói này.');
        if (!response.ok) throw new Error('Subscription service unavailable');
        return Response.json(currentSubscriptionSchema.parse(await response.json()), { headers });
    } catch { return apiError(503, 'SERVICE_UNAVAILABLE', 'Chưa thể tải gói hiện tại. Vui lòng thử lại.'); }
}

export function isSubscriptionOrderRequest(request: Request) {
    return /^\/api\/bff\/orders(?:\/[^/]+(?:\/(?:status|cancel))?)?$/.test(new URL(request.url).pathname);
}

export async function handleSubscriptionOrder(request: Request, baseUrl?: string): Promise<Response> {
    if (new URL(request.url).pathname === '/api/bff/orders/my') return handlePaymentHistory(request, baseUrl);
    const source = new URL(request.url);
    const match = source.pathname.match(/^\/api\/bff\/orders(?:\/([^/]+)(?:\/(status|cancel))?)?$/);
    if (!match) return apiError(404, 'NOT_FOUND', 'Không tìm thấy trang thanh toán.');
    const [, id, action] = match;
    const creates = !id;
    if (request.method !== (creates || action === 'cancel' ? 'POST' : 'GET')) return apiError(405, 'BAD_REQUEST', 'Phương thức không được hỗ trợ.');
    if (request.method === 'POST' && (!isTrustedOrigin(request) || !hasValidCsrf(request))) return apiError(403, 'CSRF_TOKEN_INVALID', 'Phiên thao tác không hợp lệ.');
    if (source.search || (id && !z.guid().safeParse(id).success)) return apiError(404, 'NOT_FOUND', 'Mã đơn hàng không hợp lệ.');
    const identity = await readRequestIdentity(request);
    if (!identity) return apiError(401, 'UNAUTHENTICATED', 'Vui lòng đăng nhập.');
    if (identity.user.role !== 'recruiter') return apiError(403, 'FORBIDDEN', 'Chức năng dành cho nhà tuyển dụng.');
    const parsed = creates ? createSubscriptionOrderSchema.safeParse(await request.json().catch(() => null)) : undefined;
    if (parsed && !parsed.success) return apiError(422, 'VALIDATION_FAILED', 'Vui lòng kiểm tra gói và phương thức thanh toán.');
    const input = parsed?.success ? parsed.data : undefined;
    const key = request.headers.get('Idempotency-Key');
    if (creates && !z.uuid().safeParse(key).success) return apiError(422, 'VALIDATION_FAILED', 'Mã lần mua không hợp lệ. Vui lòng tải lại trang.');
    if (input) {
        // Keep provider callbacks on this app and preserve the correlation key.
        // Next may expose an internal hostname in Request.url. The browser's
        // Origin has already passed the same-host/protocol and CSRF checks above.
        const browserOrigin = new URL(request.headers.get('origin') ?? source.origin).origin;
        for (const [url, result] of [[input.returnUrl, 'return'], [input.cancelUrl, 'cancel']] as const) {
            const callback = new URL(url);
            if (callback.origin !== browserOrigin || callback.username || callback.password || callback.hash || callback.pathname !== '/recruiter/billing/result' || callback.searchParams.get('checkout') !== key || callback.searchParams.get('result') !== result || [...callback.searchParams.keys()].some(name => !['checkout', 'result'].includes(name))) return apiError(422, 'VALIDATION_FAILED', 'Đường dẫn quay lại không hợp lệ.');
        }
    }
    if (!baseUrl) {
        await new Promise(resolve => setTimeout(resolve, request.headers.get('x-mock-scenario') === 'slow' ? 1500 : 200));
        return handleMockCheckout(request, identity.userId, id, input);
    }
    try {
        const response = await fetch(`${baseUrl.replace(/\/$/, '')}/orders${id ? `/${id}${action ? `/${action}` : ''}` : ''}`, {
            method: request.method,
            headers: { Accept: 'application/json', Authorization: `Bearer ${identity.access}`, ...(input ? { 'Content-Type': 'application/json', 'Idempotency-Key': key! } : {}) },
            ...(input ? { body: JSON.stringify(input) } : {}),
            cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000),
        });
        if (response.status === 401) return apiError(401, 'SESSION_EXPIRED', 'Phiên đăng nhập đã hết hạn.');
        if (response.status === 403) return apiError(403, 'FORBIDDEN', 'Bạn không có quyền truy cập đơn này.');
        if (response.status === 404) return apiError(404, 'NOT_FOUND', 'Không tìm thấy đơn hàng.');
        if (response.status === 400) return apiError(400, 'BAD_REQUEST', 'Gói hoặc trạng thái đơn không hợp lệ.');
        if (response.status === 409) return apiError(409, 'CONFLICT', 'Lần mua này đã có thông tin khác.');
        if (!response.ok) throw new Error('Payment service unavailable');
        const body: unknown = await response.json();
        const data = action === 'status' ? subscriptionOrderStatusSchema.parse(body) : subscriptionOrderSchema.parse(body);
        if (id && data.orderId !== id) throw new Error('Unexpected order');
        if ('userId' in data && data.userId && data.userId !== identity.userId) return apiError(403, 'FORBIDDEN', 'Đơn hàng thuộc tài khoản khác.');
        if (input && ('itemId' in data && data.itemId !== input.itemId || 'itemType' in data && data.itemType !== 'SUBSCRIPTION')) throw new Error('Unexpected purchase');
        return Response.json(data, { status: creates ? 201 : 200, headers: { 'Cache-Control': 'private, no-store' } });
    } catch { return apiError(503, 'SERVICE_UNAVAILABLE', 'Chưa xác nhận được giao dịch. Vui lòng kiểm tra lại với cùng lần mua.'); }
}
