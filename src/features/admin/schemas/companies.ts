import { z } from 'zod';
export const companyStatuses = ['unverified', 'pending', 'verified', 'rejected', 'suspended'] as const;
export const companyActions = ['verify', 'reject', 'suspend', 'restore'] as const;
export type CompanyAction = typeof companyActions[number];
export type CompanyStatus = typeof companyStatuses[number];
export const companyDocumentSchema = z.object({ id: z.uuid().optional(), fileName: z.string(), mimeType: z.string(), sizeBytes: z.number().int().nonnegative(), uploadedAt: z.iso.datetime().optional() });
export const managedCompanySchema = z.object({
  id: z.uuid(), name: z.string(), verificationStatus: z.enum(companyStatuses), createdAt: z.iso.datetime(), updatedAt: z.iso.datetime().optional(),
  taxCode: z.string().optional(), address: z.string().optional(), city: z.string().optional(), contactEmail: z.string().optional(), contactPhone: z.string().optional(), size: z.string().optional(), website: z.string().optional(), description: z.string().optional(),
  industries: z.array(z.object({ id: z.uuid(), name: z.string() })).optional(),
  owner: z.object({ id: z.uuid().optional(), fullName: z.string().optional(), email: z.string().optional() }).optional(), jobCount: z.number().int().nonnegative().optional(),
  rejectionReason: z.string().optional(), verifiedAt: z.iso.datetime().optional(), verificationDocuments: z.array(companyDocumentSchema).optional(),
  history: z.array(z.object({ action: z.string(), at: z.iso.datetime(), reason: z.string().optional(), actorName: z.string().optional() })).optional(),
});
export const companyPageSchema = z.object({ items: z.array(managedCompanySchema), meta: z.object({ page: z.number().int().positive(), pageSize: z.number().int().positive(), totalItems: z.number().int().nonnegative(), totalPages: z.number().int().nonnegative() }) });
export const companyReasonSchema = z.object({ reason: z.string().trim().min(1, 'reasonRequired').max(1000, 'reasonLength') });
export type ManagedCompany = z.infer<typeof managedCompanySchema>;
