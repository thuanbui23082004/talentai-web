'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Plus } from 'lucide-react';
import { DndContext, DragOverlay, MouseSensor, TouchSensor, KeyboardSensor, pointerWithin, rectIntersection, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { recruiterApplicationSchema } from '@/lib/api/application-schemas';
import { Button } from '@/components/ui/button';
import { usePipelineColumn, usePipelineMove } from '@/features/applications/hooks/use-pipeline';
import { pipelineStages, canMoveApplication, isFinalStage, type ApplicationStatus, type PipelineStage } from '@/features/applications/pipeline';
import type { RecruiterApplication } from '@/features/applications/types';
import { PipelineCard } from '@/features/applications/components/recruiter/pipeline-card';
import { PipelineMovePanel, PipelinePicker } from '@/features/applications/components/recruiter/pipeline-action-panels';
import './recruiter-pipeline.css';

function PipelineColumn({ stage, disabled, dragging, onMove, onPick }: {
  stage: ApplicationStatus; disabled: boolean; dragging: RecruiterApplication | null;
  onMove: (application: RecruiterApplication, stage: PipelineStage) => void; onPick: (stage: PipelineStage) => void;
}) {
  const t = useTranslations('Pipeline');
  const query = usePipelineColumn(stage);
  const total = query.data?.pages[0]?.meta.totalItems;
  const items = [...new Map(query.data?.pages.flatMap(page => page.items).map(application => [application.id, application]) ?? []).values()];
  const target = stage === 'withdrawn' ? undefined : stage;
  const droppable = !disabled && target !== undefined && (!dragging || canMoveApplication(dragging.status, target));
  const { setNodeRef, isOver } = useDroppable({ id: stage, disabled: !droppable });
  return <section ref={setNodeRef} className={`pipeline-column${isOver && droppable ? ' pipeline-column-over' : ''}${stage === 'withdrawn' ? ' pipeline-withdrawn' : ''}`} data-stage={stage} aria-label={t('column', { stage: t(`stages.${stage}`) })}>
    <header className="pipeline-column-heading"><h2>{t(`stages.${stage}`)}</h2><span aria-label={total === undefined ? t('loading') : t('count', { count: total })}>{total ?? '—'}</span>{target && <Button variant="ghost" size="icon-xs" disabled={disabled} aria-label={t('add', { stage: t(`stages.${stage}`) })} onClick={() => onPick(target)}><Plus size={15} /></Button>}</header>
    {stage === 'withdrawn' && <p className="pipeline-withdrawn-hint">{t('withdrawnHint')}</p>}
    {query.isPending ? <div className="pipeline-column-skeleton" aria-label={t('loading')} aria-busy="true"><span /><span /><span /></div> : query.isError && !query.data ? <div className="pipeline-column-state" role="alert"><p>{t('error')}</p><Button size="sm" variant="outline" onClick={() => void query.refetch()}>{t('retry')}</Button></div> : <>
      <div className="pipeline-column-cards" aria-busy={query.isFetching}>{items.length ? items.map(application => <PipelineCard application={application} key={application.id} disabled={disabled || query.isFetching} onMove={onMove} />) : <p className="pipeline-column-state">{t('empty')}</p>}</div>
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
  const [failedDrop, setFailedDrop] = useState<{ application: RecruiterApplication; target: PipelineStage } | null>(null);
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }), useSensor(KeyboardSensor));
  const panel = useRef<HTMLDivElement>(null);
  const boardLink = useRef<HTMLAnchorElement>(null);
  useEffect(() => { if (selection || picker) panel.current?.scrollIntoView({ block: 'start' }); }, [selection, picker]);
  function move(application: RecruiterApplication, target: PipelineStage) {
    if (mutation.isPending || !canMoveApplication(application.status, target)) return;
    mutation.reset(); setFailedDrop(null); setNotice(null); setPicker(null); setDragging(null); setSelection({ application, target });
  }
  function saveDrop(application: RecruiterApplication, target: PipelineStage) {
    setNotice(null); setFailedDrop(null);
    mutation.mutate({ application, values: { from: application.status, to: target, confirmed: false } }, {
      onSuccess: () => setNotice({ name: application.candidate.fullName, stage: target }),
      onError: () => setFailedDrop({ application, target }),
    });
  }
  function close() { setPicker(null); setSelection(null); mutation.reset(); boardLink.current?.focus({ preventScroll: true }); }
  const disabled = mutation.isPending || selection !== null || picker !== null;
  const columnProps = { disabled, dragging, onMove: move, onPick: (target: PipelineStage) => { setNotice(null); setFailedDrop(null); setSelection(null); setPicker(target); } };
  return <DndContext id="recruiter-pipeline" sensors={sensors} collisionDetection={args => args.pointerCoordinates ? pointerWithin(args) : rectIntersection(args)}
    accessibility={{ screenReaderInstructions: { draggable: t('dragInstructions') }, announcements: { onDragStart: () => t('dragStarted'), onDragOver: ({ over }) => { const stage = pipelineStages.find(stage => stage === over?.id); return stage ? t('dragOver', { stage: t(`stages.${stage}`) }) : t('dragOutside'); }, onDragEnd: () => t('dragEnded'), onDragCancel: () => t('dragCancelled') } }}
    onDragStart={event => { const parsed = recruiterApplicationSchema.safeParse(event.active.data.current?.application); if (parsed.success && !disabled) { setDragging(parsed.data); setNotice(null); } }}
    onDragCancel={() => setDragging(null)}
    onDragEnd={event => { const target = pipelineStages.find(stage => stage === event.over?.id); setDragging(null); if (!dragging || !target || disabled || !canMoveApplication(dragging.status, target)) return; if (isFinalStage(target)) move(dragging, target); else saveDrop(dragging, target); }}>
    <div className="pipeline-page"><header className="pipeline-page-heading"><h1>{t('heading')}</h1><Link ref={boardLink} className="pipeline-back" href="/recruiter/candidates"><ArrowLeft size={14} />{t('back')}</Link></header>
    {notice && <p className="pipeline-notice" role="status">{t('saved', { name: notice.name, stage: t(`stages.${notice.stage}`) })}</p>}
    {mutation.isPending && !selection && <p className="pipeline-notice" role="status">{t('saving')}</p>}
    {failedDrop && <div className="pipeline-notice pipeline-drop-error" role="alert"><p>{t('moveError')}</p><Button variant="outline" size="sm" onClick={() => saveDrop(failedDrop.application, failedDrop.target)}>{t('retry')}</Button></div>}
    <div className="pipeline-panel-anchor" ref={panel}>{selection && <PipelineMovePanel key={`${selection.application.id}-${selection.target}`} application={selection.application} target={selection.target} mutation={mutation} onCancel={close} onDone={() => { setNotice({ name: selection.application.candidate.fullName, stage: selection.target }); close(); }} />}{picker && <PipelinePicker key={picker} target={picker} onSelect={move} onCancel={close} />}</div>
    <div className="pipeline-board-scroll" role="region" aria-label={t('board')} tabIndex={0}><div className="pipeline-board">{pipelineStages.map(stage => <PipelineColumn key={stage} stage={stage} {...columnProps} />)}</div></div>
    <PipelineColumn stage="withdrawn" {...columnProps} />
    </div><DragOverlay dropAnimation={null} zIndex={80}>{dragging && <article className="pipeline-card pipeline-drag-preview"><strong>{dragging.candidate.fullName}</strong><p>{dragging.candidate.headline || t('unknownPosition')}</p></article>}</DragOverlay>
  </DndContext>;
}
