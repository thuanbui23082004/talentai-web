'use client';
import { useState, type ReactNode } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CandidateDetail } from '@/lib/api/candidate-detail-schemas';
import { evaluationFormSchema, interviewFormSchema, interviewFormToInput, statusFormSchema } from '@/features/applications/schemas/candidate-detail-forms';
import { useCandidateActions } from '@/features/applications/hooks/use-candidate-detail';
import { CandidateRequestError } from '@/features/applications/errors';

function Field({ label, children, error }: { label: string; children: ReactNode; error?: string }) {
  const t = useTranslations('CandidateDetail');
  return <div className="candidate-form-field"><label className="candidate-form-field"><span>{label}</span>{children}</label>{error && <span role="alert" className="field-error">{t(error)}</span>}</div>;
}
function Choice({ value, items, onChange, label }: { value: string; items: { value: string; label: string }[]; onChange: (value: string) => void; label: string }) {
  return <Select value={value} items={items} onValueChange={next => onChange(next ?? '')}><SelectTrigger aria-label={label}><SelectValue /></SelectTrigger><SelectContent>{items.map(item => <SelectItem value={item.value} key={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>;
}
function FormError({ error }: { error: unknown }) {
  const t = useTranslations('CandidateDetail');
  if (!error) return null;
  const key = error instanceof CandidateRequestError && ['invalidTransition', 'interviewConflict', 'sessionRetry', 'conflict'].includes(error.messageKey) ? error.messageKey : 'error';
  return <p role="alert" className="field-error candidate-action-error">{t(key)}</p>;
}
export function StatusForm({ application, rounds, onDone }: { application: CandidateDetail; rounds: string[]; onDone: () => void }) {
  const t = useTranslations('CandidateDetail');
  const statuses = useTranslations('Candidates.statuses');
  const { status } = useCandidateActions(application.id);
  const form = useForm<z.infer<typeof statusFormSchema>>({ resolver: zodResolver(statusFormSchema), defaultValues: { status: application.status === 'withdrawn' ? 'reviewing' : application.status, round: application.currentRound ?? '', note: '', confirmed: false } });
  return <form className="candidate-action-form" onSubmit={form.handleSubmit(async values => { try { await status.mutateAsync({ status: values.status, round: values.round || undefined, note: values.note || undefined, notifyCandidate: true }); onDone(); } catch {} })} noValidate>
    <h2>{t('statusHeading')}</h2><div className="candidate-form-grid"><Controller control={form.control} name="status" render={({ field }) => <Field label={t('status')}><Choice label={t('status')} value={field.value} onChange={field.onChange} items={(['submitted', 'reviewing', 'interview', 'rejected', 'hired'] as const).map(value => ({ value, label: statuses(value) }))} /></Field>} /><Controller control={form.control} name="round" render={({ field }) => <Field label={t('round')}><Choice label={t('round')} value={field.value} onChange={field.onChange} items={[{ value: '', label: t('noRound') }, ...rounds.map(value => ({ value, label: value }))]} /></Field>} /></div><Field label={t('note')} error={form.formState.errors.note?.message}><Textarea {...form.register('note')} maxLength={2000} /></Field><p className="candidate-action-hint">{t('confirmHint')}</p><Controller control={form.control} name="confirmed" render={({ field }) => <label className="candidate-form-check"><Checkbox checked={field.value} onCheckedChange={field.onChange} />{t('confirmation')}</label>} />{form.formState.errors.confirmed && <p role="alert" className="field-error">{t('required')}</p>}<FormError error={status.error} /><Button type="submit" disabled={status.isPending}>{t(status.isPending ? 'saving' : 'save')}</Button>
  </form>;
}
export function EvaluationForm({ application, onDone }: { application: CandidateDetail; onDone: () => void }) {
  const t = useTranslations('CandidateDetail');
  const { evaluation } = useCandidateActions(application.id);
  const form = useForm<z.infer<typeof evaluationFormSchema>>({ resolver: zodResolver(evaluationFormSchema), defaultValues: { rating: String(application.evaluation?.rating ?? 3), classification: application.evaluation?.classification ?? 'consider', note: application.evaluation?.note ?? '', tags: application.evaluation?.tags?.join(', ') ?? '' } });
  return <form className="candidate-action-form" onSubmit={form.handleSubmit(async values => { try { await evaluation.mutateAsync({ rating: Number(values.rating), classification: values.classification, note: values.note, tags: values.tags.split(',').map(value => value.trim()).filter(Boolean) }); onDone(); } catch {} })} noValidate><h2>{t('evaluationHeading')}</h2><div className="candidate-form-grid"><Controller control={form.control} name="rating" render={({ field }) => <Field label={t('rating')}><Choice label={t('rating')} value={field.value} onChange={field.onChange} items={[1, 2, 3, 4, 5].map(value => ({ value: String(value), label: `${value}/5` }))} /></Field>} /><Controller control={form.control} name="classification" render={({ field }) => <Field label={t('classification')}><Choice label={t('classification')} value={field.value} onChange={field.onChange} items={(['potential', 'consider', 'not_suitable'] as const).map(value => ({ value, label: t(`classifications.${value}`) }))} /></Field>} /></div><Field label={t('tags')}><Input {...form.register('tags')} placeholder={t('tagsHint')} /></Field><Field label={t('note')} error={form.formState.errors.note?.message}><Textarea {...form.register('note')} maxLength={2000} /></Field><FormError error={evaluation.error} /><Button type="submit" disabled={evaluation.isPending}>{t(evaluation.isPending ? 'saving' : 'save')}</Button></form>;
}
export function InterviewForm({ application, rounds, onDone }: { application: CandidateDetail; rounds: string[]; onDone: () => void }) {
  const t = useTranslations('CandidateDetail');
  const { interview } = useCandidateActions(application.id);
  const [retryKey, setRetryKey] = useState<{ body: string; key: string } | null>(null);
  const form = useForm<z.infer<typeof interviewFormSchema>>({ resolver: zodResolver(interviewFormSchema), defaultValues: { start: '', end: '', mode: 'online', round: application.currentRound ?? '', location: '', meetingUrl: '', participants: '', message: '', sendInvitation: true } });
  return <form className="candidate-action-form" onSubmit={form.handleSubmit(async values => {
    const input = interviewFormToInput(application.id, values);
    const body = JSON.stringify(input);
    const key = retryKey?.body === body ? retryKey.key : crypto.randomUUID();
    setRetryKey({ body, key });
    try { await interview.mutateAsync({ input, key }); onDone(); } catch {}
  })} noValidate><h2>{t('interviewHeading')}</h2><div className="candidate-form-grid"><Field label={t('start')} error={form.formState.errors.start?.message}><Input type="datetime-local" {...form.register('start')} /></Field><Field label={t('end')} error={form.formState.errors.end?.message}><Input type="datetime-local" {...form.register('end')} /></Field><Controller control={form.control} name="mode" render={({ field }) => <Field label={t('mode')}><Choice label={t('mode')} value={field.value} onChange={field.onChange} items={(['online', 'offline'] as const).map(value => ({ value, label: t(value) }))} /></Field>} /><Controller control={form.control} name="round" render={({ field }) => <Field label={t('round')}><Choice label={t('round')} value={field.value} onChange={field.onChange} items={[{ value: '', label: t('noRound') }, ...rounds.map(value => ({ value, label: value }))]} /></Field>} /></div><Field label={t('meetingUrl')} error={form.formState.errors.meetingUrl?.message}><Input type="url" {...form.register('meetingUrl')} /></Field><Field label={t('interviewLocation')} error={form.formState.errors.location?.message}><Input {...form.register('location')} /></Field><Field label={t('participants')}><Input {...form.register('participants')} placeholder={t('participantsHint')} /></Field><Field label={t('message')} error={form.formState.errors.message?.message}><Textarea {...form.register('message')} maxLength={3000} /></Field><Controller control={form.control} name="sendInvitation" render={({ field }) => <label className="candidate-form-check"><Checkbox checked={field.value} onCheckedChange={field.onChange} />{t('sendInvitation')}</label>} /><FormError error={interview.error} /><Button type="submit" disabled={interview.isPending}>{t(interview.isPending ? 'saving' : 'createInterview')}</Button></form>;
}
