import { z } from 'zod';

export const subscriptionPlanSchema = z.object({
    // The service also uses seeded UUIDs without an RFC version/variant.
    id: z.guid(),
    code: z.string().min(1),
    name: z.string().min(1),
    description: z.string().nullable().optional(),
    price: z.number().nonnegative(),
    currency: z.string().regex(/^[A-Z]{3}$/),
    durationDays: z.number().int().positive(),
    features: z.record(z.string(), z.union([z.number().int(), z.boolean(), z.string()])),
});

export const subscriptionPlansSchema = z.array(subscriptionPlanSchema);

export const currentSubscriptionSchema = z.object({
    subscriptionId: z.guid().nullish(),
    plan: z.object({ code: z.string(), name: z.string() }).nullish(),
    status: z.string().nullish(),
    startedAt: z.iso.datetime({ offset: true }).nullish(),
    expiresAt: z.iso.datetime({ offset: true }).nullish(),
    daysRemaining: z.number().int().nullish(),
    quotas: z.record(z.string(), z.object({ limit: z.unknown().optional(), used: z.number().int().optional(), remaining: z.unknown().optional() })).optional(),
});

export const createSubscriptionOrderSchema = z.object({
    itemType: z.literal('SUBSCRIPTION'),
    itemId: z.guid(),
    paymentMethod: z.enum(['MOMO', 'ZALOPAY']).optional(),
    returnUrl: z.url(),
    cancelUrl: z.url(),
}).strict();

export const subscriptionOrderStateSchema = z.enum(['CREATED', 'PENDING', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED', 'REFUNDED']);
export const subscriptionOrderStatusSchema = z.object({
    orderId: z.guid(),
    orderCode: z.number().int().safe().optional(),
    status: subscriptionOrderStateSchema,
    paymentUrl: z.string().nullish(),
    qrCodeUrl: z.string().nullish(),
    expiresAt: z.iso.datetime({ offset: true }).nullish(),
});
export const subscriptionOrderSchema = subscriptionOrderStatusSchema.extend({
    userId: z.guid().optional(),
    itemType: z.enum(['SUBSCRIPTION', 'JOB_BOOST', 'CV_VIEW_CREDITS']),
    itemId: z.string().min(1),
    amount: z.number().nonnegative().int().safe(),
    currency: z.string().min(1),
    paymentProvider: z.string().optional(),
    description: z.string().nullish(),
    createdAt: z.iso.datetime({ offset: true }).optional(),
    updatedAt: z.iso.datetime({ offset: true }).optional(),
});
