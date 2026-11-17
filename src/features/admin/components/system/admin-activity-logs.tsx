'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations, useFormatter } from 'next-intl';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api';
import { adminKeys } from '@/features/admin/query-keys';
import { getAdminActivityLogs } from '@/features/admin/services/activity-logs';
import { activityFiltersSchema, type ActivityFilters, type ActivityLog } from '@/features/admin/schemas/activity-logs';
import { emptyActivityFilters, filterActivityLogs, activityActionKey, activityTargetLink } from '@/features/admin/activity-rules';

const targets = ['user', 'company', 'job', 'catalog', 'report', 'payment', 'anomaly'];
export function AdminActivityLogs() {
  const t = useTranslations('AdminActivity'), a = useTranslations('Admin'), f = useFormatter();
  const query = useQuery({ queryKey: adminKeys.activityLogs, queryFn: ({ signal }) => getAdminActivityLogs(signal), retry: false });
  const [filters, setFilters] = useState<ActivityFilters>(emptyActivityFilters), [page, setPage] = useState(1), [selectedId, setSelectedId] = useState<string | null>(null);
  const detail = useRef<HTMLElement>(null), trigger = useRef<HTMLButtonElement | null>(null);
  const valid = activityFiltersSchema.safeParse(filters).success, logs = query.data ?? [], rows = filterActivityLogs(logs, filters);
  const pages = Math.max(1, Math.ceil(rows.length / 10)), current = Math.min(page, pages), selected = rows.find(row => row.id === selectedId);
  const actors = [...new Map(logs.filter(log => log.actorId).map(log => [log.actorId!, { id: log.actorId!, name: log.actorName || t('unspecified') }])).values()].sort((x, y) => x.name.localeCompare(y.name, 'vi'));
  const actions = [...new Set(logs.map(log => log.action))].sort();
  useEffect(() => { if (selectedId) detail.current?.focus(); }, [selectedId]);
  function update<K extends keyof ActivityFilters>(key: K, value: ActivityFilters[K]) { setFilters(previous => ({ ...previous, [key]: value })); setPage(1); setSelectedId(null); }
  function clear() { setFilters(emptyActivityFilters); setPage(1); setSelectedId(null); }
  function close() { setSelectedId(null); trigger.current?.focus(); }
  return <div className="admin-users-page admin-activity-page"><div className="admin-users-heading"><div><h1>{t('title')}</h1><p>{t('subtitle')}</p></div><Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}><RefreshCw size={16} />{t('refresh')}</Button></div>
    <div className="admin-user-filters admin-activity-filters"><label className="admin-user-search" htmlFor="activity-search">{t('search')}<Input id="activity-search" type="search" placeholder={t('searchHint')} value={filters.search} onChange={event => update('search', event.target.value)} /></label>
      <label>{t('actor')}<select aria-label={t('actor')} value={filters.actor} onChange={event => update('actor', event.target.value)}><option value="">{t('all')}</option>{actors.map(actor => <option key={actor.id} value={actor.id}>{actor.name}</option>)}</select></label>
      <label>{t('action')}<select aria-label={t('action')} value={filters.action} onChange={event => update('action', event.target.value)}><option value="">{t('all')}</option>{actions.map(action => <option key={action} value={action}>{a(`actions.${activityActionKey(action)}`)}</option>)}</select></label>
      <label>{t('target')}<select aria-label={t('target')} value={filters.target} onChange={event => update('target', event.target.value)}><option value="">{t('all')}</option>{[...new Set(logs.map(log => log.targetType).filter((value): value is string => Boolean(value)))].sort().map(target => <option key={target} value={target}>{t(targets.includes(target) ? target : 'otherTarget')}</option>)}</select></label>
      <label>{t('result')}<select aria-label={t('result')} value={filters.result} onChange={event => update('result', event.target.value as ActivityFilters['result'])}><option value="">{t('all')}</option><option value="success">{t('success')}</option><option value="failure">{t('failure')}</option></select></label>
      <div className="admin-filter-dates"><label>{t('from')}<Input type="date" value={filters.from} onChange={event => update('from', event.target.value)} /></label><label>{t('to')}<Input type="date" value={filters.to} onChange={event => update('to', event.target.value)} aria-invalid={!valid} aria-describedby={!valid ? 'activity-date-error' : undefined} /></label><Button variant="ghost" onClick={clear}>{t('clear')}</Button></div>
    </div>
    {!valid && <p id="activity-date-error" className="admin-error" role="alert">{t('dateOrder')}</p>}
    {query.isPending && <div className="admin-skeleton" aria-busy="true" aria-label={t('loading')}><span /><span /><span /></div>}
    {query.error && <div className="admin-state" role="alert">{query.error instanceof ApiError && [401, 403].includes(query.error.status ?? 0) ? <><p>{t('session')}</p><Link className="admin-text-link" href="/admin/login">{t('login')}</Link></> : <><p>{t('failed')}</p><Button variant="outline" onClick={() => void query.refetch()}>{t('retry')}</Button></>}</div>}
    {!query.isPending && !query.error && valid && <>
      {selected && <ActivityDetail log={selected} panelRef={detail} close={close} />}
      {rows.length ? <div className="admin-table-scroll"><table className="admin-users-table admin-activity-table"><thead><tr>{['time', 'actor', 'action', 'target', 'result', 'actions'].map(key => <th key={key} scope="col">{t(key)}</th>)}</tr></thead><tbody>{rows.slice((current - 1) * 10, current * 10).map(log => <tr key={log.id}><td>{f.dateTime(new Date(log.occurredAt), { dateStyle: 'short', timeStyle: 'short' })}</td><td>{log.actorName || t('unspecified')}</td><td>{a(`actions.${activityActionKey(log.action)}`)}</td><td>{log.targetType ? t(targets.includes(log.targetType) ? log.targetType : 'otherTarget') : t('unspecified')}<small className="admin-content-aliases admin-activity-id">{log.metadata?.orderCode || log.targetId || t('unspecified')}</small></td><td><span className={`admin-badge${log.result === 'failure' ? ' failed' : ''}`}>{t(log.result)}</span></td><td><Button variant="ghost" aria-expanded={selectedId === log.id} aria-controls={selectedId === log.id ? 'activity-detail' : undefined} onClick={event => { trigger.current = event.currentTarget; setSelectedId(log.id); }}>{t('view')}</Button></td></tr>)}</tbody></table></div> : <div className="admin-state"><p>{t('empty')}</p><p>{t('emptyHint')}</p></div>}
      <div className="admin-user-pagination"><span>{t('count', { count: rows.length })}</span><Button variant="outline" disabled={current <= 1} onClick={() => { setPage(current - 1); setSelectedId(null); }}>{t('previous')}</Button><span>{t('page', { page: current, pages })}</span><Button variant="outline" disabled={current >= pages} onClick={() => { setPage(current + 1); setSelectedId(null); }}>{t('next')}</Button></div>
    </>}
  </div>;
}
function ActivityDetail({ log, panelRef, close }: { log: ActivityLog; panelRef: React.RefObject<HTMLElement | null>; close: () => void }) {
  const t = useTranslations('AdminActivity'), a = useTranslations('Admin'), f = useFormatter(), link = activityTargetLink(log);
  const reason = log.metadata?.reason || log.metadata?.note;
  return <section ref={panelRef} id="activity-detail" tabIndex={-1} className="admin-access-panel admin-activity-detail" aria-labelledby="activity-detail-title" onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); close(); } }}><div className="admin-users-heading"><h2 id="activity-detail-title">{t('detail')}</h2><Button variant="ghost" size="icon" aria-label={t('close')} onClick={close}><X size={18} /></Button></div>
    <dl className="admin-user-fields">{[['logId', log.id], ['time', f.dateTime(new Date(log.occurredAt), { dateStyle: 'medium', timeStyle: 'short' })], ['actor', log.actorName || t('unspecified')], ['actorId', log.actorId || t('unspecified')], ['action', a(`actions.${activityActionKey(log.action)}`)], ['result', t(log.result)], ['target', log.targetType ? t(targets.includes(log.targetType) ? log.targetType : 'otherTarget') : t('unspecified')], ['targetId', log.targetId || t('unspecified')]].map(([key, value]) => <div key={key}><dt>{t(key)}</dt><dd>{value}</dd></div>)}</dl>
    <div><h3>{t('reason')}</h3><p className="admin-content-text">{reason || t('noReason')}</p></div>
    {log.metadata?.orderCode && <p>{t('orderCode')}: {log.metadata.orderCode}</p>}
    {log.metadata?.outcome && ['verified', 'needs_follow_up'].includes(log.metadata.outcome) && <p>{t('outcome')}: {t(log.metadata.outcome)}</p>}
    {log.metadata?.catalogType && ['industries', 'positions', 'skills', 'locations'].includes(log.metadata.catalogType) && <p>{t('catalogType')}: {t(log.metadata.catalogType)}</p>}
    {link && <div><Link className="admin-text-link" href={link}>{t('openTarget')}</Link><p className="admin-content-muted">{t('targetHint')}</p></div>}
    <p className="admin-content-muted">{t('readonly')}</p>
  </section>;
}
