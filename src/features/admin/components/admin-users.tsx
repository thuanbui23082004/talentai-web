'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations, useFormatter } from 'next-intl';
import { UsersRound, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminKeys } from '@/features/admin/query-keys';
import { getManagedUsers } from '@/features/admin/services/users';
import { filterUsers } from '@/features/admin/users-filter';
import { UsersState, UserStatus } from '@/features/admin/components/users-shared';

export function AdminUsers() {
  const t = useTranslations('AdminUsers'); const a = useTranslations('Admin'); const f = useFormatter();
  const query = useQuery({ queryKey: adminKeys.users, queryFn: ({ signal }) => getManagedUsers(signal), retry: false });
  const [search, setSearch] = useState(''); const [role, setRole] = useState(''); const [status, setStatus] = useState(''); const [page, setPage] = useState(1);
  const users = query.data ?? []; const rows = filterUsers(users, search, role, status); const pages = Math.max(1, Math.ceil(rows.length / 10)); const current = Math.min(page, pages); const items = rows.slice((current - 1) * 10, current * 10);
  return <div className="admin-users-page"><div className="admin-users-heading"><div><h1>{t('title')}</h1><p>{t('subtitle')}</p></div><Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}><RefreshCw size={16} />{a('refresh')}</Button></div>
    <div className="admin-user-summary"><UsersRound size={20} /><span>{t('total')}</span><strong>{f.number(users.length)}</strong></div>
    <div className="admin-user-filters"><label className="admin-user-search" htmlFor="admin-user-search"><span>{t('search')}</span><Input id="admin-user-search" type="search" autoComplete="off" placeholder={t('searchPlaceholder')} value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /></label><label htmlFor="admin-user-role">{t('role')}<select aria-label={t('role')} id="admin-user-role" value={role} onChange={event => { setRole(event.target.value); setPage(1); }}><option value="">{t('allRoles')}</option><option value="candidate">{t('candidate')}</option><option value="recruiter">{t('recruiter')}</option></select></label><label htmlFor="admin-user-status">{t('status')}<select aria-label={t('status')} id="admin-user-status" value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="">{t('allStatuses')}</option><option value="active">{t('active')}</option><option value="locked">{t('locked')}</option></select></label><Button variant="ghost" onClick={() => { setSearch(''); setRole(''); setStatus(''); setPage(1); }}>{t('clear')}</Button></div>
    <UsersState pending={query.isPending} error={query.error} retry={query.refetch} />
    {!query.isPending && !query.error && (items.length ? <><div className="admin-table-scroll"><table className="admin-users-table"><thead><tr>{(['name', 'email', 'role', 'status', 'created', 'actions'] as const).map(key => <th key={key} scope="col">{t(key)}</th>)}</tr></thead><tbody>{items.map(user => <tr key={user.id}><td><Link className="admin-user-name" href={`/admin/users/${user.id}`}>{user.fullName}</Link></td><td>{user.email}</td><td>{t(user.role)}</td><td><UserStatus status={user.status} /></td><td>{f.dateTime(new Date(user.createdAt), { day: '2-digit', month: '2-digit', year: 'numeric' })}</td><td><Link className="admin-text-link" href={`/admin/users/${user.id}`}>{t('view')}</Link></td></tr>)}</tbody></table></div><div className="admin-user-pagination"><span>{t('count', { count: rows.length })}</span><Button variant="outline" disabled={current === 1} onClick={() => setPage(current - 1)}>{t('previous')}</Button><span>{t('page', { page: current, pages })}</span><Button variant="outline" disabled={current === pages} onClick={() => setPage(current + 1)}>{t('next')}</Button></div></> : <div className="admin-state"><p>{t(users.length ? 'empty' : 'noUsers')}</p>{users.length > 0 && <p>{t('emptyHint')}</p>}</div>)}
  </div>;
}

