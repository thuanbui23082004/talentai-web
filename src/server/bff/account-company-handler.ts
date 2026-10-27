import { randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { accountPatchSchema, imageFileSchema, passwordInputSchema } from '@/features/account/schemas/account';
import { companyInputSchema, logoFileSchema, verificationFilesSchema } from '@/features/company/schemas/company';
import { mockRecruiterAccount, mockRecruiterPassword } from '@/mocks/fixtures/recruiter-account';
import { recruiterIndustries } from '@/mocks/fixtures/recruiter-catalog';
import { getMockCompanies, getRecruiterMockStore, type MockSession } from '@/server/bff/recruiter-mock-store';
import type { components } from '@/lib/api/generated/schema';

type User = components['schemas']['User'];
type AccountRecord = { user: User; salt: string; hash: Buffer };
type Media = { ownerId: string; bytes: Uint8Array; type: string };
const shared = globalThis as typeof globalThis & { talentaiAccounts?: Map<string, AccountRecord>; talentaiMedia?: Map<string, Media> };
export function getMockAccounts() {
  if (!shared.talentaiAccounts) {
    const salt = randomUUID();
    shared.talentaiAccounts = new Map([[mockRecruiterAccount.id, { user: structuredClone(mockRecruiterAccount), salt, hash: scryptSync(mockRecruiterPassword, salt, 32) }]]);
  }
  return shared.talentaiAccounts;
}
export function getMockMedia() { return shared.talentaiMedia ??= new Map<string, Media>(); }
const problem = (status: number, code: string) => NextResponse.json({ error: { code, message: code } }, { status });
const response = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: { 'Cache-Control': 'private, no-store' } });
function syncCompany(company: components['schemas']['Company']) {
  for (const job of getRecruiterMockStore().jobs) if (job.company.id === company.id) job.company = { ...job.company, name: company.name, logoUrl: company.logoUrl };
  for (const { user } of getMockAccounts().values()) if (user.companyId === company.id) user.companyVerificationStatus = company.verificationStatus;
}
function deleteMedia(url?: string) { if (url?.startsWith('/api/mock-media/')) getMockMedia().delete(url.split('/').at(-1) ?? ''); }
async function validSignature(file: File) {
  const bytes = Buffer.from(await file.slice(0, 512).arrayBuffer());
  if (file.type === 'image/png') return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (file.type === 'image/jpeg') return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (file.type === 'image/webp') return bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  if (file.type === 'application/pdf') return bytes.toString('ascii', 0, 5) === '%PDF-';
  if (file.type === 'image/svg+xml') return /<svg[\s>]/i.test(bytes.toString('utf8'));
  return false;
}
export async function handleAccountCompany(request: NextRequest, path: string, session: MockSession) {
  if (!['me', 'me/avatar', 'auth/change-password', 'recruiter/company', 'recruiter/company/logo', 'recruiter/company/verification-documents'].includes(path)) return;
  const id = session.userId ?? mockRecruiterAccount.id;
  const account = getMockAccounts().get(id);
  if (!account) return problem(401, 'UNAUTHENTICATED');
  if (account.user.status === 'locked') return problem(423, 'ACCOUNT_LOCKED');
  const companies = getMockCompanies();
  const company = session.companyId ? companies.get(session.companyId) : undefined;
  const ownedUser = { ...account.user, companyId: session.companyId, companyVerificationStatus: company?.verificationStatus };
  if (path === 'me' && request.method === 'GET') return response(ownedUser);
  if (path === 'me' && request.method === 'PATCH') {
    const parsed = accountPatchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return problem(422, 'VALIDATION_FAILED');
    Object.assign(account.user, parsed.data);
    return response({ ...ownedUser, ...parsed.data });
  }
  if (path === 'auth/change-password' && request.method === 'POST') {
    const parsed = passwordInputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return problem(422, 'VALIDATION_FAILED');
    if (!timingSafeEqual(account.hash, scryptSync(parsed.data.currentPassword, account.salt, 32))) return problem(400, 'CURRENT_PASSWORD_INCORRECT');
    account.salt = randomUUID(); account.hash = scryptSync(parsed.data.newPassword, account.salt, 32);
    const current = request.cookies.get('talentai_mock_session')?.value;
    for (const [key, other] of getRecruiterMockStore().sessions) if (key !== current && (other.userId ?? mockRecruiterAccount.id) === id) getRecruiterMockStore().sessions.delete(key);
    return response({ message: 'PASSWORD_CHANGED' });
  }
  if (path === 'recruiter/company') {
    if (request.method === 'GET') return company ? response(company) : problem(404, 'NOT_FOUND');
    if (request.method !== 'POST' && request.method !== 'PUT') return problem(405, 'BAD_REQUEST');
    if (request.method === 'POST' && company) return problem(409, 'CONFLICT');
    if (request.method === 'PUT' && !company) return problem(404, 'NOT_FOUND');
    const parsed = companyInputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success || !parsed.data.industryIds.every(industry => recruiterIndustries.some(item => item.id === industry))) return problem(422, 'VALIDATION_FAILED');
    const { industryIds, ...fields } = parsed.data;
    const now = new Date().toISOString();
    const updated: components['schemas']['Company'] = { ...(company ?? { id: randomUUID(), verificationStatus: 'unverified', createdAt: now }), ...fields, industries: recruiterIndustries.filter(item => industryIds.includes(item.id)).map(item => ({ id: item.id, name: item.name })), updatedAt: now };
    companies.set(updated.id, updated); session.companyId = updated.id; account.user.companyId = updated.id;
    syncCompany(updated);
    return response(updated, company ? 200 : 201);
  }
  if (path.startsWith('recruiter/company/') && !company) return problem(404, 'NOT_FOUND');
  if (request.method === 'DELETE' && (path === 'me/avatar' || path === 'recruiter/company/logo')) {
    if (path === 'me/avatar') { deleteMedia(account.user.avatarUrl); delete account.user.avatarUrl; }
    else if (company) { deleteMedia(company.logoUrl); delete company.logoUrl; syncCompany(company); }
    return new NextResponse(null, { status: 204 });
  }
  if (request.method === 'PUT' && (path === 'me/avatar' || path === 'recruiter/company/logo')) {
    const data = await request.formData().catch(() => null);
    const parsed = (path === 'me/avatar' ? imageFileSchema : logoFileSchema).safeParse(data?.get('file'));
    if (!parsed.success) return problem(parsed.error.issues.some(issue => issue.message === 'fileSize') ? 413 : 415, parsed.error.issues.some(issue => issue.message === 'fileSize') ? 'PAYLOAD_TOO_LARGE' : 'UNSUPPORTED_MEDIA_TYPE');
    if (!await validSignature(parsed.data)) return problem(415, 'UNSUPPORTED_MEDIA_TYPE');
    const mediaId = randomUUID();
    const url = `/api/mock-media/${mediaId}`;
    getMockMedia().set(mediaId, { ownerId: id, type: parsed.data.type, bytes: new Uint8Array(await parsed.data.arrayBuffer()) });
    if (path === 'me/avatar') { deleteMedia(account.user.avatarUrl); account.user.avatarUrl = url; return response({ ...ownedUser, avatarUrl: url }); }
    if (company) { deleteMedia(company.logoUrl); company.logoUrl = url; syncCompany(company); return response(company); }
  }
  if (path === 'recruiter/company/verification-documents' && request.method === 'POST' && company) {
    const data = await request.formData().catch(() => null);
    const parsed = verificationFilesSchema.safeParse(data?.getAll('files'));
    if (!parsed.success) return problem(422, 'VALIDATION_FAILED');
    for (const file of parsed.data) if (!await validSignature(file)) return problem(422, 'VALIDATION_FAILED');
    company.verificationDocuments = parsed.data.map((file, index) => ({ id: randomUUID(), fileName: `document-${index + 1}${file.type === 'application/pdf' ? '.pdf' : '.image'}`, mimeType: file.type, sizeBytes: file.size, uploadedAt: new Date().toISOString() }));
    company.verificationStatus = 'pending'; delete company.rejectionReason; delete company.verifiedAt; syncCompany(company);
    return response(company);
  }
  return problem(405, 'BAD_REQUEST');
}
