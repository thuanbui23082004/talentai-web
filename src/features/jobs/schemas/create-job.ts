import { z } from 'zod';
import { jobInputSchema, jobLevels, workTypes } from '@/lib/api/job-schemas';
import type { JobInput, RecruiterJob } from '@/features/jobs/types';

const numericText = z.string().refine(value => value === '' || (Number.isFinite(Number(value)) && Number(value) >= 0), 'number');
const amount = (value: string, currency: 'VND' | 'USD') => Math.round(Number(value) * (currency === 'VND' ? 1_000_000 : 1));
export const createJobSchema = z.object({
  title: z.string().trim().min(3, 'title').max(200, 'title'), industryId: z.uuid('industry'),
  level: z.enum(jobLevels, { error: 'required' }), workType: z.enum(workTypes, { error: 'required' }),
  minExperienceYears: numericText, applicationDeadline: z.string().refine(value => value === '' || z.iso.date().safeParse(value).success, 'date'),
  salaryMin: numericText, salaryMax: numericText, negotiable: z.boolean(),
  salaryCurrency: z.enum(['VND', 'USD']), salaryPeriod: z.enum(['month', 'year']),
  description: z.string().trim().min(1, 'required').max(20000, 'contentLength'),
  requirements: z.string().trim().min(1, 'required').max(20000, 'contentLength'),
  benefits: z.string().max(10000, 'contentLength'), headcount: z.number().int('number').min(1, 'headcount'),
  city: z.string().trim().min(1, 'city'), district: z.string(), address: z.string(),
  educationLevel: z.enum(['', 'high_school', 'vocational', 'college', 'bachelor', 'master', 'doctorate', 'other']), skills: z.string(),
  hiringRounds: z.array(z.object({ name: z.string().trim().min(1, 'roundName') })),
}).superRefine((value, context) => {
  const names = new Set<string>();
  value.hiringRounds.forEach((round, index) => {
    const name = round.name.toLocaleLowerCase('vi');
    if (names.has(name)) context.addIssue({ code: 'custom', path: ['hiringRounds', index, 'name'], message: 'roundDuplicate' });
    names.add(name);
  });
  if (!value.negotiable && value.salaryMin !== '' && value.salaryMax !== '' && Number(value.salaryMin) > Number(value.salaryMax)) {
    context.addIssue({ code: 'custom', path: ['salaryMax'], message: 'salaryOrder' });
  }
  for (const key of ['salaryMin', 'salaryMax'] as const) {
    const scaled = Number(value[key]) * (value.salaryCurrency === 'VND' ? 1_000_000 : 1);
    if (!value.negotiable && value[key] !== '' && (!Number.isSafeInteger(amount(value[key], value.salaryCurrency)) || Math.abs(scaled - amount(value[key], value.salaryCurrency)) > 0.000001)) {
      context.addIssue({ code: 'custom', path: [key], message: 'number' });
    }
  }
});
export type CreateJobValues = z.infer<typeof createJobSchema>;
export const createJobDefaults: CreateJobValues = {
  title: '', industryId: '', level: 'junior', workType: 'full_time', minExperienceYears: '', applicationDeadline: '',
  salaryMin: '', salaryMax: '', negotiable: false, description: '', requirements: '', benefits: '', headcount: 1,
  salaryCurrency: 'VND', salaryPeriod: 'month',
  city: '', district: '', address: '', educationLevel: '', skills: '', hiringRounds: [],
};
export function toJobInput(values: CreateJobValues): JobInput {
  return jobInputSchema.parse({
    title: values.title, industryId: values.industryId, level: values.level, workType: values.workType,
    description: values.description, requirements: values.requirements, benefits: values.benefits || undefined,
    location: { city: values.city, district: values.district || undefined, address: values.address || undefined },
    salary: { currency: values.salaryCurrency, period: values.salaryPeriod, negotiable: values.negotiable,
      ...(!values.negotiable && { min: values.salaryMin === '' ? undefined : amount(values.salaryMin, values.salaryCurrency), max: values.salaryMax === '' ? undefined : amount(values.salaryMax, values.salaryCurrency) }) },
    minExperienceYears: values.minExperienceYears === '' ? undefined : Number(values.minExperienceYears),
    headcount: values.headcount, applicationDeadline: values.applicationDeadline || undefined,
    educationLevel: values.educationLevel || undefined,
    hiringRounds: values.hiringRounds.length ? values.hiringRounds.map(round => round.name.trim()) : undefined,
    skills: values.skills.trim() ? values.skills.split(',').map(name => ({ name: name.trim(), required: true })).filter(skill => skill.name) : undefined,
  });
}
export function jobToFormValues(job: RecruiterJob): CreateJobValues {
  const scale = job.salary?.currency === 'USD' ? 1 : 1_000_000;
  return { ...createJobDefaults, title: job.title, industryId: job.industry?.id ?? '', level: job.level, workType: job.workType,
    description: job.description, requirements: job.requirements, benefits: job.benefits ?? '', headcount: job.headcount ?? 1,
    city: job.location.city, district: job.location.district ?? '', address: job.location.address ?? '',
    salaryCurrency: job.salary?.currency ?? 'VND', salaryPeriod: job.salary?.period ?? 'month', negotiable: job.salary?.negotiable ?? false,
    salaryMin: job.salary?.min === undefined ? '' : String(job.salary.min / scale), salaryMax: job.salary?.max === undefined ? '' : String(job.salary.max / scale),
    minExperienceYears: job.minExperienceYears === undefined ? '' : String(job.minExperienceYears), applicationDeadline: job.applicationDeadline ?? '', educationLevel: job.educationLevel ?? '',
    skills: (job.requiredSkills?.map(skill => skill.name) ?? job.skills ?? []).join(', '),
    hiringRounds: (job.hiringRounds ?? []).map(name => ({ name })),
  };
}
export function toUpdatedJobInput(values: CreateJobValues, previous: RecruiterJob): JobInput {
  const result = toJobInput(values);
  const initial = jobToFormValues(previous);
  const salaryUnchanged = (['salaryMin', 'salaryMax', 'negotiable', 'salaryCurrency', 'salaryPeriod'] as const).every(key => values[key] === initial[key]);
  return jobInputSchema.parse({ ...result, positionId: previous.position?.id, maxExperienceYears: previous.maxExperienceYears, hiringRounds: result.hiringRounds ?? (previous.hiringRounds ? [] : undefined),
    location: { ...result.location, locationId: values.city === previous.location.city ? previous.location.locationId : undefined },
    salary: salaryUnchanged ? previous.salary : result.salary,
    skills: values.skills === initial.skills ? previous.requiredSkills ?? previous.skills?.map(name => ({ name, required: true })) : result.skills?.map(skill => ({ ...skill, ...previous.requiredSkills?.find(item => item.name.toLocaleLowerCase('vi') === skill.name.toLocaleLowerCase('vi')), name: skill.name })),
  });
}
