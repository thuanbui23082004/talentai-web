import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { components } from '@/lib/api/generated/schema';
import { mockSystemLogs, mockAnomalies } from '@/mocks/fixtures/admin-monitoring';
import { logLevels, anomalyTypes, anomalyStatuses, severities, anomalyUpdateSchema } from '@/features/admin/schemas/monitoring';
import { getAdminActivity } from '@/server/bff/admin-users-store';
import { mockAdmin } from '@/mocks/fixtures/admin';
import type { MockSession } from '@/server/bff/recruiter/mock-store';
const shared = globalThis as typeof globalThis & { talentaiAnomalies?: Map<string, components['schemas']['Anomaly']> };
export function anomalyStore() { return shared.talentaiAnomalies ??= new Map(structuredClone(mockAnomalies).map(row => [row.id, row])); }
const problem = (status: number, code: string) => NextResponse.json({ error: { code, message: code } }, { status });
const pageSchema = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20) });
// Called after the shared admin authorization guard.
export async function handleAdminMonitoring(request: NextRequest, path: string, session: MockSession) {
  const match = /^admin\/(system-logs|anomalies)(?:\/([\w-]+))?$/.exec(path); if (!match) return;
  const raw = Object.fromEntries(request.nextUrl.searchParams);
  if (request.method === 'GET' && !match[2]) {
    const parsed = pageSchema.safeParse(raw); if (!parsed.success) return problem(422, 'VALIDATION_FAILED');
    const { page, pageSize } = parsed.data;
    function response<T>(rows: T[]) { const items = request.headers.get('x-mock-scenario') === 'empty' ? [] : rows; return NextResponse.json({ items: items.slice((page - 1) * pageSize, page * pageSize), meta: { page, pageSize, totalItems: items.length, totalPages: Math.ceil(items.length / pageSize) } }, { headers: { 'Cache-Control': 'private, no-store' } }); }
    if (match[1] === 'system-logs') {
      const query = z.object({ level: z.enum(logLevels).optional(), source: z.string().optional(), requestId: z.string().optional(), from: z.iso.datetime({ offset: true }).optional(), to: z.iso.datetime({ offset: true }).optional() }).refine(value => !value.from || !value.to || Date.parse(value.from) <= Date.parse(value.to)).safeParse(raw);
      if (!query.success) return problem(422, 'VALIDATION_FAILED'); const q = query.data;
      return response(mockSystemLogs.filter(row => (!q.level || row.level === q.level) && (!q.source || row.source === q.source) && (!q.requestId || row.requestId === q.requestId) && (!q.from || Date.parse(row.occurredAt) >= Date.parse(q.from)) && (!q.to || Date.parse(row.occurredAt) <= Date.parse(q.to))).sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt)));
    }
    const query = z.object({ status: z.enum(anomalyStatuses).optional(), severity: z.enum(severities).optional(), type: z.enum(anomalyTypes).optional() }).safeParse(raw);
    if (!query.success) return problem(422, 'VALIDATION_FAILED'); const q = query.data;
    return response([...anomalyStore().values()].filter(row => (!q.status || row.status === q.status) && (!q.severity || row.severity === q.severity) && (!q.type || row.type === q.type)).sort((a, b) => Date.parse(b.detectedAt) - Date.parse(a.detectedAt)));
  }
  if (request.method !== 'PATCH' || match[1] !== 'anomalies' || !match[2]) return problem(405, 'METHOD_NOT_ALLOWED');
  if (request.headers.get('X-CSRF-Token') !== session.csrf) return problem(403, 'CSRF_TOKEN_INVALID');
  const row = anomalyStore().get(match[2]); if (!row) return problem(404, 'NOT_FOUND');
  const input = anomalyUpdateSchema.safeParse(await request.json().catch(() => null)); if (!input.success || row.status !== 'open') return problem(422, 'VALIDATION_FAILED');
  row.status = input.data.status; row.reviewNote = input.data.note;
  getAdminActivity().unshift({ id: randomUUID(), actorId: session.userId ?? mockAdmin.id, actorName: mockAdmin.fullName, actorRole: 'admin', action: row.status === 'reviewed' ? 'anomaly.review' : 'anomaly.dismiss', targetType: 'anomaly', targetId: row.id, occurredAt: new Date().toISOString(), result: 'success', metadata: { reason: input.data.note } });
  return NextResponse.json(row, { headers: { 'Cache-Control': 'private, no-store' } });
}
