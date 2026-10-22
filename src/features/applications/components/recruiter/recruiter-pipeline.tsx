'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePipelineColumn, usePipelineMove } from '@/features/applications/hooks/use-pipeline';
import { pipelineStages, canMoveApplication, type ApplicationStatus, type PipelineStage } from '@/features/applications/pipeline';
import type { RecruiterApplication } from '@/features/applications/types';
import { PipelineCard } from '@/features/applications/components/recruiter/pipeline-card';
import { PipelineMovePanel, PipelinePicker } from '@/features/applications/components/recruiter/pipeline-action-panels';
import './recruiter-pipeline.css';

function PipelineColumn({ stage, disabled, dragging, onMove, onPick, onDragStart, onDragEnd }: {
  stage: ApplicationStatus; disabled: boolean; dragging: RecruiterApplication | null;
  onMove: (application: RecruiterApplication, stage: PipelineStage) => void; onPick: (stage: PipelineStage) => void;
  onDragStart: (application: RecruiterApplication) => void; onDragEnd: () => void;
}) {
  const t = useTranslations('Pipeline');
  const query = usePipelineColumn(stage);
  const [over, setOver] = useState(false);
  const total = query.data?.pages[0]?.meta.totalItems;
  const items = [...new Map(query.data?.pages.flatMap(page => page.items).map(application => [application.id, application]) ?? []).values()];
  const target = stage === 'withdrawn' ? undefined : stage;
  const droppable = !disabled && !!dragging && target !== undefined && canMoveApplication(dragging.status, target);
  return <section className={`pipeline-column${droppable && over ? ' pipeline-column-over' : ''}${stage === 'withdrawn' ? ' pipeline-withdrawn' : ''}`} data-stage={stage} aria-label={t('column', { stage: t(`stages.${stage}`) })}
    onDragOver={event => { if (droppable) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setOver(true); } }}
    onDragLeave={event => { if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setOver(false); }}
    onDrop={event => { event.preventDefault(); setOver(false); if (droppable && dragging && target) onMove(dragging, target); onDragEnd(); }}>
    <header className="pipeline-column-heading"><h2>{t(`stages.${stage}`)}</h2><span aria-label={total === undefined ? t('loading') : t('count', { count: total })}>{total ?? '—'}</span>{target && <Button variant="ghost" size="icon-xs" disabled={disabled} aria-label={t('add', { stage: t(`stages.${stage}`) })} onClick={() => onPick(target)}><Plus size={15} /></Button>}</header>
    {stage === 'withdrawn' && <p className="pipeline-withdrawn-hint">{t('withdrawnHint')}</p>}
    {query.isPending ? <div className="pipeline-column-skeleton" aria-label={t('loading')} aria-busy="true"><span /><span /><span /></div> : query.isError && !query.data ? <div className="pipeline-column-state" role="alert"><p>{t('error')}</p><Button size="sm" variant="outline" onClick={() => void query.refetch()}>{t('retry')}</Button></div> : <>
      <div className="pipeline-column-cards" aria-busy={query.isFetching}>{items.length ? items.map(application => <PipelineCard application={application} key={application.id} disabled={disabled || query.isFetching} onMove={onMove} onDragStart={onDragStart} onDragEnd={onDragEnd} />) : <p className="pipeline-column-state">{t('empty')}</p>}</div>
      {query.isError && <div className="pipeline-column-state" role="alert"><p>{t('error')}</p><Button size="sm" variant="outline" onClick={() => void (query.isFetchNextPageError ? query.fetchNextPage() : query.refetch())}>{t('retry')}</Button></div>}
      {query.hasNextPage && !query.isError && <Button className="pipeline-load-more" variant="ghost" size="sm" disabled={query.isFetching} onClick={() => void query.fetchNextPage()}>{t(query.isFetchingNextPage ? 'loadingMore' : 'more')}</Button>}
    </>}
  </section>;
}

export function RecruiterPipeline() {
  const t = useTranslations('Pipeline');
  const mutation = usePipelineMove();
  const [dragging, setDragging] = useState<RecruiterApplication | null>(null);
  const [selection, setSelection] = useState<{ application: RecruiterApplication; target: PipelineStage } | null>(null);
  const [picker, setPicker] = useState<PipelineStage | null>(null);
  const [notice, setNotice] = useState<{ name: string; stage: PipelineStage } | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const boardLink = useRef<HTMLAnchorElement>(null);
  useEffect(() => { if (selection || picker) panel.current?.scrollIntoView({ block: 'start' }); }, [selection, picker]);
  function move(application: RecruiterApplication, target: PipelineStage) {
    if (mutation.isPending || !canMoveApplication(application.status, target)) return;
    mutation.reset(); setNotice(null); setPicker(null); setDragging(null); setSelection({ application, target });
  }
  function close() { setPicker(null); setSelection(null); mutation.reset(); boardLink.current?.focus({ preventScroll: true }); }
  const disabled = mutation.isPending || selection !== null || picker !== null;
  const columnProps = { disabled, dragging, onMove: move, onPick: (target: PipelineStage) => { setNotice(null); setSelection(null); setPicker(target); }, onDragStart: setDragging, onDragEnd: () => setDragging(null) };
  return <div className="pipeline-page"><header className="pipeline-page-heading"><h1>{t('heading')}</h1><Link ref={boardLink} className="pipeline-back" href="/recruiter/candidates"><ArrowLeft size={14} />{t('back')}</Link></header>
    {notice && <p className="pipeline-notice" role="status">{t('saved', { name: notice.name, stage: t(`stages.${notice.stage}`) })}</p>}
    <div className="pipeline-panel-anchor" ref={panel}>{selection && <PipelineMovePanel key={`${selection.application.id}-${selection.target}`} application={selection.application} target={selection.target} mutation={mutation} onCancel={close} onDone={() => { setNotice({ name: selection.application.candidate.fullName, stage: selection.target }); close(); }} />}{picker && <PipelinePicker key={picker} target={picker} onSelect={move} onCancel={close} />}</div>
    <div className="pipeline-board-scroll" role="region" aria-label={t('board')} tabIndex={0}><div className="pipeline-board">{pipelineStages.map(stage => <PipelineColumn key={stage} stage={stage} {...columnProps} />)}</div></div>
    <PipelineColumn stage="withdrawn" {...columnProps} />
  </div>;
}
