import { randomUUID } from 'node:crypto';
import { demoPayments } from '@/mocks/fixtures/admin-payments';
import { paymentDemoSchema, reconciliationSchema, type PaymentDemoRecord, type PaymentDemoResult } from '@/features/admin/schemas/payment-demo';
import { canReconcilePayment } from '@/features/admin/payment-rules';
import { getAdminActivity } from '@/server/bff/admin-users-store';

const shared = globalThis as typeof globalThis & { talentaiPaymentDemo?: Map<string, PaymentDemoRecord> };
export function paymentDemoStore() {
  return shared.talentaiPaymentDemo ??= new Map(paymentDemoSchema.array().parse(structuredClone(demoPayments)).map(row => [row.id, row]));
}
export function recordDemoReconciliation(raw: unknown, actor: { id: string; name: string }): PaymentDemoResult<PaymentDemoRecord> {
  const parsed = reconciliationSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: 'INVALID_INPUT' };
  const input = parsed.data, record = paymentDemoStore().get(input.paymentId);
  if (!record) return { ok: false, code: 'NOT_FOUND' };
  if (record.version !== input.version) return { ok: false, code: 'CONFLICT' };
  if (!canReconcilePayment(record)) return { ok: false, code: 'INVALID_STATE' };
  const at = new Date().toISOString();
  // Reconciliation records a review only. It never changes payment status, money or entitlements.
  record.reconciliation = input.outcome; record.version++;
  record.history.unshift({ id: randomUUID(), outcome: input.outcome, note: input.note, actorName: actor.name, at });
  getAdminActivity().unshift({ id: randomUUID(), actorId: actor.id, actorName: actor.name, actorRole: 'admin', action: 'payment.reconcile', targetType: 'payment', targetId: record.id, occurredAt: at, result: 'success', metadata: { reason: input.note, orderCode: record.orderCode, outcome: input.outcome, demo: true } });
  return { ok: true, data: structuredClone(record) };
}
