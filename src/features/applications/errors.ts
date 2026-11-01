import { z } from 'zod';
import { ApiError } from '@/lib/api';
const problemSchema = z.object({ error: z.object({ code: z.string() }) });
export class CandidateRequestError extends Error {
  constructor(public messageKey: string, public status?: number) { super(messageKey); }
}
export function candidateError(error: unknown, status?: number) {
  const parsed = problemSchema.safeParse(error instanceof ApiError ? { error: { code: error.code } } : error);
  const keys: Record<string, string> = { UNAUTHENTICATED: 'unauthenticated', SESSION_EXPIRED: 'unauthenticated', FORBIDDEN: 'forbidden', ACCOUNT_LOCKED: 'locked', NOT_FOUND: 'cvUnavailable', VALIDATION_FAILED: 'invalid', BAD_REQUEST: 'invalid', INVALID_STATUS_TRANSITION: 'invalidTransition', INTERVIEW_TIME_CONFLICT: 'interviewConflict', CSRF_TOKEN_INVALID: 'sessionRetry', CONFLICT: 'conflict' };
  return new CandidateRequestError(parsed.success ? keys[parsed.data.error.code] ?? 'requestFailed' : 'requestFailed', status);
}
