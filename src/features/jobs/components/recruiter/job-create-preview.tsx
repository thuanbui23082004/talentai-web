'use client';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { ArrowRight, BriefcaseBusiness, MapPin, Wallet, Clock3 } from 'lucide-react';
import type { CreateJobValues } from '@/features/jobs/schemas/create-job';
export function JobCreatePreview({ company }: { company: string }) {
  const t = useTranslations('JobForm');
  const { control } = useFormContext<CreateJobValues>();
  const values = useWatch({ control });
  return <aside className="create-job-side"><section className="create-job-preview"><div className="preview-heading"><h2>{t('preview')}</h2><span>{t('live')}</span></div><article><div className="preview-job-title"><span><BriefcaseBusiness size={19} /></span><div><h3>{values.title || t('previewTitle')}</h3><p>{company}</p></div></div><div className="preview-salary"><Wallet size={13} />{values.negotiable ? t('negotiable') : values.salaryMin || values.salaryMax ? `${values.salaryMin || '0'} – ${values.salaryMax || values.salaryMin} ${t('million')}` : t('noSalary')}</div><p><MapPin size={12} />{values.city || t('noLocation')}</p><div className="preview-job-meta"><Clock3 size={12} />{t(`workTypes.${values.workType}`)}<span>{t('draft')}</span></div></article></section>
    <nav className="create-job-steps" aria-label={t('steps')}><h2>{t('steps')}</h2>{(['basic', 'content', 'location', 'contact'] as const).map((key, index) => <a key={key} href={`#job-${key}`}><span>{index + 1}</span>{t(key)}<ArrowRight size={12} /></a>)}</nav>
  </aside>;
}
