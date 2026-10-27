import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { evaluationInputSchema, interviewInputSchema, interviewResultInputSchema, statusUpdateSchema } from '@/lib/api/candidate-detail-schemas';
import { getRecruiterApplicationStore } from '@/server/bff/recruiter-application-store';
import { getRecruiterMockStore } from '@/server/bff/recruiter-mock-store';
import type { components } from '@/lib/api/generated/schema';

const problem = (status: number, code: string) => NextResponse.json({ error: { code, message: code } }, { status });
type Interview = components['schemas']['Interview'];
const interviewGlobal = globalThis as typeof globalThis & { talentaiInterviewKeys?: Map<string, { body: string; interview: Interview }> };
export async function handleCandidateDetailRequest(request: NextRequest, path: string, companyId?: string): Promise<NextResponse | undefined> {
  const match = /^recruiter\/applications\/([\w-]+)(?:\/(status|evaluation))?$/.exec(path);
  const interviewList = /^recruiter\/applications\/([\w-]+)\/interviews$/.exec(path);
  const interviewResult = /^recruiter\/interviews\/([\w-]+)\/result$/.exec(path);
  if (!match && !interviewList && !interviewResult && path !== 'recruiter/interviews') return;
  const store = getRecruiterApplicationStore();
  const owned = (applicationId: string) => store.find(item => item.id === applicationId && getRecruiterMockStore().jobs.some(job => job.id === item.jobId && job.company.id === companyId));
  if (interviewList) {
    if (request.method !== 'GET') return problem(405, 'BAD_REQUEST');
    const application = owned(interviewList[1]);
    return application ? NextResponse.json({ items: application.interviews ?? [] }, { headers: { 'Cache-Control': 'private, no-store' } }) : problem(404, 'NOT_FOUND');
  }
  if (interviewResult) {
    if (request.method !== 'PUT') return problem(405, 'BAD_REQUEST');
    const application = store.find(item => item.interviews?.some(interview => interview.id === interviewResult[1]) && owned(item.id));
    const interview = application?.interviews?.find(item => item.id === interviewResult[1]);
    if (!interview) return problem(404, 'NOT_FOUND');
    let body: unknown;
    try { body = await request.json(); } catch { return problem(400, 'BAD_REQUEST'); }
    const parsed = interviewResultInputSchema.safeParse(body);
    if (!parsed.success || interview.status === 'cancelled') return problem(422, 'VALIDATION_FAILED');
    interview.result = parsed.data.result;
    interview.resultNote = parsed.data.note;
    interview.status = 'completed';
    interview.updatedAt = new Date().toISOString();
    return NextResponse.json(interview, { headers: { 'Cache-Control': 'private, no-store' } });
  }
  if (match) {
    const application = owned(match[1]);
    if (!application) return problem(404, 'NOT_FOUND');
    if (!match[2] && request.method === 'GET') return NextResponse.json(application, { headers: { 'Cache-Control': 'private, no-store' } });
    if ((match[2] === 'status' && request.method === 'PATCH') || (match[2] === 'evaluation' && request.method === 'PUT')) {
      let body: unknown;
      try { body = await request.json(); } catch { return problem(400, 'BAD_REQUEST'); }
      if (match[2] === 'evaluation') {
        const parsed = evaluationInputSchema.safeParse(body);
        if (!parsed.success) return problem(422, 'VALIDATION_FAILED');
        application.evaluation = { ...parsed.data, updatedAt: new Date().toISOString() };
        return NextResponse.json(application.evaluation);
      }
      const parsed = statusUpdateSchema.safeParse(body);
      if (!parsed.success) return problem(422, 'VALIDATION_FAILED');
      if (application.status === 'withdrawn') return problem(409, 'INVALID_STATUS_TRANSITION');
      const job = getRecruiterMockStore().jobs.find(item => item.id === application.jobId);
      if (parsed.data.round && !job?.hiringRounds?.includes(parsed.data.round)) return problem(422, 'VALIDATION_FAILED');
      const now = new Date().toISOString();
      application.status = parsed.data.status;
      application.currentRound = parsed.data.round;
      application.updatedAt = now;
      application.statusHistory = [...(application.statusHistory ?? []), { status: parsed.data.status, round: parsed.data.round, note: parsed.data.note, changedBy: 'recruiter', changedAt: now }];
      return NextResponse.json(application);
    }
    return problem(405, 'BAD_REQUEST');
  }
  if (request.method !== 'POST') return problem(405, 'BAD_REQUEST');
  let body: unknown;
  try { body = await request.json(); } catch { return problem(400, 'BAD_REQUEST'); }
  const parsed = interviewInputSchema.safeParse(body);
  if (!parsed.success) return problem(422, 'VALIDATION_FAILED');
  const application = owned(parsed.data.applicationId);
  if (!application) return problem(404, 'NOT_FOUND');
  if (['withdrawn', 'rejected', 'hired'].includes(application.status)) return problem(409, 'INVALID_STATUS_TRANSITION');
  const job = getRecruiterMockStore().jobs.find(item => item.id === application.jobId);
  if (parsed.data.round && !job?.hiringRounds?.includes(parsed.data.round)) return problem(422, 'VALIDATION_FAILED');
  const keys = interviewGlobal.talentaiInterviewKeys ??= new Map();
  const key = request.headers.get('Idempotency-Key');
  const scopedKey = key ? `${companyId}:${key}` : undefined;
  const serialized = JSON.stringify(parsed.data);
  const previous = scopedKey ? keys.get(scopedKey) : undefined;
  if (previous) return previous.body === serialized ? NextResponse.json(previous.interview, { status: 201 }) : problem(409, 'CONFLICT');
  const conflict = store.flatMap(item => item.interviews ?? []).some(interview => interview.status === 'scheduled' && interview.startTime < parsed.data.endTime && interview.endTime > parsed.data.startTime && (interview.applicationId === application.id || interview.interviewers?.some(person => parsed.data.interviewers?.includes(person))));
  if (conflict) return problem(409, 'INTERVIEW_TIME_CONFLICT');
  const { sendInvitation, ...fields } = parsed.data;
  const interview: Interview = { ...fields, id: randomUUID(), jobId: application.jobId, jobTitle: application.jobTitle, candidate: application.candidate, status: 'scheduled', invitationStatus: sendInvitation ? 'pending' : 'draft', createdAt: new Date().toISOString() };
  application.interviews = [...(application.interviews ?? []), interview];
  if (scopedKey) keys.set(scopedKey, { body: serialized, interview });
  return NextResponse.json(interview, { status: 201 });
}
