import { z } from 'zod';
export const catalogTypes = ['industries', 'positions', 'skills', 'locations'] as const;
export type CatalogType = typeof catalogTypes[number];
export const catalogInputSchema = z.object({ name: z.string().trim().min(1, 'required').max(150, 'tooLong'), parentId: z.uuid().optional(), industryId: z.uuid().optional(), aliases: z.array(z.string().trim().min(1).max(150)).optional(), isActive: z.boolean() });
export const catalogItemSchema = catalogInputSchema.extend({ id: z.uuid(), type: z.enum(catalogTypes).optional(), usageCount: z.number().int().nonnegative().optional() });
const meta = z.object({ page: z.number(), pageSize: z.number(), totalItems: z.number(), totalPages: z.number() });
export const catalogPageSchema = z.object({ items: z.array(catalogItemSchema), meta });
export type CatalogItem = z.infer<typeof catalogItemSchema>;
export const reportStatuses = ['open', 'in_review', 'resolved', 'dismissed'] as const;
export const reportCategories = ['spam', 'fraud', 'inappropriate_content', 'discrimination', 'fake_company', 'harassment', 'other', 'feedback', 'bug'] as const;
export const targetTypes = ['job', 'company', 'user', 'application', 'system'] as const;
export const resolutionActions = ['dismiss', 'warn_user', 'hide_content', 'lock_target', 'delete_content'] as const;
export const resolutionSchema = z.object({ action: z.enum(resolutionActions), note: z.string().trim().min(1, 'required').max(2000, 'tooLong'), responseToReporter: z.string().trim().max(2000, 'tooLong') });
export type ResolutionAction = typeof resolutionActions[number];
export function allowedReportActions(target: typeof targetTypes[number]): ResolutionAction[] {
  return target === 'job' ? ['hide_content', 'lock_target', 'delete_content', 'dismiss'] : target === 'user' ? ['warn_user', 'lock_target', 'dismiss'] : target === 'company' ? ['lock_target', 'dismiss'] : ['dismiss'];
}
export const reportSchema = z.object({ id: z.uuid(), category: z.enum(reportCategories), targetType: z.enum(targetTypes), targetId: z.uuid().optional(), targetLabel: z.string().optional(), description: z.string(), status: z.enum(reportStatuses), createdAt: z.iso.datetime(), responseToReporter: z.string().optional(), resolution: z.object({ action: z.enum(resolutionActions), note: z.string().optional(), resolvedBy: z.string().optional(), resolvedAt: z.string().optional() }).optional(), reporter: z.object({ fullName: z.string().optional(), email: z.string().optional() }).optional(), targetSnapshot: z.object({ summary: z.string().optional() }).optional(), history: z.array(z.object({ action: z.string(), at: z.string(), actorName: z.string().optional(), note: z.string().optional(), fromStatus: z.enum(reportStatuses).optional(), toStatus: z.enum(reportStatuses).optional() })).optional() });
export const reportPageSchema = z.object({ items: z.array(reportSchema), meta });
