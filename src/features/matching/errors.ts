import { z } from 'zod';
export class ScreeningError extends Error { constructor(public key: string, public status?: number) { super(key); } }
export const analysisErrorKeys: Record<string, string> = { CV_UNREADABLE: 'cvUnreadable', CV_TOO_LARGE: 'cvTooLarge', JD_INSUFFICIENT: 'jdInsufficient', AI_ANALYSIS_FAILED: 'analysisFailed', SERVICE_UNAVAILABLE: 'unavailable', RATE_LIMITED: 'rateLimited', UNAUTHENTICATED: 'session', CSRF_TOKEN_INVALID: 'session', FORBIDDEN: 'forbidden', NOT_FOUND: 'notFound', ACCOUNT_LOCKED: 'locked' };
export function screeningError(error: unknown, status?: number) {
  const parsed = z.object({ error: z.object({ code: z.string() }) }).safeParse(error);
  return new ScreeningError(parsed.success ? analysisErrorKeys[parsed.data.error.code] ?? 'request' : status === 429 ? 'rateLimited' : 'request', status);
}
