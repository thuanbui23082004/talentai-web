import type { components } from '@/lib/api/generated/schema';
export const recruiterIndustries: components['schemas']['CatalogItem'][] = [
  { id: '00000000-0000-4000-8000-000000000001', name: 'Công nghệ thông tin', type: 'industries', isActive: true },
  { id: '00000000-0000-4000-8000-000000000002', name: 'Kinh doanh / Bán hàng', type: 'industries', isActive: true },
  { id: '00000000-0000-4000-8000-000000000003', name: 'Thiết kế / Sáng tạo', type: 'industries', isActive: true },
];
export const recruiterLocations: components['schemas']['CatalogItem'][] = [
  { id: '00000000-0000-4000-8000-000000000011', name: 'Hà Nội', type: 'locations', isActive: true },
  { id: '00000000-0000-4000-8000-000000000012', name: 'TP. Hồ Chí Minh', type: 'locations', isActive: true },
  { id: '00000000-0000-4000-8000-000000000013', name: 'Đà Nẵng', type: 'locations', isActive: true },
  // Current provincial names: https://baochinhphu.vn/nghi-quyet-cua-quoc-hoi-ve-sap-xep-don-vi-hanh-chinh-cap-tinh-102250612191145158.htm
  ...['An Giang', 'Bắc Ninh', 'Cà Mau', 'Cần Thơ', 'Cao Bằng', 'Đắk Lắk', 'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Tĩnh', 'Hải Phòng', 'Hưng Yên', 'Huế', 'Khánh Hòa', 'Lai Châu', 'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Nghệ An', 'Ninh Bình', 'Phú Thọ', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị', 'Sơn La', 'Tây Ninh', 'Thái Nguyên', 'Thanh Hóa', 'Tuyên Quang', 'Vĩnh Long'].map((name, index) => ({
    id: `00000000-0000-4000-8000-${String(1001 + index).padStart(12, '0')}`, name, type: 'locations' as const, isActive: true,
  })),
];
