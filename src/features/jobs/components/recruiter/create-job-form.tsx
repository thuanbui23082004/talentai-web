'use client';

import Link from 'next/link';
import { useRef, useState, type FormEvent } from 'react';
import { Controller, FormProvider, useForm, useFormContext, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, CircleHelp, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { jobLevels, workTypes } from '@/lib/api/job-schemas';
import { createJobDefaults, createJobSchema, toJobInput, type CreateJobValues } from '@/features/jobs/schemas/create-job';
import { useCreateJob, useJobOptions } from '@/features/jobs/hooks/use-create-job';
import { JobRequestError } from '@/features/jobs/errors';
import { JobFormSection } from '@/features/jobs/components/recruiter/job-form-section';
import { JobEditor } from '@/features/jobs/components/recruiter/job-editor';
import { JobCreatePreview } from '@/features/jobs/components/recruiter/job-create-preview';
import { JobDataState } from '@/features/jobs/components/recruiter/job-data-state';
import './create-job.css';

type TextFieldName = 'title' | 'minExperienceYears' | 'applicationDeadline' | 'salaryMin' | 'salaryMax' | 'district' | 'address';
function TextField({ name, label, type = 'text', placeholder, disabled, required }: { name: TextFieldName; label: string; type?: string; placeholder?: string; disabled?: boolean; required?: boolean }) {
  const t = useTranslations('JobForm');
  const { register, formState: { errors } } = useFormContext<CreateJobValues>();
  const error = errors[name];
  return <div className="create-job-field"><label htmlFor={`job-${name}`}>{label}{required && <span aria-hidden="true"> *</span>}</label><Input id={`job-${name}`} type={type} placeholder={placeholder} {...register(name)} disabled={disabled} aria-invalid={!!error} aria-required={required} aria-describedby={error ? `${name}-error` : undefined} />{error && <p id={`${name}-error`} className="field-error" role="alert">{t(`validation.${error.message}`)}</p>}</div>;
}
function ChoiceField({ name, label, items }: { name: 'industryId' | 'level' | 'workType' | 'city' | 'educationLevel'; label: string; items: { value: string; label: string }[] }) {
  const t = useTranslations('JobForm');
  const { control, formState: { errors } } = useFormContext<CreateJobValues>();
  const error = errors[name];
  return <div className="create-job-field"><label id={`${name}-label`} htmlFor={`job-${name}`}>{label}{name !== 'educationLevel' && <span aria-hidden="true"> *</span>}</label><Controller control={control} name={name} render={({ field }) => <Select value={field.value || null} onValueChange={value => field.onChange(value ?? '')} onOpenChange={open => { if (!open) field.onBlur(); }} items={items}><SelectTrigger id={`job-${name}`} ref={field.ref} aria-labelledby={`${name}-label`} aria-required={name !== 'educationLevel'} aria-invalid={!!error} aria-describedby={error ? `${name}-error` : undefined}><SelectValue placeholder={t('choose')} /></SelectTrigger><SelectContent>{items.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>} />{error && <p id={`${name}-error`} role="alert" className="field-error">{t(`validation.${error.message}`)}</p>}</div>;
}

function SalaryFields() {
  const t = useTranslations('JobForm');
  const { control } = useFormContext<CreateJobValues>();
  const negotiable = useWatch({ control, name: 'negotiable' });
  return <div className="create-job-field"><span className="field-label">{t('salary')}</span><div className="salary-fields"><TextField name="salaryMin" label={t('from')} type="number" disabled={negotiable} /><span>–</span><TextField name="salaryMax" label={t('to')} type="number" disabled={negotiable} /><Controller control={control} name="negotiable" render={({ field }) => <label className="checkbox-label"><Checkbox checked={field.value} onCheckedChange={field.onChange} />{t('negotiable')}</label>} /></div></div>;
}

export function CreateJobForm() {
  const t = useTranslations('JobForm');
  const router = useRouter();
  const options = useJobOptions();
  const mutation = useCreateJob();
  const [guide, setGuide] = useState(false);
  const [phoneCount, setPhoneCount] = useState(1);
  const [extras, setExtras] = useState<string[]>([]);
  const submitting = useRef(false);
  const form = useForm<CreateJobValues>({ resolver: zodResolver(createJobSchema), mode: 'onBlur', reValidateMode: 'onChange', defaultValues: createJobDefaults });
  const submit = (event: FormEvent<HTMLFormElement>) => { void form.handleSubmit(async values => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      const result = await mutation.mutateAsync(toJobInput(values));
      router.push(`/recruiter/jobs/${result.id}`);
    } catch (error) {
      if (error instanceof JobRequestError) {
        const apiFields: Record<string, keyof CreateJobValues> = { 'location.city': 'city', 'location.district': 'district', 'location.address': 'address', 'salary.min': 'salaryMin', 'salary.max': 'salaryMax' };
        for (const issue of error.fieldErrors) {
          const name = apiFields[issue.field] ?? issue.field;
          if (name in createJobDefaults) form.setError(name as keyof CreateJobValues, { message: 'required' });
        }
      }
    } finally { submitting.current = false; }
  }, (_errors, invalidEvent) => { const root = invalidEvent?.target; if (root instanceof HTMLFormElement) root.querySelectorAll<HTMLDetailsElement>('details').forEach(section => { section.open = true; }); })(event); };
  if (!options.data) return <JobDataState loading={options.isPending} error={options.error} onRetry={() => void options.refetch()} />;
  if (!options.data.industries.length || !options.data.locations.length) return <section className="recruiter-panel empty-state"><p>{t('noOptions')}</p><Button onClick={() => void options.refetch()}>{t('retry')}</Button></section>;

  return <FormProvider {...form}><div className="create-job-page"><header className="create-job-heading"><h1>{t('heading')}</h1><Button type="button" variant="ghost" size="sm" onClick={() => setGuide(!guide)} aria-expanded={guide}><CircleHelp size={14} />{t('guide')}</Button></header>{guide && <p className="create-job-guide">{t('guideText')}</p>}
    <div className="create-job-grid"><form onSubmit={submit} noValidate>
      <JobFormSection id="job-basic" title={t('basic')}>
        <TextField name="title" label={t('title')} placeholder={t('titlePlaceholder')} required />
        <ChoiceField name="industryId" label={t('industry')} items={options.data.industries.map(item => ({ value: item.id, label: item.name }))} />
        <div className="form-two-columns"><ChoiceField name="level" label={t('level')} items={jobLevels.map(value => ({ value, label: t(`levels.${value}`) }))} /><TextField name="minExperienceYears" label={t('experience')} type="number" placeholder={t('noExperience')} /></div>
        <div className="form-two-columns"><TextField name="applicationDeadline" label={t('deadline')} type="date" /><SalaryFields /></div>
      </JobFormSection>
      <JobFormSection id="job-content" title={t('content')}>
        <JobEditor name="description" /><JobEditor name="requirements" /><JobEditor name="benefits" />
        <div className="form-two-columns"><ChoiceField name="workType" label={t('workType')} items={workTypes.map(value => ({ value, label: t(`workTypes.${value}`) }))} /><div className="create-job-field"><label htmlFor="job-headcount">{t('headcount')}<span aria-hidden="true"> *</span></label><Controller control={form.control} name="headcount" render={({ field }) => <div className="headcount-control"><Button type="button" size="icon-sm" variant="ghost" disabled={field.value <= 1} aria-label={t('decrease')} onClick={() => field.onChange(Math.max(1, field.value - 1))}><Minus size={12} /></Button><Input id="job-headcount" type="number" min={1} {...field} onChange={event => field.onChange(event.target.value === '' ? 1 : Number(event.target.value))} aria-invalid={!!form.formState.errors.headcount} /><Button type="button" size="icon-sm" variant="ghost" aria-label={t('increase')} onClick={() => field.onChange(field.value + 1)}><Plus size={12} /></Button></div>} />{form.formState.errors.headcount && <p className="field-error" role="alert">{t('validation.headcount')}</p>}</div></div>
        <div className="extra-field-buttons">{(['probation', 'education', 'gender', 'age', 'skills'] as const).map(key => <Button type="button" size="sm" variant="ghost" key={key} aria-expanded={extras.includes(key)} onClick={() => setExtras(values => values.includes(key) ? values.filter(value => value !== key) : [...values, key])}><Plus size={11} />{t(key)}</Button>)}</div>
        {extras.map(key => key === 'education' ? <ChoiceField key={key} name="educationLevel" label={t('education')} items={(['high_school', 'vocational', 'college', 'bachelor', 'master', 'doctorate', 'other'] as const).map(value => ({ value, label: t(`educationLevels.${value}`) }))} /> : <div className="create-job-field" key={key}><label htmlFor={`extra-${key}`}>{t(key)}</label><Input id={`extra-${key}`} placeholder={t(key === 'skills' ? 'skillsPlaceholder' : 'optionalPlaceholder')} {...(key === 'skills' ? form.register('skills') : {})} /></div>)}
      </JobFormSection>
      <JobFormSection id="job-location" title={t('location')}><div className="workplace-box"><h3>{t('workplace')}<span aria-hidden="true"> *</span></h3><div className="location-fields"><ChoiceField name="city" label={t('city')} items={options.data.locations.map(item => ({ value: item.name, label: item.name }))} /><TextField name="district" label={t('district')} /><TextField name="address" label={t('address')} /></div></div></JobFormSection>
      <JobFormSection id="job-contact" title={t('contact')}><div className="contact-fields">{(['contactName', 'contactEmail', 'contactPhone'] as const).map((key, index) => <div className="create-job-field" key={key}><label htmlFor={key}>{t(key)}</label><Input id={key} type={index === 1 ? 'email' : index === 2 ? 'tel' : 'text'} autoComplete="off" /></div>)}</div>{Array.from({ length: phoneCount - 1 }, (_, index) => <div className="create-job-field" key={index}><label htmlFor={`phone-${index}`}>{t('contactPhone')}</label><Input id={`phone-${index}`} type="tel" autoComplete="off" /></div>)}<Button type="button" variant="ghost" size="sm" className="add-phone" disabled={phoneCount >= 3} onClick={() => setPhoneCount(phoneCount + 1)}><Plus size={11} />{t('morePhone')}</Button><div className="create-job-field"><label htmlFor="interview-address">{t('interviewAddress')}</label><Input id="interview-address" /></div></JobFormSection>
      <JobFormSection id="job-extras" title={t('extras')}><label className="no-cv-option"><Checkbox />{t('noCv')}</label></JobFormSection>
      <p className="create-job-agreement">{t('agreement')}</p>
      {mutation.isError && <p className="field-error submit-error" role="alert">{t(`errors.${mutation.error instanceof JobRequestError ? mutation.error.messageKey : 'requestFailed'}`)}</p>}
      <div className="create-job-actions"><Link href="/recruiter/jobs"><ArrowLeft size={13} />{t('back')}</Link><Button type="submit" className="recruiter-primary" disabled={mutation.isPending} aria-busy={mutation.isPending}>{t(mutation.isPending ? 'saving' : 'save')}<ArrowRight size={14} /></Button></div>
    </form><JobCreatePreview company={options.data.company.name} /></div>
  </div></FormProvider>;
}
