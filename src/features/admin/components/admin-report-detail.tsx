'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useFormatter } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api';
import { getReport, updateReport } from '@/features/admin/services/content';
import { allowedReportActions, resolutionSchema, reportSchema } from '@/features/admin/schemas/content';
import { ContentState } from '@/features/admin/components/content-shared';
export function AdminReportDetail({ reportId }: { reportId: string }) {
  const t = useTranslations('AdminContent'), f = useFormatter(), cache = useQueryClient(); const [notice, setNotice] = useState(false);
  const query = useQuery({ queryKey: ['admin', 'reports', reportId], queryFn: ({ signal }) => getReport(reportId, signal), retry: false });
  const mutation = useMutation({ onMutate: () => setNotice(false), mutationFn: (input: z.infer<typeof resolutionSchema> | null) => updateReport(reportId, input), onSuccess: async data => { cache.setQueryData(['admin', 'reports', reportId], data); setNotice(true); await cache.invalidateQueries({ queryKey: ['admin'] }); } });
  const report = query.data; const targetPath = report?.targetId && ['job', 'company', 'user'].includes(report.targetType) ? `/admin/${report.targetType === 'company' ? 'companies' : `${report.targetType}s`}/${report.targetId}` : null;
  return <div className="admin-users-page"><Link className="admin-text-link" href="/admin/reports"><ArrowLeft size={16} />{t('back')}</Link><div className="admin-users-heading"><div><h1>{t('detail')}</h1></div>{report && <span className="admin-badge">{t(report.status)}</span>}</div>
    <ContentState pending={query.isPending} error={query.error} retry={query.refetch} />
    {notice && <p role="status" className="admin-user-notice">{t('updated')}</p>}
    {mutation.error && <p role="alert" className="admin-error">{t(mutation.error instanceof ApiError && [404, 422].includes(mutation.error.status ?? 0) ? 'invalid' : 'failed')}</p>}
    {report && !query.error && <><section className="admin-user-info admin-report-info"><h2>{report.targetLabel || t(report.targetType)}</h2><dl className="admin-user-fields"><div><dt>{t('category')}</dt><dd>{t(report.category)}</dd></div><div><dt>{t('targetType')}</dt><dd>{t(report.targetType)}</dd></div><div><dt>{t('created')}</dt><dd>{f.dateTime(new Date(report.createdAt), { dateStyle: 'medium', timeStyle: 'short' })}</dd></div><div><dt>{t('reporter')}</dt><dd>{report.reporter?.fullName || t('unspecified')}{report.reporter?.email && <small className="admin-content-aliases">{report.reporter.email}</small>}</dd></div></dl><h3>{t('description')}</h3><p className="admin-content-text">{report.description}</p>{report.targetSnapshot?.summary && <><h3>{t('snapshot')}</h3><p className="admin-content-text">{report.targetSnapshot.summary}</p></>}{targetPath && <Link className="admin-text-link" href={targetPath}>{t('targetLink')}</Link>}</section>
      {report.status === 'open' && <section className="admin-access-panel"><h2>{t('start')}</h2><Button disabled={mutation.isPending} onClick={() => mutation.mutate(null)}>{t('start')}</Button></section>}
      {report.status === 'in_review' && <ReportResolution key={report.id} report={report} busy={mutation.isPending} submit={input => mutation.mutate(input)} />}
      {report.resolution && <section className="admin-access-panel"><h2>{t('result')}</h2><strong>{t(report.resolution.action)}</strong><p className="admin-content-text">{report.resolution.note}</p>{report.responseToReporter && <><h3>{t('response')}</h3><p className="admin-content-text">{report.responseToReporter}</p></>}</section>}
      <section className="admin-user-history admin-report-history"><h2>{t('history')}</h2>{report.history?.length ? <ol>{report.history.map((entry, i) => <li key={`${entry.at}-${i}`}><strong>{t(entry.action === 'start_review' || ['dismiss', 'warn_user', 'hide_content', 'lock_target', 'delete_content'].includes(entry.action) ? entry.action : 'resolve')}</strong><p>{entry.actorName || t('unspecified')} · {f.dateTime(new Date(entry.at), { dateStyle: 'medium', timeStyle: 'short' })}</p>{entry.toStatus && <span className="admin-badge">{t(entry.toStatus)}</span>}<p className="admin-content-text">{entry.note}</p></li>)}</ol> : <p>{t('noHistory')}</p>}</section>
    </>}
  </div>;
}
function ReportResolution({ report, busy, submit }: { report: z.infer<typeof reportSchema>; busy: boolean; submit: (input: z.infer<typeof resolutionSchema>) => void }) {
  const t = useTranslations('AdminContent'), actions = allowedReportActions(report.targetType); const [confirm, setConfirm] = useState<z.infer<typeof resolutionSchema> | null>(null);
  const form = useForm<z.infer<typeof resolutionSchema>>({ resolver: zodResolver(resolutionSchema), defaultValues: { action: actions[0], note: '', responseToReporter: '' } });
  return <form className="admin-access-panel admin-content-form" onSubmit={form.handleSubmit(setConfirm)}><h2>{t('resolve')}</h2><fieldset disabled={busy || Boolean(confirm)}><label>{t('action')}<select aria-label={t('action')} {...form.register('action')}>{actions.map(key => <option key={key} value={key}>{t(key)}</option>)}</select></label>{actions.length === 1 && <p>{t('limitedHint')}</p>}<label>{t('note')}<Textarea maxLength={2000} rows={4} aria-invalid={Boolean(form.formState.errors.note)} {...form.register('note')} /></label>{form.formState.errors.note && <p role="alert" className="admin-error">{t('required')}</p>}<label>{t('response')}<Textarea maxLength={2000} rows={3} {...form.register('responseToReporter')} /></label><p className="admin-content-muted">{t('responseHint')}</p><Button type="submit">{t('resolve')}</Button></fieldset>
    {confirm && <div className="admin-confirm-details" role="region" aria-label={t('confirm')}><h3>{t('confirm')}</h3><p>{t('confirmHint')}</p><strong>{t(confirm.action)}</strong>{confirm.action === 'warn_user' && <p>{t('warningHint')}</p>}<p className="admin-content-text">{confirm.note}</p>{confirm.responseToReporter && <p className="admin-content-text">{confirm.responseToReporter}</p>}<div className="admin-access-buttons"><Button type="button" disabled={busy} onClick={() => submit(confirm)}>{t('confirm')}</Button><Button type="button" variant="outline" disabled={busy} onClick={() => setConfirm(null)}>{t('cancel')}</Button></div></div>}
  </form>;
}
