import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleCurrentSubscription, handleSubscriptionOrder } from '@/server/bff/recruiter/subscription-checkout';
import { csrfTokenFor } from '@/server/bff/auth/cookies';
import subscription from '../../contracts/examples/current-subscription.json';
import order from '../../contracts/examples/subscription-order.json';

const gateway = 'https://gateway.test/api/v1';
const token = 'checkout-test-access';
const userId = '00000000-0000-4000-8000-000000000003';
function request(path = '/subscriptions/me') {
    return new Request(`https://web.test/api/bff${path}`, { headers: { Cookie: `access_token=${token}` } });
}
function network(role = 'RECRUITER', status = 200) {
    return vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
        if (String(url).endsWith('/auth/me')) return Response.json({ success: true, data: { profile: { id: userId, email: 'checkout@example.test', displayName: 'Nhà tuyển dụng kiểm thử', status: 'ACTIVE', roles: [role] } } });
        expect(String(url)).toBe(`${gateway}/subscriptions/me`);
        expect(new Headers(init?.headers).get('Authorization')).toBe(`Bearer ${token}`);
        return Response.json(status === 200 ? subscription : { error: { message: 'SQL private error' } }, { status });
    });
}
afterEach(() => vi.restoreAllMocks());

describe('current subscription', () => {
    it('loads the authenticated subscription through the configured gateway without caching', async () => {
        network();
        const response = await handleCurrentSubscription(request(), gateway);
        expect(await response.json()).toEqual(subscription);
        expect(response.headers.get('Cache-Control')).toContain('no-store');
    });
    it('requires a recruiter session', async () => {
        expect((await handleCurrentSubscription(new Request('https://web.test/api/bff/subscriptions/me'), gateway)).status).toBe(401);
        network('CANDIDATE');
        expect((await handleCurrentSubscription(request(), gateway)).status).toBe(403);
    });
    it('preserves auth errors and hides technical failures', async () => {
        for (const status of [401, 403, 500]) {
            const fetcher = network('RECRUITER', status);
            const response = await handleCurrentSubscription(request(), gateway);
            expect(response.status).toBe(status === 500 ? 503 : status);
            expect(await response.text()).not.toContain('SQL');
            fetcher.mockRestore();
        }
    });
    it('supports mock subscription and empty/error states', async () => {
        network();
        expect(await (await handleCurrentSubscription(request())).json()).toEqual(subscription);
        expect(await (await handleCurrentSubscription(new Request(request(), { headers: { Cookie: `access_token=${token}`, 'x-mock-scenario': 'empty' } }))).json()).toEqual({});
        expect((await handleCurrentSubscription(new Request(request(), { headers: { Cookie: `access_token=${token}`, 'x-mock-scenario': 'error' } }))).status).toBe(503);
    });
});

const key = '00000000-0000-4000-8000-000000095001';
function input(method?: 'MOMO' | 'ZALOPAY') {
    return { itemType: 'SUBSCRIPTION', itemId: order.itemId, ...(method ? { paymentMethod: method } : {}), returnUrl: `https://web.test/recruiter/billing/result?checkout=${key}&result=return`, cancelUrl: `https://web.test/recruiter/billing/result?checkout=${key}&result=cancel` };
}
function write(path = '/orders', body: unknown = input(), extra: Record<string, string> = {}) {
    return new Request(`https://web.test/api/bff${path}`, { method: 'POST', body: JSON.stringify(body), headers: { Cookie: `access_token=${token}`, Origin: 'https://web.test', 'Content-Type': 'application/json', 'X-CSRF-Token': csrfTokenFor({ access: token }), 'Idempotency-Key': key, ...extra } });
}
function paymentNetwork(status = 201, payload: unknown = order) {
    return vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
        if (String(url).endsWith('/auth/me')) return Response.json({ success: true, data: { profile: { id: userId, email: 'checkout@example.test', displayName: 'Kiểm thử', status: 'ACTIVE', roles: ['RECRUITER'] } } });
        expect(new Headers(init?.headers).get('Authorization')).toBe(`Bearer ${token}`);
        return Response.json(payload, { status });
    });
}

describe('payment order integration', () => {
    it.each([undefined, 'MOMO', 'ZALOPAY'] as const)('creates once with server pricing and method %s', async method => {
        const fetcher = paymentNetwork();
        const response = await handleSubscriptionOrder(write('/orders', input(method)), gateway);
        expect(response.status).toBe(201);
        const writes = fetcher.mock.calls.filter(([, init]) => init?.method === 'POST');
        expect(writes).toHaveLength(1);
        expect(String(writes[0][0])).toBe(`${gateway}/orders`);
        expect(new Headers(writes[0][1]?.headers).get('Idempotency-Key')).toBe(key);
        expect(JSON.parse(String(writes[0][1]?.body))).toEqual(input(method));
        expect(String(writes[0][1]?.body)).not.toContain('amount');
        expect((await response.json()).status).toBe('PENDING');
    });

    it('blocks missing CSRF, cross-origin callbacks, arbitrary amounts and missing idempotency keys', async () => {
        const fetcher = paymentNetwork();
        for (const req of [write('/orders', input(), { 'X-CSRF-Token': '' }), write('/orders', input(), { Origin: 'https://evil.test' })]) expect((await handleSubscriptionOrder(req, gateway)).status).toBe(403);
        for (const req of [write('/orders', { ...input(), amount: 1 }), write('/orders', { ...input(), returnUrl: 'https://evil.test' }), write('/orders', input(), { 'Idempotency-Key': '' })]) expect((await handleSubscriptionOrder(req, gateway)).status).toBe(422);
        expect(fetcher.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(0);
    });

    it('validates callback origin against the checked browser host when Next uses an internal hostname', async () => {
        paymentNetwork();
        const req = new Request('https://internal.test/api/bff/orders', { method: 'POST', body: JSON.stringify(input()), headers: { Cookie: `access_token=${token}`, Host: 'web.test', Origin: 'https://web.test', 'Content-Type': 'application/json', 'X-CSRF-Token': csrfTokenFor({ access: token }), 'Idempotency-Key': key } });
        expect((await handleSubscriptionOrder(req, gateway)).status).toBe(201);
    });

    it('checks status using the documented endpoint, rejects mismatched IDs and never retries a write', async () => {
        const fetcher = paymentNetwork(200, { orderId: order.orderId, status: 'PAID' });
        expect(await (await handleSubscriptionOrder(request(`/orders/${order.orderId}/status`), gateway)).json()).toEqual({ orderId: order.orderId, status: 'PAID' });
        expect(String(fetcher.mock.calls.at(-1)?.[0])).toBe(`${gateway}/orders/${order.orderId}/status`);
        fetcher.mockRestore();
        for (const status of [400, 401, 403, 404, 409, 500]) {
            const fetcher = paymentNetwork(status, { error: { message: 'SQL private error' } });
            const response = await handleSubscriptionOrder(write(), gateway);
            expect(response.status).toBe(status === 500 ? 503 : status);
            expect(await response.text()).not.toContain('SQL');
            expect(fetcher.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1);
            fetcher.mockRestore();
        }
        paymentNetwork(200, { orderId: key, status: 'PAID' });
        expect((await handleSubscriptionOrder(request(`/orders/${order.orderId}/status`), gateway)).status).toBe(503);
    });

    it('mocks idempotency, pending → paid activation, ownership and cancellation', async () => {
        network();
        const first = await (await handleSubscriptionOrder(write())).json();
        const duplicate = await (await handleSubscriptionOrder(write())).json();
        expect(duplicate.orderId).toBe(first.orderId);
        expect((await (await handleCurrentSubscription(request())).json()).plan.code).toBe('FREE');
        for (let i = 0; i < 3; i++) {
            const status = await (await handleSubscriptionOrder(request(`/orders/${first.orderId}/status`))).json();
            expect(status.status).toBe(i === 2 ? 'PAID' : 'PENDING');
        }
        expect((await (await handleCurrentSubscription(request())).json()).plan.code).toBe('BASIC');
        expect((await handleSubscriptionOrder(write(`/orders/${first.orderId}/cancel`, {}))).status).toBe(400);
        const cancelKey = '00000000-0000-4000-8000-000000095002';
        const cancelInput = JSON.parse(JSON.stringify(input()).replaceAll(key, cancelKey));
        const second = await (await handleSubscriptionOrder(write('/orders', cancelInput, { 'Idempotency-Key': cancelKey }))).json();
        expect((await (await handleSubscriptionOrder(write(`/orders/${second.orderId}/cancel`, {}))).json()).status).toBe('CANCELLED');
        expect((await (await handleSubscriptionOrder(request(`/orders/${second.orderId}/status`))).json()).status).toBe('CANCELLED');
    });

    it('denies another recruiter access to a mock order', async () => {
        const fetcher = paymentNetwork();
        const purchase = await (await handleSubscriptionOrder(write())).json();
        fetcher.mockImplementation(async () => Response.json({ success: true, data: { profile: { id: '00000000-0000-4000-8000-000000000004', email: 'other@example.test', displayName: 'Recruiter khác', status: 'ACTIVE', roles: ['RECRUITER'] } } }));
        expect((await handleSubscriptionOrder(request(`/orders/${purchase.orderId}/status`))).status).toBe(403);
        expect((await handleSubscriptionOrder(write(`/orders/${purchase.orderId}/cancel`, {}))).status).toBe(403);
    });
});
