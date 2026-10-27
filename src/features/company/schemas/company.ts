import { z } from 'zod';
export const companySizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'] as const;
export const companyInputSchema = z.object({
  name: z.string().trim().min(2, 'companyName').max(200, 'companyName'), industryIds: z.array(z.uuid()).min(1, 'industry'), city: z.string().trim().min(1, 'required'),
  address: z.string().trim().max(255, 'addressLength').optional(), contactPhone: z.string().optional(), contactEmail: z.email('email').optional(), taxCode: z.string().optional(), size: z.enum(companySizes).optional(),
  website: z.url('website').refine(value => /^https?:\/\//i.test(value), 'website').optional(), description: z.string().max(5000, 'descriptionLength').optional(), foundedYear: z.number().int().min(1800).max(2100).optional(),
}).strict();
export const companySchema = z.object({
  id: z.uuid(), name: z.string(), logoUrl: z.string().optional(), website: z.string().optional(), description: z.string().optional(),
  industries: z.array(z.object({ id: z.uuid(), name: z.string() })).optional(), city: z.string().optional(), address: z.string().optional(), size: z.enum(companySizes).optional(),
  contactEmail: z.string().optional(), contactPhone: z.string().optional(), taxCode: z.string().optional(), foundedYear: z.number().int().optional(),
  verificationStatus: z.enum(['unverified', 'pending', 'verified', 'rejected', 'suspended']),
  verificationDocuments: z.array(z.object({ id: z.uuid().optional(), fileName: z.string(), mimeType: z.string(), sizeBytes: z.number().int().nonnegative(), uploadedAt: z.iso.datetime().optional() })).optional(),
  rejectionReason: z.string().optional(), verifiedAt: z.iso.datetime().optional(), createdAt: z.iso.datetime(), updatedAt: z.iso.datetime().optional(),
});
export type Company = z.infer<typeof companySchema>;
export type CompanyInput = z.infer<typeof companyInputSchema>;
export const companyMainFormSchema = companyInputSchema.pick({ name: true, industryIds: true, city: true, taxCode: true, address: true, contactPhone: true }).extend({ size: z.enum(companySizes).or(z.literal('')) });
export const companyIntroFormSchema = z.object({ description: z.string().max(5000, 'descriptionLength'), website: z.union([companyInputSchema.shape.website, z.literal('')]) });
export function companyToInput(company: Company): CompanyInput {
  return { name: company.name, industryIds: company.industries?.map(item => item.id) ?? [], city: company.city ?? '', address: company.address, contactPhone: company.contactPhone, contactEmail: company.contactEmail, taxCode: company.taxCode, size: company.size, description: company.description, website: company.website || undefined, foundedYear: company.foundedYear };
}
export const logoFileSchema = z.instanceof(File).refine(file => file.size > 0, 'fileEmpty').refine(file => file.size <= 2 * 1024 * 1024, 'fileSize').refine(file => ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type), 'logoType');
export const verificationFilesSchema = z.array(z.instanceof(File).refine(file => file.size > 0, 'fileEmpty').refine(file => file.type === 'application/pdf' || ['image/png', 'image/jpeg', 'image/webp'].includes(file.type), 'documentType')).min(1, 'fileRequired');
