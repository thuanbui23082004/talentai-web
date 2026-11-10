'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations, useFormatter } from 'next-intl';
import { Building2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminKeys } from '@/features/admin/query-keys';
import { getManagedCompanies } from '@/features/admin/services/companies';
import { companyStatuses } from '@/features/admin/schemas/companies';
import { filterCompanies } from '@/features/admin/company-rules';
import { CompanyState, CompanyBadge } from '@/features/admin/components/companies-shared';
export function AdminCompanies() {
  const t = useTranslations('AdminCompanies'); const a = useTranslations('Admin'); const f = useFormatter();
  const query = useQuery({ queryKey: adminKeys.companies, queryFn: ({ signal }) => getManagedCompanies(signal), retry: false });
  const [search, setSearch] = useState(''); const [status, setStatus] = useState(''); const [page, setPage] = useState(1);
  const companies = query.data ?? []; const rows = filterCompanies(companies, search, status); const pages = Math.max(1, Math.ceil(rows.length / 10)); const current = Math.min(page, pages); const items = rows.slice((current - 1) * 10, current * 10);
  return <div className="admin-users-page"><div className="admin-users-heading"><div><h1>{t('title')}</h1><p>{t('subtitle')}</p></div><Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}><RefreshCw size={16} />{a('refresh')}</Button></div>
    <div className="admin-user-summary"><Building2 size={20} /><span>{t('total')}</span><strong>{query.isPending ? '—' : f.number(companies.length)}</strong></div>
    <div className="admin-user-filters"><label className="admin-user-search" htmlFor="admin-company-search"><span>{t('search')}</span><Input id="admin-company-search" type="search" autoComplete="off" placeholder={t('searchPlaceholder')} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></label><label htmlFor="admin-company-status"><span>{t('status')}</span><select id="admin-company-status" aria-label={t('status')} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">{t('allStatuses')}</option>{companyStatuses.map(value => <option key={value} value={value}>{t(value)}</option>)}</select></label><Button variant="ghost" onClick={() => { setSearch(''); setStatus(''); setPage(1); }}>{t('clear')}</Button></div>
    <CompanyState pending={query.isPending} error={query.error} retry={query.refetch} />
    {!query.isPending && !query.error && (items.length ? <><div className="admin-table-scroll"><table className="admin-companies-table"><thead><tr>{(['name', 'taxCode', 'city', 'status', 'created', 'actions'] as const).map(key => <th scope="col" key={key}>{t(key)}</th>)}</tr></thead><tbody>{items.map(company => <tr key={company.id}><td><Link className="admin-user-name" href={`/admin/companies/${company.id}`}>{company.name}</Link></td><td>{company.taxCode || t('noValue')}</td><td>{company.city || t('noValue')}</td><td><CompanyBadge status={company.verificationStatus} /></td><td>{f.dateTime(new Date(company.createdAt), { day: '2-digit', month: '2-digit', year: 'numeric' })}</td><td><Link className="admin-text-link" href={`/admin/companies/${company.id}`}>{t('view')}</Link></td></tr>)}</tbody></table></div><div className="admin-user-pagination"><span>{t('count', { count: rows.length })}</span><Button variant="outline" disabled={current === 1} onClick={() => setPage(current - 1)}>{t('previous')}</Button><span>{t('page', { page: current, pages })}</span><Button variant="outline" disabled={current === pages} onClick={() => setPage(current + 1)}>{t('next')}</Button></div></> : <div className="admin-state"><p>{t(companies.length ? 'empty' : 'noCompanies')}</p>{companies.length > 0 && <p>{t('emptyHint')}</p>}</div>)}
  </div>;
}
