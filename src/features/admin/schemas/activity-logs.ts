import { z } from 'zod';
export const activityLogSchema = z.object({
  id: z.uuid(), occurredAt: z.iso.datetime({ offset: true }), action: z.string(), result: z.enum(['success', 'failure']),
  actorId: z.uuid().optional(), actorName: z.string().optional(), actorRole: z.enum(['admin', 'candidate', 'recruiter']).optional(),
  targetType: z.string().optional(), targetId: z.string().optional(),
  // Only known display fields are retained. Never dump arbitrary metadata (tokens, CV content, etc.).
  metadata: z.object({ reason: z.string().optional(), note: z.string().optional(), outcome: z.string().optional(), status: z.string().optional(), catalogType: z.string().optional(), orderCode: z.string().optional(), reportId: z.string().optional() }).optional(),
});
export const activityPageSchema = z.object({ items: activityLogSchema.array(), meta: z.object({ page: z.number().int().positive(), pageSize: z.number().int().positive(), totalItems: z.number().int().nonnegative(), totalPages: z.number().int().nonnegative() }) });
export const activityFiltersSchema = z.object({ search: z.string(), actor: z.string(), action: z.string(), target: z.string(), result: z.enum(['', 'success', 'failure']), from: z.union([z.literal(''), z.iso.date()]), to: z.union([z.literal(''), z.iso.date()]) }).refine(value => !value.from || !value.to || value.from <= value.to, { message: 'dateOrder', path: ['to'] });
export type ActivityLog = z.infer<typeof activityLogSchema>;
export type ActivityFilters = z.infer<typeof activityFiltersSchema>;
