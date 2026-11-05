import { z } from 'zod';

export const postingExperienceLevels = ['INTERN', 'FRESHER', 'JUNIOR', 'MIDDLE', 'SENIOR', 'EXPERT'] as const;
export const postingJobTypes = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'] as const;
export const postingWorkModes = ['ONSITE', 'HYBRID', 'REMOTE'] as const;
const id = z.number().int().positive().safe();
export const postingLocationSchema = z.object({ id, code: z.string(), name: z.string(), type: z.enum(['PROVINCE', 'DISTRICT', 'WARD']), parentId: id.nullish() });
export const postingCategorySchema = z.object({ categoryId: id, categoryName: z.string(), description: z.string().optional() });
export const postingSkillSchema = z.object({ skillId: id, skillName: z.string() });
export const postingOptionsSchema = z.object({ categories: z.array(postingCategorySchema), skills: z.array(postingSkillSchema), company: z.object({ id: z.uuid(), name: z.string() }).optional() });

const input = z.object({
  title: z.string().max(200).optional(), description: z.string().max(50000).optional(),
  requirements: z.string().max(50000).optional(), benefits: z.string().max(50000).optional(),
  categoryId: id.optional(), skillIds: z.array(id).max(100),
  salaryMin: z.number().int().nonnegative().safe().optional(), salaryMax: z.number().int().nonnegative().safe().optional(),
  salaryCurrency: z.string().regex(/^[A-Z]{3}$/), isSalaryNegotiable: z.boolean(),
  location: z.string().max(500).optional(),
  locations: z.array(z.object({ provinceId: id, districtId: id.optional(), wardId: id.optional(), addressLine: z.string().max(500).optional() })).max(20).optional(),
  experienceLevel: z.enum(postingExperienceLevels).optional(), jobType: z.enum(postingJobTypes).optional(),
  workMode: z.enum(postingWorkModes).optional(), headCount: z.number().int().positive().optional(),
  deadline: z.iso.datetime({ offset: true }).optional(), version: z.number().int().nonnegative().optional(),
  workplace: z.string().regex(/^\d+(?::\d+)?$/).optional(), addressLine: z.string().max(500).optional(),
});
export const jobPostingInputSchema = input.strict().superRefine((value, context) => {
  if (new Set(value.skillIds).size !== value.skillIds.length) context.addIssue({ code: 'custom', path: ['skillIds'], message: 'duplicate' });
  if (value.salaryMin !== undefined && value.salaryMax !== undefined && value.salaryMin > value.salaryMax)
    context.addIssue({ code: 'custom', path: ['salaryMax'], message: 'salaryOrder' });
});

function withoutNulls(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutNulls);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== null).map(([key, item]) => [key, withoutNulls(item)]));
  return value;
}

export const jobPostingRecordSchema = z.preprocess(withoutNulls, input.omit({ workplace: true, addressLine: true }).partial().extend({
  jobPostId: z.uuid(), companyId: z.uuid(), version: z.number().int().nonnegative(),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED', 'EXPIRED']),
  createdAt: z.string().optional(), updatedAt: z.string().optional(), publishedAt: z.string().optional(),
  closedAt: z.string().optional(), closeReason: z.string().optional(),
  workplace: z.string().optional(), addressLine: z.string().optional(),
}));
