import type { components } from '@/lib/api/generated/schema';
import { syntheticCompanyDocument } from '@/mocks/fixtures/company-verification-document';
const names = ['Công ty Công nghệ Bình Minh', 'Công ty Dịch vụ An Phát', 'Công ty Truyền thông Mây Xanh', 'Công ty Thương mại Hòa An', 'Công ty Giải pháp Nam Việt', 'Công ty Sáng tạo Ánh Dương', 'Công ty Phát triển Minh Tâm', 'Công ty Tư vấn Thiên An', 'Công ty Sản xuất Hoa Mai', 'Công ty Dữ liệu Bắc Nam', 'Công ty Thương mại An Nhiên'];
const statuses = ['pending', 'verified', 'rejected', 'suspended', 'unverified'] as const;
export const mockAdminCompanies: components['schemas']['Company'][] = names.map((name, i) => ({
  id: `00000000-0000-4000-8000-${String(4000 + i).padStart(12, '0')}`, name, verificationStatus: statuses[i % statuses.length],
  taxCode: `000000${String(i + 1).padStart(4, '0')}`, city: i % 2 ? 'Hà Nội' : 'TP. Hồ Chí Minh', address: 'Địa chỉ doanh nghiệp mẫu', size: '11-50', contactEmail: `company${i + 1}@example.test`,
  description: 'Doanh nghiệp giả phục vụ kiểm thử giao diện tuyển dụng.', createdAt: `2026-10-${String(10 + i).padStart(2, '0')}T01:00:00Z`,
  ...(i % 5 === 4 ? {} : { verificationDocuments: [{ id: `00000000-0000-4000-8000-${String(5000 + i).padStart(12, '0')}`, fileName: 'ho-so-xac-minh-mau.pdf', mimeType: 'application/pdf', sizeBytes: syntheticCompanyDocument().byteLength, uploadedAt: '2026-11-01T01:00:00Z' }] }),
  ...(i % 5 === 2 ? { rejectionReason: 'Hồ sơ mẫu cần bổ sung thông tin xác minh.' } : {}),
}));
export const mockCompanyOwners: Record<string, NonNullable<components['schemas']['AdminCompany']['owner']>> = Object.fromEntries(mockAdminCompanies.map((company, i) => [company.id, { id: `00000000-0000-4000-8000-${String(6000 + i).padStart(12, '0')}`, fullName: `Đại diện mẫu ${i + 1}`, email: `owner${i + 1}@example.test` }]));
