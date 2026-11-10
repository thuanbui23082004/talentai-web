import { paymentFiltersSchema, type PaymentDemoRecord, type PaymentFilters } from '@/features/admin/schemas/payment-demo';

export const emptyPaymentFilters: PaymentFilters = { search: '', status: '', reconciliation: '', from: '', to: '' };
export function canReconcilePayment(payment: PaymentDemoRecord) {
  return ['failed', 'pending', 'expired'].includes(payment.status) && payment.reconciliation !== 'verified';
}
export function paymentDay(value: string) {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(value));
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)?.value).join('-');
}
export function filterPayments(items: PaymentDemoRecord[], input: PaymentFilters) {
  if (!paymentFiltersSchema.safeParse(input).success) return [];
  const needle = input.search.trim().toLocaleLowerCase('vi');
  return items.filter(item => (!needle || [item.orderCode, item.transactionCode ?? '', item.buyer, item.company].some(value => value.toLocaleLowerCase('vi').includes(needle))) &&
    (!input.status || item.status === input.status) && (!input.reconciliation || item.reconciliation === input.reconciliation) &&
    (!input.from || paymentDay(item.createdAt) >= input.from) && (!input.to || paymentDay(item.createdAt) <= input.to))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.orderCode.localeCompare(b.orderCode));
}
