'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { listCalendarInterviews } from '@/features/interviews/services/interview-management';
import { monthRange, shiftMonth, vietnamDay } from '@/features/interviews/calendar';
export function DashboardCalendar({ jobId }: { jobId?: string }) {
  const t = useTranslations('RecruiterStats');
  const [today] = useState(() => vietnamDay(new Date().toISOString()));
  const [month, setMonth] = useState(today.slice(0, 7)); const [day, setDay] = useState(Number(today.slice(-2)));
  const query = useQuery({ queryKey: ['recruiter-interviews', 'dashboard-month', month, jobId], queryFn: ({ signal }) => listCalendarInterviews({ ...monthRange(month), jobId, status: 'scheduled' }, signal), retry: false });
  const selected = `${month}-${String(day).padStart(2, '0')}`;
  const days = Number(monthRange(month).to.slice(-2)); const start = Math.max(1, Math.min(day - 3, days - 6));
  const events = query.data?.filter(item => vietnamDay(item.startTime) === selected) ?? [];
  return <section className="recruiter-panel dashboard-calendar"><div className="dashboard-section-title"><h2>{t('calendar')}</h2><Link href="/recruiter/interviews" aria-label={t('viewAll')}>···</Link></div><div className="dashboard-calendar-strip"><div className="dashboard-calendar-month"><strong>{new Intl.DateTimeFormat('vi', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(month + '-01T00:00:00Z'))}</strong><span><Button size="icon-xs" variant="ghost" aria-label={t('previousMonth')} onClick={() => { setMonth(value => shiftMonth(value, -1)); setDay(1); }}><ChevronLeft size={13} /></Button><Button size="icon-xs" variant="ghost" aria-label={t('nextMonth')} onClick={() => { setMonth(value => shiftMonth(value, 1)); setDay(1); }}><ChevronRight size={13} /></Button></span></div><div className="dashboard-calendar-days">{Array.from({ length: 7 }, (_, index) => start + index).map(value => <div key={value}><small>{t(`weekdays.${new Date(`${month}-${String(value).padStart(2, '0')}T00:00:00Z`).getUTCDay()}`)}</small><Button size="icon-xs" variant="ghost" className={value === day ? 'chosen-day' : ''} aria-pressed={value === day} aria-label={`${value}/${month.slice(-2)}/${month.slice(0, 4)}`} onClick={() => setDay(value)}>{value}</Button></div>)}</div></div>
    {query.isPending ? <div className="stats-skeleton" aria-busy="true" aria-label={t('loading')} /> : query.isError ? <div className="stats-error" role="alert"><p>{t('errors.request')}</p><Button size="sm" variant="outline" onClick={() => void query.refetch()}>{t('retry')}</Button></div> : events.length ? <ol className="dashboard-calendar-events">{events.map(item => <li key={item.id}><time dateTime={item.startTime}>{new Intl.DateTimeFormat('vi', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(item.startTime))}</time><Link href={`/recruiter/interviews/${item.id}`}><strong>{item.round || item.candidate?.fullName}</strong><small>{item.jobTitle}</small></Link></li>)}</ol> : <p className="dashboard-no-events">{t('noDayInterviews')}</p>}
  </section>;
}
