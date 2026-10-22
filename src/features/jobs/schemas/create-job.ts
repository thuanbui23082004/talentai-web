import { z } from 'zod';
import { jobInputSchema, jobLevels, workTypes } from '@/lib/api/job-schemas';
import type { JobInput } from '@/features/jobs/types';

const numericText = z.string().refine(value => value === '' || (Number.isFinite(Number(value)) && Number(value) >= 0), 'number');
export const createJobSchema = z.object({
  title: z.string().trim().min(3, 'title').max(200, 'title'), industryId: z.uuid('industry'),
  level: z.enum(jobLevels, { error: 'required' }), workType: z.enum(workTypes, { error: 'required' }),
  minExperienceYears: numericText, applicationDeadline: z.string().refine(value => value === '' || z.iso.date().safeParse(value).success, 'date'),
  salaryMin: numericText, salaryMax: numericText, negotiable: z.boolean(),
  description: z.string().trim().min(1, 'required').max(20000, 'contentLength'),
  requirements: z.string().trim().min(1, 'required').max(20000, 'contentLength'),
  benefits: z.string().max(10000, 'contentLength'), headcount: z.number().int('number').min(1, 'headcount'),
  city: z.string().trim().min(1, 'city'), district: z.string(), address: z.string(),
  educationLevel: z.enum(['', 'high_school', 'vocational', 'college', 'bachelor', 'master', 'doctorate', 'other']), skills: z.string(),
}).superRefine((value, context) => {
  if (!value.negotiable && value.salaryMin !== '' && value.salaryMax !== '' && Number(value.salaryMin) > Number(value.salaryMax)) {
    context.addIssue({ code: 'custom', path: ['salaryMax'], message: 'salaryOrder' });
  }
  for (const key of ['salaryMin', 'salaryMax'] as const) {
    if (!value.negotiable && value[key] !== '' && !Number.isSafeInteger(Number(value[key]) * 1_000_000)) {
      context.addIssue({ code: 'custom', path: [key], message: 'number' });
    }
  }
});
export type CreateJobValues = z.infer<typeof createJobSchema>;
export const createJobDefaults: CreateJobValues = {
  title: '', industryId: '', level: 'junior', workType: 'full_time', minExperienceYears: '', applicationDeadline: '',
  salaryMin: '', salaryMax: '', negotiable: false, description: '', requirements: '', benefits: '', headcount: 1,
  city: '', district: '', address: '', educationLevel: '', skills: '',
};
export function toJobInput(values: CreateJobValues): JobInput {
  return jobInputSchema.parse({
    title: values.title, industryId: values.industryId, level: values.level, workType: values.workType,
    description: values.description, requirements: values.requirements, benefits: values.benefits || undefined,
    location: { city: values.city, district: values.district || undefined, address: values.address || undefined },
    salary: { currency: 'VND', period: 'month', negotiable: values.negotiable,
      ...(!values.negotiable && { min: values.salaryMin === '' ? undefined : Number(values.salaryMin) * 1_000_000, max: values.salaryMax === '' ? undefined : Number(values.salaryMax) * 1_000_000 }) },
    minExperienceYears: values.minExperienceYears === '' ? undefined : Number(values.minExperienceYears),
    headcount: values.headcount, applicationDeadline: values.applicationDeadline || undefined,
    educationLevel: values.educationLevel || undefined,
    skills: values.skills.trim() ? values.skills.split(',').map(name => ({ name: name.trim(), required: true })).filter(skill => skill.name) : undefined,
  });
}
