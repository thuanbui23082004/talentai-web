import type { components } from '@/lib/api/generated/schema';
const names = ['An Bình', 'Bảo Ngọc', 'Gia Hân', 'Hải Nam', 'Khánh Linh', 'Minh Khoa', 'Ngọc Anh', 'Phương Nhi', 'Quốc Bảo', 'Thanh Hà', 'Tuấn Minh', 'Vân Anh'];
export const mockManagedUsers: components['schemas']['AdminUserDetail'][] = names.map((fullName, index) => ({
  id: `00000000-0000-4000-8000-${String(2000 + index).padStart(12, '0')}`, fullName,
  email: `user${index + 1}@example.test`, role: index % 3 === 0 ? 'recruiter' : 'candidate', status: index === 1 ? 'locked' : 'active',
  createdAt: `2026-10-${String(10 + index).padStart(2, '0')}T01:00:00Z`,
  stats: index % 3 === 0 ? { jobCount: index + 1 } : { cvCount: 2, applicationCount: index + 3 },
  ...(index === 1 ? { lockReason: 'Gửi nội dung không phù hợp nhiều lần.', violationCount: 1, violations: [{ id: '00000000-0000-4000-8000-000000003001', type: 'account', reason: 'Gửi nội dung không phù hợp nhiều lần.', createdAt: '2026-11-01T01:00:00Z' }] } : { violationCount: 0, violations: [] }),
}));
