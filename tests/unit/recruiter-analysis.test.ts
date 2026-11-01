import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { analysisTaskSchema, matchingResultSchema, recommendedCandidatesSchema } from '@/lib/api/analysis-schemas';
import { recruiterApplicationPageSchema } from '@/lib/api/application-schemas';
import { analysisPhase, isAnalysisFinished } from '@/features/cv-analysis/progress';
import { getRecruiterAnalysisTasks, advanceRecruiterTask } from '@/server/bff/recruiter-analysis-handler';
import { createMockRecruiterSession, getRecruiterMockStore, getDeletedJobIds } from '@/server/bff/recruiter-mock-store';
import { getRecruiterApplicationStore } from '@/server/bff/recruiter-application-store';
import { mockJobs } from '@/mocks/fixtures/recruiter-jobs';
import { mockCandidateDetails } from '@/mocks/fixtures/candidate-details';
import { handleMockRequest } from '@/server/bff/mock-adapter';

beforeEach(() => {
  getRecruiterMockStore().jobs = structuredClone(mockJobs); getRecruiterMockStore().sessions.clear(); getDeletedJobIds().clear(); getRecruiterAnalysisTasks().clear();
  getRecruiterApplicationStore().splice(0, getRecruiterApplicationStore().length, ...structuredClone(mockCandidateDetails));
});
function auth() { const created = createMockRecruiterSession(); return { ...created, headers: { cookie: `access_token=${created.id}`, 'X-CSRF-Token': created.session.csrf } }; }
function request(session: ReturnType<typeof auth>, path: string, method = 'GET', scenario?: string) { return handleMockRequest(new NextRequest('http://localhost/api/bff/' + path, { method, headers: { ...session.headers, ...(scenario ? { 'x-mock-scenario': scenario } : {}) } }), path.split('?')[0]); }
const applicationId = mockCandidateDetails[0].id;
const jobId = mockCandidateDetails[0].jobId;
const matchingPath = `recruiter/applications/${applicationId}/matching`;
async function start(session: ReturnType<typeof auth>, path = matchingPath, scenario?: string) { const response = await request(session, path, 'POST', scenario); expect(response.status).toBe(202); return analysisTaskSchema.parse(await response.json()); }

describe('analysis contract and phases', () => {
  it('normalizes contractual pending/processing into the five UI phases', () => {
    expect(analysisPhase({ status: 'pending', progress: 0 })).toBe('queued');
    expect(analysisPhase({ status: 'processing', progress: 25 })).toBe('parsing');
    expect(analysisPhase({ status: 'processing', progress: 70 })).toBe('analyzing');
    expect(analysisPhase({ status: 'completed', progress: 100 })).toBe('completed');
    expect(analysisPhase({ status: 'failed' })).toBe('failed');
    expect(isAnalysisFinished({ status: 'completed' })).toBe(true);
    expect(isAnalysisFinished({ status: 'failed' })).toBe(true);
    expect(isAnalysisFinished({ status: 'processing' })).toBe(false);
  });
  it('rejects non-integer/out-of-range matching scores and mismatched result types', () => {
    const result = mockCandidateDetails[0].matching!;
    expect(matchingResultSchema.safeParse({ ...result, score: 78.5 }).success).toBe(false);
    expect(matchingResultSchema.safeParse({ ...result, score: 101 }).success).toBe(false);
    expect(analysisTaskSchema.safeParse({ taskId: result.id, type: 'screening', status: 'completed', createdAt: result.createdAt, result }).success).toBe(false);
  });
});
describe('recruiter analysis API mock', () => {
  it('progresses asynchronously, updates skills and keeps the human recruitment decision', async () => {
    const session = auth(); const application = getRecruiterApplicationStore()[0]; const oldStatus = application.status;
    const task = await start(session); const record = getRecruiterAnalysisTasks().get(task.taskId)!;
    expect(task.status).toBe('pending');
    advanceRecruiterTask(record, record.startedAt + 700); expect(record.task.status).toBe('processing'); expect(record.task.progress).toBe(25);
    advanceRecruiterTask(record, record.startedAt + 1800); expect(record.task.progress).toBe(70);
    advanceRecruiterTask(record, record.startedAt + 3300);
    const completed = analysisTaskSchema.parse(record.task);
    expect(completed.status).toBe('completed');
    const matching = matchingResultSchema.parse(await (await request(session, matchingPath)).json());
    expect(matching.matchedSkills?.map(skill => skill.name)).toContain('React'); expect(matching.missingSkills?.map(skill => skill.name)).toContain('SQL');
    expect(matching.explanation).toBeTruthy(); expect(application.status).toBe(oldStatus); expect(application.matchScore).toBe(matching.score);
  });
  it('deduplicates active runs and processes only unscored applications in a batch', async () => {
    const session = auth(); const application = getRecruiterApplicationStore()[0]; delete application.matchScore; delete application.matching;
    const untouched = getRecruiterApplicationStore().find(item => item.jobId === jobId && item.id !== applicationId && item.matchScore !== undefined);
    const old = untouched?.matching;
    const task = await start(session, `recruiter/jobs/${jobId}/screening`);
    expect((await start(session, `recruiter/jobs/${jobId}/screening`)).taskId).toBe(task.taskId);
    const record = getRecruiterAnalysisTasks().get(task.taskId)!; advanceRecruiterTask(record, record.startedAt + 3300);
    const result = analysisTaskSchema.parse(record.task); expect(result.status).toBe('completed');
    expect(application.matching).toBeDefined(); if (untouched) expect(untouched.matching).toEqual(old);
    const ranked = recruiterApplicationPageSchema.parse(await (await request(session, `recruiter/jobs/${jobId}/applications?sort=match_score_desc`)).json());
    expect(ranked.items.every(item => item.jobId === jobId)).toBe(true);
    const scores = ranked.items.map(item => item.matchScore ?? -1); expect(scores).toEqual([...scores].sort((a, b) => b - a));
    const recommended = recommendedCandidatesSchema.parse(await (await request(session, `recruiter/jobs/${jobId}/recommended-candidates?limit=10`)).json());
    expect(recommended.items.every(item => !!item.reasons?.length)).toBe(true);
  });
  it('returns mapped failure codes, allows retry, and never rejects an applicant automatically', async () => {
    const session = auth(); const statuses = getRecruiterApplicationStore().map(item => item.status);
    const task = await start(session, matchingPath, 'analysis-failed'); const record = getRecruiterAnalysisTasks().get(task.taskId)!;
    advanceRecruiterTask(record, record.startedAt + 3300); expect(record.task.status).toBe('failed'); expect(record.task.error?.code).toBe('AI_ANALYSIS_FAILED');
    expect((await start(session)).taskId).not.toBe(task.taskId);
    expect(getRecruiterApplicationStore().map(item => item.status)).toEqual(statuses);
  });
  it('reports unreadable CVs and incomplete JD without erasing existing results', async () => {
    const session = auth(); const previous = getRecruiterApplicationStore()[0].matching;
    getRecruiterApplicationStore()[0].cvAvailable = false;
    const task = await start(session); const record = getRecruiterAnalysisTasks().get(task.taskId)!; advanceRecruiterTask(record, record.startedAt + 3300);
    expect(record.task.error?.code).toBe('CV_UNREADABLE'); expect(getRecruiterApplicationStore()[0].matching).toEqual(previous);
    getRecruiterMockStore().jobs[0].description = 'JD';
    const retry = await start(session); const next = getRecruiterAnalysisTasks().get(retry.taskId)!; advanceRecruiterTask(next, next.startedAt + 3300);
    expect(next.task.error?.code).toBe('JD_INSUFFICIENT');
  });
  it('enforces company ownership, task creator access, deleted jobs, role and CSRF', async () => {
    const session = auth(); const task = await start(session);
    const other = auth(); other.session.userId = '00000000-0000-4000-8000-999999999999';
    expect((await request(other, `analysis-tasks/${task.taskId}`)).status).toBe(404);
    other.session.companyId = '00000000-0000-4000-8000-999999999998';
    expect((await request(other, matchingPath)).status).toBe(404);
    expect((await request(other, `recruiter/jobs/${jobId}/recommended-candidates`)).status).toBe(404);
    expect((await request({ ...session, headers: { ...session.headers, 'X-CSRF-Token': 'wrong' } }, matchingPath, 'POST')).status).toBe(403);
    other.session.role = 'candidate'; expect((await request(other, `analysis-tasks/${task.taskId}`)).status).toBe(403);
    getDeletedJobIds().add(jobId); expect((await request(session, `recruiter/jobs/${jobId}/screening`, 'POST')).status).toBe(404);
  });
});
