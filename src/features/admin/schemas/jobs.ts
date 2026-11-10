import { z } from 'zod';
import { recruiterJobSchema, jobStatuses, pageMetaSchema } from '@/lib/api/job-schemas';
export { jobStatuses };
export const jobActions = ['approve', 'reject', 'hide', 'lock', 'delete'] as const;
export type JobAction = typeof jobActions[number];
export const managedJobSchema = recruiterJobSchema.extend({ createdAt: z.iso.datetime().optional(), updatedAt: z.iso.datetime().optional(), applicationDeadline: z.iso.date().optional(), moderation: z.object({ status: z.enum(['none', 'pending', 'approved', 'rejected']).optional(), reason: z.string().optional(), reviewedAt: z.iso.datetime().optional() }).optional(), history: z.array(z.object({ action: z.string(), at: z.iso.datetime(), reason: z.string().optional(), actorName: z.string().optional() })).optional() });
export const adminJobPageSchema = z.object({ items: z.array(managedJobSchema), meta: pageMetaSchema.extend({ page: z.number().int().positive(), pageSize: z.number().int().positive(), totalItems: z.number().int().nonnegative(), totalPages: z.number().int().nonnegative() }) });
export const jobReasonSchema = z.object({ reason: z.string().trim().min(1, 'reasonRequired').max(1000, 'reasonLength') });
// DELETE uses a query parameter in the existing contract; personal data must never enter URLs.
export const deleteJobReasonSchema = jobReasonSchema.refine(value => !/[^\s@]+@[^\s@]+\.[^\s@]+/.test(value.reason) && !/\+?\d(?:[\s().-]*\d){8,}/.test(value.reason), { path: ['reason'], message: 'privateReason' });
export type ManagedJob = z.infer<typeof managedJobSchema>;
