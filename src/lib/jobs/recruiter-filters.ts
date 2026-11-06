import { z } from 'zod';

export const postingStatuses = ['DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED', 'EXPIRED'] as const;
export const recruiterJobFiltersSchema = z.object({
  status: z.enum(postingStatuses).optional(),
  page: z.coerce.number().int().min(1).max(10001).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
}).strict();
export type PostingStatus = typeof postingStatuses[number];
export type RecruiterJobFilters = Partial<z.output<typeof recruiterJobFiltersSchema>>;

export const postingStatusLabels: Record<PostingStatus, string> = {
  DRAFT: 'Bản nháp', ACTIVE: 'Đang tuyển', PAUSED: 'Tạm dừng', CLOSED: 'Đã đóng', EXPIRED: 'Hết hạn',
};
