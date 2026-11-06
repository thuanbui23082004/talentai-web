'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors, useDroppable, pointerWithin } from '@dnd-kit/core';
import { ArrowLeft } from 'lucide-react';
import { Alert, Button, Select } from '@/components/ui';
import { useRecruiterJobs } from '@/features/jobs';
import { ApiError } from '@/lib/api/errors';
import { JOB_APPLICANT_TRANSITIONS } from '@/lib/api/job-applicant-transitions';
import { useJobPipeline, useJobPipelineMove } from '../../hooks/use-job-pipeline';
import { JOB_APPLICANT_STATUS_LABELS } from '../../job-applicant-messages';
import type { JobApplicant } from '../../types';
import { JobPipelineCard } from './job-pipeline-card';
import { JobApplicantCvDialog } from './job-applicant-cv-dialog';
import './recruiter-pipeline.css';
type Status = JobApplicant['status'];
const STAGES: Status[] = ['submitted', 'reviewing', 'shortlisted', 'interview_scheduled', 'offered', 'hired', 'rejected', 'withdrawn'];
function PipelineColumn({
  stage,
  items,
  disabled,
  dragging,
  onMove,
  onCv
}: {
  stage: Status;
  items: JobApplicant[];
  disabled: boolean;
  dragging: JobApplicant | null;
  onMove: (item: JobApplicant, target: Status) => void;
  onCv: (item: JobApplicant) => void;
}) {
  const allowed = !disabled && !!dragging && JOB_APPLICANT_TRANSITIONS[dragging.status].includes(stage);
  const {
    setNodeRef,
    isOver
  } = useDroppable({
    id: stage,
    disabled: !allowed
  });
  return <section ref={setNodeRef} data-stage={stage} aria-label={JOB_APPLICANT_STATUS_LABELS[stage]} className={`pipeline-column ${isOver ? 'pipeline-column-over' : ''}`}>
        <header className="pipeline-column-heading">
            <h2>{JOB_APPLICANT_STATUS_LABELS[stage]}</h2>
            <span>{items.length}</span>
        </header>
        <div className="pipeline-column-cards">
            {items.map(item => <JobPipelineCard key={item.id} item={item} disabled={disabled} onMove={onMove} onCv={onCv} />)}
            {!items.length && <p className="pipeline-column-state">Chưa có hồ sơ</p>}
        </div>
    </section>;
}
function JobPipelineBoard({
  jobId
}: {
  jobId: string;
}) {
  const query = useJobPipeline(jobId);
  const mutation = useJobPipelineMove(jobId);
  const [dragging, setDragging] = useState<JobApplicant | null>(null);
  const [activeCv, setActiveCv] = useState<JobApplicant | null>(null);
  const [notice, setNotice] = useState('');
  const sensors = useSensors(useSensor(MouseSensor, {
    activationConstraint: {
      distance: 6
    }
  }), useSensor(TouchSensor, {
    activationConstraint: {
      delay: 200,
      tolerance: 8
    }
  }));
  const items = query.data ?? [];
  const disabled = mutation.isPending || query.isFetching;
  function move(item: JobApplicant, status: Status) {
    if (disabled || !JOB_APPLICANT_TRANSITIONS[item.status].includes(status)) return;
    setNotice('');
    mutation.mutate({
      id: item.id,
      values: {
        status,
        version: item.version
      }
    }, {
      onSuccess: saved => setNotice(`Đã chuyển ${saved.fullName || 'ứng viên'} sang “${JOB_APPLICANT_STATUS_LABELS[saved.status]}”.`)
    });
  }
  if (query.isPending) return <p className="pipeline-notice" role="status">Đang tải hồ sơ ứng tuyển…</p>;
  if (query.isError) return <Alert variant="error" title="Không tải được hồ sơ của tin tuyển dụng này"><Button variant="outline" onClick={() => void query.refetch()}>Thử lại</Button></Alert>;
  return <>
        <p className="pipeline-advisory">{items.length} hồ sơ · Kéo thẻ sang bước tiếp theo hoặc cột từ chối. Bạn cũng có thể dùng nút chuyển trạng thái trên từng thẻ.</p>
        {mutation.isPending && <p role="status" className="pipeline-notice">Đang cập nhật trạng thái hồ sơ…</p>}
        {notice && <p role="status" className="pipeline-notice">{notice}</p>}
        {mutation.isError && <Alert variant="error" title={mutation.error instanceof ApiError && mutation.error.status === 409 ? 'Hồ sơ đã thay đổi hoặc không thể chuyển sang bước này. Bảng đã được tải lại.' : 'Chưa xác nhận được cập nhật. Kiểm tra trạng thái trước khi thử lại.'}><Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>Tải lại bảng</Button></Alert>}
        {!items.length && <p className="pipeline-notice">Chưa có ứng viên ứng tuyển vào tin này.</p>}
        <DndContext id="job-applicant-pipeline" sensors={sensors} collisionDetection={pointerWithin} accessibility={{
      screenReaderInstructions: {
        draggable: 'Dùng mục Chuyển trạng thái trên thẻ để di chuyển hồ sơ bằng bàn phím.'
      }
    }} onDragStart={({
      active
    }) => {
      setDragging(items.find(item => item.id === active.id) ?? null);
      setNotice('');
    }} onDragCancel={() => setDragging(null)} onDragEnd={({
      over
    }) => {
      const target = STAGES.find(stage => stage === over?.id);
      if (dragging && target) move(dragging, target);
      setDragging(null);
    }}>
            <div className="pipeline-board-scroll" role="region" aria-label="Bảng theo dõi ứng viên" tabIndex={0} aria-busy={disabled}>
                <div className="pipeline-board job-pipeline-board">
                    {STAGES.map(stage => <PipelineColumn key={stage} stage={stage} items={items.filter(item => item.status === stage)} disabled={disabled} dragging={dragging} onMove={move} onCv={setActiveCv} />)}
                </div>
            </div>
            <DragOverlay dropAnimation={null}>
                {dragging && <article className="pipeline-card pipeline-drag-preview">
                    <strong>{dragging.fullName || 'Ứng viên'}</strong>
                    <p>{dragging.email}</p>
                </article>}
            </DragOverlay>
        </DndContext>
        {activeCv && <JobApplicantCvDialog item={activeCv} onClose={() => setActiveCv(null)} />}
    </>;
}
export function RecruiterPipeline() {
  const router = useRouter();
  const params = useSearchParams();
  const jobId = params.get('jobId') ?? '';
  const [jobPage, setJobPage] = useState(1);
  const jobs = useRecruiterJobs({
    page: jobPage,
    pageSize: 100
  });
  const valid = z.uuid().safeParse(jobId).success;
  const options = [{
    value: '',
    label: 'Chọn tin tuyển dụng'
  }, ...(jobs.data?.items ?? []).map(job => ({
    value: job.id,
    label: job.title
  }))];
  if (valid && !options.some(option => option.value === jobId)) options.push({
    value: jobId,
    label: 'Tin tuyển dụng đang chọn'
  });
  return <div className="pipeline-page">
        <header className="pipeline-page-heading">
            <div><h1>Bảng theo dõi ứng viên</h1><p>Theo dõi hồ sơ theo từng giai đoạn tuyển dụng.</p></div>
            <Link className="pipeline-back" href={`/recruiter/candidates${valid ? `?jobId=${jobId}` : ''}`}>
                <ArrowLeft size={16} />Quay lại ứng viên
            </Link>
        </header>
        <section className="job-pipeline-filter" aria-label="Chọn tin tuyển dụng">
            <span>Tin tuyển dụng</span>
            <Select aria-label="Tin tuyển dụng" options={options} value={valid ? jobId : ''} disabled={jobs.isPending} onValueChange={value => router.push(`/recruiter/candidates/pipeline${value ? `?jobId=${value}` : ''}`, {
        scroll: false
      })} />
            {(jobs.data?.meta.totalPages ?? 0) > 1 && <div className="job-pipeline-job-pages">
                <Button variant="outline" size="sm" disabled={jobs.isFetching || jobPage <= 1} onClick={() => setJobPage(page => page - 1)}>Tin trang trước</Button>
                <span>Trang {jobPage}/{jobs.data?.meta.totalPages}</span>
                <Button variant="outline" size="sm" disabled={jobs.isFetching || jobPage >= (jobs.data?.meta.totalPages ?? 1)} onClick={() => setJobPage(page => page + 1)}>Tin trang sau</Button>
            </div>}
            {jobs.isError && <Alert variant="error" title="Không tải được tin tuyển dụng"><Button variant="outline" onClick={() => void jobs.refetch()}>Thử lại</Button></Alert>}
        </section>
        {valid ? <JobPipelineBoard key={jobId} jobId={jobId} /> : <p role="status" className="pipeline-notice">Vui lòng chọn tin tuyển dụng để xem bảng theo dõi ứng viên.</p>}
    </div>;
}
