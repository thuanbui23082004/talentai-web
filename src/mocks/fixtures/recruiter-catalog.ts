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
];
