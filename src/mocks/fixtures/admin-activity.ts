import type { components } from '@/lib/api/generated/schema';
export const additionalAdminActivity: components['schemas']['ActivityLog'][] = Array.from({ length: 12 }, (_, index) => ({
  id: `00000000-0000-4000-8000-${String(14000 + index).padStart(12, '0')}`,
  actorId: index % 2 ? '00000000-0000-4000-8000-000000000902' : '00000000-0000-4000-8000-000000000901',
  actorName: index % 2 ? 'Quản trị viên mẫu' : 'Quản trị TalentAI', actorRole: 'admin',
  action: index % 3 === 0 ? 'job.approve' : index % 3 === 1 ? 'company.verify' : 'user.warn',
  targetType: index % 3 === 0 ? 'job' : index % 3 === 1 ? 'company' : 'user',
  targetId: index % 3 === 0 ? '00000000-0000-4000-8000-000000008005' : index % 3 === 1 ? '00000000-0000-4000-8000-000000004006' : '00000000-0000-4000-8000-000000002008',
  result: index % 4 === 0 ? 'failure' : 'success', occurredAt: `2026-10-${String(28 - index).padStart(2, '0')}T03:00:00Z`,
  metadata: { reason: index % 4 === 0 ? 'Thao tác mẫu không thành công do trạng thái đối tượng không phù hợp.' : 'Đã kiểm tra thông tin mẫu và ghi nhận kết quả.' },
}));
