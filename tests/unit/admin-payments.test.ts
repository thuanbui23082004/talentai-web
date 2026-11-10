import { beforeEach, expect, test } from 'vitest';
import { demoPayments } from '@/mocks/fixtures/admin-payments';
import { paymentDemoStore, recordDemoReconciliation } from '@/server/bff/admin-payments-store';
import { getAdminActivity } from '@/server/bff/admin-users-store';
import { paymentDemoSchema, reconciliationSchema } from '@/features/admin/schemas/payment-demo';
import { canReconcilePayment, emptyPaymentFilters, filterPayments, paymentDay } from '@/features/admin/payment-rules';
const actor = { id: '00000000-0000-4000-8000-000000000901', name: 'Quản trị viên mẫu' };
beforeEach(() => { paymentDemoStore().clear(); for (const row of structuredClone(demoPayments)) paymentDemoStore().set(row.id, row); });
test('demo fixtures validate and filters combine status, reconciliation, keyword and inclusive local dates', () => {
  const rows = paymentDemoSchema.array().parse(demoPayments);
  expect(filterPayments(rows, { ...emptyPaymentFilters, search: 'gd-demo-0003', status: 'failed', from: '2026-11-06', to: '2026-11-06' }).map(row => row.id)).toEqual([rows[2].id]);
  expect(filterPayments(rows, { ...emptyPaymentFilters, search: 'BÌNH MINH' }).length).toBeGreaterThan(0);
  expect(filterPayments(rows, { ...emptyPaymentFilters, reconciliation: 'needs_follow_up' })).toHaveLength(1);
  expect(filterPayments(rows, { ...emptyPaymentFilters, from: '2026-12-01', to: '2026-11-01' })).toEqual([]);
  expect(paymentDay('2026-11-06T18:00:00Z')).toBe('2026-11-07');
});
test('reconciliation records history/audit and preserves payment money, transaction status and purchased plan', () => {
  const record = paymentDemoStore().get(demoPayments[2].id)!; const before = structuredClone(record), logs = getAdminActivity().length;
  const result = recordDemoReconciliation({ paymentId: record.id, version: record.version, outcome: 'needs_follow_up', note: ' Kiểm tra thêm giao dịch mẫu ' }, actor);
  expect(result.ok).toBe(true); expect(record.status).toBe(before.status); expect(record.amount).toBe(before.amount); expect(record.plan).toBe(before.plan);
  expect(record.version).toBe(1); expect(record.reconciliation).toBe('needs_follow_up'); expect(record.history[0].note).toBe('Kiểm tra thêm giao dịch mẫu');
  expect(getAdminActivity()).toHaveLength(logs + 1); expect(getAdminActivity()[0]).toMatchObject({ action: 'payment.reconcile', targetId: record.id, actorId: actor.id });
  expect(recordDemoReconciliation({ paymentId: record.id, version: 1, outcome: 'verified', note: 'Đã kiểm tra kết quả thất bại' }, actor).ok).toBe(true);
  expect(record.status).toBe('failed'); expect(canReconcilePayment(record)).toBe(false);
});
test('stale or duplicate confirmations cannot append audit or overwrite a newer review', () => {
  const input = { paymentId: demoPayments[2].id, version: 0, outcome: 'needs_follow_up', note: 'Lần đầu' };
  expect(recordDemoReconciliation(input, actor).ok).toBe(true); const logs = getAdminActivity().length;
  expect(recordDemoReconciliation({ ...input, note: 'Dữ liệu cũ' }, actor)).toEqual({ ok: false, code: 'CONFLICT' });
  expect(getAdminActivity()).toHaveLength(logs); expect(paymentDemoStore().get(input.paymentId)?.history).toHaveLength(1);
});
test('completed/cancelled payments and invalid notes cannot be reconciled', () => {
  const logs = getAdminActivity().length;
  for (const index of [0, 3]) expect(recordDemoReconciliation({ paymentId: demoPayments[index].id, version: 0, outcome: 'verified', note: 'Không hợp lệ' }, actor)).toEqual({ ok: false, code: 'INVALID_STATE' });
  expect(reconciliationSchema.safeParse({ paymentId: demoPayments[2].id, version: 0, outcome: 'verified', note: '   ' }).success).toBe(false);
  expect(reconciliationSchema.safeParse({ paymentId: demoPayments[2].id, version: 0, outcome: 'verified', note: 'a'.repeat(1001) }).success).toBe(false);
  expect(recordDemoReconciliation({ paymentId: 'missing' }, actor)).toEqual({ ok: false, code: 'INVALID_INPUT' });
  expect(getAdminActivity()).toHaveLength(logs);
});
