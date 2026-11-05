import { z } from 'zod';
import { postingExperienceLevels, postingJobTypes, postingWorkModes, jobPostingInputSchema } from '@/lib/api/job-posting-schemas';
import type { JobPostingInput, RecruiterJob } from '../types';

const amount = z.string().refine(value => value === '' || (Number.isFinite(Number(value)) && Number(value) >= 0), 'number');
export const jobPostingFormSchema = z.object({
  title: z.string().trim().min(3, 'title').max(200, 'title'),
  categoryId: z.string().regex(/^\d+$/, 'industry'), skillIds: z.array(z.string().regex(/^\d+$/)).max(100),
  description: z.string().trim().min(1, 'required').max(50000, 'contentLength'),
  requirements: z.string().trim().min(1, 'required').max(50000, 'contentLength'), benefits: z.string().max(50000, 'contentLength'),
  salaryMin: amount, salaryMax: amount, salaryCurrency: z.string().regex(/^[A-Z]{3}$/), isSalaryNegotiable: z.boolean(),
  experienceLevel: z.enum(postingExperienceLevels), jobType: z.enum(postingJobTypes), workMode: z.enum(postingWorkModes),
  headCount: z.string().refine(value => Number.isSafeInteger(Number(value)) && Number(value) > 0, 'headcount'),
  applicationDeadline: z.string().refine(value => !value || z.iso.date().safeParse(value).success, 'date'),
  workplace: z.string().min(1, 'city'), address: z.string().max(500, 'contentLength'),
}).superRefine((value, context) => {
  if (!value.isSalaryNegotiable && value.salaryMin && value.salaryMax && Number(value.salaryMin) > Number(value.salaryMax))
    context.addIssue({ code: 'custom', path: ['salaryMax'], message: 'salaryOrder' });
  const scale = value.salaryCurrency === 'VND' ? 1000000 : 1;
  for (const key of ['salaryMin', 'salaryMax'] as const) {
    if (!value.isSalaryNegotiable && value[key] && !Number.isSafeInteger(Number(value[key]) * scale))
      context.addIssue({ code: 'custom', path: [key], message: 'number' });
  }
});
export type JobPostingFormValues = z.infer<typeof jobPostingFormSchema>;

export function jobPostingDefaults(job?: RecruiterJob): JobPostingFormValues {
  const posting = job?.posting;
  const currency = posting?.salaryCurrency ?? 'VND';
  const scale = currency === 'VND' ? 1000000 : 1;
  const deadline = posting?.deadline ? new Date(posting.deadline) : undefined;
  const parts = deadline ? Object.fromEntries(new Intl.DateTimeFormat('en', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(deadline).map(part => [part.type, part.value])) : undefined;
  return {
    title: posting?.title ?? job?.title ?? '', categoryId: posting?.categoryId ? String(posting.categoryId) : '',
    skillIds: posting?.skillIds?.map(String) ?? [], description: posting?.description ?? job?.description ?? '',
    requirements: posting?.requirements ?? job?.requirements ?? '', benefits: posting?.benefits ?? job?.benefits ?? '',
    salaryMin: posting?.salaryMin === undefined ? '' : String(posting.salaryMin / scale),
    salaryMax: posting?.salaryMax === undefined ? '' : String(posting.salaryMax / scale), salaryCurrency: currency,
    isSalaryNegotiable: posting?.isSalaryNegotiable ?? false, experienceLevel: posting?.experienceLevel ?? 'JUNIOR',
    jobType: posting?.jobType ?? 'FULL_TIME', workMode: posting?.workMode ?? 'ONSITE', headCount: String(posting?.headCount ?? 1),
    applicationDeadline: parts ? `${parts.year}-${parts.month}-${parts.day}` : '', workplace: posting?.workplace ?? '',
    address: posting?.addressLine ?? posting?.locations?.[0]?.addressLine ?? '',
  };
}

export function toJobPostingInput(value: JobPostingFormValues, version?: number): JobPostingInput {
  const scale = value.salaryCurrency === 'VND' ? 1000000 : 1;
  return jobPostingInputSchema.parse({
    title: value.title, categoryId: Number(value.categoryId), skillIds: value.skillIds.map(Number),
    description: value.description, requirements: value.requirements, benefits: value.benefits,
    salaryCurrency: value.salaryCurrency, isSalaryNegotiable: value.isSalaryNegotiable,
    ...(!value.isSalaryNegotiable ? {
      salaryMin: value.salaryMin ? Math.round(Number(value.salaryMin) * scale) : undefined,
      salaryMax: value.salaryMax ? Math.round(Number(value.salaryMax) * scale) : undefined,
    } : {}),
    experienceLevel: value.experienceLevel, jobType: value.jobType, workMode: value.workMode, headCount: Number(value.headCount),
    deadline: value.applicationDeadline ? `${value.applicationDeadline}T23:59:59+07:00` : undefined,
    workplace: value.workplace, addressLine: value.address, version,
  });
}
