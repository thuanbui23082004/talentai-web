import { randomUUID } from 'node:crypto';
import type { components } from '@/lib/api/generated/schema';
import { jobPostingCatalogs } from '@/mocks/fixtures/job-posting-catalogs';
import { jobPostingInputSchema } from '@/lib/api/job-posting-schemas';
import { provinceCity, resolveLocation } from '@/lib/locations/vietnam';
import { readRequestIdentity } from '../auth/session';
import { apiError } from '../responses';
import { mapRecruiterPosting } from './job-posting-mapper';
import { getMockCompanies, getRecruiterMockStore } from './mock-store';
import { toJobLocationIds } from './job-location-ids';

export async function mockJobPostingOptions(request: Request) {
  const identity = await readRequestIdentity(request);
  if (!identity) return apiError(401, 'UNAUTHENTICATED', 'Vui lòng đăng nhập.');
  if (identity.user.role !== 'recruiter') return apiError(403, 'FORBIDDEN', 'Chức năng dành cho nhà tuyển dụng.');
  if (request.method !== 'GET') return apiError(405, 'BAD_REQUEST', 'Phương thức không được hỗ trợ.');
  const companyId = getRecruiterMockStore().workspaces.get(identity.userId)?.companyId;
  const company = companyId ? getMockCompanies().get(companyId) : undefined;
  return Response.json({ ...jobPostingCatalogs, company: company ? { id: company.id, name: company.name } : undefined }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export function mockPostingJob(body: unknown, company: { id: string; name: string }, previous?: components['schemas']['RecruiterJob']) {
  const input = jobPostingInputSchema.safeParse(body);
  if (!input.success) throw apiError(422, 'VALIDATION_FAILED', 'Thông tin tin chưa hợp lệ.');
  const value = input.data;
  if (previous?.posting && value.version !== previous.posting.version) throw apiError(409, 'CONFLICT', 'Phiên bản tin đã thay đổi.');
  if (!jobPostingCatalogs.categories.some(item => item.categoryId === value.categoryId) || value.skillIds.some(id => !jobPostingCatalogs.skills.some(item => item.skillId === id)))
    throw apiError(422, 'VALIDATION_FAILED', 'Danh mục không hợp lệ.');
  const { province, ward } = resolveLocation(value.workplace ?? '');
  const ids = toJobLocationIds(value.workplace ?? '');
  if (!province || !ids) throw apiError(422, 'VALIDATION_FAILED', 'Địa điểm không hợp lệ.');
  const now = new Date().toISOString();
  const posting: components['schemas']['JobPostingRecord'] = {
    ...value, jobPostId: previous?.id ?? randomUUID(), companyId: company.id,
    status: previous?.posting?.status ?? 'DRAFT', version: (previous?.posting?.version ?? -1) + 1,
    createdAt: previous?.createdAt ?? now, updatedAt: now,
    location: [value.addressLine, ward?.name, provinceCity(province.name)].filter(Boolean).join(', '),
    locations: [{ ...ids, addressLine: value.addressLine }],
  };
  return mapRecruiterPosting(posting, company);
}
