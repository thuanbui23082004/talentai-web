import { NextRequest, NextResponse } from 'next/server';
import { getRecruiterApplicationStore } from '@/server/bff/recruiter-application-store';
import { getRecruiterMockStore } from '@/server/bff/recruiter-mock-store';
import { interviewQuerySchema, interviewUpdateSchema, cancelInterviewSchema } from '@/features/interviews/schemas';
import { interviewInputSchema } from '@/lib/api/candidate-detail-schemas';
import { vietnamDay } from '@/features/interviews/calendar';
const problem = (status: number, code: string) => NextResponse.json({ error: { code, message: code } }, { status });
const response = (data: unknown) => NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
export async function handleInterviewManagement(request: NextRequest, path: string, companyId?: string) {
  const match = /^recruiter\/interviews\/([\w-]+)(?:\/(send-invitation|cancel))?$/.exec(path);
  if (!match && !(path === 'recruiter/interviews' && request.method === 'GET')) return;
  const store = getRecruiterApplicationStore();
  const owned = store.filter(app => getRecruiterMockStore().jobs.some(job => job.id === app.jobId && job.company.id === companyId));
  const all = owned.flatMap(app => (app.interviews ?? []).map(interview => ({ ...interview, candidate: app.candidate, jobTitle: app.jobTitle, jobId: app.jobId })));
  if (!match) {
    const params = request.nextUrl.searchParams;
    const parsed = interviewQuerySchema.safeParse(Object.fromEntries([...params].map(([name, value]) => [name, ['page', 'pageSize'].includes(name) ? Number(value) : value])));
    if (!parsed.success) return problem(422, 'VALIDATION_FAILED');
    const q = parsed.data;
    const items = (request.headers.get('x-mock-scenario') === 'empty' ? [] : all).filter(item => (!q.jobId || item.jobId === q.jobId) && (!q.applicationId || item.applicationId === q.applicationId) && (!q.status || item.status === q.status) && (!q.invitationStatus || item.invitationStatus === q.invitationStatus) && (!q.from || vietnamDay(item.startTime) >= q.from) && (!q.to || vietnamDay(item.startTime) <= q.to)).sort((a, b) => a.startTime.localeCompare(b.startTime) || a.id.localeCompare(b.id));
    return response({ items: items.slice((q.page - 1) * q.pageSize, q.page * q.pageSize), meta: { page: q.page, pageSize: q.pageSize, totalItems: items.length, totalPages: Math.ceil(items.length / q.pageSize) } });
  }
  const app = owned.find(app => app.interviews?.some(item => item.id === match[1]));
  const interview = app?.interviews?.find(item => item.id === match[1]);
  if (!interview || !app) return problem(404, 'NOT_FOUND');
  const enriched = () => ({ ...interview, candidate: app.candidate, jobTitle: app.jobTitle, jobId: app.jobId });
  if (!match[2] && request.method === 'GET') return response(enriched());
  if (request.method !== (match[2] ? 'POST' : 'PATCH')) return problem(405, 'BAD_REQUEST');
  if (interview.status !== 'scheduled') return problem(match[2] === 'send-invitation' ? 403 : 422, 'INVALID_STATUS_TRANSITION');
  if (match[2] === 'send-invitation') { interview.invitationStatus = 'pending'; interview.updatedAt = new Date().toISOString(); return response(enriched()); }
  let body: unknown;
  try { body = await request.json(); } catch { return problem(400, 'BAD_REQUEST'); }
  if (match[2] === 'cancel') {
    const parsed = cancelInterviewSchema.safeParse(body);
    if (!parsed.success) return problem(422, 'VALIDATION_FAILED');
    interview.status = 'cancelled'; interview.cancelReason = parsed.data.reason;
  } else {
    const parsed = interviewUpdateSchema.safeParse(body);
    if (!parsed.success) return problem(422, 'VALIDATION_FAILED');
    const next = { ...interview, ...parsed.data };
    const valid = interviewInputSchema.safeParse({ applicationId: next.applicationId, round: next.round, startTime: next.startTime, endTime: next.endTime, mode: next.mode, location: next.location, meetingUrl: next.meetingUrl, interviewers: next.interviewers, message: next.message });
    if (!valid.success) return problem(422, 'VALIDATION_FAILED');
    if (parsed.data.round && !getRecruiterMockStore().jobs.find(job => job.id === app.jobId)?.hiringRounds?.includes(parsed.data.round)) return problem(422, 'VALIDATION_FAILED');
    if (all.some(item => item.id !== interview.id && item.status === 'scheduled' && item.startTime < next.endTime && item.endTime > next.startTime && (item.applicationId === app.id || item.interviewers?.some(person => next.interviewers?.includes(person))))) return problem(409, 'INTERVIEW_TIME_CONFLICT');
    const changed = (['startTime', 'endTime', 'mode', 'location', 'meetingUrl'] as const).some(field => next[field] !== interview[field]);
    Object.assign(interview, parsed.data);
    if (next.mode === 'online') interview.location = undefined; else interview.meetingUrl = undefined;
    if (changed) interview.invitationStatus = 'pending';
  }
  interview.updatedAt = new Date().toISOString();
  return response(enriched());
}
