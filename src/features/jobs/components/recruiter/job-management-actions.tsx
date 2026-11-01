'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PenLine, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useJobManagement } from '@/features/jobs/hooks/use-create-job';
import { JobRequestError } from '@/features/jobs/errors';
import type { RecruiterJobView } from '@/features/jobs/job-view';
import './create-job.css';

export function JobManagementActions({ job }: { job: RecruiterJobView }) {
  const t = useTranslations('JobForm'); const router = useRouter(); const actions = useJobManagement(job.id);
  const [confirmation, setConfirmation] = useState<'delete' | 'publish' | null>(null);
  const [notice, setNotice] = useState<'published' | 'submittedReview' | null>(null);
  const guard = useRef(false);
  const busy = actions.publish.isPending || actions.remove.isPending;
  const error = confirmation === 'delete' ? actions.remove.error : actions.publish.error;
  const open = (action: 'delete' | 'publish') => { setNotice(null); actions.publish.reset(); actions.remove.reset(); setConfirmation(action); };
  async function confirm() {
    if (guard.current || !confirmation) return;
    guard.current = true;
    try {
      if (confirmation === 'delete') { await actions.remove.mutateAsync(); router.replace('/recruiter/jobs'); }
      else { const result = await actions.publish.mutateAsync(); setNotice(result.status === 'open' ? 'published' : 'submittedReview'); setConfirmation(null); }
    } catch { /* Keep the confirmation open for a deliberate retry. */ } finally { guard.current = false; }
  }
  return <section className="job-management" aria-label={t('manageJob')}><div className="job-management-buttons">{job.status !== 'locked' && !busy && <Link className="job-edit-link" href={`/recruiter/jobs/${job.id}/edit`}><PenLine size={14} />{t('editHeading')}</Link>}{job.status === 'draft' && <Button size="sm" disabled={busy} onClick={() => open('publish')}><Send size={13} />{t('publishJob')}</Button>}<Button className="job-delete-button" size="sm" variant="outline" disabled={busy} onClick={() => open('delete')}><Trash2 size={13} />{t('deleteJob')}</Button></div>
    {notice && <p role="status" className="job-management-notice">{t(notice)}</p>}
    {confirmation && <section className="recruiter-panel job-management-confirm" aria-labelledby="job-management-confirm-title"><h2 id="job-management-confirm-title">{t(confirmation === 'delete' ? 'deleteTitle' : 'publishTitle')}</h2><p>{t(confirmation === 'delete' ? 'deleteDescription' : 'publishDescription', { title: job.title })}</p>{error && <p className="field-error" role="alert">{t(`errors.${error instanceof JobRequestError ? error.messageKey : 'requestFailed'}`)}</p>}<div className="job-management-buttons"><Button disabled={busy} onClick={() => void confirm()}>{t(busy ? 'saving' : confirmation === 'delete' ? 'confirmDelete' : 'confirmPublish')}</Button><Button variant="outline" disabled={busy} onClick={() => setConfirmation(null)}>{t('cancel')}</Button></div></section>}
  </section>;
}
