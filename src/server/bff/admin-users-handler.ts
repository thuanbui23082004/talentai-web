import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminUsers, getAdminActivity } from '@/server/bff/admin-users-store';
import { getMockAccounts } from '@/server/bff/recruiter/account-company-handler';
import { getRecruiterMockStore, type MockSession } from '@/server/bff/recruiter/mock-store';
import { mockAdmin } from '@/mocks/fixtures/admin';
import { mockRecruiterAccount } from '@/mocks/fixtures/recruiter-account';
import { reasonSchema } from '@/features/admin/schemas/users';
const problem = (status: number, code: string) => NextResponse.json({ error: { code, message: code } }, { status });
const response = (data: unknown) => NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
const querySchema = z.object({ q: z.string().optional(), role: z.enum(['candidate', 'recruiter', 'admin']).optional(), status: z.enum(['active', 'locked']).optional(), createdFrom: z.iso.date().optional(), createdTo: z.iso.date().optional(), sort: z.enum(['newest', 'oldest', 'name']).default('newest'), page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20), from: z.iso.date().optional(), to: z.iso.date().optional() }).refine(q => !q.createdFrom || !q.createdTo || q.createdFrom <= q.createdTo);
export async function handleAdminUsers(request: NextRequest, path: string, session: MockSession) {
  const match = /^admin\/users(?:\/([\w-]+)(?:\/(lock|unlock|activity))?)?$/.exec(path);
  if (!match) return;
  const users = getAdminUsers();
  const user = match[1] ? users.get(match[1]) : undefined;
  if (match[1] && (!z.uuid().safeParse(match[1]).success || !user)) return problem(404, 'NOT_FOUND');
  if (request.method === 'GET') {
    const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!parsed.success) return problem(422, 'VALIDATION_FAILED');
    const q = parsed.data;
    const empty = request.headers.get('x-mock-scenario') === 'empty';
    function page<T>(items: T[]) { const rows = empty ? [] : items; return response({ items: rows.slice((q.page - 1) * q.pageSize, q.page * q.pageSize), meta: { page: q.page, pageSize: q.pageSize, totalItems: rows.length, totalPages: Math.ceil(rows.length / q.pageSize) } }); }
    if (!match[1]) {
      const needle = q.q?.toLocaleLowerCase('vi');
      const rows = [...users.values()].filter(item => (!q.role || item.role === q.role) && (!q.status || item.status === q.status) && (!needle || item.fullName.toLocaleLowerCase('vi').includes(needle) || item.email.toLocaleLowerCase('vi').includes(needle)) && (!q.createdFrom || item.createdAt.slice(0, 10) >= q.createdFrom) && (!q.createdTo || item.createdAt.slice(0, 10) <= q.createdTo));
      rows.sort((a, b) => q.sort === 'name' ? a.fullName.localeCompare(b.fullName, 'vi') : q.sort === 'oldest' ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt));
      return page(rows);
    }
    if (match[2] === 'activity') return page(getAdminActivity().filter(log => (log.targetId === user?.id || log.actorId === user?.id) && (!q.from || log.occurredAt.slice(0, 10) >= q.from) && (!q.to || log.occurredAt.slice(0, 10) <= q.to)));
    if (!match[2]) return response(user);
    return problem(405, 'METHOD_NOT_ALLOWED');
  }
  if (request.method !== 'POST' || !user || !['lock', 'unlock'].includes(match[2])) return problem(405, 'METHOD_NOT_ALLOWED');
  if (request.headers.get('X-CSRF-Token') !== session.csrf) return problem(403, 'CSRF_TOKEN_INVALID');
  if (user.role === 'admin' || user.id === session.userId) return problem(403, 'FORBIDDEN');
  const raw: unknown = await request.json().catch(() => null);
  const parsed = match[2] === 'unlock' ? z.object({ note: reasonSchema.shape.reason }).safeParse(raw) : reasonSchema.safeParse(raw);
  if (!parsed.success) return problem(422, 'VALIDATION_FAILED');
  const locked = match[2] === 'lock';
  if (user.status === (locked ? 'locked' : 'active')) return problem(422, 'VALIDATION_FAILED');
  const reason = 'reason' in parsed.data ? parsed.data.reason : parsed.data.note;
  const now = new Date().toISOString();
  user.status = locked ? 'locked' : 'active';
  user.lockReason = locked ? reason : undefined; user.lockedUntil = undefined;
  if (locked) {
    user.violationCount = (user.violationCount ?? 0) + 1;
    (user.violations ??= []).unshift({ id: randomUUID(), type: 'account', reason, createdAt: now });
    for (const [id, active] of getRecruiterMockStore().sessions) if ((active.userId ?? (active.role === 'recruiter' ? mockRecruiterAccount.id : undefined)) === user.id) getRecruiterMockStore().sessions.delete(id);
  }
  const account = getMockAccounts().get(user.id);
  if (account) account.user.status = user.status;
  getAdminActivity().unshift({ id: randomUUID(), actorId: session.userId ?? mockAdmin.id, actorName: mockAdmin.fullName, actorRole: 'admin', action: locked ? 'user.lock' : 'user.unlock', targetId: user.id, targetType: 'user', occurredAt: now, result: 'success', metadata: { reason } });
  return response(user);
}
