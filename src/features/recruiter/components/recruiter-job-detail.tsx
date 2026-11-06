'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft, BriefcaseBusiness, Check,
  Pause, Play, Share2, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal, ModalContent } from '@/components/ui/modal';
import type { RecruiterJobView } from '@/features/jobs';
import { JobManagementActions } from '@/features/jobs';
import { RecruiterScreening } from '@/features/matching';
import { useJobStatus } from '@/features/jobs';
import { JobRequestError } from '@/features/jobs';
import './recruiter-job-detail-toolbar.css';

type Action = 'pause' | 'close' | 'reopen';

export function RecruiterJobDetail({ job }: { job: RecruiterJobView }) {
  const t = useTranslations('Recruiter');
  const status = job.status;
  const mutation = useJobStatus(job.id);
  const formText = useTranslations('JobForm');
  const [saved, setSaved] = useState(false);
  const [confirmation, setConfirmation] = useState<Action | null>(null);
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'failed'>('idle');

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareState('copied');
    } catch {
      setShareState('failed');
    }
  }

  async function confirmAction() {
    if (!confirmation || mutation.isPending) return;
    try { await mutation.mutateAsync(confirmation); setConfirmation(null); setSaved(true); } catch {}
  }
  function openConfirmation(action: Action) { mutation.reset(); setSaved(false); setConfirmation(action); }

  const facts = [
    { label: t('detailExperience'), value: job.experienceLabel ?? t('detailYears', { count: job.experience }) },
    { label: t('type'), value: t(job.type) },
    { label: t('locationLabel'), value: job.location },
    { label: t('detailCompany'), value: job.company },
  ];

  return (
    <div className="jobs-page recruiter-job-detail-page">
      <div className="detail-command-bar">
        <Link href="/recruiter/jobs" className="detail-back">
          <ArrowLeft size={18} />
          <h1>{t('jobDetailHeading')}</h1>
        </Link>
        <JobManagementActions job={job}>
          <Link href={`/recruiter/candidates?jobId=${job.id}`} className="inline-flex min-h-10 items-center rounded-lg border border-border px-3 text-sm font-semibold text-primary hover:bg-secondary">Xem ứng viên</Link>
          {status === 'open' && (
            <Button variant="outline" disabled={mutation.isPending} onClick={() => openConfirmation('pause')}>
              <Pause size={14} />{t('pauseJob')}
            </Button>
          )}
          {(status === 'paused' || status === 'closed') && (
            <Button variant="outline" disabled={mutation.isPending} onClick={() => openConfirmation('reopen')}>
              <Play size={14} />{t('reopenJob')}
            </Button>
          )}
          {(status === 'open' || status === 'paused') && (
            <Button variant="outline" disabled={mutation.isPending} onClick={() => openConfirmation('close')}>
              <X size={14} />{t('closeJob')}
            </Button>
          )}
          <Button variant="outline" onClick={share}>
            {shareState === 'copied' ? <Check size={14} /> : <Share2 size={14} />}
            {t(shareState === 'copied' ? 'detailCopied' : 'detailShare')}
          </Button>
        </JobManagementActions>
      </div>

      <RecruiterScreening jobId={job.id} />
      {saved && <p role="status">{formText('statusSaved')}</p>}
      {shareState === 'copied' && <p role="status">{t('detailCopiedNotice')}</p>}
      {shareState === 'failed' && <p role="alert">{t('detailCopyFailed')}</p>}

      {confirmation && (
        <Modal open onOpenChange={open => { if (!open && !mutation.isPending) setConfirmation(null); }}>
          <ModalContent
            title={t('detailConfirmTitle')}
            description={t('detailConfirmDescription')}
            className="max-w-md"
            footer={<>
              <Button variant="outline" disabled={mutation.isPending} onClick={() => setConfirmation(null)}>{t('cancel')}</Button>
              <Button loading={mutation.isPending} onClick={() => void confirmAction()}>{mutation.isPending ? formText('saving') : t('detailConfirm')}</Button>
            </>}
          >
            <p className="rounded-xl bg-secondary/60 px-4 py-3 text-sm font-medium break-words">{job.title}</p>
            {mutation.error && <p className="field-error mt-3" role="alert">{formText(`errors.${mutation.error instanceof JobRequestError ? mutation.error.messageKey : 'requestFailed'}`)}</p>}
          </ModalContent>
        </Modal>
      )}

      <div className="detail-columns">
        <article>
          <header className="detail-job-heading">
            <span className="detail-position-icon"><BriefcaseBusiness size={25} /></span>
            <div className="detail-title-block">
              <h2>{job.title}</h2>
              <p>{job.company}</p>
            </div>
            <div className="detail-salary">
              <strong>{job.salary === 'negotiable' ? t('negotiable') : job.salary}</strong>
              <span>{job.location}</span>
            </div>
          </header>

          <dl className="detail-facts">
            {facts.map(fact => (
              <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>
            ))}
          </dl>

          {(['description', 'requirements', 'benefits'] as const).map(section => (
            <section className="detail-content-section" key={section}>
              <h3>{t(section === 'description' ? 'description' : section === 'requirements' ? 'detailRequirements' : 'detailBenefits')}</h3>
              <div>
                {job[section].map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              </div>
            </section>
          ))}
        </article>

        <aside className="detail-info-card">
          <div className="detail-info-heading">
            <h2>{t('detailPostingInfo')}</h2>
            <span className="job-status"><span className="status-dot" />{t(status)}</span>
          </div>
          <dl className="detail-info-list">
            <div><dt>{t('status')}</dt><dd aria-live="polite">{t(status)}</dd></div>
            <div><dt>{t('detailCreated')}</dt><dd>{job.createdDateLabel}</dd></div>
            <div><dt>{t('detailRecruitmentPeriod')}</dt><dd>{job.recruitmentPeriodLabel}</dd></div>
            <div><dt>{t('detailApplicantCount')}</dt><dd className="detail-highlight">{t('applicants', { count: job.applicants })}</dd></div>
            <div><dt>{t('detailHeadcount')}</dt><dd>{job.headcount}</dd></div>
            <div><dt>{t('detailViews')}</dt><dd>{job.viewCount}</dd></div>
            <div><dt>{t('detailUpdated')}</dt><dd>{t('updated', { hours: job.hours })}</dd></div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
