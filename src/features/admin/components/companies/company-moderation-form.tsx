'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api';
import { adminKeys } from '@/features/admin/query-keys';
import { moderateCompany } from '@/features/admin/services/companies';
import { companyReasonSchema, type CompanyAction, type ManagedCompany } from '@/features/admin/schemas/companies';
export function CompanyModerationForm({ company, action, close, saved }: { company: ManagedCompany; action: CompanyAction; close: () => void; saved: () => void }) {
  const t = useTranslations('AdminCompanies'); const cache = useQueryClient(); const [reason, setReason] = useState<string | null>(null);
  const form = useForm<z.infer<typeof companyReasonSchema>>({ resolver: zodResolver(companyReasonSchema), mode: 'onChange', defaultValues: { reason: '' } });
  const mutation = useMutation({ mutationFn: (content: string) => moderateCompany(company.id, action, content), onSuccess: async result => {
    cache.setQueryData(adminKeys.company(company.id), result);
    await Promise.all([cache.invalidateQueries({ queryKey: adminKeys.companies }), cache.invalidateQueries({ queryKey: ['admin', 'overview'] }), cache.invalidateQueries({ queryKey: ['admin', 'logs'] })]);
    saved(); close();
  } });
  const error = mutation.error;
  return <section className="admin-access-panel" aria-label={t(action)}><h2>{t(reason === null ? action : 'confirmTitle')}</h2><p>{t(reason === null ? `${action}Hint` : 'confirmHint')}</p>
    {reason === null ? <form noValidate onSubmit={form.handleSubmit(values => setReason(values.reason))}><label htmlFor="admin-company-reason">{t('note')}</label><Textarea id="admin-company-reason" {...form.register('reason')} rows={4} placeholder={t('notePlaceholder')} aria-invalid={!!form.formState.errors.reason} aria-describedby={form.formState.errors.reason ? 'company-reason-error' : undefined} />{form.formState.errors.reason && <p id="company-reason-error" className="admin-error" role="alert">{t(form.formState.errors.reason.message === 'reasonLength' ? 'reasonLength' : 'reasonRequired')}</p>}<div className="admin-access-buttons"><Button type="button" variant="outline" onClick={close}>{t('cancel')}</Button><Button type="submit">{t('continue')}</Button></div></form> : <><dl className="admin-confirm-details"><div><dt>{t('name')}</dt><dd>{company.name}</dd></div><div><dt>{t('taxCode')}</dt><dd>{company.taxCode || t('noValue')}</dd></div><div><dt>{t('actions')}</dt><dd>{t(action)}</dd></div><div><dt>{t('note')}</dt><dd>{reason}</dd></div></dl>
      {error && <p className="admin-error" role="alert">{t(error instanceof ApiError && error.status === 403 ? 'forbidden' : error instanceof ApiError && error.status === 422 ? 'invalidState' : 'updateFailed')}</p>}
      <div className="admin-access-buttons"><Button variant="ghost" disabled={mutation.isPending} onClick={() => { setReason(null); mutation.reset(); }}>{t('edit')}</Button><Button variant="outline" disabled={mutation.isPending} onClick={close}>{t('cancel')}</Button><Button disabled={mutation.isPending} onClick={() => mutation.mutate(reason)}>{t(mutation.isPending ? 'saving' : 'confirm')}</Button></div></>}
  </section>;
}
