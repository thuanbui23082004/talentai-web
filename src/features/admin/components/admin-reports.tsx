'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations, useFormatter } from 'next-intl';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getReports } from '@/features/admin/services/content';
import { reportStatuses, reportCategories, targetTypes } from '@/features/admin/schemas/content';
import { ContentState, ContentPagination } from '@/features/admin/components/content-shared';
export function AdminReports() {
  const t = useTranslations('AdminContent'), f = useFormatter();
  const query = useQuery({ queryKey: ['admin', 'reports'], queryFn: ({ signal }) => getReports(signal), retry: false });
  const [search, setSearch] = useState(''), [status, setStatus] = useState(''), [category, setCategory] = useState(''), [target, setTarget] = useState(''), [sort, setSort] = useState('newest'), [page, setPage] = useState(1);
  const rows = (query.data ?? []).filter(row => (!status || row.status === status) && (!category || row.category === category) && (!target || row.targetType === target) && `${row.targetLabel ?? ''} ${row.description}`.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi'))).sort((a, b) => sort === 'oldest' ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt));
  const current = Math.min(page, Math.max(1, Math.ceil(rows.length / 10)));
  const filters = [{ key: 'status', value: status, set: setStatus, options: reportStatuses }, { key: 'category', value: category, set: setCategory, options: reportCategories }, { key: 'targetType', value: target, set: setTarget, options: targetTypes }];
  return <div className="admin-users-page"><div className="admin-users-heading"><div><h1>{t('reports')}</h1><p>{t('reportsHint')}</p></div><Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}><RefreshCw size={16} />{t('refresh')}</Button></div>
    <div className="admin-report-summary">{reportStatuses.map(key => <div key={key}><span>{t(key)}</span><strong>{(query.data ?? []).filter(row => row.status === key).length}</strong></div>)}</div>
    <div className="admin-user-filters admin-report-filters"><label className="admin-user-search">{t('search')}<Input type="search" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /></label>{filters.map(filter => <label key={filter.key}>{t(filter.key)}<select aria-label={t(filter.key)} value={filter.value} onChange={event => { filter.set(event.target.value); setPage(1); }}><option value="">{t('all')}</option>{filter.options.map(key => <option key={key} value={key}>{t(key)}</option>)}</select></label>)}<label>{t('sort')}<select aria-label={t('sort')} value={sort} onChange={event => { setSort(event.target.value); setPage(1); }}><option value="newest">{t('newest')}</option><option value="oldest">{t('oldest')}</option></select></label><Button variant="ghost" onClick={() => { setSearch(''); setStatus(''); setCategory(''); setTarget(''); setSort('newest'); setPage(1); }}>{t('clear')}</Button></div>
    <ContentState pending={query.isPending} error={query.error} retry={query.refetch} />
    {!query.isPending && !query.error && <>{rows.length ? <div className="admin-table-scroll"><table className="admin-users-table"><thead><tr>{['targetType', 'category', 'status', 'created', 'actions'].map(key => <th key={key} scope="col">{t(key)}</th>)}</tr></thead><tbody>{rows.slice((current - 1) * 10, current * 10).map(row => <tr key={row.id}><td><Link className="admin-user-name" href={`/admin/reports/${row.id}`}>{row.targetLabel || t(row.targetType)}</Link><small className="admin-content-aliases">{t(row.targetType)}</small></td><td>{t(row.category)}</td><td><span className="admin-badge">{t(row.status)}</span></td><td>{f.dateTime(new Date(row.createdAt), { day: '2-digit', month: '2-digit', year: 'numeric' })}</td><td><Link className="admin-text-link" href={`/admin/reports/${row.id}`}>{t('view')}</Link></td></tr>)}</tbody></table></div> : <div className="admin-state">{t('empty')}</div>}<ContentPagination count={rows.length} page={current} setPage={setPage} /></>}
  </div>;
}
