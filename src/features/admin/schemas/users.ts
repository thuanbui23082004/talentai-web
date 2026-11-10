import { z } from 'zod';
export const managedUserSchema = z.object({
  id: z.uuid(), email: z.email(), fullName: z.string(), role: z.enum(['candidate', 'recruiter', 'admin']), status: z.enum(['active', 'locked']), createdAt: z.iso.datetime(),
  phone: z.string().optional(), address: z.string().optional(), lastLoginAt: z.iso.datetime().optional(), lockReason: z.string().optional(), lockedUntil: z.iso.datetime().optional(), violationCount: z.number().int().nonnegative().optional(),
  stats: z.object({ cvCount: z.number().optional(), applicationCount: z.number().optional(), jobCount: z.number().optional() }).optional(),
  violations: z.array(z.object({ id: z.uuid(), type: z.string(), reason: z.string().optional(), createdAt: z.iso.datetime() })).optional(),
});
export const userPageSchema = z.object({ items: z.array(managedUserSchema), meta: z.object({ page: z.number().int().positive(), pageSize: z.number().int().positive(), totalItems: z.number().int().nonnegative(), totalPages: z.number().int().nonnegative() }) });
export const reasonSchema = z.object({ reason: z.string().trim().min(1, 'reasonRequired').max(1000, 'reasonLength') });
export type ManagedUser = z.infer<typeof managedUserSchema>;
