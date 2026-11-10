'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useFormatter } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api';
import { adminKeys } from '@/features/admin/query-keys';
import { getSystemLogs, getAnomalies, reviewAnomaly } from '@/features/admin/services/monitoring';
import { anomalyTypes, anomalyStatuses, logLevels, severities, anomalyReviewSchema, type Anomaly, type AnomalyReview } from '@/features/admin/schemas/monitoring';
import { filterSystemLogs, filterAnomalies, monitoringPeriodSchema } from '@/features/admin/monitoring-rules';
import { ContentState } from '@/features/admin/components/content-shared';

const initialFilters = { search: '', level: '', source: '', from: '', to: '', type: '', status: '', severity: '' };
export function AdminMonitoring() {
  const t = useTranslations('AdminMonitoring'), f = useFormatter(), cache = useQueryClient();
  const logs = useQuery({ queryKey: adminKeys.systemLogs, queryFn: ({ signal }) => getSystemLogs(signal), retry: false });
  const anomalies = useQuery({ queryKey: adminKeys.anomalies, queryFn: ({ signal }) => getAnomalies(signal), retry: false });
  const [section, setSection] = useState<'systemLogs' | 'anomalies'>('systemLogs'), [filters, setFilters] = useState(initialFilters), [page, setPage] = useState(1), [selectedId, setSelectedId] = useState<string | null>(null), [notice, setNotice] = useState(false);
  const mutation = useMutation({ mutationFn: ({ id, input }: { id: string; input: AnomalyReview }) => reviewAnomaly(id, input), onMutate: () => setNotice(false), onSuccess: async row => { cache.setQueryData<Anomaly[]>(adminKeys.anomalies, previous => previous?.map(item => item.id === row.id ? row : item)); setNotice(true); await cache.invalidateQueries({ queryKey: ['admin'] }); } });
  const query = section === 'systemLogs' ? logs : anomalies, valid = section !== 'systemLogs' || monitoringPeriodSchema.safeParse(filters).success;
  const rows = section === 'systemLogs' ? filterSystemLogs(logs.data ?? [], filters) : filterAnomalies(anomalies.data ?? [], filters);
  const pages = Math.max(1, Math.ceil(rows.length / 10)), current = Math.min(page, pages), selectedLog = section === 'systemLogs' ? rows.find(row => row.id === selectedId) : undefined;
  // Keep the selected anomaly visible when its status changes and no longer matches the list filters.
  const selectedAnomaly = section === 'anomalies' ? anomalies.data?.find(row => row.id === selectedId) : undefined;
  const summaries = [ ['errorCount', logs.data?.filter(row => ['error', 'fatal'].includes(row.level)).length], ['warnCount', logs.data?.filter(row => row.level === 'warn').length], ['openCount', anomalies.data?.filter(row => row.status === 'open').length], ['urgentCount', anomalies.data?.filter(row => row.status === 'open' && ['high', 'critical'].includes(row.severity)).length] ] as const;
  function clear() { setFilters(initialFilters); setPage(1); setSelectedId(null); setNotice(false); mutation.reset(); }
  function change(key: keyof typeof initialFilters, value: string) { setFilters(previous => ({ ...previous, [key]: value })); setPage(1); setSelectedId(null); setNotice(false); mutation.reset(); }
  const selected = selectedLog && 'message' in selectedLog ? selectedLog : undefined;
  return <div className="admin-users-page admin-monitoring-page"><div className="admin-users-heading"><div><h1>{t('title')}</h1><p>{t('subtitle')}</p></div><Button variant="outline" disabled={logs.isFetching || anomalies.isFetching || mutation.isPending} onClick={() => { mutation.reset(); void logs.refetch(); void anomalies.refetch(); }}><RefreshCw size={16} />{t('refresh')}</Button></div>
    <div><div className="admin-report-summary">{summaries.map(([key, value]) => <div key={key}><span>{t(key)}</span><strong>{value === undefined || (key === 'errorCount' || key === 'warnCount' ? logs.error : anomalies.error) ? '—' : f.number(value)}</strong></div>)}</div><p className="admin-content-muted">{t('summaryHint')}</p></div>
    <div className="admin-section-tabs" role="group" aria-label={t('title')}>{(['systemLogs', 'anomalies'] as const).map(key => <Button key={key} variant="ghost" className={section === key ? 'selected' : ''} aria-pressed={section === key} disabled={mutation.isPending} onClick={() => { setSection(key); clear(); }}>{t(key)}</Button>)}</div>
    <div className="admin-user-filters"><label className="admin-user-search">{t('search')}<Input type="search" value={filters.search} placeholder={t(section === 'systemLogs' ? 'searchLogs' : 'searchAnomalies')} disabled={mutation.isPending} onChange={event => change('search', event.target.value)} /></label>
      {(section === 'systemLogs' ? [{ key: 'level' as const, options: logLevels }, { key: 'source' as const, options: [...new Set(logs.data?.map(row => row.source).filter((value): value is string => Boolean(value)))] }] : [{ key: 'type' as const, options: anomalyTypes }, { key: 'severity' as const, options: severities }, { key: 'status' as const, options: anomalyStatuses }]).map(filter => <label key={filter.key}>{t(filter.key)}<select aria-label={t(filter.key)} value={filters[filter.key]} disabled={mutation.isPending} onChange={event => change(filter.key, event.target.value)}><option value="">{t('all')}</option>{filter.options.map(value => <option key={value} value={value}>{filter.key === 'source' ? value : t(value)}</option>)}</select></label>)}
      {section === 'systemLogs' && <><label>{t('from')}<Input type="date" value={filters.from} onChange={event => change('from', event.target.value)} /></label><label>{t('to')}<Input type="date" value={filters.to} aria-invalid={!valid} onChange={event => change('to', event.target.value)} /></label></>}
      <Button variant="ghost" disabled={mutation.isPending} onClick={clear}>{t('clear')}</Button>
    </div>
    {!valid && <p className="admin-error" role="alert">{t('dateOrder')}</p>}
    <ContentState pending={query.isPending} error={query.error} retry={query.refetch} />
    {notice && <p className="admin-user-notice" role="status">{t('saved')}</p>}
    {!query.isPending && !query.error && valid && <>
      {selected && <section className="admin-access-panel admin-activity-detail" aria-label={t('detailLog')}><div className="admin-users-heading"><h2>{t('detailLog')}</h2><Button variant="ghost" size="icon" aria-label={t('close')} onClick={() => setSelectedId(null)}><X size={18} /></Button></div><dl className="admin-user-fields">{[['id', selected.id], ['time', f.dateTime(new Date(selected.occurredAt), { dateStyle: 'medium', timeStyle: 'short' })], ['level', t(selected.level)], ['source', selected.source || t('absent')], ['requestId', selected.requestId || t('absent')]].map(([key, value]) => <div key={key}><dt>{t(key)}</dt><dd>{value}</dd></div>)}</dl><p className="admin-content-text">{selected.message}</p></section>}
      {selectedAnomaly && <section className="admin-access-panel admin-activity-detail" aria-label={t('detailAnomaly')}><div className="admin-users-heading"><h2>{t('detailAnomaly')}</h2><Button variant="ghost" size="icon" disabled={mutation.isPending} aria-label={t('close')} onClick={() => setSelectedId(null)}><X size={18} /></Button></div><dl className="admin-user-fields">{[['id', selectedAnomaly.id], ['type', t(selectedAnomaly.type)], ['severity', t(selectedAnomaly.severity)], ['status', t(selectedAnomaly.status)], ['time', f.dateTime(new Date(selectedAnomaly.detectedAt), { dateStyle: 'medium', timeStyle: 'short' })]].map(([key, value]) => <div key={key}><dt>{t(key)}</dt><dd>{value}</dd></div>)}</dl><p className="admin-content-text">{selectedAnomaly.description || t('absent')}</p><p className="admin-content-muted">{t('caution')}</p>
        {selectedAnomaly.evidence && <div><h3>{t('evidence')}</h3><dl className="admin-user-fields">{selectedAnomaly.evidence.eventCount !== undefined && <div><dt>{t('eventCount')}</dt><dd>{selectedAnomaly.evidence.eventCount}</dd></div>}{selectedAnomaly.evidence.windowMinutes !== undefined && <div><dt>{t('window')}</dt><dd>{selectedAnomaly.evidence.windowMinutes}</dd></div>}{selectedAnomaly.evidence.source && <div><dt>{t('source')}</dt><dd>{selectedAnomaly.evidence.source}</dd></div>}</dl></div>}
        {selectedAnomaly.userId && <Link className="admin-text-link" href={`/admin/users/${selectedAnomaly.userId}`}>{t('userLink')}</Link>}
        {selectedAnomaly.status === 'open' ? <AnomalyForm key={selectedAnomaly.id} busy={mutation.isPending} error={mutation.error} submit={input => mutation.mutate({ id: selectedAnomaly.id, input })} /> : <div><h3>{t('closed')}</h3><p className="admin-content-text">{selectedAnomaly.reviewNote || t('absent')}</p></div>}
      </section>}
      {rows.length ? <div className="admin-table-scroll"><table className="admin-users-table admin-monitoring-table"><thead><tr>{(section === 'systemLogs' ? ['time', 'level', 'source', 'message', 'actions'] : ['time', 'type', 'severity', 'status', 'actions']).map(key => <th key={key} scope="col">{t(key)}</th>)}</tr></thead><tbody>{rows.slice((current - 1) * 10, current * 10).map(row => <tr key={row.id}><td>{f.dateTime(new Date('occurredAt' in row ? row.occurredAt : row.detectedAt), { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>{'message' in row ? <><td><MonitoringBadge value={row.level} /></td><td>{row.source || t('absent')}</td><td>{row.message}</td></> : <><td>{t(row.type)}</td><td><MonitoringBadge value={row.severity} /></td><td><MonitoringBadge value={row.status} /></td></>}<td><Button variant="ghost" disabled={mutation.isPending} onClick={() => { setSelectedId(row.id); setNotice(false); mutation.reset(); }}>{t('view')}</Button></td></tr>)}</tbody></table></div> : <div className="admin-state">{t('empty')}</div>}
      <div className="admin-user-pagination"><span>{t('count', { count: rows.length })}</span><Button variant="outline" disabled={current === 1 || mutation.isPending} onClick={() => { setPage(current - 1); setSelectedId(null); }}>{t('previous')}</Button><span>{t('page', { page: current, pages })}</span><Button variant="outline" disabled={current === pages || mutation.isPending} onClick={() => { setPage(current + 1); setSelectedId(null); }}>{t('next')}</Button></div>
    </>}
  </div>;
}
function MonitoringBadge({ value }: { value: string }) { const t = useTranslations('AdminMonitoring'); return <span className={`admin-badge${['error', 'fatal', 'high', 'critical'].includes(value) ? ' failed' : ''}`}>{t(value)}</span>; }
function AnomalyForm({ busy, error, submit }: { busy: boolean; error: unknown; submit: (input: AnomalyReview) => void }) {
  const t = useTranslations('AdminMonitoring'), a = useTranslations('Admin'), [confirm, setConfirm] = useState<AnomalyReview | null>(null);
  const form = useForm<AnomalyReview>({ resolver: zodResolver(anomalyReviewSchema), mode: 'onBlur', defaultValues: { status: 'reviewed', note: '' } });
  return <form className="admin-content-form" aria-label={t('review')} onSubmit={form.handleSubmit(setConfirm)}><h3>{t('review')}</h3><p>{t('reviewHint')}</p><fieldset disabled={busy || Boolean(confirm)}><label>{t('result')}<select aria-label={t('result')} {...form.register('status')}><option value="reviewed">{t('reviewed')}</option><option value="dismissed">{t('dismissed')}</option></select></label><label>{t('note')}<Textarea rows={4} maxLength={1000} aria-invalid={Boolean(form.formState.errors.note)} {...form.register('note')} /></label>{form.formState.errors.note && <p className="admin-error" role="alert">{t(form.formState.errors.note.message === 'noteLong' ? 'noteLong' : 'noteRequired')}</p>}<Button type="submit">{t('continue')}</Button></fieldset>
    {confirm && <div className="admin-confirm-details" role="region" aria-label={t('confirm')}><h3>{t('confirm')}</h3><strong>{t(confirm.status)}</strong><p className="admin-content-text">{confirm.note}</p><div className="admin-access-buttons"><Button type="button" disabled={busy} onClick={() => submit(confirm)}>{t('confirm')}</Button><Button type="button" variant="outline" disabled={busy} onClick={() => setConfirm(null)}>{t('edit')}</Button><Button type="button" variant="ghost" disabled={busy} onClick={() => { setConfirm(null); form.reset(); }}>{t('cancel')}</Button></div></div>}
    {Boolean(error) && <div className="admin-error" role="alert">{error instanceof ApiError && [401, 403].includes(error.status ?? 0) ? <><p>{a('sessionExpired')}</p><Link className="admin-text-link" href="/admin/login">{a('backLogin')}</Link></> : <p>{t(error instanceof ApiError && [404, 422].includes(error.status ?? 0) ? 'stale' : 'failed')}</p>}</div>}
  </form>;
}
