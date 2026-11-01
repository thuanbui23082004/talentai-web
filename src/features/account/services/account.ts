import { z } from 'zod';
import { apiClient, ensureApiSession } from '@/lib/api';
import { accountInputSchema, accountSchema, imageFileSchema, passwordInputSchema } from '@/features/account/schemas/account';
import { settingsError, settingsRequest } from '@/features/account/errors';
export function getAccount() { return settingsRequest(async () => {
  await ensureApiSession(); const result = await apiClient.GET('/me');
  if (result.error) throw settingsError(result.error, result.response.status);
  return accountSchema.parse(result.data);
}); }
export function saveAccount(input: z.infer<typeof accountInputSchema>) { return settingsRequest(async () => {
  const values = accountInputSchema.parse(input);
  const token = await ensureApiSession(); const result = await apiClient.PATCH('/me', { body: { ...values, phone: values.phone || undefined }, headers: { 'X-CSRF-Token': token } });
  if (result.error) throw settingsError(result.error, result.response.status);
  return accountSchema.parse(result.data);
}); }
export function changePassword(input: z.infer<typeof passwordInputSchema>) { return settingsRequest(async () => {
  const token = await ensureApiSession(); const result = await apiClient.POST('/auth/change-password', { body: passwordInputSchema.parse(input), headers: { 'X-CSRF-Token': token } });
  if (result.error) throw settingsError(result.error, result.response.status);
  z.object({ message: z.string() }).parse(result.data);
}); }
export function uploadAvatar(file: File) { return settingsRequest(async () => {
  imageFileSchema.parse(file); const token = await ensureApiSession(); const data = new FormData(); data.set('file', file);
  const result = await apiClient.PUT('/me/avatar', { body: { file: file.name }, bodySerializer: () => data, headers: { 'X-CSRF-Token': token } });
  if (result.error) throw settingsError(result.error, result.response.status);
  return accountSchema.parse(result.data);
}); }
export function deleteAvatar() { return settingsRequest(async () => {
  const token = await ensureApiSession(); const result = await apiClient.DELETE('/me/avatar', { headers: { 'X-CSRF-Token': token } });
  if (result.error) throw settingsError(result.error, result.response.status);
}); }
