import 'server-only';
import { getServerEnv } from '@/lib/env';
import { hasAdminSession } from '@/server/bff/admin-session';
import { paymentDemoStore, recordDemoReconciliation } from '@/server/bff/admin-payments-store';
import { mockAdmin } from '@/mocks/fixtures/admin';
import type { PaymentDemoRecord, PaymentDemoResult } from '@/features/admin/schemas/payment-demo';

// Explicit mock-only UI bridge until payment operations have an approved API contract.
// No REST endpoint or real backend payment payload is inferred here.
export async function readPaymentDemo(): Promise<PaymentDemoResult<PaymentDemoRecord[]>> {
  if (!await hasAdminSession()) return { ok: false, code: 'UNAUTHENTICATED' };
  if (getServerEnv().DATA_MODE !== 'mock') return { ok: false, code: 'UNAVAILABLE' };
  return { ok: true, data: structuredClone([...paymentDemoStore().values()]) };
}
export async function reconcilePaymentDemo(input: unknown): Promise<PaymentDemoResult<PaymentDemoRecord>> {
  if (!await hasAdminSession()) return { ok: false, code: 'UNAUTHENTICATED' };
  if (getServerEnv().DATA_MODE !== 'mock') return { ok: false, code: 'UNAVAILABLE' };
  return recordDemoReconciliation(input, { id: mockAdmin.id, name: mockAdmin.fullName });
}
