import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { jobInputSchema } from '@/lib/api/job-schemas';
import { matchesLocationName } from '@/features/jobs/location-search';
import { handleAccountCompany } from '@/server/bff/account-company-handler';
import { recruiterIndustries, recruiterLocations } from '@/mocks/fixtures/recruiter-catalog';
import { createMockJob, createMockRecruiterSession, getDeletedJobIds, getRecruiterMockStore } from '@/server/bff/recruiter-mock-store';
import { handleJobManagement } from '@/server/bff/job-management-handler';
import { handleRecruiterAnalysis } from '@/server/bff/recruiter-analysis-handler';
import { recruiterApplicationQuerySchema, recruiterApplicationSchema } from '@/lib/api/application-schemas';
import { getRecruiterApplicationStore } from '@/server/bff/recruiter-application-store';
import { selectRecruiterApplications } from '@/server/bff/recruiter-application-query';
import { createSyntheticCvPdf } from '@/server/bff/recruiter-cv-document';
import { handleCandidateDetailRequest } from '@/server/bff/candidate-detail-handler';
import { handleInterviewManagement } from '@/server/bff/interview-management-handler';
import { handleRecruiterStats } from '@/server/bff/recruiter-stats-handler';
export function mockProblem(status: number, code: string) {
  return NextResponse.json({ error: { code, message: code, requestId: randomUUID() } }, { status });
}
export async function handleMockRequest(request: NextRequest, path: string) {
  const scenario = request.headers.get('x-mock-scenario');
  const scenarios: Record<string, [number, string]> = { unauthorized: [401, 'UNAUTHENTICATED'], forbidden: [403, 'FORBIDDEN'], error: [500, 'INTERNAL_ERROR'], locked: [423, 'ACCOUNT_LOCKED'], conflict: [409, 'CONFLICT'] };
  if (scenario && scenarios[scenario]) return mockProblem(...scenarios[scenario]);
  await new Promise(resolve => setTimeout(resolve, scenario === 'slow' ? 1500 : 200));
  const store = getRecruiterMockStore();
  let session = store.sessions.get(request.cookies.get('talentai_mock_session')?.value ?? '');
  // Bootstrap the existing mock recruiter workspace only; real auth remains with the backend.
  if (request.method === 'GET' && path === 'auth/csrf') {
    if (session) return NextResponse.json({ csrfToken: session.csrf });
    const created = createMockRecruiterSession();
    session = created.session;
    const response = NextResponse.json({ csrfToken: session.csrf });
    response.cookies.set('talentai_mock_session', created.id, { httpOnly: true, sameSite: 'lax', secure: request.nextUrl.protocol === 'https:', path: '/', maxAge: 1800 });
    return response;
  }
  if (!session) return mockProblem(401, 'UNAUTHENTICATED');
  if (session.role !== 'recruiter') return mockProblem(403, 'FORBIDDEN');
  if (request.method !== 'GET' && request.headers.get('X-CSRF-Token') !== session.csrf) return mockProblem(403, 'CSRF_TOKEN_INVALID');
  const accountResponse = await handleAccountCompany(request, path, session);
  if (accountResponse) return accountResponse;
  const analysisResponse = await handleRecruiterAnalysis(request, path, session);
  if (analysisResponse) return analysisResponse;
  const statsResponse = handleRecruiterStats(request, path, session.companyId);
  if (statsResponse) return statsResponse;
  const jobResponse = await handleJobManagement(request, path, session.companyId);
  if (jobResponse) return jobResponse;
  const interviewResponse = await handleInterviewManagement(request, path, session.companyId);
  if (interviewResponse) return interviewResponse;
  const detailResponse = await handleCandidateDetailRequest(request, path, session.companyId);
  if (detailResponse) return detailResponse;
  if (path === 'recruiter/applications' && request.method === 'GET') {
    const params = request.nextUrl.searchParams;
    const optionalNumber = (name: string) => params.has(name) ? Number(params.get(name)) : undefined;
    const parsed = recruiterApplicationQuerySchema.safeParse({
      q: params.get('q') ?? undefined, jobId: params.get('jobId') ?? undefined, status: params.getAll('status'), skills: params.getAll('skills'),
      minExperienceYears: optionalNumber('minExperienceYears'), educationLevel: params.get('educationLevel') ?? undefined,
      city: params.get('city') ?? undefined, minMatchScore: optionalNumber('minMatchScore'), classification: params.get('classification') ?? undefined,
      sort: params.get('sort') ?? undefined, page: optionalNumber('page'), pageSize: optionalNumber('pageSize'),
    });
    if (!parsed.success) return mockProblem(422, 'VALIDATION_FAILED');
    const jobs = new Set(store.jobs.filter(job => job.company.id === session.companyId).map(job => job.id));
    const result = selectRecruiterApplications(scenario === 'empty' ? [] : getRecruiterApplicationStore(), parsed.data, jobs);
    return NextResponse.json({ ...result, items: result.items.map(item => recruiterApplicationSchema.parse(item)) });
  }
  const cvMatch = /^recruiter\/applications\/([\w-]+)\/cv$/.exec(path);
  if (cvMatch && request.method === 'GET') {
    const application = getRecruiterApplicationStore().find(item => item.id === cvMatch[1]);
    if (!application || !application.cvId || !store.jobs.some(job => job.id === application.jobId && job.company.id === session.companyId)) return mockProblem(404, 'NOT_FOUND');
    const disposition = request.nextUrl.searchParams.get('disposition') ?? 'attachment';
    if (disposition !== 'inline' && disposition !== 'attachment') return mockProblem(422, 'VALIDATION_FAILED');
    const file = createSyntheticCvPdf(application.candidate.fullName, application.candidate.headline ?? '', application.candidate.topSkills ?? []);
    return new NextResponse(file, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `${disposition}; filename="candidate-cv.pdf"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
  }
  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page')) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get('pageSize')) || 20));
  function paged<T>(items: T[]) {
    const values = scenario === 'empty' ? [] : items;
    return NextResponse.json({ items: values.slice((page - 1) * pageSize, page * pageSize), meta: { page, pageSize, totalItems: values.length, totalPages: Math.ceil(values.length / pageSize) } });
  }
  if (request.method === 'GET' && path.startsWith('catalog/')) {
    const catalog = path.split('/')[1];
    if (!['industries', 'locations', 'skills', 'positions'].includes(catalog)) return mockProblem(404, 'NOT_FOUND');
    const items = catalog === 'industries' ? recruiterIndustries : catalog === 'locations' ? recruiterLocations : [];
    return paged(items.filter(item => item.isActive && matchesLocationName(item.name, request.nextUrl.searchParams.get('q') ?? '')));
  }
  if (path === 'recruiter/jobs' && request.method === 'POST') {
    if (!session.companyId) return mockProblem(409, 'COMPANY_REQUIRED');
    let body: unknown;
    try { body = await request.json(); } catch { return mockProblem(400, 'BAD_REQUEST'); }
    const result = jobInputSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: { code: 'VALIDATION_FAILED', message: 'VALIDATION_FAILED', fieldErrors: result.error.issues.map(issue => ({ field: issue.path.join('.'), code: 'VALIDATION_FAILED', message: 'VALIDATION_FAILED' })), requestId: randomUUID() } }, { status: 422 });
    if (!recruiterIndustries.some(item => item.id === result.data.industryId)) return mockProblem(422, 'VALIDATION_FAILED');
    return NextResponse.json(createMockJob(result.data, session.companyId), { status: 201 });
  }
  if (path === 'recruiter/jobs' && request.method === 'GET') {
    const q = request.nextUrl.searchParams.get('q')?.toLocaleLowerCase('vi') ?? '';
    const statuses = request.nextUrl.searchParams.getAll('status');
    const values = store.jobs.filter(job => !getDeletedJobIds().has(job.id) && job.company.id === session.companyId && job.title.toLocaleLowerCase('vi').includes(q) && (!statuses.length || statuses.includes(job.status)));
    if (request.nextUrl.searchParams.get('sort') === 'title') values.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
    return paged(values);
  }
  const match = /^recruiter\/jobs\/([^/]+)$/.exec(path);
  if (match && request.method === 'GET') {
    const job = store.jobs.find(item => item.id === match[1] && item.company.id === session.companyId && !getDeletedJobIds().has(item.id));
    return job ? NextResponse.json(job) : mockProblem(404, 'NOT_FOUND');
  }
  return mockProblem(404, 'NOT_FOUND');
}
