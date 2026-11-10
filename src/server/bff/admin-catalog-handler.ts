import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { catalogInputSchema, catalogTypes } from '@/features/admin/schemas/content';
import { catalogStore, getCatalogItems } from '@/server/bff/catalog-store';
import { getRecruiterMockStore, getDeletedJobIds, type MockSession } from '@/server/bff/recruiter/mock-store';
import { adminCompanies } from '@/server/bff/admin-companies-store';
import { adminJobs } from '@/server/bff/admin-jobs-store';
import { getAdminActivity } from '@/server/bff/admin-users-store';
import { mockAdmin } from '@/mocks/fixtures/admin';
import { getRecruiterApplicationStore } from '@/server/bff/recruiter/application-store';
import type { components } from '@/lib/api/generated/schema';
const problem = (status: number, code: string) => NextResponse.json({ error: { code, message: code } }, { status });
export function catalogUsage(item: components['schemas']['CatalogItem']) {
  const jobs = adminJobs().filter(job => !getDeletedJobIds().has(job.id));
  return jobs.filter(job => job.industry?.id === item.id || job.position?.id === item.id || job.requiredSkills?.some(skill => skill.skillId === item.id || skill.name === item.name) || job.skills?.includes(item.name) || (job.location?.locationId === item.id || job.location?.city === item.name)).length
    + [...adminCompanies().values()].filter(company => company.industries?.some(industry => industry.id === item.id)).length
    + getRecruiterApplicationStore().filter(application => item.type === 'skills' ? application.profile?.skills?.some(skill => skill.name === item.name) || application.candidate.topSkills?.includes(item.name) : item.type === 'locations' && (application.profile?.city === item.name || application.candidate.city === item.name)).length
    + [...catalogStore().values()].filter(child => child.parentId === item.id || child.industryId === item.id).length;
}
export async function handleAdminCatalog(request: NextRequest, path: string, session: MockSession) {
  const match = /^admin\/catalog\/(industries|positions|skills|locations)(?:\/([\w-]+))?$/.exec(path); if (!match) return;
  const type = z.enum(catalogTypes).parse(match[1]), store = catalogStore(), item = match[2] ? store.get(match[2]) : undefined;
  if (match[2] && (!item || item.type !== type)) return problem(404, 'NOT_FOUND');
  if (request.method === 'GET' && !match[2]) {
    const raw = Object.fromEntries(request.nextUrl.searchParams);
    const query = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20), isActive: z.enum(['true', 'false']).optional() }).safeParse(raw);
    if (!query.success) return problem(422, 'VALIDATION_FAILED');
    const { page, pageSize } = query.data, needle = raw.q?.trim().toLocaleLowerCase('vi');
    const rows = request.headers.get('x-mock-scenario') === 'empty' ? [] : getCatalogItems(type).filter(row => (!needle || row.name.toLocaleLowerCase('vi').includes(needle)) && (!raw.parentId || row.parentId === raw.parentId) && (!raw.industryId || row.industryId === raw.industryId) && (!raw.isActive || String(row.isActive) === raw.isActive));
    return NextResponse.json({ items: rows.slice((page - 1) * pageSize, page * pageSize).map(row => ({ ...row, usageCount: catalogUsage(row) })), meta: { page, pageSize, totalItems: rows.length, totalPages: Math.ceil(rows.length / pageSize) } });
  }
  if (request.headers.get('X-CSRF-Token') !== session.csrf) return problem(403, 'CSRF_TOKEN_INVALID');
  if (request.method === 'DELETE' && item) {
    if (catalogUsage(item)) return problem(409, 'CATALOG_ITEM_IN_USE');
    store.delete(item.id);
  } else if ((request.method === 'POST' && !match[2]) || (request.method === 'PUT' && item)) {
    const parsed = catalogInputSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return problem(422, 'VALIDATION_FAILED');
    const input = parsed.data;
    if (getCatalogItems(type).some(row => row.id !== item?.id && row.name.toLocaleLowerCase('vi') === input.name.toLocaleLowerCase('vi'))) return problem(item ? 422 : 409, 'CONFLICT');
    if (input.industryId && store.get(input.industryId)?.type !== 'industries') return problem(422, 'VALIDATION_FAILED');
    if (input.parentId) {
      let parent = store.get(input.parentId); const seen = new Set<string>(item ? [item.id] : []);
      if (!parent || parent.type !== type) return problem(422, 'VALIDATION_FAILED');
      while (parent) { if (seen.has(parent.id)) return problem(422, 'VALIDATION_FAILED'); seen.add(parent.id); parent = parent.parentId ? store.get(parent.parentId) : undefined; }
    }
    const oldName = item?.name; const updated = { ...input, id: item?.id ?? randomUUID(), type, createdAt: item?.createdAt ?? new Date().toISOString(), updatedAt: new Date().toISOString() }; store.set(updated.id, updated);
    if (item && oldName !== input.name) {
      for (const job of getRecruiterMockStore().jobs) {
        if (job.industry?.id === item.id) job.industry.name = input.name;
        if (job.position?.id === item.id) job.position.name = input.name;
        if (type === 'skills') { for (const skill of job.requiredSkills ?? []) if (skill.skillId === item.id || skill.name === oldName) skill.name = input.name; job.skills = job.skills?.map(skill => skill === oldName ? input.name : skill); }
        if (type === 'locations' && (job.location.locationId === item.id || job.location.city === oldName)) job.location.city = input.name;
      }
      for (const company of adminCompanies().values()) for (const industry of company.industries ?? []) if (industry.id === item.id) industry.name = input.name;
      for (const application of getRecruiterApplicationStore()) {
        if (type === 'skills') {
          for (const skill of application.profile?.skills ?? []) if (skill.name === oldName) skill.name = input.name;
          application.candidate.topSkills = application.candidate.topSkills?.map(name => name === oldName ? input.name : name);
        }
        if (type === 'locations') {
          if (application.profile && application.profile.city === oldName) application.profile.city = input.name;
          if (application.candidate.city === oldName) application.candidate.city = input.name;
        }
      }
    }
    getAdminActivity().unshift({ id: randomUUID(), actorId: session.userId ?? mockAdmin.id, actorName: mockAdmin.fullName, actorRole: 'admin', action: `catalog.${item ? 'update' : 'create'}`, targetType: 'catalog', targetId: updated.id, occurredAt: new Date().toISOString(), result: 'success', metadata: { catalogType: type } });
    return NextResponse.json({ ...updated, usageCount: catalogUsage(updated) }, { status: item ? 200 : 201 });
  } else return problem(405, 'METHOD_NOT_ALLOWED');
  getAdminActivity().unshift({ id: randomUUID(), actorId: session.userId ?? mockAdmin.id, actorName: mockAdmin.fullName, actorRole: 'admin', action: 'catalog.delete', targetType: 'catalog', targetId: item.id, occurredAt: new Date().toISOString(), result: 'success' });
  return new NextResponse(null, { status: 204 });
}
