import { z } from 'zod';
import { ApiError } from '@/lib/api';
import { PaymentDemoError } from '@/features/admin/payment-errors';
import type { PaymentDemoErrorCode } from '@/features/admin/schemas/payment-demo';
export function paymentErrorKey(error: unknown): PaymentDemoErrorCode | 'generic' { return error instanceof PaymentDemoError ? error.code : 'generic'; }
export function adminErrorKey(error: unknown) {
  const parsed = error instanceof ApiError ? z.object({ error: z.object({ code: z.string() }) }).safeParse(error.data) : undefined;
  const code = parsed?.success ? parsed.data.error.code : '';
  return code === 'INVALID_CREDENTIALS' || code === 'ACCOUNT_LOCKED' || code === 'FORBIDDEN' ? code : 'generic';
}
