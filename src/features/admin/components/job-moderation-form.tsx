'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api';
import { adminKeys } from '@/features/admin/query-keys';
import { moderateJob } from '@/features/admin/services/jobs';
import { jobReasonSchema, deleteJobReasonSchema, type JobAction, type ManagedJob } from '@/features/admin/schemas/jobs';
import { useAdminJobsNotice } from '@/features/admin/jobs-ui-store';
export function JobModerationForm({ job, action, close, saved }: { job: ManagedJob; action: JobAction; close: () => void; saved: () => void }) {
  const t = useTranslations('AdminJobs'); const router = useRouter(); const cache = useQueryClient(); const [reason, setReason] = useState<string | null>(null); const setDeleted = useAdminJobsNotice(s => s.setDeleted);
  const form = useForm<z.infer<typeof jobReasonSchema>>({ resolver: zodResolver(action === 'delete' ? deleteJobReasonSchema : jobReasonSchema), mode: 'onChange', defaultValues: { reason: '' } });
  const mutation = useMutation({ mutationFn: (content: string) => moderateJob(job.id, action, content), onSuccess: async result => {
    if (result) cache.setQueryData(adminKeys.job(job.id), result);
    await Promise.all([cache.invalidateQueries({ queryKey: adminKeys.jobs }), cache.invalidateQueries({ queryKey: ['admin', 'overview'] }), cache.invalidateQueries({ queryKey: ['admin', 'logs'] }), cache.invalidateQueries({ queryKey: ['admin', 'company', job.company.id] })]);
    if (!result) { cache.removeQueries({ queryKey: adminKeys.job(job.id), exact: true }); setDeleted(true); router.replace('/admin/jobs'); return; }
    saved(); close();
  } });
  const error = mutation.error;
  return <section className="admin-access-panel" aria-label={t(action)}><h2>{t(reason === null ? action : 'confirmTitle')}</h2><p>{t(reason === null ? `${action}Hint` : 'confirmHint')}</p>
    {reason === null ? <form noValidate onSubmit={form.handleSubmit(values => setReason(values.reason))}><label htmlFor="admin-job-reason">{t('reason')}</label><Textarea id="admin-job-reason" {...form.register('reason')} rows={4} placeholder={t('reasonPlaceholder')} aria-invalid={!!form.formState.errors.reason} aria-describedby={form.formState.errors.reason ? 'job-reason-error' : undefined} />{form.formState.errors.reason && <p id="job-reason-error" className="admin-error" role="alert">{t(form.formState.errors.reason.message === 'reasonLength' ? 'reasonLength' : form.formState.errors.reason.message === 'privateReason' ? 'privateReason' : 'reasonRequired')}</p>}<div className="admin-access-buttons"><Button type="button" variant="outline" onClick={close}>{t('cancel')}</Button><Button type="submit">{t('continue')}</Button></div></form> : <><dl className="admin-confirm-details"><div><dt>{t('jobTitle')}</dt><dd>{job.title}</dd></div><div><dt>{t('company')}</dt><dd>{job.company.name}</dd></div><div><dt>{t('actions')}</dt><dd>{t(action)}</dd></div><div><dt>{t('reason')}</dt><dd>{reason}</dd></div></dl>
      {error && <p className="admin-error" role="alert">{t(error instanceof ApiError && error.status === 403 ? 'forbidden' : error instanceof ApiError && [409, 422].includes(error.status ?? 0) ? 'invalidState' : 'updateFailed')}</p>}
      <div className="admin-access-buttons"><Button variant="ghost" disabled={mutation.isPending} onClick={() => { setReason(null); mutation.reset(); }}>{t('edit')}</Button><Button variant="outline" disabled={mutation.isPending} onClick={close}>{t('cancel')}</Button><Button variant={action === 'delete' ? 'destructive' : 'default'} disabled={mutation.isPending} onClick={() => mutation.mutate(reason)}>{t(mutation.isPending ? 'saving' : 'confirm')}</Button></div></>}
  </section>;
}
