import { z } from 'zod';
const problemSchema = z.object({ error: z.object({ code: z.string(), fieldErrors: z.array(z.object({ field: z.string(), code: z.string(), message: z.string() })).optional() }) });
const messageKeys = { COMPANY_REQUIRED: 'companyRequired', UNAUTHENTICATED: 'unauthenticated', SESSION_EXPIRED: 'unauthenticated', FORBIDDEN: 'forbidden', CSRF_TOKEN_INVALID: 'sessionRetry', VALIDATION_FAILED: 'invalid', CONFLICT: 'conflict', ACCOUNT_LOCKED: 'locked', NOT_FOUND: 'notFound' } as const;
export class JobRequestError extends Error {
  constructor(public messageKey: string, public status?: number, public fieldErrors: { field: string; code: string; message: string }[] = []) { super(messageKey); }
}
export function jobRequestError(error: unknown, status?: number) {
  const problem = problemSchema.safeParse(error);
  const code = problem.success ? problem.data.error.code : '';
  return new JobRequestError(code in messageKeys ? messageKeys[code as keyof typeof messageKeys] : 'requestFailed', status, problem.success ? problem.data.error.fieldErrors : []);
}
