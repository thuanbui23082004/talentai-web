'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { safeProfileUrlSchema } from '@/lib/api/candidate-detail-schemas';
import { interviewFormSchema, interviewFormToInput } from '@/features/applications';
import { getInterview } from '@/features/interviews/services/interview-management';
import { interviewKeys } from '@/features/interviews/query-keys';
import { useInterviewActions } from '@/features/interviews/hooks';
import { cancelInterviewSchema, type ManagedInterview } from '@/features/interviews/schemas';
import { ResultEditor } from '@/features/interviews/components/interview-results';
import { InterviewChoice, InterviewError, interviewTime } from '@/features/interviews/components/interview-shared';
import './interview-management.css';

function EditInterview({ interview, close }: { interview: ManagedInterview; close: (saved?: boolean) => void }) {
  const t = useTranslations('Interviews'); const actions = useInterviewActions(interview.id);
  const local = (value: string) => new Date(new Date(value).getTime() + 7 * 3600000).toISOString().slice(0, 16);
  const form = useForm<z.infer<typeof interviewFormSchema>>({ resolver: zodResolver(interviewFormSchema), defaultValues: { start: local(interview.startTime), end: local(interview.endTime), mode: interview.mode, round: interview.round ?? '', location: interview.location ?? '', meetingUrl: interview.meetingUrl ?? '', participants: interview.interviewers?.join(', ') ?? '', message: interview.message ?? '', sendInvitation: true } });
  const mode = useWatch({ control: form.control, name: 'mode' });
  return <form className="interview-edit-form" aria-label={t('edit')} noValidate onSubmit={form.handleSubmit(async values => {
    const input = interviewFormToInput(interview.applicationId, values);
    try { await actions.update.mutateAsync({ startTime: input.startTime, endTime: input.endTime, mode: input.mode, location: input.location, meetingUrl: input.meetingUrl, interviewers: input.interviewers, message: values.message }); close(true); } catch {}
  })}><h2>{t('edit')}</h2><p>{t('editHint')}</p><fieldset disabled={actions.update.isPending}><div className="interview-edit-grid"><label>{t('start')}<Input type="datetime-local" {...form.register('start')} /></label><label>{t('end')}<Input type="datetime-local" {...form.register('end')} /></label><Controller name="mode" control={form.control} render={({ field }) => <InterviewChoice label={t('mode')} value={field.value} change={field.onChange} items={(['online', 'offline'] as const).map(value => ({ value, label: t(value) }))} />} />
    {mode === 'online' ? <label>{t('meetingUrl')}<Input {...form.register('meetingUrl')} /></label> : <label>{t('location')}<Input {...form.register('location')} /></label>}
    <label>{t('interviewers')}<Input {...form.register('participants')} /></label></div><label>{t('message')}<Textarea {...form.register('message')} maxLength={3000} rows={4} /></label>
    {Object.keys(form.formState.errors).length > 0 && <p role="alert">{t('errors.invalid')}</p>}{actions.update.error && <InterviewError error={actions.update.error} />}<div className="interview-action-row"><Button type="submit">{t(actions.update.isPending ? 'saving' : 'save')}</Button><Button type="button" variant="outline" onClick={() => close()}>{t('cancelEdit')}</Button></div></fieldset></form>;
}
function DetailContent({ interview }: { interview: ManagedInterview }) {
  const t = useTranslations('Interviews'); const actions = useInterviewActions(interview.id);
  const [action, setAction] = useState<'edit' | 'send' | 'cancel' | 'result' | null>(null);
  const [notice, setNotice] = useState<'updated' | 'sent' | 'cancelledNotice' | null>(null);
  const cancelForm = useForm<z.infer<typeof cancelInterviewSchema>>({ resolver: zodResolver(cancelInterviewSchema), defaultValues: { reason: '' } });
  const busy = actions.send.isPending || actions.cancel.isPending;
  const scheduled = interview.status === 'scheduled';
  const meeting = safeProfileUrlSchema.safeParse(interview.meetingUrl);
  const open = (next: typeof action) => { actions.send.reset(); actions.cancel.reset(); cancelForm.reset(); setNotice(null); setAction(next); };
  return <><header className="interview-page-heading"><div><h1>{t('detail')}</h1><p>{interview.candidate?.fullName ?? t('unknown')} · {interview.jobTitle ?? t('unknown')}</p></div><span className="interview-result-badge">{t(interview.status)}</span></header>
    {notice && <p role="status" className="interview-notice">{t(notice)}</p>}
    <section className="interview-detail-panel"><div className="interview-action-row">{scheduled && <><Button disabled={busy} onClick={() => open('edit')}>{t('edit')}</Button><Button variant="outline" disabled={busy} onClick={() => open('send')}>{t(interview.invitationStatus === 'draft' ? 'send' : 'resend')}</Button><Button variant="outline" disabled={busy} onClick={() => open('cancel')}>{t('cancel')}</Button></>}{interview.status !== 'cancelled' && <Button variant="outline" disabled={busy} onClick={() => open('result')}>{t(interview.result ? 'editResult' : 'record')}</Button>}</div>
      <dl className="interview-detail-fields"><div><dt>{t('candidate')}</dt><dd><Link href={`/recruiter/candidates/${interview.applicationId}`}>{interview.candidate?.fullName ?? t('profile')}</Link></dd></div><div><dt>{t('job')}</dt><dd>{interview.jobId ? <Link href={`/recruiter/jobs/${interview.jobId}`}>{interview.jobTitle ?? t('unknown')}</Link> : t('unknown')}</dd></div><div><dt>{t('round')}</dt><dd>{interview.round || t('unknown')}</dd></div><div><dt>{t('time')}</dt><dd>{interviewTime(interview.startTime)} – {interviewTime(interview.endTime)}</dd></div><div><dt>{t('mode')}</dt><dd>{t(interview.mode)}</dd></div><div><dt>{t('invitation')}</dt><dd>{t(interview.invitationStatus)}</dd></div><div><dt>{t(interview.mode === 'online' ? 'meetingUrl' : 'location')}</dt><dd>{interview.mode === 'online' ? meeting.success ? <a href={meeting.data} target="_blank" rel="noopener noreferrer">{t('join')}</a> : t('unknown') : interview.location || t('unknown')}</dd></div><div><dt>{t('interviewers')}</dt><dd>{interview.interviewers?.join(', ') || t('unknown')}</dd></div><div><dt>{t('message')}</dt><dd>{interview.message || t('unknown')}</dd></div></dl>
      {interview.cancelReason && <div className="interview-cancel-reason"><h2>{t('cancelReason')}</h2><p>{interview.cancelReason}</p></div>}
    </section>
    {action === 'edit' && scheduled && <section className="interview-detail-panel"><EditInterview key={interview.updatedAt ?? interview.id} interview={interview} close={saved => { setAction(null); if (saved) setNotice('updated'); }} /></section>}
    {action === 'send' && scheduled && <section className="interview-detail-panel"><h2>{t('sendTitle')}</h2><p>{t('sendDescription')}</p>{actions.send.error && <InterviewError error={actions.send.error} />}<div className="interview-action-row"><Button disabled={busy} onClick={async () => { try { await actions.send.mutateAsync(); setAction(null); setNotice('sent'); } catch {} }}>{t(busy ? 'saving' : 'confirmSend')}</Button><Button variant="outline" disabled={busy} onClick={() => setAction(null)}>{t('dismiss')}</Button></div></section>}
    {action === 'cancel' && scheduled && <section className="interview-detail-panel"><h2>{t('cancelTitle')}</h2><form noValidate onSubmit={cancelForm.handleSubmit(async values => { try { await actions.cancel.mutateAsync(values.reason); setAction(null); setNotice('cancelledNotice'); } catch {} })}><label>{t('reason')}<Textarea {...cancelForm.register('reason')} maxLength={500} rows={3} disabled={busy} /></label>{cancelForm.formState.errors.reason && <p role="alert">{t('errors.invalid')}</p>}{actions.cancel.error && <InterviewError error={actions.cancel.error} />}<div className="interview-action-row"><Button type="submit" disabled={busy}>{t(busy ? 'saving' : 'confirmCancel')}</Button><Button type="button" variant="outline" disabled={busy} onClick={() => setAction(null)}>{t('dismiss')}</Button></div></form></section>}
    <section className="interview-detail-panel"><h2>{t('result')}</h2>{interview.result ? <><strong className="interview-result-badge">{t(interview.result)}</strong>{interview.resultNote && <p className="interview-result-note">{interview.resultNote}</p>}</> : <p>{t('noResult')}</p>}{action === 'result' && interview.status !== 'cancelled' && <ResultEditor interview={interview} close={() => setAction(null)} />}</section>
  </>;
}
export function InterviewDetailPage({ id }: { id: string }) {
  const t = useTranslations('Interviews');
  const query = useQuery({ queryKey: interviewKeys.detail(id), queryFn: () => getInterview(id), retry: false });
  return <div className="interview-page"><Link className="interview-back" href="/recruiter/interviews">← {t('back')}</Link>{query.isPending ? <div className="interview-loading" aria-busy="true" aria-label={t('loading')} /> : query.isError ? <InterviewError error={query.error} retry={() => void query.refetch()} /> : query.data && <DetailContent key={id} interview={query.data} />}</div>;
}
