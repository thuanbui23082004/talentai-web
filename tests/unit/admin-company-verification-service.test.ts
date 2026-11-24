import { afterEach, describe, expect, it, vi } from 'vitest';
import { csrfTokenFor } from '@/server/bff/auth/cookies';
import { handleAdminCompanyVerification } from '@/server/bff/admin/company-verification-service';

const baseUrl = 'http://company.test/api/v1';
const companyId = '10000000-0000-4000-8000-000000000003';
const documentId = '10000000-0000-4000-8000-000000000004';
const token = 'admin-verification-token';
const record = { id: companyId, name: 'Công ty mẫu', verificationStatus: 'PENDING', createdAt: '2026-11-24T00:00:00Z', taxCode: '0101234567', address: 'Hà Nội', industry: { id: 12, name: 'Công nghệ' } };
const file = { id: documentId, companyId, documentType: 'BUSINESS_REGISTRATION', fileName: 'license.pdf', fileUrl: 'https://res.cloudinary.com/demo/raw/upload/license.pdf', fileSize: 1024, mimeType: 'application/pdf', status: 'PENDING', uploadedAt: '2026-11-24T00:00:00Z' };
const profile = (role: string) => ({ success: true, data: { profile: { id: '10000000-0000-4000-8000-000000000001', email: 'admin@example.test', displayName: 'Admin', status: 'ACTIVE', roles: [role] } } });
function request(path = '', method = 'GET', body?: unknown, csrf = true) {
  return new Request(`http://localhost/api/bff/admin/companies${path}`, { method, headers: { cookie: `access_token=${token}`, ...(csrf ? { 'X-CSRF-Token': csrfTokenFor({ access: token }) } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}
function network(role = 'ADMIN') {
  let documentStatus = file.status, companyStatus = record.verificationStatus;
  const fetch = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
    const path = String(url);
    if (path.endsWith('/auth/me')) return Response.json(profile(role));
    expect(new Headers(init?.headers).get('Authorization')).toBe(`Bearer ${token}`);
    if (path.includes('/admin/companies?page=')) return Response.json({ data: { content: [{ ...record, verificationStatus: companyStatus }], page: 0, size: 100, totalElements: 1, totalPages: 1 } });
    if (path.endsWith(`/admin/companies/${companyId}/documents`)) return Response.json({ data: [{ ...file, status: documentStatus }] });
    if (path.endsWith(`/tax-lookup/${record.taxCode}`)) return Response.json({ data: { taxCode: record.taxCode, name: record.name, address: record.address, isActive: true } });
    if (path.endsWith(`/admin/documents/${documentId}/verification`)) { documentStatus = JSON.parse(String(init?.body)).status; return Response.json({ data: { ...file, status: documentStatus } }); }
    if (path.endsWith(`/admin/companies/${companyId}/verification`)) { companyStatus = JSON.parse(String(init?.body)).status; return Response.json({ data: { ...record, verificationStatus: companyStatus } }); }
    throw new Error(`Unexpected request: ${path}`);
  });
  return fetch;
}
afterEach(() => vi.restoreAllMocks());

describe('real company verification BFF', () => {
  it('maps company list, documents and tax lookup without inventing missing fields', async () => {
    network();
    const list = await handleAdminCompanyVerification(request('?page=1&pageSize=100'), baseUrl);
    expect(list.status).toBe(200);
    expect((await list.json()).items[0]).toMatchObject({ id: companyId, verificationStatus: 'pending', taxCode: record.taxCode });
    const detail = await handleAdminCompanyVerification(request(`/${companyId}`), baseUrl);
    expect((await detail.json()).verificationDocuments[0]).toMatchObject({ id: documentId, status: 'pending' });
    const lookup = await handleAdminCompanyVerification(request(`/${companyId}/tax-lookup`), baseUrl);
    expect(await lookup.json()).toMatchObject({ taxCode: record.taxCode, isActive: true });
  });

  it('reviews a document before allowing company verification', async () => {
    const fetch = network();
    expect((await handleAdminCompanyVerification(request(`/${companyId}/verify`, 'POST', { note: 'checked' }), baseUrl)).status).toBe(422);
    const reviewed = await handleAdminCompanyVerification(request(`/${companyId}/documents/${documentId}/verification`, 'PATCH', { status: 'verified' }), baseUrl);
    expect(reviewed.status).toBe(200);
    expect((await reviewed.json()).verificationDocuments[0].status).toBe('verified');
    const verified = await handleAdminCompanyVerification(request(`/${companyId}/verify`, 'POST', { note: 'checked' }), baseUrl);
    expect((await verified.json()).verificationStatus).toBe('verified');
    expect(fetch.mock.calls.some(([url, init]) => String(url).endsWith('/verification') && init?.method === 'PATCH')).toBe(true);
  });

  it('enforces admin role and CSRF before backend writes', async () => {
    const fetch = network('RECRUITER');
    expect((await handleAdminCompanyVerification(request(), baseUrl)).status).toBe(403);
    expect((await handleAdminCompanyVerification(request(`/${companyId}/verify`, 'POST', {}, false), baseUrl)).status).toBe(403);
    expect(fetch.mock.calls.filter(([url]) => String(url).includes('company.test'))).toHaveLength(0);
  });

  it('requires a reason when rejecting a document', async () => {
    const fetch = network();
    const missing = await handleAdminCompanyVerification(request(`/${companyId}/documents/${documentId}/verification`, 'PATCH', { status: 'rejected' }), baseUrl);
    expect(missing.status).toBe(422);
    expect(fetch.mock.calls.some(([url]) => String(url).endsWith(`/admin/documents/${documentId}/verification`))).toBe(false);
    const rejected = await handleAdminCompanyVerification(request(`/${companyId}/documents/${documentId}/verification`, 'PATCH', { status: 'rejected', rejectionReason: 'Mã số thuế trên tài liệu không khớp.' }), baseUrl);
    expect(rejected.status).toBe(200);
    expect((await rejected.json()).verificationDocuments[0].status).toBe('rejected');
  });
});
