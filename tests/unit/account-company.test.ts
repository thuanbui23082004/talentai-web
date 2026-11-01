import { beforeEach, describe, expect, it } from 'vitest';
import { scryptSync } from 'node:crypto';
import { NextRequest } from 'next/server';
import { accountSchema, accountInputSchema, passwordInputSchema } from '@/features/account/schemas/account';
import { companyInputSchema, companySchema, companyToInput } from '@/features/company/schemas/company';
import { mockRecruiterAccount, mockRecruiterPassword } from '@/mocks/fixtures/recruiter-account';
import { recruiterCompany } from '@/mocks/fixtures/recruiter-company';
import { mockJobs } from '@/mocks/fixtures/recruiter-jobs';
import { settingsPngBase64, settingsPdf } from '@/mocks/fixtures/settings-files';
import { getMockAccounts, getMockMedia } from '@/server/bff/account-company-handler';
import { createMockRecruiterSession, getMockCompanies, getRecruiterMockStore } from '@/server/bff/recruiter-mock-store';
import { handleMockRequest } from '@/server/bff/mock-adapter';
import { GET as getMedia } from '@/app/api/mock-media/[assetId]/route';

beforeEach(() => {
  const store = getRecruiterMockStore(); store.sessions.clear(); store.jobs = structuredClone(mockJobs);
  getMockCompanies().clear(); getMockCompanies().set(recruiterCompany.id, structuredClone(recruiterCompany));
  getMockAccounts().clear(); getMockAccounts().set(mockRecruiterAccount.id, { user: structuredClone(mockRecruiterAccount), salt: 'test-salt', hash: scryptSync(mockRecruiterPassword, 'test-salt', 32) });
  getMockMedia().clear();
});
function authorization() { const created = createMockRecruiterSession(); return { ...created, headers: { cookie: `access_token=${created.id}`, 'X-CSRF-Token': created.session.csrf } }; }
function request(auth: ReturnType<typeof authorization>, path: string, method = 'GET', body?: unknown) {
  return handleMockRequest(new NextRequest('http://localhost/api/bff/' + path, { method, headers: auth.headers, body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body) }), path);
}
function imageData() { const data = new FormData(); data.set('file', new File([Buffer.from(settingsPngBase64, 'base64')], 'avatar.png', { type: 'image/png' })); return data; }

describe('settings schemas', () => {
  it('validates account fields and actual password rules', () => {
    expect(accountInputSchema.safeParse({ fullName: 'A', phone: 'abc', address: '' }).success).toBe(false);
    expect(passwordInputSchema.safeParse({ currentPassword: 'old', newPassword: 'short', confirmPassword: 'short' }).success).toBe(false);
    expect(passwordInputSchema.safeParse({ currentPassword: 'old', newPassword: 'StrongPass1', confirmPassword: 'Different1' }).success).toBe(false);
  });
  it('retains the saved company fields when composing independent form submissions', () => {
    const company = companySchema.parse(recruiterCompany);
    const input = companyInputSchema.parse({ ...companyToInput(company), description: 'Giới thiệu mới' });
    expect(input.taxCode).toBe(company.taxCode);
    expect(input.industryIds).toEqual(company.industries?.map(item => item.id));
    expect(companyInputSchema.safeParse({ ...input, industryIds: [] }).success).toBe(false);
    expect(companyInputSchema.safeParse({ ...input, website: 'javascript:alert(1)' }).success).toBe(false);
  });
});
describe('settings API mock', () => {
  it('updates only contract account fields and rejects missing permissions/CSRF', async () => {
    const auth = authorization();
    const updated = accountSchema.parse(await (await request(auth, 'me', 'PATCH', { fullName: 'Minh An Mới', address: 'Đà Nẵng' })).json());
    expect(updated.fullName).toBe('Minh An Mới'); expect(updated.email).toBe(mockRecruiterAccount.email);
    expect((await request(auth, 'me', 'PATCH', { email: 'other@example.test' })).status).toBe(422);
    expect((await request({ ...auth, headers: { ...auth.headers, 'X-CSRF-Token': 'invalid' } }, 'me', 'PATCH', { fullName: 'Minh An' })).status).toBe(403);
    auth.session.role = 'candidate'; expect((await request(auth, 'recruiter/company')).status).toBe(403);
  });
  it('changes a hashed mock password, checks the current value, and revokes other sessions', async () => {
    const auth = authorization(); const other = authorization();
    const values = { currentPassword: 'WrongPassword1', newPassword: 'ChangedPass2026', confirmPassword: 'ChangedPass2026' };
    expect((await request(auth, 'auth/change-password', 'POST', values)).status).toBe(400);
    expect((await request(auth, 'auth/change-password', 'POST', { ...values, currentPassword: mockRecruiterPassword })).status).toBe(200);
    expect((await request(other, 'me')).status).toBe(401);
    expect((await request(auth, 'me')).status).toBe(200);
    expect(getMockAccounts().get(mockRecruiterAccount.id)).not.toHaveProperty('password');
  });
  it('uploads and deletes an avatar, protects media access and rejects spoofed images', async () => {
    const auth = authorization();
    const uploaded = accountSchema.parse(await (await request(auth, 'me/avatar', 'PUT', imageData())).json());
    expect(uploaded.avatarUrl).toMatch(/^\/api\/mock-media\//);
    const id = uploaded.avatarUrl!.split('/').at(-1)!;
    const allowed = await getMedia(new NextRequest('http://localhost' + uploaded.avatarUrl, { headers: auth.headers }), { params: Promise.resolve({ assetId: id }) });
    expect(allowed.status).toBe(200); expect(allowed.headers.get('Cache-Control')).toContain('no-store');
    expect((await getMedia(new NextRequest('http://localhost' + uploaded.avatarUrl), { params: Promise.resolve({ assetId: id }) })).status).toBe(404);
    const invalid = new FormData(); invalid.set('file', new File(['not an image'], 'x.png', { type: 'image/png' }));
    expect((await request(auth, 'me/avatar', 'PUT', invalid)).status).toBe(415);
    expect((await request(auth, 'me/avatar', 'DELETE')).status).toBe(204);
    expect(getMockMedia().has(id)).toBe(false);
    expect(accountSchema.parse(await (await request(auth, 'me')).json()).avatarUrl).toBeUndefined();
  });
  it('updates the shared company and jobs, supports the no-company/create flow', async () => {
    const auth = authorization();
    const input = { ...companyToInput(companySchema.parse(recruiterCompany)), name: 'Công ty Sao Mai Mới' };
    expect((await request(auth, 'recruiter/company', 'PUT', input)).status).toBe(200);
    expect(getRecruiterMockStore().jobs[0].company.name).toBe(input.name);
    expect((await request(auth, 'recruiter/company', 'POST', input)).status).toBe(409);
    auth.session.companyId = undefined;
    expect((await request(auth, 'recruiter/company')).status).toBe(404);
    const created = await request(auth, 'recruiter/company', 'POST', input);
    expect(created.status).toBe(201);
    expect(companySchema.parse(await created.json()).verificationStatus).toBe('unverified');
    expect((await request(auth, 'recruiter/company')).status).toBe(200);
  });
  it('persists logos and validates verification files before setting pending', async () => {
    const auth = authorization();
    const logo = companySchema.parse(await (await request(auth, 'recruiter/company/logo', 'PUT', imageData())).json());
    expect(getRecruiterMockStore().jobs[0].company.logoUrl).toBe(logo.logoUrl);
    expect((await request(auth, 'recruiter/company/logo', 'DELETE')).status).toBe(204);
    const files = new FormData(); files.append('files', new File([settingsPdf], 'license.pdf', { type: 'application/pdf' }));
    const pending = companySchema.parse(await (await request(auth, 'recruiter/company/verification-documents', 'POST', files)).json());
    expect(pending.verificationStatus).toBe('pending'); expect(pending.verificationDocuments).toHaveLength(1);
    expect(accountSchema.parse(await (await request(auth, 'me')).json()).companyVerificationStatus).toBe('pending');
    const invalid = new FormData(); invalid.append('files', new File(['script'], 'x.html', { type: 'text/html' }));
    expect((await request(auth, 'recruiter/company/verification-documents', 'POST', invalid)).status).toBe(422);
  });
});
