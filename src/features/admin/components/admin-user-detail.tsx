'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useFormatter } from 'next-intl';
import { ArrowLeft, LockKeyhole, LockKeyholeOpen, ShieldCheck } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api';
import { adminKeys } from '@/features/admin/query-keys';
import { getManagedUser, getUserActivity, changeUserAccess } from '@/features/admin/services/users';
import { reasonSchema, type ManagedUser } from '@/features/admin/schemas/users';
import { UsersState, UserStatus } from '@/features/admin/components/users-shared';

function AccessForm({ user, action, close, saved }: { user: ManagedUser; action: 'lock' | 'unlock'; close: () => void; saved: () => void }) {
  const t = useTranslations('AdminUsers'); const cache = useQueryClient();
  const [confirmedReason, setConfirmedReason] = useState<string | null>(null);
  const form = useForm<z.infer<typeof reasonSchema>>({ resolver: zodResolver(reasonSchema), mode: 'onChange', defaultValues: { reason: '' } });
  const mutation = useMutation({ mutationFn: (reason: string) => changeUserAccess(user.id, action, { reason }), onSuccess: async result => {
    cache.setQueryData(adminKeys.user(user.id), result);
    await Promise.all([cache.invalidateQueries({ queryKey: adminKeys.users }), cache.invalidateQueries({ queryKey: adminKeys.userActivity(user.id) }), cache.invalidateQueries({ queryKey: ['admin', 'logs'] }), cache.invalidateQueries({ queryKey: ['admin', 'overview'] })]);
    saved(); close();
  } });
  const error = mutation.error;
  return <section className="admin-access-panel" aria-label={t(action)}><h2>{t(confirmedReason === null ? action : 'confirmTitle')}</h2><p>{t(confirmedReason === null ? action === 'lock' ? 'lockHint' : 'unlockHint' : 'confirmHint')}</p>
    {confirmedReason === null ? <form noValidate onSubmit={form.handleSubmit(values => setConfirmedReason(values.reason))}><label htmlFor="admin-action-reason">{t('reason')}</label><Textarea id="admin-action-reason" {...form.register('reason')} rows={4} placeholder={t('reasonPlaceholder')} aria-invalid={!!form.formState.errors.reason} aria-describedby={form.formState.errors.reason ? 'admin-reason-error' : undefined} />{form.formState.errors.reason && <p id="admin-reason-error" className="admin-error" role="alert">{t(form.formState.errors.reason.message === 'reasonLength' ? 'reasonLength' : 'reasonRequired')}</p>}<div className="admin-access-buttons"><Button type="button" variant="outline" onClick={close}>{t('cancel')}</Button><Button type="submit">{t('continue')}</Button></div></form> : <><dl className="admin-confirm-details"><div><dt>{t('name')}</dt><dd>{user.fullName}</dd></div><div><dt>{t('email')}</dt><dd>{user.email}</dd></div><div><dt>{t('reason')}</dt><dd>{confirmedReason}</dd></div></dl>
      {error && <p className="admin-error" role="alert">{t(error instanceof ApiError && error.status === 403 ? 'permission' : error instanceof ApiError && error.status === 422 ? 'invalidState' : 'updateFailed')}</p>}
      <div className="admin-access-buttons"><Button variant="ghost" disabled={mutation.isPending} onClick={() => { setConfirmedReason(null); mutation.reset(); }}>{t('edit')}</Button><Button variant="outline" disabled={mutation.isPending} onClick={close}>{t('cancel')}</Button><Button disabled={mutation.isPending} onClick={() => mutation.mutate(confirmedReason)}>{t(mutation.isPending ? 'saving' : action === 'lock' ? 'confirmLock' : 'confirmUnlock')}</Button></div></>}
  </section>;
}
export function AdminUserDetail({ userId }: { userId: string }) {
  const t = useTranslations('AdminUsers'); const f = useFormatter();
  const query = useQuery({ queryKey: adminKeys.user(userId), queryFn: ({ signal }) => getManagedUser(userId, signal), retry: false });
  const history = useQuery({ queryKey: adminKeys.userActivity(userId), queryFn: ({ signal }) => getUserActivity(userId, signal), retry: false, enabled: !!query.data });
  const [action, setAction] = useState<'lock' | 'unlock' | null>(null); const [notice, setNotice] = useState<'lockSuccess' | 'unlockSuccess' | null>(null);
  const user = query.data;
  const date = (value?: string) => value ? f.dateTime(new Date(value), { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : t('noValue');
  return <div className="admin-users-page"><Link className="admin-user-back" href="/admin/users"><ArrowLeft size={17} />{t('back')}</Link><UsersState pending={query.isPending} error={query.error} retry={query.refetch} />
    {user && !query.error && <><div className="admin-users-heading"><div><h1>{t('detail')}</h1><p>{user.fullName}</p></div><UserStatus status={user.status} /></div>{notice && <p className="admin-user-notice" role="status"><ShieldCheck size={18} />{t(notice)}</p>}
      <section className="admin-user-info"><h2>{t('overview')}</h2><dl className="admin-user-fields">{[{ key: 'name', value: user.fullName }, { key: 'email', value: user.email }, { key: 'role', value: t(user.role) }, { key: 'phone', value: user.phone }, { key: 'address', value: user.address }, { key: 'created', value: date(user.createdAt) }, { key: 'lastLogin', value: date(user.lastLoginAt) }, ...(user.status === 'locked' ? [{ key: 'lockReason', value: user.lockReason }] : [])].map(({ key, value }) => <div key={key}><dt>{t(key)}</dt><dd>{value || t('noValue')}</dd></div>)}</dl></section>
      <section className="admin-user-info"><h2>{t('statistics')}</h2><div className="admin-user-metrics">{[{ key: 'cvCount', value: user.stats?.cvCount }, { key: 'applicationCount', value: user.stats?.applicationCount }, { key: 'jobCount', value: user.stats?.jobCount }, { key: 'violations', value: user.violationCount }].filter(item => item.value !== undefined).map(item => <div key={item.key}><span>{t(item.key)}</span><strong>{f.number(item.value ?? 0)}</strong></div>)}</div></section>
      {!action && (user.role !== 'admin' ? <div className="admin-user-actions"><Button variant={user.status === 'active' ? 'destructive' : 'default'} onClick={() => { setNotice(null); setAction(user.status === 'active' ? 'lock' : 'unlock'); }}>{user.status === 'active' ? <LockKeyhole size={17} /> : <LockKeyholeOpen size={17} />}{t(user.status === 'active' ? 'lock' : 'unlock')}</Button></div> : <p className="admin-muted">{t('readOnly')}</p>)}
      {action && <AccessForm key={`${user.id}-${action}`} user={user} action={action} close={() => setAction(null)} saved={() => setNotice(action === 'lock' ? 'lockSuccess' : 'unlockSuccess')} />}
      <section className="admin-user-info"><h2>{t('history')}</h2><UsersState pending={history.isPending} error={history.error} retry={history.refetch} />{!history.isPending && !history.error && (history.data?.items.length ? <ol className="admin-user-history">{history.data.items.map(item => <li key={item.id}><ShieldCheck size={18} /><div><strong>{t(item.action === 'user.lock' ? 'actionLock' : item.action === 'user.unlock' ? 'actionUnlock' : 'actionOther')}</strong><p>{t('actor')}: {item.actorName ?? t('admin')}</p>{item.metadata?.reason && <p className="admin-history-reason">{t('reason')}: {item.metadata.reason}</p>}<time dateTime={item.occurredAt}>{date(item.occurredAt)}</time></div></li>)}</ol> : <p className="admin-user-history-empty">{t('noHistory')}</p>)}</section>
    </>}
  </div>;
}
