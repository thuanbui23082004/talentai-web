import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleSubscriptionPlans } from '@/server/bff/recruiter/subscription-plans';
import { planFeatureValue, planPrice } from '@/features/recruiter-services/plan-presentation';
import plans from '../../contracts/examples/subscription-plans.json';

const gateway = 'http://gateway.test/api/v1';
const request = () => new Request('http://localhost/api/bff/plans');
afterEach(() => vi.restoreAllMocks());

describe('subscription plan catalog', () => {
    it('reads the public catalog, preserves seeded IDs and does not send user credentials', async () => {
        const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(plans));
        const response = await handleSubscriptionPlans(request(), gateway);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual(plans);
        expect(String(fetcher.mock.calls[0][0])).toBe(`${gateway}/plans`);
        const headers = new Headers(fetcher.mock.calls[0][1]?.headers);
        expect(headers.has('Authorization')).toBe(false);
        expect(headers.has('Cookie')).toBe(false);
    });

    it('does not fall back to demo packages on backend errors or malformed prices', async () => {
        const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 500 }));
        expect((await handleSubscriptionPlans(request(), gateway)).status).toBe(503);
        fetcher.mockResolvedValue(Response.json([{ ...plans[0], price: -1 }]));
        expect((await handleSubscriptionPlans(request(), gateway)).status).toBe(503);
    });

    it('supports empty responses and mock loading/error scenarios', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json([]));
        expect(await (await handleSubscriptionPlans(request(), gateway)).json()).toEqual([]);
        const empty = new Request(request(), { headers: { 'x-mock-scenario': 'empty' } });
        expect(await (await handleSubscriptionPlans(empty)).json()).toEqual([]);
        const error = new Request(request(), { headers: { 'x-mock-scenario': 'error' } });
        expect((await handleSubscriptionPlans(error)).status).toBe(503);
    });

    it('formats backend prices and limits without invented monthly/yearly discounts', () => {
        expect(planPrice(plans[1])).toBe('499,000 VNĐ');
        expect(planPrice(plans[0])).toBe('Miễn phí');
        expect(planFeatureValue('AI_MATCHING', false)).toBe('Không bao gồm');
        expect(planFeatureValue('MAX_POSTS', -1)).toBe('Không giới hạn');
        expect(planFeatureValue('MAX_POSTS', 'UNLIMITED')).toBe('Không giới hạn');
        expect(planFeatureValue('CV_SEARCH_LIMIT', 0)).toBe('0 lượt');
        expect(planFeatureValue('JOB_DISPLAY_DAYS', 15)).toBe('15 ngày');
        expect(planFeatureValue('AI_MATCHING', undefined)).toBe('—');
    });
});
