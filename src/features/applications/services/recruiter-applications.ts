import { z } from 'zod';
import { apiClient, ensureApiSession } from '@/lib/api';
import { candidateError, CandidateRequestError } from '@/features/applications/errors';
import { recruiterApplicationPageSchema, recruiterApplicationQuerySchema, type RecruiterApplicationQuery } from '@/features/applications/schemas/recruiter-applications';

export async function listRecruiterApplications(query: RecruiterApplicationQuery) {
  const validated = recruiterApplicationQuerySchema.parse(query);
  try {
    await ensureApiSession();
    const result = await apiClient.GET('/recruiter/applications', { params: { query: validated } });
    if (result.error) throw candidateError(result.error, result.response.status);
    return recruiterApplicationPageSchema.parse(result.data);
  } catch (error) { throw error instanceof CandidateRequestError ? error : candidateError(error); }
}
export async function getApplicantCv(applicationId: string) {
  const id = z.uuid().parse(applicationId);
  try {
    await ensureApiSession();
    const result = await apiClient.GET('/recruiter/applications/{applicationId}/cv', { params: { path: { applicationId: id }, query: { disposition: 'inline' } }, parseAs: 'blob' });
    if (result.error) throw candidateError(result.error, result.response.status);
    const blob = z.instanceof(Blob).parse(result.data);
    if (blob.type.split(';')[0] !== 'application/pdf' && blob.type.split(';')[0] !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') throw new CandidateRequestError('cvInvalid');
    if (blob.size === 0) throw new CandidateRequestError('cvUnavailable');
    if (blob.type.split(';')[0] === 'application/pdf' && await blob.slice(0, 5).text() !== '%PDF-') throw new CandidateRequestError('cvInvalid');
    return blob;
  } catch (error) { throw error instanceof CandidateRequestError ? error : candidateError(error); }
}
