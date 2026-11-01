import { z } from 'zod';
export const planIds = ['starter', 'growth', 'pro'] as const;
export const cycleSchema = z.enum(['month', 'year']);
export const planSchema = z.object({ id: z.enum(planIds), monthlyPrice: z.number().int().nonnegative(), annualDiscount: z.number().int().min(0).max(100), jobs: z.number().int().positive(), analyses: z.number().int().positive(), featured: z.boolean() });
export const offerSchema = z.object({ id: z.string(), code: z.string().regex(/^[A-Z0-9]+$/), percent: z.number().int().min(1).max(100), planIds: z.array(z.enum(planIds)).min(1), cycle: cycleSchema.optional(), startsAt: z.iso.date(), endsAt: z.iso.date(), category: z.enum(['new', 'ai', 'annual']) }).refine(offer => offer.startsAt <= offer.endsAt);
export type ServicePlan = z.infer<typeof planSchema>;
export type ServiceOffer = z.infer<typeof offerSchema>;
export type BillingCycle = z.infer<typeof cycleSchema>;
export const offerQuerySchema = z.object({ offer: z.string().max(40).optional() });
