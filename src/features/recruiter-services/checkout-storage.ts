import { z } from 'zod';
import type { PaymentMethod } from './types';

const attemptSchema = z.object({ key: z.uuid(), planId: z.guid(), method: z.enum(['BANK', 'MOMO', 'ZALOPAY']), orderId: z.guid().optional(), finished: z.boolean().optional() });
type Attempt = z.infer<typeof attemptSchema>;
const STORAGE_KEY = 'talentai:subscription-checkout';

export function readCheckoutAttempt(): Attempt | undefined {
    try { const parsed = attemptSchema.safeParse(JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null')); return parsed.success ? parsed.data : undefined; }
    catch { return undefined; }
}

export function rememberCheckout(attempt: Attempt) {
    // Only order IDs and an idempotency key, never auth or payment credentials.
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attempt));
}

export function checkoutAttempt(planId: string, method: PaymentMethod): Attempt {
    const previous = readCheckoutAttempt();
    if (previous && !previous.finished) {
        if (previous.planId !== planId || previous.method !== method) throw new Error('CHECKOUT_IN_PROGRESS');
        return previous;
    }
    const attempt = { key: crypto.randomUUID(), planId, method };
    rememberCheckout(attempt);
    return attempt;
}

export function finishCheckout(orderId: string) {
    try { const attempt = readCheckoutAttempt(); if (attempt?.orderId === orderId) rememberCheckout({ ...attempt, finished: true }); } catch { /* Storage is optional on the result screen. */ }
}

export function discardRejectedCheckout() {
    try { if (!readCheckoutAttempt()?.orderId) sessionStorage.removeItem(STORAGE_KEY); } catch { /* A rejected request created no order. */ }
}

export function resolveCheckoutOrder(params: { orderId?: string; checkout?: string }) {
    const attempt = readCheckoutAttempt();
    // The correlation key in our returnUrl survives provider-specific query fields.
    if (params.checkout) return attempt?.key === params.checkout ? attempt.orderId : undefined;
    const id = z.guid().safeParse(params.orderId);
    return id.success ? id.data : undefined;
}
