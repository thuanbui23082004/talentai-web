import { z } from 'zod';

export const loginSchema = z.object({ email: z.email('email').trim(), password: z.string().min(1, 'required').max(256, 'required') });
export const adminUserSchema = z.object({ id: z.string(), fullName: z.string(), role: z.enum(['admin', 'candidate', 'recruiter']), status: z.enum(['active', 'locked']) });
export const sessionSchema = z.object({ user: adminUserSchema, csrfToken: z.string(), expiresAt: z.iso.datetime(), idleTimeoutSeconds: z.number() });
const count = z.number().int().nonnegative();
export const overviewSchema = z.object({
  users: z.object({ total: count.optional(), candidates: count.optional(), recruiters: count.optional() }).optional(),
  companies: z.object({ total: count.optional(), verified: count.optional(), pending: count.optional() }).optional(), jobs: z.object({ total: count.optional(), byStatus: z.record(z.string(), count).optional() }).optional(),
  reports: z.object({ open: count.optional(), inReview: count.optional() }).optional(),
});
export const seriesSchema = z.object({ points: z.array(z.object({ date: z.iso.date(), value: z.number() })) });
export const logsSchema = z.object({ items: z.array(z.object({ id: z.string(), actorName: z.string().optional(), actorRole: z.string().optional(), action: z.string(), occurredAt: z.iso.datetime(), result: z.enum(['success', 'failure']), metadata: z.object({ reason: z.string().optional() }).optional() })) });
export const periodSchema = z.object({ from: z.iso.date().optional(), to: z.iso.date().optional() }).refine(q => !q.from || !q.to || q.from <= q.to, 'dateOrder');
export type Period = z.infer<typeof periodSchema>;
export type Metric = 'new_users' | 'applications' | 'jobs_posted';
