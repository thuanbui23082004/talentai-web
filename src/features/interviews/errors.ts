import { CandidateRequestError } from '@/features/applications';
export function interviewErrorKey(error: unknown) {
  if (!(error instanceof CandidateRequestError)) return 'request';
  if (error.status === 404) return 'notFound';
  const keys: Record<string, string> = { interviewConflict: 'conflict', unauthenticated: 'session', sessionRetry: 'session', forbidden: 'forbidden', invalid: 'invalid', invalidTransition: 'invalid', locked: 'forbidden' };
  return keys[error.messageKey] ?? 'request';
}
