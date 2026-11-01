'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { CalendarDays, ChevronLeft, ChevronRight, List, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { listInterviews, listCalendarInterviews } from '@/features/interviews/services/interview-management';
import { interviewKeys } from '@/features/interviews/query-keys';
import type { InterviewQuery, ManagedInterview } from '@/features/interviews/schemas';
import { calendarDays, monthRange, shiftMonth, vietnamDay } from '@/features/interviews/calendar';
import { InterviewError, InterviewChoice, interviewTime } from '@/features/interviews/components/interview-shared';
import './interview-management.css';

function InterviewCard({ interview }: { interview: ManagedInterview }) {
  const t = useTranslations('Interviews');
  return <article className="interview-list-card"><div><h2><Link href={`/recruiter/interviews/${interview.id}`}>{interview.candidate?.fullName ?? t('unnamed')}</Link></h2><p>{interview.jobTitle ?? t('unknown')}</p><p>{interview.round || t('unnamed')}</p></div><div><time dateTime={interview.startTime}>{interviewTime(interview.startTime)}</time><p>{t(interview.mode)} · {t(interview.status)}</p><p>{t(interview.invitationStatus)}</p></div><div className="interview-card-actions">{interview.result && <span className="interview-result-badge">{t(interview.result)}</span>}<Link className="interview-link" href={`/recruiter/interviews/${interview.id}`}>{t('view')}</Link></div></article>;
}
export function InterviewListPage() {
  const t = useTranslations('Interviews');
  const [view, setView] = useState<'list' | 'calendar'>('list'); const [page, setPage] = useState(1);
  const [status, setStatus] = useState<InterviewQuery['status']>(); const [invitation, setInvitation] = useState<InterviewQuery['invitationStatus']>();
  const [from, setFrom] = useState(''); const [to, setTo] = useState(''); const [month, setMonth] = useState(() => vietnamDay(new Date().toISOString()).slice(0, 7));
  const valid = !from || !to || from <= to;
  const query = { status, invitationStatus: invitation, from: from || undefined, to: to || undefined, page, pageSize: 10 };
  const list = useQuery({ queryKey: [...interviewKeys.all, 'list', query], queryFn: ({ signal }) => listInterviews(query, signal), enabled: view === 'list' && valid, retry: false });
  const calendarQuery = { status, invitationStatus: invitation, ...monthRange(month) };
  const calendar = useQuery({ queryKey: [...interviewKeys.all, 'calendar', calendarQuery], queryFn: ({ signal }) => listCalendarInterviews(calendarQuery, signal), enabled: view === 'calendar', retry: false });
  const active = view === 'list' ? list : calendar;
  const items = view === 'list' ? list.data?.items : calendar.data;
  return <div className="interview-page"><header className="interview-page-heading"><h1>{t('title')}</h1><div><Button variant={view === 'list' ? 'default' : 'outline'} aria-pressed={view === 'list'} onClick={() => setView('list')}><List size={15} />{t('list')}</Button><Button variant={view === 'calendar' ? 'default' : 'outline'} aria-pressed={view === 'calendar'} onClick={() => setView('calendar')}><CalendarDays size={15} />{t('calendar')}</Button></div></header>
    <section className="interview-filters" aria-labelledby="interview-filter-title">
      <div className="interview-filter-heading"><h2 id="interview-filter-title"><SlidersHorizontal size={17} aria-hidden="true" />{t('filterTitle')}</h2><Button variant="ghost" onClick={() => { setStatus(undefined); setInvitation(undefined); setFrom(''); setTo(''); setPage(1); }}><RotateCcw size={15} aria-hidden="true" />{t('clear')}</Button></div>
      <div className="interview-filter-grid">
        <label className="interview-filter-field"><span>{t('status')}</span><InterviewChoice label={t('status')} value={status ?? ''} change={value => { setStatus(value as typeof status || undefined); setPage(1); }} items={[{ value: '', label: t('allStatus') }, ...(['scheduled', 'completed', 'cancelled'] as const).map(value => ({ value, label: t(value) }))]} /></label>
        <label className="interview-filter-field"><span>{t('invitation')}</span><InterviewChoice label={t('invitation')} value={invitation ?? ''} change={value => { setInvitation(value as typeof invitation || undefined); setPage(1); }} items={[{ value: '', label: t('allInvitations') }, ...(['draft', 'pending', 'accepted', 'declined'] as const).map(value => ({ value, label: t(value) }))]} /></label>
        {view === 'list' ? <><label className="interview-filter-field" htmlFor="interview-filter-from"><span>{t('from')}</span><Input id="interview-filter-from" type="date" value={from} aria-invalid={!valid} aria-describedby={!valid ? 'interview-date-error' : undefined} max={to || undefined} onChange={e => { setFrom(e.target.value); setPage(1); }} /></label><label className="interview-filter-field" htmlFor="interview-filter-to"><span>{t('to')}</span><Input id="interview-filter-to" type="date" value={to} aria-invalid={!valid} aria-describedby={!valid ? 'interview-date-error' : undefined} min={from || undefined} onChange={e => { setTo(e.target.value); setPage(1); }} /></label></> : <div className="interview-filter-field interview-month-field"><label htmlFor="interview-filter-month">{t('monthLabel')}</label><div className="interview-month-controls"><Button variant="outline" size="icon" aria-label={t('previous')} onClick={() => setMonth(value => shiftMonth(value, -1))}><ChevronLeft size={17} /></Button><Input id="interview-filter-month" type="month" aria-label={t('calendar')} value={month} onChange={e => { if (/^\d{4}-\d{2}$/.test(e.target.value) && Number(e.target.value.slice(0, 4)) > 99) setMonth(e.target.value); }} /><Button variant="outline" size="icon" aria-label={t('next')} onClick={() => setMonth(value => shiftMonth(value, 1))}><ChevronRight size={17} /></Button><Button variant="outline" onClick={() => setMonth(vietnamDay(new Date().toISOString()).slice(0, 7))}>{t('today')}</Button></div></div>}
      </div>
    </section>
    {view === 'list' && !valid ? <p id="interview-date-error" className="interview-filter-error" role="alert">{t('dateOrder')}</p> : active.isPending ? <div className="interview-loading" aria-busy="true" aria-label={t('loading')} /> : active.isError ? <InterviewError error={active.error} retry={() => void active.refetch()} /> : view === 'calendar' ? <><div className="interview-calendar-summary"><p className="interview-count" role="status">{t('total', { count: items?.length ?? 0 })}</p>{!items?.length && <p className="interview-calendar-empty">{t('empty')}</p>}</div><div className="interview-calendar-scroll"><div className="interview-calendar">{(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).map(day => <div className="interview-weekday" key={day}>{t(`weekdays.${day}`)}</div>)}{calendarDays(month).map((day, index) => <div className="interview-calendar-day" key={day ?? index}>{day && <><time dateTime={day}>{Number(day.slice(-2))}</time>{calendar.data?.filter(item => vietnamDay(item.startTime) === day).map(item => <Link href={`/recruiter/interviews/${item.id}`} key={item.id}><strong>{new Intl.DateTimeFormat('vi', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(item.startTime))} · {item.candidate?.fullName ?? t('unnamed')}</strong><span>{item.round || item.jobTitle}</span><small>{t(item.status)}</small></Link>)}</>}</div>)}</div></div></> : !list.data?.items.length ? <p className="interview-empty">{t('empty')}</p> : <><p className="interview-count">{t('total', { count: list.data.meta.totalItems })}</p><div className="interview-cards">{list.data.items.map(item => <InterviewCard key={item.id} interview={item} />)}</div><nav className="interview-pagination"><Button variant="outline" disabled={page <= 1 || list.isFetching} onClick={() => setPage(value => value - 1)}>{t('previous')}</Button><span>{t('page', { page, total: Math.max(1, list.data.meta.totalPages) })}</span><Button variant="outline" disabled={page >= list.data.meta.totalPages || list.isFetching} onClick={() => setPage(value => value + 1)}>{t('next')}</Button></nav></>}
  </div>;
}
