import type { components } from '@/lib/api/generated/schema';
export const extraCatalog: components['schemas']['CatalogItem'][] = [
  { id: '00000000-0000-4000-8000-000000009001', name: 'Lập trình viên', type: 'positions', industryId: '00000000-0000-4000-8000-000000000001', isActive: true },
  { id: '00000000-0000-4000-8000-000000009002', name: 'TypeScript', aliases: ['TS'], type: 'skills', industryId: '00000000-0000-4000-8000-000000000001', isActive: true },
  { id: '00000000-0000-4000-8000-000000009003', name: 'Kỹ năng mẫu đã ngừng', type: 'skills', isActive: false },
];
export const mockReports: components['schemas']['AdminReportDetail'][] = [
  { id: '00000000-0000-4000-8000-000000009101', category: 'spam', targetType: 'job', targetId: '00000000-0000-4000-8000-000000008001', targetLabel: 'Chuyên viên kế toán tổng hợp', description: 'Tin tuyển dụng mẫu có dấu hiệu đăng lặp nội dung. Đề nghị kiểm tra trước khi xử lý.', status: 'open', createdAt: '2026-11-05T08:00:00Z', reporter: { fullName: 'Người dùng mẫu A', email: 'reporter.a@example.test' }, targetSnapshot: { summary: 'Nội dung tuyển dụng được người dùng đánh dấu là trùng lặp.' }, history: [] },
  { id: '00000000-0000-4000-8000-000000009102', category: 'harassment', targetType: 'user', targetId: '00000000-0000-4000-8000-000000002004', targetLabel: 'Khánh Linh', description: 'Tài khoản mẫu bị báo cáo gửi nội dung không phù hợp.', status: 'in_review', createdAt: '2026-11-04T08:00:00Z', reporter: { fullName: 'Người dùng mẫu B' }, history: [{ action: 'start_review', fromStatus: 'open', toStatus: 'in_review', at: '2026-11-05T09:00:00Z', actorName: 'Quản trị TalentAI', note: 'Đang kiểm tra thông tin.' }] },
  { id: '00000000-0000-4000-8000-000000009103', category: 'fake_company', targetType: 'company', targetId: '00000000-0000-4000-8000-000000004006', targetLabel: 'Doanh nghiệp mẫu', description: 'Đề nghị kiểm tra thông tin doanh nghiệp mẫu.', status: 'open', createdAt: '2026-11-03T08:00:00Z', history: [] },
  { id: '00000000-0000-4000-8000-000000009104', category: 'feedback', targetType: 'system', targetLabel: 'Góp ý giao diện', description: 'Mong muốn bộ lọc dễ sử dụng hơn trên điện thoại.', status: 'open', createdAt: '2026-11-02T08:00:00Z', history: [] },
];
