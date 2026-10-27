import { z } from 'zod';
import { ApiError } from '@/lib/api';
export class SettingsError extends Error {
  constructor(public key: string, public status?: number) { super(key); }
}
export function settingsError(error: unknown, status?: number) {
  if (error instanceof SettingsError) return error;
  const parsed = z.object({ error: z.object({ code: z.string() }) }).safeParse(error instanceof ApiError ? error.data : error);
  const map: Record<string, string> = { UNAUTHENTICATED: 'session', FORBIDDEN: 'forbidden', CSRF_TOKEN_INVALID: 'session', ACCOUNT_LOCKED: 'locked', CURRENT_PASSWORD_INCORRECT: 'passwordIncorrect', VALIDATION_FAILED: 'invalid', CONFLICT: 'conflict', PAYLOAD_TOO_LARGE: 'fileSize', UNSUPPORTED_MEDIA_TYPE: 'imageType' };
  return new SettingsError(parsed.success ? map[parsed.data.error.code] ?? 'request' : 'request', status);
}
export async function settingsRequest<T>(action: () => Promise<T>): Promise<T> {
  try { return await action(); } catch (error) { if (error instanceof z.ZodError) throw error; throw settingsError(error); }
}
