import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminActivity } from '@/server/bff/admin-users-store';
const querySchema = z.object({
  userId: z.uuid().optional(), role: z.enum(['admin', 'candidate', 'recruiter']).optional(), action: z.string().optional(), targetType: z.string().optional(), result: z.enum(['success', 'failure']).optional(),
  from: z.iso.datetime({ offset: true }).optional(), to: z.iso.datetime({ offset: true }).optional(),
  page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20),
}).refine(value => !value.from || !value.to || Date.parse(value.from) <= Date.parse(value.to));
// Called only after the common admin authorization guard. This endpoint is read-only.
export function handleAdminActivity(request: NextRequest) {
  if (request.method !== 'GET') return NextResponse.json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'METHOD_NOT_ALLOWED' } }, { status: 405 });
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: { code: 'VALIDATION_FAILED', message: 'VALIDATION_FAILED' } }, { status: 422 });
  const q = parsed.data;
  const items = request.headers.get('x-mock-scenario') === 'empty' ? [] : getAdminActivity().filter(row =>
    (!q.userId || row.actorId === q.userId) && (!q.role || row.actorRole === q.role) && (!q.action || row.action === q.action) && (!q.targetType || row.targetType === q.targetType) && (!q.result || row.result === q.result) &&
    (!q.from || Date.parse(row.occurredAt) >= Date.parse(q.from)) && (!q.to || Date.parse(row.occurredAt) <= Date.parse(q.to)))
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
  return NextResponse.json({ items: items.slice((q.page - 1) * q.pageSize, q.page * q.pageSize), meta: { page: q.page, pageSize: q.pageSize, totalItems: items.length, totalPages: Math.ceil(items.length / q.pageSize) } }, { headers: { 'Cache-Control': 'private, no-store' } });
}
