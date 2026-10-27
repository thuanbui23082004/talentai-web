import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { createJobSchema, jobToFormValues, toJobInput, toUpdatedJobInput } from '@/features/jobs/schemas/create-job';
import { canChangeJobStatus } from '@/features/jobs/job-status';
import { recruiterJobSchema } from '@/lib/api/job-schemas';
import { mockEditableJob } from '@/mocks/fixtures/editable-job';
import { recruiterCompany } from '@/mocks/fixtures/recruiter-company';
import { mockCandidateDetails } from '@/mocks/fixtures/candidate-details';
import { candidateDetailSchema } from '@/lib/api/candidate-detail-schemas';
import { getRecruiterApplicationStore } from '@/server/bff/recruiter-application-store';
import { getDeletedJobIds, getMockCompanies, getRecruiterMockStore, createMockRecruiterSession } from '@/server/bff/recruiter-mock-store';
import { handleMockRequest } from '@/server/bff/mock-adapter';

beforeEach(() => {
  getRecruiterMockStore().jobs = [structuredClone(mockEditableJob)]; getRecruiterMockStore().sessions.clear(); getDeletedJobIds().clear();
  getMockCompanies().clear(); getMockCompanies().set(recruiterCompany.id, structuredClone(recruiterCompany));
  getRecruiterApplicationStore().splice(0, getRecruiterApplicationStore().length, ...structuredClone(mockCandidateDetails));
});
function auth() { const created = createMockRecruiterSession(); return { ...created, headers: { cookie: `talentai_mock_session=${created.id}`, 'X-CSRF-Token': created.session.csrf } }; }
function request(session: ReturnType<typeof auth>, path: string, method = 'GET', body?: unknown) { return handleMockRequest(new NextRequest('http://localhost/api/bff/' + path, { method, headers: session.headers, body: body === undefined ? undefined : JSON.stringify(body) }), path); }
const path = `recruiter/jobs/${mockEditableJob.id}`;

describe('edit form conversion', () => {
  it('validates round names, saves their order and supports clearing configured rounds', () => {
    const values = jobToFormValues(mockEditableJob);
    const changed = { ...values, hiringRounds: [{ name: 'Sơ tuyển' }, { name: 'Chuyên môn' }] };
    expect(toJobInput(changed).hiringRounds).toEqual(['Sơ tuyển', 'Chuyên môn']);
    expect(toUpdatedJobInput(changed, mockEditableJob).hiringRounds).toEqual(['Sơ tuyển', 'Chuyên môn']);
    expect(toUpdatedJobInput({ ...values, hiringRounds: [] }, mockEditableJob).hiringRounds).toEqual([]);
    expect(createJobSchema.safeParse({ ...values, hiringRounds: [{ name: ' ' }] }).success).toBe(false);
    expect(createJobSchema.safeParse({ ...values, hiringRounds: [{ name: 'Sơ tuyển' }, { name: ' sơ tuyển ' }] }).success).toBe(false);
  });
  it('loads all editable fields and preserves metadata outside the form', () => {
    const job = recruiterJobSchema.parse(mockEditableJob);
    const values = jobToFormValues(job);
    expect(createJobSchema.safeParse(values).success).toBe(true);
    expect(values.salaryMin).toBe('45000');
    const input = toUpdatedJobInput({ ...values, title: 'Tên tin được chỉnh sửa' }, job);
    expect(input).toMatchObject({ positionId: job.position?.id, maxExperienceYears: 8, hiringRounds: job.hiringRounds, educationLevel: 'bachelor', salary: job.salary, location: job.location, skills: job.requiredSkills });
    const commaSkill = { ...job, requiredSkills: [{ name: 'Research, Design', skillId: job.requiredSkills?.[0].skillId, required: false }] };
    expect(toUpdatedJobInput(jobToFormValues(commaSkill), commaSkill).skills).toEqual(commaSkill.requiredSkills);
  });
  it('retains USD/year units when amounts change and preserves existing skill IDs', () => {
    const values = jobToFormValues(mockEditableJob);
    const input = toUpdatedJobInput({ ...values, salaryMin: '50000', skills: 'React, SQL' }, mockEditableJob);
    expect(input.salary).toMatchObject({ min: 50000, currency: 'USD', period: 'year' });
    expect(input.skills?.[0].skillId).toBe(mockEditableJob.requiredSkills?.[0].skillId);
    expect(input.skills?.[1]).toEqual({ name: 'SQL', required: true });
  });
  it('preserves absent and negotiable salary data and exact VND amounts', () => {
    const absent = { ...mockEditableJob, salary: undefined };
    expect(toUpdatedJobInput(jobToFormValues(absent), absent).salary).toBeUndefined();
    const negotiated = { ...mockEditableJob, salary: { ...mockEditableJob.salary!, negotiable: true } };
    expect(toUpdatedJobInput(jobToFormValues(negotiated), negotiated).salary).toEqual(negotiated.salary);
    const vnd = { ...mockEditableJob, salary: { min: 1000001, max: 20500001, currency: 'VND' as const, period: 'year' as const, negotiable: false } };
    expect(createJobSchema.safeParse(jobToFormValues(vnd)).success).toBe(true);
    expect(toUpdatedJobInput(jobToFormValues(vnd), vnd).salary).toEqual(vnd.salary);
  });
});
describe('job management mock', () => {
  it('persists pause, close and reopen through subsequent GET requests', async () => {
    const session = auth(); getRecruiterMockStore().jobs[0].status = 'open';
    for (const [action, status] of [['pause', 'paused'], ['close', 'closed'], ['reopen', 'open']] as const) {
      expect((await request(session, path + '/' + action, 'POST')).status).toBe(200);
      const reloaded = recruiterJobSchema.parse(await (await request(session, path)).json());
      expect(reloaded.status).toBe(status);
    }
  });
  it('rejects invalid lifecycle transitions without changing the job', async () => {
    const session = auth();
    expect(canChangeJobStatus('draft', 'pause')).toBe(false);
    expect(canChangeJobStatus('closed', 'reopen')).toBe(true);
    for (const status of ['draft', 'pending_review', 'rejected', 'hidden', 'locked'] as const) {
      getRecruiterMockStore().jobs[0].status = status;
      for (const action of ['pause', 'close', 'reopen']) expect((await request(session, path + '/' + action, 'POST')).status).toBe(409);
      expect(getRecruiterMockStore().jobs[0].status).toBe(status);
    }
  });
  it('keeps status actions scoped to the owner and protected by CSRF', async () => {
    const session = auth(); getRecruiterMockStore().jobs[0].status = 'open';
    session.headers['X-CSRF-Token'] = 'invalid';
    expect((await request(session, path + '/pause', 'POST')).status).toBe(403);
    session.headers['X-CSRF-Token'] = session.session.csrf;
    session.session.companyId = '00000000-0000-4000-8000-000000000999';
    expect((await request(session, path + '/pause', 'POST')).status).toBe(404);
    expect(getRecruiterMockStore().jobs[0].status).toBe('open');
  });
  it('saves round changes and exposes them in applicant round selection data', async () => {
    const session = auth();
    const input = toUpdatedJobInput({ ...jobToFormValues(mockEditableJob), hiringRounds: [{ name: 'Trao đổi ban đầu' }, { name: 'Phỏng vấn kỹ thuật' }] }, mockEditableJob);
    expect((await request(session, path, 'PUT', input)).status).toBe(200);
    const saved = recruiterJobSchema.parse(await (await request(session, path)).json());
    expect(saved.hiringRounds).toEqual(['Trao đổi ban đầu', 'Phỏng vấn kỹ thuật']);
    const app = getRecruiterApplicationStore().find(item => item.jobId === saved.id)!;
    expect((await request(session, `recruiter/applications/${app.id}/status`, 'PATCH', { status: 'interview', round: 'Phỏng vấn kỹ thuật' })).status).toBe(200);
    expect(app.currentRound).toBe('Phỏng vấn kỹ thuật');
  });
  it('updates the owned job and required skills, moving an open job back to review', async () => {
    const session = auth(); getRecruiterMockStore().jobs[0].status = 'open';
    const input = toUpdatedJobInput({ ...jobToFormValues(mockEditableJob), title: 'Nội dung cập nhật' }, mockEditableJob);
    const response = await request(session, path, 'PUT', input);
    expect(response.status).toBe(200);
    const saved = recruiterJobSchema.parse(await response.json());
    expect(saved.status).toBe('pending_review'); expect(saved.title).toBe(input.title); expect(saved.requiredSkills).toEqual(input.skills);
  });
  it('requires verification and draft status for publish', async () => {
    const session = auth(); getMockCompanies().get(recruiterCompany.id)!.verificationStatus = 'pending';
    expect((await request(session, path + '/publish', 'POST')).status).toBe(409);
    expect(getRecruiterMockStore().jobs[0].status).toBe('draft');
    getMockCompanies().get(recruiterCompany.id)!.verificationStatus = 'verified';
    const result = await request(session, path + '/publish', 'POST');
    expect(result.status).toBe(200); expect(recruiterJobSchema.parse(await result.json()).status).toBe('pending_review');
    expect((await request(session, path + '/publish', 'POST')).status).toBe(409);
  });
  it('soft deletes without removing received applications or their CV access', async () => {
    const session = auth();
    expect((await request(session, path, 'DELETE')).status).toBe(204);
    expect(getRecruiterMockStore().jobs).toHaveLength(1);
    expect((await request(session, path)).status).toBe(404);
    expect((await (await request(session, 'recruiter/jobs')).json()).items).toEqual([]);
    const detail = await request(session, `recruiter/applications/${mockCandidateDetails[0].id}`);
    expect(detail.status).toBe(200); expect(candidateDetailSchema.parse(await detail.json()).id).toBe(mockCandidateDetails[0].id);
    expect((await request(session, `recruiter/applications/${mockCandidateDetails[0].id}/cv`)).status).toBe(200);
  });
  it('enforces locked edits, CSRF and company ownership', async () => {
    const session = auth(); const input = toUpdatedJobInput(jobToFormValues(mockEditableJob), mockEditableJob);
    getRecruiterMockStore().jobs[0].status = 'locked';
    expect((await request(session, path, 'PUT', input)).status).toBe(409);
    expect((await request({ ...session, headers: { ...session.headers, 'X-CSRF-Token': 'wrong' } }, path, 'DELETE')).status).toBe(403);
    session.session.companyId = '00000000-0000-4000-8000-999999999999';
    expect((await request(session, path, 'DELETE')).status).toBe(404);
    expect((await request(session, path + '/publish', 'POST')).status).toBe(404);
  });
});
