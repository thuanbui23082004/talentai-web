import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api/errors';
import { isPendingPayment, paymentErrorMessage, paymentStateMessages, safePaymentUrl, safeQrImage } from '@/features/recruiter-services/payment-presentation';
import { checkoutAttempt, finishCheckout, readCheckoutAttempt, rememberCheckout, resolveCheckoutOrder } from '@/features/recruiter-services/checkout-storage';

afterEach(() => vi.unstubAllGlobals());
describe('payment presentation and recovery', () => {
    it('maps every backend status, never treats a pending order as successful and hides raw errors', () => {
        expect(Object.keys(paymentStateMessages)).toHaveLength(7);
        expect(isPendingPayment('PENDING')).toBe(true);
        expect(isPendingPayment('CREATED')).toBe(true);
        expect(isPendingPayment('PAID')).toBe(false);
        expect(paymentErrorMessage(new Error('SQL secret'))).not.toContain('secret');
        expect(paymentErrorMessage(new ApiError('SQL', 401))).toContain('đăng nhập');
    });
    it('rejects unsafe redirects and QR content while allowing provider HTTPS and raster data', () => {
        for (const value of ['javascript:alert(1)', 'data:text/html,payload', 'https://user:secret@pay.test', 'http://evil.test']) expect(safePaymentUrl(value, 'http://web.test')).toBeUndefined();
        expect(safePaymentUrl('https://pay.test/checkout', 'http://web.test')).toBe('https://pay.test/checkout');
        expect(safePaymentUrl('http://web.test/recruiter/billing/result', 'http://web.test')).toBe('http://web.test/recruiter/billing/result');
        expect(safeQrImage('data:image/svg+xml;base64,PHN2Zz4=')).toBeUndefined();
        expect(safeQrImage('data:image/png;base64,YWJjZA==')).toBe('data:image/png;base64,YWJjZA==');
    });
    it('reuses the same purchase after an ambiguous failure, correlates callbacks and supports reload after success', () => {
        const storage = new Map<string, string>();
        vi.stubGlobal('sessionStorage', { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) });
        const plan = '11111111-0000-0000-0000-000000000001';
        const orderId = '00000000-0000-4000-8000-000000092123';
        const attempt = checkoutAttempt(plan, 'BANK');
        expect(checkoutAttempt(plan, 'BANK')).toEqual(attempt);
        expect(() => checkoutAttempt(plan, 'MOMO')).toThrow('CHECKOUT_IN_PROGRESS');
        rememberCheckout({ ...attempt, orderId });
        expect(resolveCheckoutOrder({ checkout: attempt.key, orderId: 'provider-numeric-code' })).toBe(orderId);
        expect(resolveCheckoutOrder({ checkout: crypto.randomUUID(), orderId })).toBeUndefined();
        finishCheckout(orderId);
        expect(readCheckoutAttempt()?.finished).toBe(true);
        expect(resolveCheckoutOrder({ checkout: attempt.key })).toBe(orderId);
        expect(checkoutAttempt(plan, 'MOMO').key).not.toBe(attempt.key);
    });
});
