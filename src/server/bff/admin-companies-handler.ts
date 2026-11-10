import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminCompanies, adminCompanyDetail, companyHistories, previousCompanyStatuses } from '@/server/bff/admin-companies-store';
import { getVerificationFiles } from '@/server/bff/company-verification-store';
import { getRecruiterMockStore, type MockSession } from '@/server/bff/recruiter/mock-store';
import { getMockAccounts } from '@/server/bff/recruiter/account-company-handler';
import { getAdminActivity } from '@/server/bff/admin-users-store';
import { mockAdmin } from '@/mocks/fixtures/admin';
import { companyStatuses, companyActions, companyReasonSchema, type CompanyAction } from '@/features/admin/schemas/companies';
import { canModerateCompany } from '@/features/admin/company-rules';
const problem = (status: number, code: string) => NextResponse.json({ error: { code, message: code } }, { status });
const response = (data: unknown) => NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
const listSchema = z.object({ q: z.string().optional(), verificationStatus: z.enum(companyStatuses).optional(), page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20) });
export async function handleAdminCompanies(request: NextRequest, path: string, session: MockSession) {
  const match = /^admin\/companies(?:\/([\w-]+)(?:\/(verify|reject|suspend|restore|documents\/([\w-]+)))?)?$/.exec(path);
  if (!match) return;
  const companies = adminCompanies(); const company = match[1] ? companies.get(match[1]) : undefined;
  if (match[1] && (!z.uuid().safeParse(match[1]).success || !company)) return problem(404, 'NOT_FOUND');
  if (request.method === 'GET') {
    if (match[3] && company) {
      const file = getVerificationFiles().get(match[3]);
      if (!company.verificationDocuments?.some(document => document.id === match[3]) || !file || file.companyId !== company.id) return problem(404, 'NOT_FOUND');
      const extension = file.type === 'application/pdf' ? 'pdf' : file.type === 'image/png' ? 'png' : file.type === 'image/jpeg' ? 'jpg' : 'webp';
      return new NextResponse(new Uint8Array(file.bytes), { headers: { 'Content-Type': file.type, 'Content-Disposition': `attachment; filename="company-verification.${extension}"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
    }
    if (match[2]) return problem(405, 'METHOD_NOT_ALLOWED');
    if (company) return response(adminCompanyDetail(company.id));
    const parsed = listSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!parsed.success) return problem(422, 'VALIDATION_FAILED');
    const { q, verificationStatus, page, pageSize } = parsed.data;
    const needle = q?.trim().toLocaleLowerCase('vi');
    const items = request.headers.get('x-mock-scenario') === 'empty' ? [] : [...companies.values()].filter(c => (!verificationStatus || c.verificationStatus === verificationStatus) && (!needle || c.name.toLocaleLowerCase('vi').includes(needle) || c.taxCode?.includes(needle))).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return response({ items: items.slice((page - 1) * pageSize, page * pageSize).map(c => adminCompanyDetail(c.id)), meta: { page, pageSize, totalItems: items.length, totalPages: Math.ceil(items.length / pageSize) } });
  }
  if (request.method !== 'POST' || !company || !companyActions.includes(match[2] as CompanyAction)) return problem(405, 'METHOD_NOT_ALLOWED');
  if (request.headers.get('X-CSRF-Token') !== session.csrf) return problem(403, 'CSRF_TOKEN_INVALID');
  const action = match[2] as CompanyAction;
  const raw: unknown = await request.json().catch(() => null);
  const parsed = (action === 'verify' || action === 'restore' ? z.object({ note: companyReasonSchema.shape.reason }) : z.object({ reason: companyReasonSchema.shape.reason })).safeParse(raw);
  if (!parsed.success || !canModerateCompany(company.verificationStatus, action)) return problem(422, 'VALIDATION_FAILED');
  if (action === 'verify' && !company.verificationDocuments?.length) return problem(422, 'VALIDATION_FAILED');
  const reason = 'reason' in parsed.data ? parsed.data.reason : parsed.data.note;
  const now = new Date().toISOString();
  if (action === 'suspend') {
    previousCompanyStatuses().set(company.id, company.verificationStatus);
    company.verificationStatus = 'suspended';
    for (const job of getRecruiterMockStore().jobs) if (job.company.id === company.id && job.status === 'open') { job.status = 'hidden'; job.updatedAt = now; }
  } else if (action === 'restore') {
    company.verificationStatus = previousCompanyStatuses().get(company.id) ?? 'unverified'; previousCompanyStatuses().delete(company.id);
  } else if (action === 'verify') {
    company.verificationStatus = 'verified'; company.verifiedAt = now; delete company.rejectionReason;
  } else {
    company.verificationStatus = 'rejected'; company.rejectionReason = reason; delete company.verifiedAt;
  }
  company.updatedAt = now;
  for (const { user } of getMockAccounts().values()) if (user.companyId === company.id) user.companyVerificationStatus = company.verificationStatus;
  const history = companyHistories().get(company.id) ?? [];
  history.unshift({ action, at: now, reason, actorName: mockAdmin.fullName }); companyHistories().set(company.id, history);
  getAdminActivity().unshift({ id: randomUUID(), actorId: session.userId ?? mockAdmin.id, actorName: mockAdmin.fullName, actorRole: 'admin', action: `company.${action}`, targetType: 'company', targetId: company.id, occurredAt: now, result: 'success', metadata: { reason } });
  return response(adminCompanyDetail(company.id));
}
