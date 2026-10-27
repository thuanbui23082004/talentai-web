import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getRecruiterApplicationStore } from '@/server/bff/recruiter-application-store';
import { getDeletedJobIds, getRecruiterMockStore, type MockSession } from '@/server/bff/recruiter-mock-store';
import { mockRecruiterAccount } from '@/mocks/fixtures/recruiter-account';
import { syntheticMatching } from '@/mocks/fixtures/analysis';
import { selectRecruiterApplications } from '@/server/bff/recruiter-application-query';
import { recruiterApplicationQuerySchema, recruiterApplicationSchema } from '@/lib/api/application-schemas';
import type { components } from '@/lib/api/generated/schema';

type Task = components['schemas']['AnalysisTask'];
type RecordTask = { task: Task; owner: string; companyId: string; jobId: string; jobVersion?: string; applicationIds: string[]; startedAt: number; forceFailure: boolean };
const shared = globalThis as typeof globalThis & { talentaiAnalysisTasks?: Map<string, RecordTask> };
export const getRecruiterAnalysisTasks = () => shared.talentaiAnalysisTasks ??= new Map<string, RecordTask>();
const problem = (status: number, code: string) => NextResponse.json({ error: { code, message: code } }, { status });
const response = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: { 'Cache-Control': 'private, no-store' } });
export function advanceRecruiterTask(record: RecordTask, now = Date.now()) {
  if (record.task.status === 'completed' || record.task.status === 'failed') return;
  const elapsed = now - record.startedAt;
  if (elapsed < 600) return;
  record.task.status = 'processing'; record.task.progress = elapsed < 1600 ? 25 : 70;
  if (elapsed < 3200) return;
  const job = getRecruiterMockStore().jobs.find(item => item.id === record.jobId && item.company.id === record.companyId);
  const failed = record.forceFailure || !job || getDeletedJobIds().has(record.jobId) || job.updatedAt !== record.jobVersion;
  if (failed || !job || job.description.trim().length < 30) {
    record.task.status = 'failed'; record.task.error = { code: !failed && job ? 'JD_INSUFFICIENT' : 'AI_ANALYSIS_FAILED', message: 'ANALYSIS_FAILED' }; record.task.completedAt = new Date(now).toISOString(); return;
  }
  const applications = getRecruiterApplicationStore(); let processed = 0; let unreadable = 0;
  for (const id of record.applicationIds) {
    const application = applications.find(item => item.id === id && item.jobId === job.id);
    if (!application?.cvId || application.cvAvailable === false) { unreadable++; continue; }
    const matching = syntheticMatching(application, job, randomUUID(), new Date(now).toISOString());
    application.matching = matching; application.matchScore = matching.score; processed++;
    if (record.task.type === 'matching') { record.task.result = matching; record.task.resultId = matching.id; }
  }
  if (record.task.type === 'matching' && !processed) {
    record.task.status = 'failed'; record.task.error = { code: 'CV_UNREADABLE', message: 'CV_UNREADABLE' }; record.task.completedAt = new Date(now).toISOString(); return;
  }
  if (record.task.type === 'screening') record.task.result = { jobId: job.id, processed, failed: unreadable, completedAt: new Date(now).toISOString() };
  record.task.status = 'completed'; record.task.progress = 100; record.task.completedAt = new Date(now).toISOString();
}
export async function handleRecruiterAnalysis(request: NextRequest, path: string, session: MockSession) {
  const tasks = getRecruiterAnalysisTasks();
  for (const record of tasks.values()) if (record.companyId === session.companyId) advanceRecruiterTask(record);
  const taskMatch = /^analysis-tasks\/([\w-]+)$/.exec(path);
  if (taskMatch && request.method === 'GET') {
    const record = tasks.get(taskMatch[1]);
    if (!record || record.owner !== (session.userId ?? mockRecruiterAccount.id) || record.companyId !== session.companyId) return problem(404, 'NOT_FOUND');
    return response(record.task);
  }
  const jobMatch = /^recruiter\/jobs\/([\w-]+)\/(screening|recommended-candidates|applications)$/.exec(path);
  const matching = /^recruiter\/applications\/([\w-]+)\/matching$/.exec(path);
  if (!jobMatch && !matching) return;
  const applications = getRecruiterApplicationStore();
  const application = matching ? applications.find(item => item.id === matching[1]) : undefined;
  const jobId = jobMatch?.[1] ?? application?.jobId;
  const job = getRecruiterMockStore().jobs.find(item => item.id === jobId && item.company.id === session.companyId && !getDeletedJobIds().has(item.id));
  if (!job) return problem(404, 'NOT_FOUND');
  if (matching && request.method === 'GET') return application?.matching ? response(application.matching) : problem(404, 'NOT_FOUND');
  if (jobMatch?.[2] === 'applications' && request.method === 'GET') {
    const params = request.nextUrl.searchParams;
    const parsed = recruiterApplicationQuerySchema.safeParse({ jobId: job.id, q: params.get('q') ?? undefined, sort: params.get('sort') ?? 'match_score_desc', page: params.has('page') ? Number(params.get('page')) : 1, pageSize: params.has('pageSize') ? Number(params.get('pageSize')) : 5, status: params.getAll('status'), skills: params.getAll('skills'), educationLevel: params.get('educationLevel') ?? undefined, minExperienceYears: params.has('minExperienceYears') ? Number(params.get('minExperienceYears')) : undefined });
    if (!parsed.success) return problem(422, 'VALIDATION_FAILED');
    const values = request.headers.get('x-mock-scenario') === 'empty' ? [] : applications;
    const selected = selectRecruiterApplications(values, parsed.data, new Set([job.id]));
    return response({ ...selected, items: selected.items.map(item => recruiterApplicationSchema.parse(item)) });
  }
  if (jobMatch?.[2] === 'recommended-candidates' && request.method === 'GET') {
    const limit = Number(request.nextUrl.searchParams.get('limit') ?? 10);
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) return problem(422, 'VALIDATION_FAILED');
    const values = applications.filter(item => item.jobId === job.id && item.matching && item.status !== 'withdrawn').sort((a, b) => b.matching!.score - a.matching!.score || a.id.localeCompare(b.id)).slice(0, limit);
    return response({ items: values.map(item => ({ application: recruiterApplicationSchema.parse(item), score: item.matching!.score, reasons: [item.matching!.explanation] })) });
  }
  if (request.method !== 'POST' || (!matching && jobMatch?.[2] !== 'screening')) return problem(405, 'BAD_REQUEST');
  const type = matching ? 'matching' : 'screening';
  const owner = session.userId ?? mockRecruiterAccount.id;
  const ids = matching ? [application!.id] : applications.filter(item => item.jobId === job.id && item.matchScore === undefined).map(item => item.id);
  const active = [...tasks.values()].find(record => record.owner === owner && record.companyId === session.companyId && record.jobId === job.id && record.task.type === type && (type !== 'matching' || record.applicationIds[0] === application!.id) && !['completed', 'failed'].includes(record.task.status));
  if (active) return response(active.task, 202);
  const task: Task = { taskId: randomUUID(), type, status: 'pending', progress: 0, createdAt: new Date().toISOString() };
  tasks.set(task.taskId, { task, owner, companyId: job.company.id, jobId: job.id, jobVersion: job.updatedAt, applicationIds: ids, startedAt: Date.now(), forceFailure: request.headers.get('x-mock-scenario') === 'analysis-failed' });
  return response(task, 202);
}
