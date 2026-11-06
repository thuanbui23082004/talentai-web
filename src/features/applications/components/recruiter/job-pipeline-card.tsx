'use client';

import Link from 'next/link';
import { useDraggable } from '@dnd-kit/core';
import { CalendarDays, FileText, GripVertical } from 'lucide-react';
import { Button, Select } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { JOB_APPLICANT_TRANSITIONS } from '@/lib/api/job-applicant-transitions';
import { JOB_APPLICANT_STATUS_LABELS } from '../../job-applicant-messages';
import type { JobApplicant } from '../../types';
export function JobPipelineCard({
  item,
  disabled,
  onMove,
  onCv
}: {
  item: JobApplicant;
  disabled: boolean;
  onMove: (item: JobApplicant, status: JobApplicant['status']) => void;
  onCv: (item: JobApplicant) => void;
}) {
  const targets = JOB_APPLICANT_TRANSITIONS[item.status];
  const {
    setNodeRef,
    attributes,
    listeners,
    isDragging
  } = useDraggable({
    id: item.id,
    disabled: disabled || !targets.length
  });
  const name = item.fullName || 'Chưa cập nhật tên';
  return <article ref={setNodeRef} data-application-id={item.id} className={`pipeline-card ${isDragging ? 'pipeline-card-dragging' : ''}`}>
        <header className="pipeline-card-header">
            <span className="pipeline-avatar" aria-hidden="true">{name.trim().split(/\s+/).slice(-2).map(word => word[0]).join('')}</span>
            <div>
                <Link className="pipeline-candidate-name" href={`/recruiter/candidates/${item.id}?from=job`}>{name}</Link>
                <p>{item.email || 'Chưa cung cấp email'}</p>
            </div>
            {!!targets.length && <Button variant="ghost" size="icon-sm" className="job-pipeline-grip" {...attributes} {...listeners} disabled={disabled} aria-label={`Kéo thẻ của ${name}`}><GripVertical size={16} /></Button>}
        </header>
        <p className="job-pipeline-position">{item.jobTitle || item.headline || 'Chưa cung cấp vị trí'}</p>
        <footer className="pipeline-card-meta">
            <span><CalendarDays size={14} aria-hidden="true" />{formatDate(item.appliedAt)}</span>
            <Button variant="ghost" size="sm" onClick={() => onCv(item)} aria-label={`Xem CV của ${name}`}>
                <FileText size={15} />Xem CV
            </Button>
        </footer>
        {!!targets.length && <Select aria-label={`Chuyển trạng thái của ${name}`} placeholder="Chuyển trạng thái" value="" disabled={disabled} options={[{
      value: '',
      label: 'Chuyển trạng thái',
      disabled: true
    }, ...targets.map(status => ({
      value: status,
      label: JOB_APPLICANT_STATUS_LABELS[status]
    }))]} onValueChange={value => {
      const target = targets.find(status => status === value);
      if (target) onMove(item, target);
    }} />}
    </article>;
}
