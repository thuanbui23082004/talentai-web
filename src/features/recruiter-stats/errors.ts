import { CandidateRequestError } from '@/features/applications';
export function statsErrorKey(error: unknown) {
  if (!(error instanceof CandidateRequestError)) return 'request';
  if (error.status === 401 || error.messageKey === 'sessionRetry') return 'session';
  if (error.status === 403) return 'forbidden';
  if (error.status === 422) return 'invalid';
  return 'request';
}
