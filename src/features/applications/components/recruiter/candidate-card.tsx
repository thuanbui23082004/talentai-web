'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, FileText, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RecruiterApplication } from '@/features/applications/types';

export function CandidateIdentity({ application }: { application: RecruiterApplication }) {
  const t = useTranslations('Candidates');
  const candidate = application.candidate;
  const initials = candidate.fullName.trim().split(/\s+/).slice(-2).map(word => word[0]).join('');
  return <div className="candidate-identity"><span className="candidate-avatar" aria-hidden="true">{initials}</span><div><h2><Link href={`/recruiter/candidates/${application.id}`}>{candidate.fullName}</Link></h2><p>{candidate.headline || t('noHeadline')}</p><span className="candidate-skill-tag">{candidate.topSkills?.slice(0, 2).join(' · ') || t('noSkills')}</span></div></div>;
}
export function CandidateCvButton({ application, onView, busy }: { application: RecruiterApplication; onView: (id: string) => void; busy: boolean }) {
  const t = useTranslations('Candidates');
  return <Button variant="ghost" size="sm" className="candidate-cv-button" disabled={!application.cvId || busy} aria-busy={busy} onClick={() => onView(application.id)}><FileText size={12} />{t(application.cvId ? 'viewCv' : 'noCv')}</Button>;
}
export function CandidateDetailLink({ application }: { application: RecruiterApplication }) {
  const t = useTranslations('Candidates');
  return <Link className="candidate-detail-link" href={`/recruiter/candidates/${application.id}`} aria-label={t('viewDetailFor', { name: application.candidate.fullName })}>{t('viewDetail')}<ArrowRight size={14} aria-hidden="true" /></Link>;
}
export function CandidateCard({ application, onView, busy }: { application: RecruiterApplication; onView: (id: string) => void; busy: boolean }) {
  const t = useTranslations('Candidates');
  const applied = new Intl.DateTimeFormat('vi', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(application.appliedAt));
  return <article className="candidate-card"><div className="candidate-card-top"><span className={`candidate-status status-${application.status}`}><span />{t(`statuses.${application.status}`)}</span></div><CandidateIdentity application={application} /><dl className="candidate-card-details"><div><dt>{t('position')}</dt><dd>{application.jobTitle || t('unknownPosition')}</dd></div><div><dt>{t('reference')}</dt><dd className="candidate-reference" title={application.id}>{application.id.slice(-8)}</dd></div><div><dt>{t('salary')}</dt><dd className="candidate-unknown-value">{t('notProvided')}</dd></div><div><dt>{t('appliedAt')}</dt><dd>{applied}</dd></div><div><dt>{t('attachedCv')}</dt><dd><CandidateCvButton application={application} onView={onView} busy={busy} /></dd></div></dl><footer className="candidate-card-footer"><span className="candidate-card-city"><MapPin size={10} />{application.candidate.city || t('notProvided')}</span><CandidateDetailLink application={application} /></footer></article>;
}
