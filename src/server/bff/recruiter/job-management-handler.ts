import { NextRequest, NextResponse } from 'next/server';
import { jobInputSchema } from '@/lib/api/job-schemas';
import { mockPostingJob } from './job-posting-mock';
import { getDeletedJobIds, getMockCompanies, getRecruiterMockStore } from '@/server/bff/recruiter/mock-store';
import { getCatalogItems } from '@/server/bff/catalog-store';
import { canChangeJobStatus, type JobStatusAction } from '@/features/jobs';
const problem = (status: number, code: string) => NextResponse.json({ error: { code, message: code } }, { status });
export async function handleJobManagement(request: NextRequest, path: string, companyId?: string) {
  const match = /^recruiter\/jobs\/([\w-]+)(?:\/(publish|pause|reopen|close))?$/.exec(path);
  if (!match || !['PUT', 'DELETE', 'POST'].includes(request.method)) return;
  const job = getRecruiterMockStore().jobs.find(item => item.id === match[1] && item.company.id === companyId && !getDeletedJobIds().has(item.id));
  if (!job) return problem(404, 'NOT_FOUND');
  if (['pause', 'reopen', 'close'].includes(match[2]) && request.method === 'POST') {
    const action = match[2] as JobStatusAction;
    if (action === 'reopen' && companyId && getMockCompanies().get(companyId)?.verificationStatus === 'suspended') return problem(409, 'COMPANY_NOT_VERIFIED');
    if (!canChangeJobStatus(job.status, action)) return problem(409, 'INVALID_STATUS_TRANSITION');
    job.status = action === 'pause' ? 'paused' : action === 'close' ? 'closed' : 'open';
    job.updatedAt = new Date().toISOString();
    return NextResponse.json(job, { headers: { 'Cache-Control': 'private, no-store' } });
  }
  if (!match[2] && request.method === 'DELETE') { getDeletedJobIds().add(job.id); return new NextResponse(null, { status: 204 }); }
  if (match[2] === 'publish' && request.method === 'POST') {
    if (job.status !== 'draft') return problem(409, 'INVALID_STATUS_TRANSITION');
    if (!companyId || getMockCompanies().get(companyId)?.verificationStatus !== 'verified') return problem(409, 'COMPANY_NOT_VERIFIED');
    job.status = 'pending_review'; job.updatedAt = new Date().toISOString();
    return NextResponse.json(job);
  }
  if (!match[2] && request.method === 'PUT') {
    if (job.status === 'locked') return problem(409, 'INVALID_STATUS_TRANSITION');
    const body: unknown = await request.json().catch(() => null);
    if (body && typeof body === 'object' && 'skillIds' in body) {
      try { Object.assign(job, mockPostingJob(body, job.company, job)); return NextResponse.json(job); }
      catch (error) { if (error instanceof Response) return error; throw error; }
    }
    const parsed = jobInputSchema.safeParse(body);
    if (!parsed.success) return problem(422, 'VALIDATION_FAILED');
    const industry = getCatalogItems('industries').find(item => item.id === parsed.data.industryId);
    if (!industry || (!industry.isActive && job.industry?.id !== industry.id)) return problem(422, 'VALIDATION_FAILED');
    const { industryId: _industryId, positionId, skills, ...fields } = parsed.data;
    void _industryId;
    const status = job.status === 'open' ? 'pending_review' : job.status;
    // Replace the editable input while keeping the job identity, company and received applications.
    Object.assign(job, fields, { industry, position: positionId ? { id: positionId, name: job.position?.name ?? fields.title } : undefined,
      skills: skills?.map(skill => skill.name), requiredSkills: skills, status, updatedAt: new Date().toISOString(), analysisStatus: 'pending' });
    // Optional fields omitted from a full PUT are cleared rather than kept accidentally.
    for (const key of ['benefits', 'salary', 'minExperienceYears', 'maxExperienceYears', 'applicationDeadline', 'educationLevel', 'hiringRounds'] as const) if (!(key in fields)) delete job[key];
    return NextResponse.json(job);
  }
  return problem(405, 'BAD_REQUEST');
}
