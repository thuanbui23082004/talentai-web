import type { components } from '@/lib/api/generated/schema';
export const recruiterCompany: components['schemas']['Company'] = {
  id: '00000000-0000-4000-8000-000000000100', name: 'Công ty Công nghệ Sao Mai',
  verificationStatus: 'verified', createdAt: '2026-10-01T00:00:00Z', city: 'Hà Nội',
  industries: [{ id: '00000000-0000-4000-8000-000000000001', name: 'Công nghệ thông tin' }], size: '51-200', address: 'Hà Nội',
  taxCode: '0000000000', contactPhone: '+84000000000', contactEmail: 'company@example.test', description: 'Phát triển sản phẩm công nghệ và giải pháp phần mềm cho doanh nghiệp.', website: 'https://example.test',
};
