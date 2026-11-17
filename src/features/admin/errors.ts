import { ApiError } from '@/lib/api';
import { PaymentDemoError } from '@/features/admin/payment-errors';
import type { PaymentDemoErrorCode } from '@/features/admin/schemas/payment-demo';
export function paymentErrorKey(error: unknown): PaymentDemoErrorCode | 'generic' { return error instanceof PaymentDemoError ? error.code : 'generic'; }
export function adminErrorKey(error: unknown) {
  const code = error instanceof ApiError ? error.code : '';
  return code === 'INVALID_CREDENTIALS' || code === 'ACCOUNT_LOCKED' || code === 'FORBIDDEN' ? code : 'generic';
}
