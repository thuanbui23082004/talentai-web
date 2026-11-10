import type { PaymentDemoErrorCode } from '@/features/admin/schemas/payment-demo';
export class PaymentDemoError extends Error {
  constructor(public code: PaymentDemoErrorCode) { super(code); }
}
