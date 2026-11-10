import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminJobs, adminJobDetail, jobHistories } from '@/server/bff/admin-jobs-store';
import { getDeletedJobIds, getMockCompanies, type MockSession } from '@/server/bff/recruiter/mock-store';
import { getAdminActivity } from '@/server/bff/admin-users-store';
import { mockAdmin } from '@/mocks/fixtures/admin';
import { jobStatuses, jobReasonSchema, deleteJobReasonSchema, type JobAction } from '@/features/admin/schemas/jobs';
import { canModerateJob } from '@/features/admin/job-rules';
const problem = (status: number, code: string) => NextResponse.json({ error: { code, message: code } }, { status });
const response = (data: unknown) => NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
const querySchema = z.object({ q: z.string().optional(), status: z.array(z.enum(jobStatuses)), companyId: z.uuid().optional(), sort: z.enum(['newest', 'oldest', 'reports_desc']).default('newest'), page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20) });
export async function handleAdminJobs(request: NextRequest, path: string, session: MockSession) {
  const match = /^admin\/jobs(?:\/([\w-]+)(?:\/(approve|reject|hide|lock))?)?$/.exec(path);
  if (!match) return;
  const jobs = adminJobs(); const job = match[1] ? jobs.find(item => item.id === match[1]) : undefined;
  if (match[1] && (!z.uuid().safeParse(match[1]).success || !job)) return problem(404, 'NOT_FOUND');
  if (request.method === 'GET') {
    if (match[2]) return problem(405, 'METHOD_NOT_ALLOWED');
    if (job) return response(adminJobDetail(job.id));
    const parsed = querySchema.safeParse({ ...Object.fromEntries(request.nextUrl.searchParams), status: request.nextUrl.searchParams.getAll('status') });
    if (!parsed.success) return problem(422, 'VALIDATION_FAILED');
    const q = parsed.data, needle = q.q?.trim().toLocaleLowerCase('vi');
    const rows = request.headers.get('x-mock-scenario') === 'empty' ? [] : jobs.filter(item => (!q.status.length || q.status.includes(item.status)) && (!q.companyId || item.company.id === q.companyId) && (!needle || item.title.toLocaleLowerCase('vi').includes(needle) || item.company.name.toLocaleLowerCase('vi').includes(needle)));
    rows.sort((a, b) => q.sort === 'oldest' ? (a.createdAt ?? '').localeCompare(b.createdAt ?? '') : (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
    return response({ items: rows.slice((q.page - 1) * q.pageSize, q.page * q.pageSize).map(item => adminJobDetail(item.id)), meta: { page: q.page, pageSize: q.pageSize, totalItems: rows.length, totalPages: Math.ceil(rows.length / q.pageSize) } });
  }
  const deleting = request.method === 'DELETE' && !match[2];
  if (!job || (!deleting && (request.method !== 'POST' || !match[2]))) return problem(405, 'METHOD_NOT_ALLOWED');
  if (request.headers.get('X-CSRF-Token') !== session.csrf) return problem(403, 'CSRF_TOKEN_INVALID');
  const action = (deleting ? 'delete' : match[2]) as JobAction;
  const raw: unknown = deleting ? { reason: request.nextUrl.searchParams.get('reason') } : await request.json().catch(() => null);
  const parsed = deleting ? deleteJobReasonSchema.safeParse(raw) : action === 'approve' ? z.object({ note: jobReasonSchema.shape.reason }).transform(value => ({ reason: value.note })).safeParse(raw) : jobReasonSchema.safeParse(raw);
  if (!parsed.success) return problem(422, 'VALIDATION_FAILED');
  if (!canModerateJob(job.status, action)) return problem(action === 'approve' || action === 'reject' ? 409 : 422, action === 'approve' || action === 'reject' ? 'INVALID_STATUS_TRANSITION' : 'VALIDATION_FAILED');
  if (action === 'approve' && getMockCompanies().get(job.company.id)?.verificationStatus !== 'verified') return problem(422, 'VALIDATION_FAILED');
  const now = new Date().toISOString(), reason = parsed.data.reason;
  const history = jobHistories().get(job.id) ?? [];
  history.unshift({ action, reason, at: now, actorName: mockAdmin.fullName }); jobHistories().set(job.id, history);
  if (deleting) getDeletedJobIds().add(job.id);
  else {
    job.status = action === 'approve' ? 'open' : action === 'reject' ? 'rejected' : action === 'hide' ? 'hidden' : 'locked';
    job.updatedAt = now; job.moderation = { status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : job.moderation?.status ?? 'none', reason, reviewedAt: now };
  }
  getAdminActivity().unshift({ id: randomUUID(), actorId: session.userId ?? mockAdmin.id, actorName: mockAdmin.fullName, actorRole: 'admin', action: `job.${action}`, targetType: 'job', targetId: job.id, occurredAt: now, result: 'success', metadata: { reason } });
  return deleting ? new NextResponse(null, { status: 204 }) : response(adminJobDetail(job.id));
}
