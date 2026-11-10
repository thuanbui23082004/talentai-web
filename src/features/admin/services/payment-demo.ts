import { startTransition } from 'react';
import { z } from 'zod';
import { readPaymentDemoAction, reconcilePaymentDemoAction } from '@/features/admin/actions/payment-demo';
import { paymentDemoSchema, paymentDemoErrors, reconciliationSchema, type ReconciliationInput } from '@/features/admin/schemas/payment-demo';
import { PaymentDemoError } from '@/features/admin/payment-errors';
function actionTransition<T>(action: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => { startTransition(() => { void action().then(resolve, reject); }); });
}
const failure = z.object({ ok: z.literal(false), code: z.enum(paymentDemoErrors) });
export async function getPaymentDemo(signal?: AbortSignal) {
  const result = z.discriminatedUnion('ok', [failure, z.object({ ok: z.literal(true), data: paymentDemoSchema.array() })]).parse(await actionTransition(readPaymentDemoAction));
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  if (!result.ok) throw new PaymentDemoError(result.code);
  return result.data;
}
export async function getPaymentDemoDetail(id: string, signal?: AbortSignal) {
  const rows = await getPaymentDemo(signal), record = rows.find(row => row.id === id);
  if (!record) throw new PaymentDemoError('NOT_FOUND');
  return record;
}
export async function savePaymentDemoReview(input: ReconciliationInput) {
  const value = reconciliationSchema.parse(input);
  const result = z.discriminatedUnion('ok', [failure, z.object({ ok: z.literal(true), data: paymentDemoSchema })]).parse(await actionTransition(() => reconcilePaymentDemoAction(value)));
  if (!result.ok) throw new PaymentDemoError(result.code);
  return result.data;
}
