'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useDraggable } from '@dnd-kit/core';
import { CalendarDays, GripVertical, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { recruiterApplicationKeys } from '@/features/applications/query-keys';
import { getCandidateDetail } from '@/features/applications/services/candidate-detail';
import { pipelineStages, canMoveApplication, type PipelineStage } from '@/features/applications/pipeline';
import type { RecruiterApplication } from '@/features/applications/types';

function PipelineScore({ application }: { application: RecruiterApplication }) {
  const t = useTranslations('Pipeline');
  const [open, setOpen] = useState(false);
  const detail = useQuery({ queryKey: recruiterApplicationKeys.detail(application.id), queryFn: () => getCandidateDetail(application.id), enabled: open, retry: false });
  if (application.matchScore === undefined) return null;
  return <div className="pipeline-score"><Button size="xs" variant="ghost" aria-label={t('aiScore', { score: application.matchScore })} aria-expanded={open} onClick={() => setOpen(value => !value)}>{application.matchScore}%</Button>{open && <div className="pipeline-score-explanation"><strong>{t('aiLabel')}</strong>{detail.isPending ? <p aria-busy="true">{t('loading')}</p> : detail.isError ? <div role="alert"><p>{t('error')}</p><Button size="xs" variant="outline" onClick={() => void detail.refetch()}>{t('retry')}</Button></div> : <p>{detail.data?.matching?.explanation ?? t('noMatching')}</p>}<small>{t('disclaimer')}</small><Button size="xs" variant="ghost" onClick={() => setOpen(false)}>{t('closeExplanation')}</Button></div>}</div>;
}

export function PipelineCard({ application, disabled, onMove }: {
  application: RecruiterApplication; disabled: boolean;
  onMove: (application: RecruiterApplication, stage: PipelineStage) => void;
}) {
  const t = useTranslations('Pipeline');
  const initials = application.candidate.fullName.trim().split(/\s+/).slice(-2).map(word => word[0]).join('');
  const date = new Intl.DateTimeFormat('vi', { day: '2-digit', month: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(application.appliedAt));
  const readOnly = application.status === 'withdrawn';
  const { setNodeRef, setActivatorNodeRef, isDragging, listeners, attributes } = useDraggable({ id: application.id, data: { application }, disabled: disabled || readOnly, attributes: { roleDescription: t('dragRole') } });
  const items = [{ value: '', label: t('move') }, ...pipelineStages.filter(stage => canMoveApplication(application.status, stage)).map(stage => ({ value: stage, label: t(`stages.${stage}`) }))];
  return <article ref={setNodeRef} className={`pipeline-card${isDragging ? ' pipeline-card-dragging' : ''}`} data-application-id={application.id}
    onMouseDown={event => { if (!(event.target instanceof Element) || !event.target.closest('a,button,input,select,textarea,[role=combobox]') || event.target.closest('.pipeline-drag-handle')) listeners?.onMouseDown?.(event); }}
    onTouchStart={event => { if (!(event.target instanceof Element) || !event.target.closest('a,button,input,select,textarea,[role=combobox]') || event.target.closest('.pipeline-drag-handle')) listeners?.onTouchStart?.(event); }}>
    <div className="pipeline-card-header"><span className="pipeline-avatar" aria-hidden="true">{initials}</span><div><Link href={`/recruiter/candidates/${application.id}`} className="pipeline-candidate-name">{application.candidate.fullName}</Link><p>{application.candidate.headline || t('unknownPosition')}</p></div></div>
    <div className="pipeline-card-meta"><span><CalendarDays size={12} aria-hidden="true" />{date}</span><PipelineScore application={application} /></div>
    <Link className="pipeline-detail-link" href={`/recruiter/candidates/${application.id}`} aria-label={t('viewDetailFor', { name: application.candidate.fullName })}>{t('viewDetail')}<ArrowUpRight size={12} aria-hidden="true" /></Link>
    {!readOnly && <div className="pipeline-card-actions"><Select value="" items={items} disabled={disabled} onValueChange={value => { if (pipelineStages.includes(value as PipelineStage)) onMove(application, value as PipelineStage); }}><SelectTrigger aria-label={t('moveFor', { name: application.candidate.fullName })}><SelectValue /></SelectTrigger><SelectContent>{items.map(item => <SelectItem value={item.value} key={item.value}>{item.label}</SelectItem>)}</SelectContent></Select><Button ref={setActivatorNodeRef} {...attributes} onKeyDown={event => listeners?.onKeyDown?.(event)} className="pipeline-drag-handle" size="icon-sm" variant="ghost" disabled={disabled} aria-label={t('drag', { name: application.candidate.fullName })}><GripVertical size={15} /></Button></div>}
  </article>;
}
