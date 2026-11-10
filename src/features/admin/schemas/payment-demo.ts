import { z } from 'zod';

// UI demonstration models, not an API contract. Payment endpoints are not defined yet.
export const paymentStatuses = ['paid', 'pending', 'failed', 'cancelled', 'expired'] as const;
export const reconciliationStates = ['unreviewed', 'verified', 'needs_follow_up'] as const;
export const reconciliationSchema = z.object({
  paymentId: z.uuid(), version: z.number().int().nonnegative(),
  outcome: z.enum(['verified', 'needs_follow_up']),
  note: z.string().trim().min(1, 'noteRequired').max(1000, 'noteLong'),
});
export const paymentDemoSchema = z.object({
  id: z.uuid(), orderCode: z.string(), transactionCode: z.string().optional(),
  buyer: z.string(), company: z.string(), plan: z.string(), amount: z.number().int().nonnegative(),
  method: z.enum(['bank_transfer', 'domestic_card', 'ewallet']), status: z.enum(paymentStatuses),
  createdAt: z.iso.datetime(), paidAt: z.iso.datetime().optional(),
  issue: z.enum(['timeout', 'declined', 'expired', 'cancelled']).optional(),
  reconciliation: z.enum(reconciliationStates), version: z.number().int().nonnegative(),
  history: z.array(z.object({ id: z.uuid(), outcome: z.enum(['verified', 'needs_follow_up']), note: z.string(), actorName: z.string(), at: z.iso.datetime() })),
});
export const paymentFiltersSchema = z.object({
  search: z.string(), status: z.union([z.literal(''), z.enum(paymentStatuses)]),
  reconciliation: z.union([z.literal(''), z.enum(reconciliationStates)]),
  from: z.union([z.literal(''), z.iso.date()]), to: z.union([z.literal(''), z.iso.date()]),
}).refine(value => !value.from || !value.to || value.from <= value.to, { message: 'dateOrder', path: ['to'] });
export type PaymentDemoRecord = z.infer<typeof paymentDemoSchema>;
export type PaymentFilters = z.infer<typeof paymentFiltersSchema>;
export type ReconciliationInput = z.infer<typeof reconciliationSchema>;
export const paymentDemoErrors = ['UNAUTHENTICATED', 'UNAVAILABLE', 'NOT_FOUND', 'INVALID_INPUT', 'CONFLICT', 'INVALID_STATE'] as const;
export type PaymentDemoErrorCode = typeof paymentDemoErrors[number];
export type PaymentDemoResult<T> = { ok: true; data: T } | { ok: false; code: PaymentDemoErrorCode };
