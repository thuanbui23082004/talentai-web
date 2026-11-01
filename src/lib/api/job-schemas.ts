import { z } from 'zod';

export const workTypes = ['full_time', 'part_time', 'internship', 'contract', 'freelance', 'remote', 'hybrid'] as const;
export const jobLevels = ['intern', 'fresher', 'junior', 'middle', 'senior', 'lead', 'manager', 'director'] as const;
export const jobStatuses = ['draft', 'pending_review', 'rejected', 'open', 'paused', 'closed', 'hidden', 'locked'] as const;
export const salarySchema = z.object({ min: z.number().int().nonnegative().optional(), max: z.number().int().nonnegative().optional(), currency: z.enum(['VND', 'USD']).default('VND'), period: z.enum(['month', 'year']).default('month'), negotiable: z.boolean().default(false) });
export const jobLocationSchema = z.object({ city: z.string().trim().min(1), district: z.string().optional(), address: z.string().optional(), locationId: z.uuid().optional() });
export const jobInputSchema = z.object({
  title: z.string().trim().min(3).max(200), industryId: z.uuid(), positionId: z.uuid().optional(),
  description: z.string().max(20000), requirements: z.string().max(20000), benefits: z.string().max(10000).optional(),
  workType: z.enum(workTypes), level: z.enum(jobLevels), location: jobLocationSchema, salary: salarySchema.optional(),
  minExperienceYears: z.number().nonnegative().optional(), maxExperienceYears: z.number().nonnegative().optional(),
  headcount: z.number().int().min(1).default(1), applicationDeadline: z.iso.date().optional(),
  educationLevel: z.enum(['high_school', 'vocational', 'college', 'bachelor', 'master', 'doctorate', 'other']).optional(),
  skills: z.array(z.object({ name: z.string(), skillId: z.uuid().optional(), required: z.boolean().default(true) })).optional(),
  hiringRounds: z.array(z.string()).optional(),
}).strict().superRefine((value, context) => {
  if (!value.salary?.negotiable && value.salary?.min !== undefined && value.salary.max !== undefined && value.salary.min > value.salary.max) {
    context.addIssue({ code: 'custom', path: ['salary', 'max'], message: 'salaryOrder' });
  }
});

export const recruiterJobSchema = z.object({
  id: z.uuid(), title: z.string(), company: z.object({ id: z.uuid(), name: z.string(), logoUrl: z.string().optional() }).passthrough(),
  location: jobLocationSchema, salary: salarySchema.optional(), workType: z.enum(workTypes), level: z.enum(jobLevels),
  status: z.enum(jobStatuses), description: z.string(), requirements: z.string(), benefits: z.string().optional(),
  industry: z.object({ id: z.uuid(), name: z.string() }).optional(), minExperienceYears: z.number().optional(),
  position: z.object({ id: z.uuid(), name: z.string() }).optional(), maxExperienceYears: z.number().nonnegative().optional(),
  educationLevel: z.enum(['high_school', 'vocational', 'college', 'bachelor', 'master', 'doctorate', 'other']).optional(),
  skills: z.array(z.string()).optional(), requiredSkills: z.array(z.object({ name: z.string(), skillId: z.uuid().optional(), required: z.boolean().default(true) })).optional(),
  headcount: z.number().int().optional(), applicationDeadline: z.string().optional(),
  hiringRounds: z.array(z.string()).optional(),
  createdAt: z.string().optional(), updatedAt: z.string().optional(),
  stats: z.object({ viewCount: z.number().int().optional(), applicationCount: z.number().int().optional() }).passthrough().optional(),
}).passthrough();
export const pageMetaSchema = z.object({ page: z.number().int(), pageSize: z.number().int(), totalItems: z.number().int(), totalPages: z.number().int() });
export const recruiterJobPageSchema = z.object({ items: z.array(recruiterJobSchema), meta: pageMetaSchema });
export const catalogPageSchema = z.object({ items: z.array(z.object({ id: z.uuid(), name: z.string(), isActive: z.boolean() }).passthrough()), meta: pageMetaSchema });
export const companySchema = z.object({ id: z.uuid(), name: z.string(), verificationStatus: z.enum(['unverified', 'pending', 'verified', 'rejected', 'suspended']), createdAt: z.string() }).passthrough();
