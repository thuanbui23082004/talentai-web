'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { CandidateRequestError } from '@/features/applications/errors';
import { useRecruiterApplications } from '@/features/applications/hooks/use-recruiter-applications';
import { candidateSearchSchema } from '@/lib/api/application-schemas';
import { isFinalStage, pipelineMoveSchema, pipelineStages, type PipelineStage } from '@/features/applications/pipeline';
import type { RecruiterApplication } from '@/features/applications/types';
import type { usePipelineMove } from '@/features/applications/hooks/use-pipeline';

export function PipelineMovePanel({ application, target, mutation, onCancel, onDone }: {
  application: RecruiterApplication; target: PipelineStage; mutation: ReturnType<typeof usePipelineMove>;
  onCancel: () => void; onDone: () => void;
}) {
  const t = useTranslations('Pipeline');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  const form = useForm<z.infer<typeof pipelineMoveSchema>>({ resolver: zodResolver(pipelineMoveSchema), defaultValues: { from: application.status, to: target, confirmed: false } });
  const errorKey = mutation.error instanceof CandidateRequestError && ['invalidTransition', 'sessionRetry'].includes(mutation.error.messageKey) ? mutation.error.messageKey : 'moveError';
  return <section className="pipeline-action-panel" aria-labelledby="pipeline-move-heading">
    <h2 id="pipeline-move-heading" tabIndex={-1} ref={heading}>{t('moveHeading')}</h2>
    <p>{t('moveDescription', { name: application.candidate.fullName, from: t(`stages.${application.status}`), to: t(`stages.${target}`) })}</p>
    <form noValidate onSubmit={form.handleSubmit(async values => { try { await mutation.mutateAsync({ application, values }); onDone(); } catch { /* The form retains the selection and shows the mapped error. */ } })}>
      {isFinalStage(target) && <><p>{t('finalHint')}</p><Controller control={form.control} name="confirmed" render={({ field }) => <label className="pipeline-confirmation"><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={mutation.isPending} />{t('confirmation')}</label>} />{form.formState.errors.confirmed && <p role="alert" className="pipeline-error">{t('confirmRequired')}</p>}</>}
      {form.formState.errors.to && <p role="alert" className="pipeline-error">{t('invalidMove')}</p>}
      {mutation.isError && <p role="alert" className="pipeline-error">{t(errorKey)}</p>}
      <div className="pipeline-panel-buttons"><Button type="button" variant="outline" disabled={mutation.isPending} onClick={onCancel}>{t('cancel')}</Button><Button type="submit" disabled={mutation.isPending}>{t(mutation.isPending ? 'saving' : 'confirm')}</Button></div>
    </form>
  </section>;
}

export function PipelinePicker({ target, onSelect, onCancel }: { target: PipelineStage; onSelect: (application: RecruiterApplication, stage: PipelineStage) => void; onCancel: () => void }) {
  const t = useTranslations('Pipeline');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { input.current?.focus(); }, []);
  useEffect(() => { const timer = setTimeout(() => setDebounced(search), 300); return () => clearTimeout(timer); }, [search]);
  const raw = candidateSearchSchema.safeParse(search);
  const parsed = candidateSearchSchema.safeParse(debounced);
  const valid = raw.success && parsed.success;
  const results = useRecruiterApplications({ status: pipelineStages.filter(stage => stage !== target), q: parsed.success ? parsed.data || undefined : undefined, page, pageSize: 5, sort: 'applied_desc' }, valid);
  const updating = results.isFetching || search !== debounced;
  return <section className="pipeline-action-panel" aria-labelledby="pipeline-picker-heading"><h2 id="pipeline-picker-heading">{t('pickerHeading', { stage: t(`stages.${target}`) })}</h2><p>{t('pickerHint')}</p><label className="pipeline-search"><span>{t('search')}</span><Input ref={input} value={search} maxLength={200} aria-invalid={!raw.success} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder={t('searchPlaceholder')} /></label>
    {!valid ? <p role="alert" className="pipeline-error">{t('privateSearch')}</p> : results.isError ? <div role="alert"><p>{t('error')}</p><Button size="sm" variant="outline" onClick={() => void results.refetch()}>{t('retry')}</Button></div> : results.isPending ? <p aria-busy="true">{t('loading')}</p> : <div aria-busy={updating}>{results.data?.items.length ? <ul className="pipeline-picker-list">{results.data.items.map(application => <li key={application.id}><div><strong>{application.candidate.fullName}</strong><small>{application.jobTitle || t('unknownPosition')} · {t(`stages.${application.status}`)}</small></div><Button size="sm" variant="outline" aria-label={t('select', { name: application.candidate.fullName })} disabled={updating} onClick={() => onSelect(application, target)}>{t('move')}</Button></li>)}</ul> : <p>{t('noResults')}</p>}<div className="pipeline-picker-pagination"><Button size="sm" variant="ghost" disabled={page === 1 || updating} onClick={() => setPage(value => value - 1)}>{t('previous')}</Button><span>{t('page', { page })}</span><Button size="sm" variant="ghost" disabled={page >= (results.data?.meta.totalPages ?? 0) || updating} onClick={() => setPage(value => value + 1)}>{t('next')}</Button></div></div>}
    <div className="pipeline-panel-buttons"><Button variant="outline" onClick={onCancel}>{t('cancel')}</Button></div>
  </section>;
}
