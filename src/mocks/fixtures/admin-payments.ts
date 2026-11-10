import type { PaymentDemoRecord } from '@/features/admin/schemas/payment-demo';

const statuses = ['paid', 'pending', 'failed', 'cancelled', 'expired'] as const;
export const demoPayments: PaymentDemoRecord[] = Array.from({ length: 14 }, (_, index) => ({
  id: `00000000-0000-4000-8000-${String(12000 + index).padStart(12, '0')}`,
  orderCode: `DH-DEMO-${String(index + 1).padStart(4, '0')}`,
  ...(index % 5 === 4 ? {} : { transactionCode: `GD-DEMO-${String(index + 1).padStart(4, '0')}` }),
  buyer: ['Minh Anh', 'Gia Bảo', 'Thanh Hà'][index % 3], company: ['Công ty Sao Mai Demo', 'Công ty Cánh Diều Demo', 'Công ty Bình Minh Demo'][index % 3],
  plan: ['Đăng tin cơ bản', 'Đăng tin nổi bật', 'Tuyển dụng chuyên nghiệp'][index % 3],
  amount: [490000, 990000, 1990000][index % 3], method: (['bank_transfer', 'domestic_card', 'ewallet'] as const)[index % 3],
  status: statuses[index % 5], createdAt: `2026-11-${String(6 - Math.floor(index / 3)).padStart(2, '0')}T${String(15 - index % 3).padStart(2, '0')}:00:00Z`,
  ...(index % 5 === 0 ? { paidAt: `2026-11-${String(6 - Math.floor(index / 3)).padStart(2, '0')}T15:05:00Z` } : {}),
  ...(index % 5 === 2 ? { issue: index % 2 ? 'declined' as const : 'timeout' as const } : index % 5 === 4 ? { issue: 'expired' as const } : index % 5 === 3 ? { issue: 'cancelled' as const } : {}),
  reconciliation: index === 7 ? 'needs_follow_up' : 'unreviewed', version: index === 7 ? 1 : 0,
  history: index === 7 ? [{ id: '00000000-0000-4000-8000-000000012100', outcome: 'needs_follow_up', note: 'Đã ghi nhận giao dịch mẫu cần kiểm tra thêm.', actorName: 'Quản trị TalentAI', at: '2026-11-05T14:00:00Z' }] : [],
}));
