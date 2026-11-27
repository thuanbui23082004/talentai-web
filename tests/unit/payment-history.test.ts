import { afterEach, expect, it, vi } from 'vitest';
import { handleSubscriptionOrder } from '@/server/bff/recruiter/subscription-checkout';
import { csrfTokenFor } from '@/server/bff/auth/cookies';
import { paymentHistoryExample } from '@/mocks/fixtures/payment-history';

const id = '00000000-0000-4000-8000-000000096001';
const access = 'history-unit-access';
function request(search = '', user = true) { return new Request(`https://web.test/api/bff/orders/my${search}`, { headers: user ? { Cookie: `access_token=${access}` } : {} }); }
function network(role = 'RECRUITER', payload: unknown = { content: paymentHistoryExample.items, number: 0, size: 10, totalElements: 1, totalPages: 1 }, status = 200) {
    return vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => String(url).endsWith('/auth/me') ? Response.json({ success: true, data: { profile: { id, email: 'history@example.test', displayName: 'Test', status: 'ACTIVE', roles: [role] } } }) : Response.json(payload, { status }));
}
afterEach(() => vi.restoreAllMocks());
it('maps Spring pagination and forwards only the verified bearer token, filter and fixed sort', async () => {
    const fetcher = network('RECRUITER', { content: paymentHistoryExample.items, number: 1, size: 10, totalElements: 11, totalPages: 2 });
    const response = await handleSubscriptionOrder(request('?page=2&pageSize=10&status=PAID'), 'https://gateway.test/api/v1');
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ items: paymentHistoryExample.items, meta: { page: 2, totalItems: 11, totalPages: 2 } });
    const [url, init] = fetcher.mock.calls.at(-1)!;
    expect(String(url)).toBe('https://gateway.test/api/v1/orders/my?page=1&size=10&sort=createdAt%2Cdesc&status=PAID');
    expect(new Headers(init?.headers).get('Authorization')).toBe(`Bearer ${access}`);
    expect(new Headers(init?.headers).has('Cookie')).toBe(false);
    expect(response.headers.get('cache-control')).toContain('no-store');
});
it('requires recruiter auth and validates queries before calling the payment service', async () => {
    expect((await handleSubscriptionOrder(request('', false))).status).toBe(401);
    const fetcher = network('CANDIDATE');
    expect((await handleSubscriptionOrder(request())).status).toBe(403);
    fetcher.mockRestore(); network();
    for (const search of ['?page=0', '?pageSize=101', '?status=success', '?userId=other', '?page=1&page=2', '?page=1.5']) expect((await handleSubscriptionOrder(request(search), 'https://gateway.test/api/v1')).status).toBe(422);
});
it('does not expose foreign orders, invalid data or technical service errors', async () => {
    const fetcher = network('RECRUITER', { content: [{ ...paymentHistoryExample.items[0], userId: '00000000-0000-4000-8000-000000096002' }], number: 0, size: 10, totalElements: 1, totalPages: 1 });
    expect((await handleSubscriptionOrder(request(), 'https://gateway.test/api/v1')).status).toBe(403);
    fetcher.mockRestore();
    for (const status of [401, 403, 500, 200]) {
        const fetcher = network('RECRUITER', { secret: 'private SQL error' }, status);
        const response = await handleSubscriptionOrder(request(), 'https://gateway.test/api/v1');
        expect(response.status).toBe(status === 401 || status === 403 ? status : 503);
        expect(await response.text()).not.toContain('SQL');
        fetcher.mockRestore();
    }
});
it('lists actual mock orders by owner, paginates, filters and reflects cancellation', async () => {
    network();
    expect((await (await handleSubscriptionOrder(request())).json()).items).toHaveLength(0);
    let orderId = '';
    for (let i = 0; i < 3; i++) {
        const key = crypto.randomUUID();
        const response = await handleSubscriptionOrder(new Request('https://web.test/api/bff/orders', { method: 'POST', headers: { Cookie: `access_token=${access}`, Origin: 'https://web.test', 'X-CSRF-Token': csrfTokenFor({ access }), 'Idempotency-Key': key }, body: JSON.stringify({ itemType: 'SUBSCRIPTION', itemId: paymentHistoryExample.items[0].itemId, returnUrl: `https://web.test/recruiter/billing/result?checkout=${key}&result=return`, cancelUrl: `https://web.test/recruiter/billing/result?checkout=${key}&result=cancel` }) }));
        orderId = (await response.json()).orderId;
    }
    const first = await (await handleSubscriptionOrder(request('?pageSize=2'))).json();
    expect(first.items).toHaveLength(2); expect(first.meta.totalPages).toBe(2); expect(first.items[0].orderId).toBe(orderId);
    expect((await (await handleSubscriptionOrder(request('?page=2&pageSize=2'))).json()).items).toHaveLength(1);
    await handleSubscriptionOrder(new Request(`https://web.test/api/bff/orders/${orderId}/cancel`, { method: 'POST', headers: { Cookie: `access_token=${access}`, Origin: 'https://web.test', 'X-CSRF-Token': csrfTokenFor({ access }) } }));
    expect((await (await handleSubscriptionOrder(request('?status=CANCELLED'))).json()).items).toHaveLength(1);
    expect((await (await handleSubscriptionOrder(request('?status=PAID'))).json()).items).toHaveLength(0);
    expect((await (await handleSubscriptionOrder(new Request(request(), { headers: { Cookie: `access_token=${access}`, 'x-mock-scenario': 'empty' } }))).json()).items).toHaveLength(0);
});
