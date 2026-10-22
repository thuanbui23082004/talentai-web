import { z } from 'zod';
import { pageMetaSchema } from '@/lib/api/job-schemas';

export const applicationStatuses = ['submitted', 'reviewing', 'interview', 'rejected', 'hired', 'withdrawn'] as const;
export const applicationSorts = ['match_score_desc', 'applied_desc', 'applied_asc', 'experience_desc'] as const;
export const candidateSearchSchema = z.string().trim().max(200).refine(value => !/@|(?:\+?\d[\s.()-]*){8,}/.test(value), 'privateSearch');
export const recruiterApplicationQuerySchema = z.object({
  q: candidateSearchSchema.optional(), jobId: z.uuid().optional(), status: z.array(z.enum(applicationStatuses)).optional(),
  skills: z.array(z.string().trim().min(1)).optional(), minExperienceYears: z.number().nonnegative().optional(),
  educationLevel: z.enum(['high_school', 'vocational', 'college', 'bachelor', 'master', 'doctorate', 'other']).optional(),
  city: z.string().optional(), minMatchScore: z.number().int().min(0).max(100).optional(),
  classification: z.enum(['potential', 'consider', 'not_suitable']).optional(),
  sort: z.enum(applicationSorts).default('applied_desc'), page: z.number().int().min(1).default(1), pageSize: z.number().int().min(1).max(100).default(9),
});
export type RecruiterApplicationQuery = z.infer<typeof recruiterApplicationQuerySchema>;
export const recruiterApplicationSchema = z.object({
  id: z.uuid(), jobId: z.uuid(), jobTitle: z.string().optional(), cvId: z.uuid().optional(),
  candidate: z.object({ id: z.uuid(), fullName: z.string(), avatarUrl: z.string().optional(), headline: z.string().optional(), city: z.string().optional(), totalYearsExperience: z.number().nonnegative().optional(), educationLevel: z.enum(['high_school', 'vocational', 'college', 'bachelor', 'master', 'doctorate', 'other']).optional(), topSkills: z.array(z.string()).optional() }),
  status: z.enum(applicationStatuses), currentRound: z.string().optional(), matchScore: z.number().int().min(0).max(100).optional(),
  evaluation: z.object({ rating: z.number().int().min(1).max(5).optional(), classification: z.enum(['potential', 'consider', 'not_suitable']).optional(), tags: z.array(z.string()).optional(), note: z.string().optional(), updatedAt: z.string().optional() }).optional(),
  appliedAt: z.iso.datetime(), updatedAt: z.iso.datetime().optional(),
});
export const recruiterApplicationPageSchema = z.object({ items: z.array(recruiterApplicationSchema), meta: pageMetaSchema });
