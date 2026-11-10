import type { components } from '@/lib/api/generated/schema';
import { mockJobs } from '@/mocks/fixtures/jobs';
import { mockAdminCompanies } from '@/mocks/fixtures/admin-companies';
const statuses = ['pending_review', 'open', 'paused', 'closed', 'hidden', 'locked', 'rejected', 'draft'] as const;
const titles = ['Chuyên viên phát triển phần mềm', 'Chuyên viên kế toán tổng hợp', 'Nhân viên kinh doanh', 'Chuyên viên thiết kế', 'Nhân viên vận hành', 'Chuyên viên marketing', 'Kỹ sư kiểm thử', 'Chuyên viên nhân sự', 'Chuyên viên tư vấn khách hàng'];
export const mockAdminJobs: components['schemas']['RecruiterJob'][] = titles.map((title, i) => ({
  ...structuredClone(mockJobs[0]), id: `00000000-0000-4000-8000-${String(8000 + i).padStart(12, '0')}`, title,
  company: { id: mockAdminCompanies[1].id, name: mockAdminCompanies[1].name }, status: statuses[i % statuses.length],
  description: 'Tin tuyển dụng giả phục vụ kiểm thử giao diện quản trị. Tham gia triển khai công việc theo kế hoạch của nhóm.',
  requirements: 'Có kiến thức chuyên môn phù hợp, khả năng phối hợp và tinh thần trách nhiệm.', benefits: 'Môi trường làm việc chuyên nghiệp, hỗ trợ phát triển năng lực.',
  createdAt: `2026-10-${String(i + 18).padStart(2, '0')}T01:00:00Z`,
  moderation: { status: statuses[i % statuses.length] === 'pending_review' ? 'pending' : statuses[i % statuses.length] === 'rejected' ? 'rejected' : 'none', ...(statuses[i % statuses.length] === 'rejected' ? { reason: 'Tin mẫu cần bổ sung thông tin.' } : {}) },
}));

