import { afterEach, describe, expect, it, vi } from 'vitest';
import { csrfTokenFor } from '@/server/bff/auth/cookies';
import { handleAdminJobCategories } from '@/server/bff/admin/job-categories-service';

const baseUrl = 'http://gateway.test/api/v1';
const token = 'admin-test-token';
const auth = { success: true, data: { profile: { id: '10000000-0000-4000-8000-000000000001', email: 'admin@example.test', displayName: 'Admin', status: 'ACTIVE', roles: ['ADMIN'] } } };
const category = { categoryId: 7, categoryName: 'Kỹ sư phần mềm', description: 'Phát triển ứng dụng', industryId: 12, industryName: 'Công nghệ', isActive: true };

function request(path: string, method = 'GET', body?: unknown) {
  return new Request(`http://localhost/api/bff/admin/catalog/${path}`, { method, headers: { cookie: `access_token=${token}`, 'X-CSRF-Token': csrfTokenFor({ access: token }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}
function network(role = 'ADMIN', respond?: (url: string, init?: RequestInit) => Response) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
    const target = String(url);
    if (target.endsWith('/auth/me')) return Response.json({ ...auth, data: { profile: { ...auth.data.profile, roles: [role] } } });
    expect(new Headers(init?.headers).get('Authorization')).toBe(`Bearer ${token}`);
    return respond?.(target, init) ?? Response.json({ data: { items: [category], page: 0, size: 20, totalElements: 1, totalPages: 1 } });
  });
}
afterEach(() => vi.restoreAllMocks());

describe('admin job positions BFF', () => {
  it('maps paged backend categories and company industries to catalog items', async () => {
    const fetch = network('ADMIN', url => url.endsWith('/industries')
      ? Response.json({ data: [{ id: 12, name: 'Công nghệ' }] })
      : Response.json({ data: { items: [category], page: 0, size: 20, totalElements: 1, totalPages: 1 } }));
    const list = await handleAdminJobCategories(request('positions?page=1&pageSize=20&q=Kỹ'), baseUrl);
    expect(list.status).toBe(200);
    expect(await list.json()).toEqual({ items: [{ id: '7', type: 'positions', name: category.categoryName, description: category.description, industryId: '12', industryName: 'Công nghệ', isActive: true }], meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } });
    expect(String(fetch.mock.calls.at(-1)?.[0])).toContain('/admin/job-categories?page=0&size=20&q=K');
    const industries = await handleAdminJobCategories(request('industries?page=1&pageSize=100'), baseUrl);
    expect(await industries.json()).toEqual({ items: [{ id: '12', type: 'industries', name: 'Công nghệ', isActive: true }], meta: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 } });
  });

  it('sends null to remove an optional industry and maps delete conflicts', async () => {
    const fetch = network('ADMIN', (url, init) => init?.method === 'DELETE'
      ? Response.json({ message: 'private' }, { status: 409 })
      : Response.json({ data: { ...category, industryId: null, industryName: null } }));
    const updated = await handleAdminJobCategories(request('positions/7', 'PUT', { name: 'Kỹ sư phần mềm', description: '', isActive: false }), baseUrl);
    expect(updated.status).toBe(200);
    expect((await updated.json()).industryId).toBeUndefined();
    expect(JSON.parse(String(fetch.mock.calls.at(-1)?.[1]?.body))).toMatchObject({ industryId: null, isActive: false });
    const deleted = await handleAdminJobCategories(request('positions/7', 'DELETE'), baseUrl);
    expect(deleted.status).toBe(409);
    expect(await deleted.text()).not.toContain('private');
  });

  it('checks role, CSRF and IDs before writing to backend', async () => {
    const fetch = network('RECRUITER');
    expect((await handleAdminJobCategories(request('positions'), baseUrl)).status).toBe(403);
    expect(fetch.mock.calls.filter(([url]) => String(url).includes('job-categories'))).toHaveLength(0);
    network('ADMIN');
    const noCsrf = new Request('http://localhost/api/bff/admin/catalog/positions', { method: 'POST', headers: { cookie: `access_token=${token}` }, body: '{}' });
    expect((await handleAdminJobCategories(noCsrf, baseUrl)).status).toBe(403);
    expect((await handleAdminJobCategories(request('positions/bad', 'DELETE'), baseUrl)).status).toBe(422);
  });
});
