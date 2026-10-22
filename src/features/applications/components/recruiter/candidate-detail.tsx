'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Award, BriefcaseBusiness, CalendarDays, Check, Copy, FileText, GraduationCap, MapPin, UserRound, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRecruiterJob } from '@/features/jobs';
import type { CandidateDetail } from '@/lib/api/candidate-detail-schemas';
import { safeProfileUrlSchema } from '@/lib/api/candidate-detail-schemas';
import { useCandidateDetail } from '@/features/applications/hooks/use-candidate-detail';
import { useApplicantCv } from '@/features/applications/hooks/use-recruiter-applications';
import { CandidateCvViewer } from '@/features/applications/components/recruiter/candidate-cv-viewer';
import { EvaluationForm, InterviewForm, StatusForm } from '@/features/applications/components/recruiter/candidate-action-forms';
import { CandidateRequestError } from '@/features/applications/errors';
import './candidate-detail.css';

const date = (value?: string) => value ? new Intl.DateTimeFormat('vi', { dateStyle: 'medium', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value)) : '—';
const dateTime = (value: string) => new Intl.DateTimeFormat('vi', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value));
function DetailSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="candidate-resume-section"><h2>{title}</h2>{children}</section>; }
function DetailContent({ application }: { application: CandidateDetail }) {
  const t = useTranslations('CandidateDetail');
  const statusText = useTranslations('Candidates.statuses');
  const workText = useTranslations('JobForm');
  const job = useRecruiterJob(application.jobId);
  const cv = useApplicantCv();
  const [showCv, setShowCv] = useState(false);
  const [action, setAction] = useState<'status' | 'evaluation' | 'interview' | null>(null);
  const [notice, setNotice] = useState<'saved' | 'copied' | 'copyFailed' | null>(null);
  const [now] = useState(() => Date.now());
  useEffect(() => {
    if (!action) return;
    const frame = requestAnimationFrame(() => document.getElementById('candidate-action-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    return () => cancelAnimationFrame(frame);
  }, [action]);
  const profile = application.profile;
  const name = profile?.fullName ?? application.candidate.fullName;
  const initials = name.split(/\s+/).slice(-2).map(value => value[0]).join('');
  const disabled = ['withdrawn', 'rejected', 'hired'].includes(application.status);
  const rounds = job.data?.hiringRounds ?? [];
  const nextInterview = application.interviews?.filter(item => item.status === 'scheduled' && new Date(item.startTime).getTime() >= now).sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
  const matching = application.matching;
  const links = profile?.links?.filter(link => safeProfileUrlSchema.safeParse(link.url).success) ?? [];
  const portfolio = links.find(link => /portfolio|năng lực/i.test(link.label));
  const pipeline = ['submitted', 'reviewing', 'interview', 'hired'] as const;
  const current = pipeline.indexOf(application.status as typeof pipeline[number]);
  function done() { setAction(currentAction => currentAction === action ? null : currentAction); setNotice('saved'); }
  async function copyEmail() { try { if (profile?.email) { await navigator.clipboard.writeText(profile.email); setNotice('copied'); } } catch { setNotice('copyFailed'); } }
  const salary = job.data?.salary;
  const money = (value?: number) => value === undefined ? '' : new Intl.NumberFormat('vi', { style: 'currency', currency: salary?.currency ?? 'VND', maximumFractionDigits: 0 }).format(value);

  return <div className="candidate-detail-page"><Link className="candidate-detail-back" href="/recruiter/candidates"><ArrowLeft size={16} />{t('back')}</Link>{notice && <p role="status" className="candidate-detail-notice">{t(notice)}</p>}
    <div className="candidate-detail-grid">
      <aside className="candidate-personal-panel candidate-detail-panel"><div className="candidate-personal-intro"><span className="candidate-detail-avatar" aria-hidden="true">{initials}</span><h1>{name}</h1><span className={`candidate-status status-${application.status}`}><span />{statusText(application.status)}</span><div className="candidate-profile-badges"><span>{matching ? `${matching.score}%` : '—'}<small>{t('aiScore')}</small></span><span>{profile?.totalYearsExperience ?? application.candidate.totalYearsExperience ?? 0}<small>{t('years', { count: profile?.totalYearsExperience ?? application.candidate.totalYearsExperience ?? 0 })}</small></span></div><p>{t('applied', { date: date(application.appliedAt) })}</p><div className="candidate-profile-actions"><Button variant="outline" size="icon-sm" aria-label={t('copyEmail')} disabled={!profile?.email} onClick={copyEmail}><Copy size={13} /></Button><Button size="sm" disabled={disabled} onClick={() => setAction('interview')}><CalendarDays size={13} />{t('schedule')}</Button></div></div>
        <DetailSection title={t('personal')}><dl className="candidate-personal-fields">{([{ key: 'gender', value: profile?.gender ? t(`genders.${profile.gender}`) : undefined }, { key: 'birth', value: profile?.dateOfBirth ? date(profile.dateOfBirth) : undefined }, { key: 'email', value: profile?.email }, { key: 'phone', value: profile?.phone }, { key: 'address', value: profile?.address || profile?.city }] as const).map(field => <div key={field.key}><dt>{t(field.key)}</dt><dd>{field.value || t('empty')}</dd></div>)}</dl></DetailSection>
        <DetailSection title={t('links')}>{links.length ? <div className="candidate-detail-tags">{links.map(link => <a href={link.url} target="_blank" rel="noopener noreferrer" key={link.url}>{link.label}</a>)}</div> : <p className="candidate-detail-empty">{t('empty')}</p>}</DetailSection>
        <DetailSection title={t('languages')}><div className="candidate-detail-tags">{application.cv?.content?.languages?.length ? application.cv.content.languages.map(language => <span key={language.name}>{language.name}{language.level ? ` · ${language.level}` : ''}</span>) : <p className="candidate-detail-empty">{t('empty')}</p>}</div></DetailSection>
      </aside>

      <div className="candidate-detail-center"><section className="candidate-detail-panel candidate-pipeline"><div className="candidate-panel-title"><h2>{t('pipeline')}</h2><Button variant="ghost" size="sm" disabled={application.status === 'withdrawn'} onClick={() => setAction('status')}>{t('changeStatus')}</Button></div><ol>{pipeline.map((status, index) => <li key={status} aria-current={application.status === status ? 'step' : undefined} className={current >= index ? 'completed-stage' : ''}>{index < current && <Check size={11} />}{index === 3 && ['rejected', 'withdrawn'].includes(application.status) ? statusText(application.status) : statusText(status)}</li>)}</ol>{application.currentRound && <p className="candidate-current-round">{t('currentRound')}: {application.currentRound}</p>}</section>
        {action && <section id="candidate-action-panel" className="candidate-detail-panel candidate-form-panel"><Button className="candidate-form-close" size="sm" variant="ghost" onClick={() => setAction(null)}><X size={13} />{t('close')}</Button>{action === 'status' ? <StatusForm application={application} rounds={rounds} onDone={done} /> : action === 'evaluation' ? <EvaluationForm application={application} onDone={done} /> : <InterviewForm application={application} rounds={rounds} onDone={done} />}</section>}
        {showCv && <CandidateCvViewer blob={cv.data} loading={cv.isPending} error={cv.error} onClose={() => { setShowCv(false); cv.reset(); }} onRetry={() => cv.mutate(application.id)} />}
        <article className="candidate-detail-panel candidate-resume"><DetailSection title={t('overview')}><p>{profile?.summary || t('empty')}</p></DetailSection>
          <DetailSection title={t('experience')}>{profile?.experiences?.length ? profile.experiences.map(item => <div className="candidate-timeline-item" key={item.id}><span className="candidate-timeline-icon"><BriefcaseBusiness size={16} /></span><div><h3>{item.company}</h3><small>{item.position} · {date(item.startDate)} – {item.isCurrent ? t('present') : date(item.endDate)}</small><p>{item.description || t('empty')}</p></div></div>) : <p className="candidate-detail-empty">{t('empty')}</p>}</DetailSection>
          <DetailSection title={t('education')}>{profile?.educations?.length ? profile.educations.map(item => <div className="candidate-timeline-item" key={item.id}><span className="candidate-timeline-icon"><GraduationCap size={17} /></span><div><h3>{item.school}</h3><small>{item.major} · {date(item.startDate)} – {item.isCurrent ? t('present') : date(item.endDate)}</small></div></div>) : <p className="candidate-detail-empty">{t('empty')}</p>}</DetailSection>
          <DetailSection title={t('skills')}><div className="candidate-detail-tags">{profile?.skills?.length ? profile.skills.map(skill => <span key={skill.id}>{skill.name}</span>) : <p className="candidate-detail-empty">{t('empty')}</p>}</div></DetailSection>
          <DetailSection title={t('certificates')}>{profile?.certificates?.length ? profile.certificates.map(item => <div className="candidate-certificate" key={item.id}><Award size={16} /><div><h3>{item.name}</h3><small>{item.issuer}</small></div></div>) : <p className="candidate-detail-empty">{t('empty')}</p>}</DetailSection>
          <DetailSection title={t('history')}><ol className="candidate-history">{application.statusHistory?.map((item, index) => <li key={`${item.changedAt}-${index}`}><span>{statusText(item.status)}</span><time>{dateTime(item.changedAt)}</time>{item.note && <p>{item.note}</p>}</li>)}</ol></DetailSection>
        </article>
      </div>

      <aside className="candidate-detail-right"><section className="candidate-detail-panel candidate-score-panel"><h2>{t('scoreTitle')}</h2><div className="candidate-ai-score"><small>{t('aiLabel')}</small>{matching ? <strong>{matching.score}%<span>{t('aiScore')}</span></strong> : <p>{t('noMatching')}</p>}</div>{profile && <div className="candidate-score-bar"><div><span>{t('completeness')}</span><span>{profile.completenessPercent}%</span></div><progress value={profile.completenessPercent} max={100} /></div>}{matching?.breakdown && (['skills', 'experience', 'education'] as const).map(key => matching.breakdown?.[key] === undefined ? null : <div className="candidate-score-bar" key={key}><div><span>{t(`${key === 'skills' ? 'skill' : key}Score`)}</span><span>{matching.breakdown[key]}%</span></div><progress value={matching.breakdown[key]} max={100} /></div>)}{matching && <div className="candidate-ai-explanation"><p>{matching.explanation}</p><small>{t('disclaimer')}</small></div>}<div className="candidate-manual-rating"><span>{t('recruiterRating')}</span><strong>{application.evaluation?.rating ? t('ratingValue', { rating: application.evaluation.rating }) : t('notRated')}</strong>{application.evaluation?.classification && <small>{t(`classifications.${application.evaluation.classification}`)}</small>}{application.evaluation?.note && <p>{application.evaluation.note}</p>}<Button variant="outline" size="sm" onClick={() => setAction('evaluation')}>{t('evaluate')}</Button></div></section>
        <section className="candidate-detail-panel"><h2>{t('nextInterview')}</h2>{nextInterview ? <div className="candidate-next-interview"><h3>{nextInterview.round || t('interviewHeading')}</h3><dl><div><dt>{t('interviewTime')}</dt><dd>{dateTime(nextInterview.startTime)} – {dateTime(nextInterview.endTime)}</dd></div><div><dt>{t('interviewMode')}</dt><dd>{t(nextInterview.mode)}</dd></div>{nextInterview.location && <div><dt>{t('interviewLocation')}</dt><dd>{nextInterview.location}</dd></div>}<div><dt>{t('interviewers')}</dt><dd>{nextInterview.interviewers?.join(', ') || t('empty')}</dd></div></dl></div> : <p className="candidate-detail-empty">{t('noInterview')}</p>}</section>
        <section className="candidate-detail-panel candidate-job-summary"><h2>{t('position')}</h2>{job.isPending ? <div className="candidate-summary-skeleton" aria-busy="true" /> : job.data ? <><div className="candidate-job-heading"><UserRound size={20} /><h3>{job.data.title}</h3></div><div className="candidate-detail-tags"><span>{workText(`workTypes.${job.data.workType}`)}</span><span>{workText(`levels.${job.data.level}`)}</span></div><p><MapPin size={12} />{job.data.location.city}</p><strong>{salary?.negotiable ? workText('negotiable') : [money(salary?.min), money(salary?.max)].filter(Boolean).join(' – ') || t('empty')}</strong><Link href={`/recruiter/jobs/${application.jobId}`}>{t('viewJob')}</Link></> : <><p className="candidate-detail-empty">{t('error')}</p><Button variant="ghost" onClick={() => void job.refetch()}>{t('retry')}</Button></>}</section>
        <section className="candidate-detail-panel candidate-attachments"><h2>{t('attachments')}</h2><Button variant="ghost" disabled={!application.cvId || application.cvAvailable === false || cv.isPending} onClick={() => { cv.reset(); setShowCv(true); cv.mutate(application.id); }}><FileText size={14} />{t(application.cvId && application.cvAvailable !== false ? 'cv' : 'noCv')}</Button>{portfolio && <a href={portfolio.url} target="_blank" rel="noopener noreferrer"><BriefcaseBusiness size={14} />{t('portfolio')}</a>}</section>
      </aside>
    </div>
  </div>;
}
export function CandidateDetailPage({ id }: { id: string }) {
  const t = useTranslations('CandidateDetail');
  const query = useCandidateDetail(id);
  if (query.isPending) return <div className="candidate-detail-skeleton" aria-busy="true"><span /><span /><span /></div>;
  if (!query.data) return <section className="candidate-detail-error" role="alert"><h1>{t(query.error instanceof CandidateRequestError && query.error.status === 404 ? 'notFound' : 'error')}</h1><Button variant="outline" onClick={() => void query.refetch()}>{t('retry')}</Button><Link href="/recruiter/candidates">{t('back')}</Link></section>;
  return <DetailContent key={id} application={query.data} />;
}
