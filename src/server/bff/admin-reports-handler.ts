import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { components } from '@/lib/api/generated/schema';
import { mockReports } from '@/mocks/fixtures/admin-content';
import { mockAdmin } from '@/mocks/fixtures/admin';
import { allowedReportActions, reportStatuses, reportCategories, targetTypes, resolutionSchema } from '@/features/admin/schemas/content';
import { getAdminActivity, getAdminUsers } from '@/server/bff/admin-users-store';
import { handleAdminUsers } from '@/server/bff/admin-users-handler';
import { handleAdminCompanies } from '@/server/bff/admin-companies-handler';
import { handleAdminJobs } from '@/server/bff/admin-jobs-handler';
import { adminJobs } from '@/server/bff/admin-jobs-store';
import { adminCompanies } from '@/server/bff/admin-companies-store';
import type { MockSession } from '@/server/bff/recruiter/mock-store';
const shared = globalThis as typeof globalThis & { talentaiReports?: Map<string, components['schemas']['AdminReportDetail']>; talentaiReportsBusy?: Set<string> };
export function reportStore() { return shared.talentaiReports ??= new Map(structuredClone(mockReports).map(row => [row.id, row])); }
export function reportOverview() { const rows = [...reportStore().values()]; return { open: rows.filter(row => row.status === 'open').length, inReview: rows.filter(row => row.status === 'in_review').length }; }
const problem = (status: number, code: string) => NextResponse.json({ error: { code, message: code } }, { status });
export async function handleAdminReports(request: NextRequest, path: string, session: MockSession) {
  const match = /^admin\/reports(?:\/([\w-]+)(?:\/(start-review|resolve|history))?)?$/.exec(path); if (!match) return;
  const store = reportStore(), report = match[1] ? store.get(match[1]) : undefined;
  if (match[1] && !report) return problem(404, 'NOT_FOUND');
  if (request.method === 'GET') {
    if (match[2] === 'history') return NextResponse.json({ items: report?.history ?? [] });
    if (match[2]) return problem(405, 'METHOD_NOT_ALLOWED');
    if (report) return NextResponse.json(report);
    const parsed = z.object({ status: z.enum(reportStatuses).optional(), category: z.enum(reportCategories).optional(), targetType: z.enum(targetTypes).optional(), sort: z.enum(['newest', 'oldest']).default('newest'), page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20) }).safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!parsed.success) return problem(422, 'VALIDATION_FAILED');
    const q = parsed.data; const rows = request.headers.get('x-mock-scenario') === 'empty' ? [] : [...store.values()].filter(row => (!q.status || q.status === row.status) && (!q.category || q.category === row.category) && (!q.targetType || q.targetType === row.targetType));
    rows.sort((a, b) => q.sort === 'oldest' ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt));
    return NextResponse.json({ items: rows.slice((q.page - 1) * q.pageSize, q.page * q.pageSize), meta: { page: q.page, pageSize: q.pageSize, totalItems: rows.length, totalPages: Math.ceil(rows.length / q.pageSize) } });
  }
  if (request.method !== 'POST' || !report || !['start-review', 'resolve'].includes(match[2])) return problem(405, 'METHOD_NOT_ALLOWED');
  if (request.headers.get('X-CSRF-Token') !== session.csrf) return problem(403, 'CSRF_TOKEN_INVALID');
  const busy = shared.talentaiReportsBusy ??= new Set<string>();
  if (busy.has(report.id)) return problem(422, 'VALIDATION_FAILED');
  busy.add(report.id);
  try {
    const raw: unknown = await request.json().catch(() => null); const fromStatus = report.status;
    let now = new Date().toISOString();
    let note: string;
    if (match[2] === 'start-review') {
      const parsed = z.object({ note: z.string().trim().max(2000).optional() }).safeParse(raw);
      if (!parsed.success || report.status !== 'open') return problem(422, 'VALIDATION_FAILED');
      note = parsed.data.note ?? ''; report.status = 'in_review';
    } else {
      const parsed = resolutionSchema.safeParse(raw);
      if (!parsed.success || report.status !== 'in_review' || !allowedReportActions(report.targetType).includes(parsed.data.action)) return problem(422, 'VALIDATION_FAILED');
      const input = parsed.data; note = input.note;
      if (input.action !== 'dismiss') {
        if (!report.targetId) return problem(422, 'VALIDATION_FAILED');
        // Delegate to the same moderation handlers as the management screens. Full notes stay in the report, never a URL.
        const reason = 'Xử lý vi phạm theo báo cáo người dùng';
        const target = report.targetType === 'job' ? adminJobs().find(row => row.id === report.targetId) : report.targetType === 'user' ? getAdminUsers().get(report.targetId) : adminCompanies().get(report.targetId);
        if (!target) return problem(404, 'NOT_FOUND');
        let result: NextResponse | undefined;
        if (input.action === 'warn_user') {
          const user = getAdminUsers().get(report.targetId);
          if (!user || user.role === 'admin' || user.id === session.userId) return problem(403, 'FORBIDDEN');
          getAdminActivity().unshift({ id: randomUUID(), actorId: session.userId ?? mockAdmin.id, actorName: mockAdmin.fullName, actorRole: 'admin', action: 'user.warn', targetType: 'user', targetId: user.id, occurredAt: now, result: 'success', metadata: { reportId: report.id, reason: note } });
        } else {
          const action = input.action === 'hide_content' ? 'hide' : input.action === 'delete_content' ? 'delete' : report.targetType === 'company' ? 'suspend' : 'lock';
          const targetPath = `admin/${report.targetType === 'company' ? 'companies' : report.targetType === 'job' ? 'jobs' : 'users'}/${report.targetId}${action === 'delete' ? '' : `/${action}`}`;
          const url = new URL(`/api/bff/${targetPath}`, request.url); if (action === 'delete') url.searchParams.set('reason', reason);
          const forwarded = new NextRequest(url, { method: action === 'delete' ? 'DELETE' : 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrf }, ...(action === 'delete' ? {} : { body: JSON.stringify({ reason }) }) });
          result = report.targetType === 'job' ? await handleAdminJobs(forwarded, targetPath, session) : report.targetType === 'company' ? await handleAdminCompanies(forwarded, targetPath, session) : await handleAdminUsers(forwarded, targetPath, session);
          if (!result?.ok) return result ?? problem(422, 'VALIDATION_FAILED');
          const audit = getAdminActivity()[0]; if (audit?.targetId === report.targetId) audit.metadata = { ...audit.metadata, reportId: report.id };
        }
      }
      now = new Date().toISOString();
      report.status = input.action === 'dismiss' ? 'dismissed' : 'resolved';
      report.responseToReporter = input.responseToReporter;
      report.resolution = { action: input.action, note, resolvedBy: session.userId ?? mockAdmin.id, resolvedAt: now };
    }
    report.updatedAt = now;
    (report.history ??= []).unshift({ action: match[2] === 'start-review' ? 'start_review' : report.resolution?.action ?? 'resolve', fromStatus, toStatus: report.status, note, actorName: mockAdmin.fullName, at: now });
    getAdminActivity().unshift({ id: randomUUID(), actorId: session.userId ?? mockAdmin.id, actorName: mockAdmin.fullName, actorRole: 'admin', action: `report.${match[2]}`, targetType: 'report', targetId: report.id, occurredAt: now, result: 'success', metadata: { reason: note, status: report.status } });
    return NextResponse.json(report);
  } finally { busy.delete(report.id); }
}
