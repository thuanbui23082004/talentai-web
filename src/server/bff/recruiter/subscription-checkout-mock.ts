import type { components } from '@/lib/api/generated/schema';
import { mockCurrentSubscription, mockSubscriptionOrder } from '@/mocks/fixtures/subscription-checkout';
import { mockSubscriptionPlans } from '@/mocks/fixtures/subscription-plans';
import { apiError } from '../responses';

type Order = components['schemas']['SubscriptionOrder'];
type Store = { next: number; orders: Map<string, Order & { reads: number; scenario: string | null }>; keys: Map<string, string>; subscriptions: Map<string, components['schemas']['CurrentSubscription']> };
const globalStore = globalThis as typeof globalThis & { talentaiCheckout?: Store };
const store = globalStore.talentaiCheckout ??= { next: 1, orders: new Map(), keys: new Map(), subscriptions: new Map() };
const headers = { 'Cache-Control': 'private, no-store' };

export function readMockSubscription(userId: string) {
    return store.subscriptions.get(userId) ?? structuredClone(mockCurrentSubscription);
}

export function handleMockCheckout(request: Request, userId: string, id?: string, input?: components['schemas']['CreateSubscriptionOrder']) {
    const scenario = request.headers.get('x-mock-scenario');
    if (scenario === 'error') return apiError(503, 'SERVICE_UNAVAILABLE', 'Chưa thể xử lý thanh toán.');
    if (scenario === 'unauthorized') return apiError(401, 'SESSION_EXPIRED', 'Phiên đăng nhập đã hết hạn.');
    if (scenario === 'forbidden') return apiError(403, 'FORBIDDEN', 'Bạn không có quyền truy cập đơn này.');
    if (input) {
        const key = `${userId}:${request.headers.get('Idempotency-Key')}`;
        const existing = store.keys.get(key);
        if (existing) {
            const order = store.orders.get(existing)!;
            if (order.itemId !== input.itemId || order.paymentProvider !== (input.paymentMethod ?? 'VIETQR')) return apiError(409, 'CONFLICT', 'Lần mua đã có thông tin khác.');
            return Response.json(publicOrder(order), { status: 201, headers });
        }
        const plan = mockSubscriptionPlans.find(plan => plan.id === input.itemId && plan.price > 0);
        if (!plan) return apiError(400, 'BAD_REQUEST', 'Gói không có sẵn để thanh toán.');
        const orderId = `00000000-0000-4000-8000-${String(92000 + store.next).padStart(12, '0')}`;
        const paymentUrl = new URL('/recruiter/billing/result', request.headers.get('origin') ?? request.url);
        paymentUrl.searchParams.set('orderId', orderId);
        const order = { ...mockSubscriptionOrder, userId, orderId, orderCode: 1795737600000 + store.next++, itemId: plan.id, amount: plan.price, currency: plan.currency, paymentProvider: input.paymentMethod ?? 'VIETQR', paymentUrl: paymentUrl.href, reads: 0, scenario };
        store.orders.set(orderId, order);
        store.keys.set(key, orderId);
        return Response.json(publicOrder(order), { status: 201, headers });
    }
    const order = id ? store.orders.get(id) : undefined;
    if (!order) return apiError(404, 'NOT_FOUND', 'Không tìm thấy đơn hàng.');
    if (order.userId !== userId) return apiError(403, 'FORBIDDEN', 'Đơn hàng thuộc tài khoản khác.');
    if (request.method === 'POST') {
        if (order.status !== 'PENDING') return apiError(400, 'BAD_REQUEST', 'Đơn không còn ở trạng thái chờ thanh toán.');
        order.status = 'CANCELLED';
    } else if (new URL(request.url).pathname.endsWith('/status') && ['PENDING', 'CREATED'].includes(order.status)) {
        const outcome = scenario ?? order.scenario;
        if (++order.reads >= 3 && outcome !== 'pending') {
            order.status = outcome === 'failed' ? 'FAILED' : outcome === 'cancelled' ? 'CANCELLED' : outcome === 'expired' ? 'EXPIRED' : 'PAID';
            if (order.status === 'PAID') {
                const plan = mockSubscriptionPlans.find(plan => plan.id === order.itemId)!;
                store.subscriptions.set(userId, { ...mockCurrentSubscription, subscriptionId: order.orderId, plan: { code: plan.code, name: plan.name }, status: 'ACTIVE', daysRemaining: plan.durationDays, quotas: Object.fromEntries(Object.entries(plan.features).map(([key, value]) => [key, { limit: value, used: 0, remaining: value }])) });
            }
        }
    }
    const value = publicOrder(order);
    return Response.json(new URL(request.url).pathname.endsWith('/status') ? { orderId: value.orderId, orderCode: value.orderCode, status: value.status, paymentUrl: value.paymentUrl, qrCodeUrl: value.qrCodeUrl, expiresAt: value.expiresAt } : value, { headers });
}

function publicOrder(order: Order) {
    // Explicitly omit mock-only counters/scenarios from the wire response.
    const { orderId, orderCode, userId, itemType, itemId, amount, currency, paymentProvider, status, paymentUrl, qrCodeUrl, expiresAt, createdAt } = order;
    return { orderId, orderCode, userId, itemType, itemId, amount, currency, paymentProvider, status, paymentUrl, qrCodeUrl, expiresAt, createdAt };
}
