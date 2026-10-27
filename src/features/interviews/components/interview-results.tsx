'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { interviewResultInputSchema, interviewSchema } from '@/lib/api/candidate-detail-schemas';
import { listInterviewResults, saveInterviewResult } from '@/features/interviews/services/interview-results';
import { recruiterApplicationKeys } from '@/features/applications/query-keys';
import { CandidateRequestError } from '@/features/applications/errors';
import './interview-results.css';
import { interviewKeys } from '@/features/interviews/query-keys';
type Interview = z.infer<typeof interviewSchema>;
const results = ['passed', 'failed', 'need_more'] as const;
const key = (id: string) => [...recruiterApplicationKeys.all, 'interviews', id];
export function ResultEditor({ interview, close }: { interview: Interview; close: (saved?: boolean) => void }) {
  const t = useTranslations('InterviewResults'); const client = useQueryClient();
  const form = useForm<z.infer<typeof interviewResultInputSchema>>({ resolver: zodResolver(interviewResultInputSchema), defaultValues: { result: interview.result, note: interview.resultNote ?? '' } });
  const mutation = useMutation({ mutationFn: (input: z.infer<typeof interviewResultInputSchema>) => saveInterviewResult(interview.id, input), retry: false,
    onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: recruiterApplicationKeys.all }), client.invalidateQueries({ queryKey: interviewKeys.all })]); close(true); },
  });
  return <form className="interview-result-form" aria-label={t('record')} noValidate onSubmit={form.handleSubmit(values => mutation.mutate(values))}>
    <Controller name="result" control={form.control} render={({ field }) => <Select value={field.value ?? ''} onValueChange={value => { field.onChange(value); mutation.reset(); }} items={results.map(value => ({ value, label: t(value) }))}><SelectTrigger aria-label={t('result')} aria-invalid={!!form.formState.errors.result}><SelectValue placeholder={t('choose')} /></SelectTrigger><SelectContent>{results.map(value => <SelectItem key={value} value={value}>{t(value)}</SelectItem>)}</SelectContent></Select>} />
    <label htmlFor={`interview-note-${interview.id}`}>{t('note')}</label><Textarea id={`interview-note-${interview.id}`} {...form.register('note')} maxLength={2000} rows={4} />
    {Object.keys(form.formState.errors).length > 0 && <p role="alert">{t('invalid')}</p>}
    {mutation.error && <p role="alert">{t(mutation.error instanceof CandidateRequestError && mutation.error.status === 401 ? 'session' : 'error')}</p>}
    <div className="interview-result-actions"><Button type="submit" size="sm" disabled={mutation.isPending}>{t(mutation.isPending ? 'saving' : 'save')}</Button><Button type="button" size="sm" variant="outline" disabled={mutation.isPending} onClick={() => close()}>{t('cancel')}</Button></div>
  </form>;
}
export function InterviewResults({ applicationId }: { applicationId: string }) {
  const t = useTranslations('InterviewResults');
  const query = useQuery({ queryKey: key(applicationId), queryFn: () => listInterviewResults(applicationId), retry: false });
  const [editing, setEditing] = useState<string | null>(null); const [saved, setSaved] = useState(false);
  const date = (value: string) => new Intl.DateTimeFormat('vi', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value));
  return <section className="candidate-detail-panel interview-results" aria-label={t('title')}><h2>{t('title')}</h2>
    {saved && <p role="status" className="interview-result-notice">{t('saved')}</p>}
    {query.isPending ? <div className="interview-result-skeleton" aria-busy="true" aria-label={t('loading')} /> : query.isError ? <div role="alert"><p>{t('error')}</p><Button variant="outline" size="sm" onClick={() => void query.refetch()}>{t('retry')}</Button></div> : !query.data?.items.length ? <p className="candidate-detail-empty">{t('empty')}</p> : <ol className="interview-result-list">{[...query.data.items].sort((a, b) => b.startTime.localeCompare(a.startTime)).map(interview => <li key={interview.id}><div className="interview-result-heading"><h3>{interview.round || t('round')}</h3><span className={`interview-result-badge result-${interview.result ?? interview.status}`}>{t(interview.result ?? interview.status)}</span></div><p className="interview-result-time"><time dateTime={interview.startTime}>{date(interview.startTime)}</time> · {t(interview.mode)}</p>{interview.resultNote && <p className="interview-result-note">{interview.resultNote}</p>}
      <Link className="interview-result-link" href={`/recruiter/interviews/${interview.id}`}>{t('detail')}</Link>
      {editing === interview.id ? <ResultEditor interview={interview} close={success => { setEditing(null); setSaved(!!success); }} /> : interview.status !== 'cancelled' && <Button size="sm" variant="outline" onClick={() => { setSaved(false); setEditing(interview.id); }}>{t(interview.result ? 'edit' : 'record')}</Button>}
    </li>)}</ol>}
  </section>;
}
