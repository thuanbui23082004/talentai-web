import { afterEach, expect, it, vi } from 'vitest';
import { csrfTokenFor } from '@/server/bff/auth/cookies';
import { handleRecruiterCompany } from '@/server/bff/recruiter/company-service';

const baseUrl = 'http://company.test/api/v1';
const token = 'recruiter-verification-token';
const companyId = '10000000-0000-4000-8000-000000000003';
const backendCompany = { id: companyId, name: 'Công ty mẫu', verificationStatus: 'UNVERIFIED', createdAt: '2026-11-24T00:00:00Z', taxCode: '0101234567', industry: { id: 12, name: 'Công nghệ' }, location: { id: 1, name: 'Hà Nội' } };
afterEach(() => vi.restoreAllMocks());

it('uploads one legal document then submits the company for verification', async () => {
  const calls: string[] = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
    const path = String(url); calls.push(`${init?.method ?? 'GET'} ${path}`);
    if (path.endsWith('/auth/me')) return Response.json({ success: true, data: { profile: { id: '10000000-0000-4000-8000-000000000001', email: 'recruiter@example.test', displayName: 'Recruiter', status: 'ACTIVE', roles: ['RECRUITER'] } } });
    expect(new Headers(init?.headers).get('Authorization')).toBe(`Bearer ${token}`);
    if (path.includes('/recruiter/company/documents?')) return Response.json({ data: { id: '10000000-0000-4000-8000-000000000004' } }, { status: 201 });
    if (path.endsWith('/recruiter/company/documents')) return Response.json({ data: [{ id: '10000000-0000-4000-8000-000000000004', fileName: 'license.pdf', fileSize: 8, mimeType: 'application/pdf', documentType: 'BUSINESS_REGISTRATION', status: 'PENDING', uploadedAt: '2026-11-24T00:00:00Z' }] });
    if (path.endsWith('/recruiter/company/verification')) return Response.json({ data: { ...backendCompany, verificationStatus: 'PENDING' } });
    if (path.endsWith('/recruiter/company')) return Response.json({ data: backendCompany });
    throw new Error(path);
  });
  const file = new File(['%PDF-123'], 'license.pdf', { type: 'application/pdf' });
  const form = new FormData(); form.set('files', file);
  const response = await handleRecruiterCompany(new Request('http://localhost/api/bff/recruiter/company/verification-documents', { method: 'POST', headers: { cookie: `access_token=${token}`, 'X-CSRF-Token': csrfTokenFor({ access: token }) }, body: form }), baseUrl);
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ verificationStatus: 'pending', verificationDocuments: [{ fileName: 'license.pdf', status: 'pending' }] });
  expect(calls.some(path => path.includes('POST http://company.test/api/v1/recruiter/company/verification'))).toBe(true);
});
