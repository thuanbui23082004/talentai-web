'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ApiError } from '@/lib/api';
import { catalogTypes, catalogInputSchema, type CatalogType, type CatalogItem } from '@/features/admin/schemas/content';
import { getCatalog, saveCatalog, deleteCatalog } from '@/features/admin/services/content';
import { ContentState, ContentPagination } from '@/features/admin/components/content-shared';

export function AdminCatalog() {
  const t = useTranslations('AdminContent'), cache = useQueryClient();
  const [type, setType] = useState<CatalogType>('industries'), [search, setSearch] = useState(''), [status, setStatus] = useState(''), [page, setPage] = useState(1);
  const [editing, setEditing] = useState<CatalogItem | 'new' | null>(null), [deleting, setDeleting] = useState<CatalogItem | null>(null), [notice, setNotice] = useState('');
  const query = useQuery({ queryKey: ['admin', 'catalog', type], queryFn: ({ signal }) => getCatalog(type, signal), retry: false });
  const remove = useMutation({ mutationFn: (item: CatalogItem) => deleteCatalog(type, item.id), onSuccess: async () => { setDeleting(null); setNotice(t('deleted')); await cache.invalidateQueries({ queryKey: ['admin'] }); } });
  const rows = (query.data ?? []).filter(item => item.name.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')) && (!status || String(item.isActive) === status));
  const current = Math.min(page, Math.max(1, Math.ceil(rows.length / 10)));
  function switchType(value: CatalogType) { if (remove.isPending) return; setType(value); setEditing(null); setDeleting(null); setNotice(''); remove.reset(); setSearch(''); setStatus(''); setPage(1); }
  return <div className="admin-users-page"><div className="admin-users-heading"><div><h1>{t('catalog')}</h1><p>{t('catalogHint')}</p></div><div className="admin-access-buttons"><Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}><RefreshCw size={16} />{t('refresh')}</Button><Button disabled={remove.isPending} onClick={() => { setEditing('new'); setDeleting(null); setNotice(''); }}><Plus size={16} />{t('add')}</Button></div></div>
    <div className="admin-section-tabs" role="group" aria-label={t('catalog')}>{catalogTypes.map(key => <Button key={key} variant="ghost" aria-pressed={type === key} className={type === key ? 'selected' : ''} disabled={remove.isPending} onClick={() => switchType(key)}>{t(key)}</Button>)}</div>
    {notice && <p role="status" className="admin-user-notice">{notice}</p>}
    {editing && <CatalogForm key={`${type}-${editing === 'new' ? 'new' : editing.id}`} type={type} item={editing === 'new' ? undefined : editing} items={query.data ?? []} close={() => setEditing(null)} saved={() => { setEditing(null); setNotice(t('saved')); }} />}
    {deleting && <section className="admin-access-panel" aria-label={t('remove')}><h2>{t('confirmDelete', { name: deleting.name })}</h2><p>{t('deleteHint')}</p>{remove.error && <p role="alert" className="admin-error">{t(remove.error instanceof ApiError && remove.error.status === 409 ? 'inUse' : 'failed')}</p>}<div className="admin-access-buttons"><Button variant="destructive" disabled={remove.isPending} onClick={() => remove.mutate(deleting)}>{t('remove')}</Button><Button variant="outline" disabled={remove.isPending} onClick={() => { setDeleting(null); remove.reset(); }}>{t('cancel')}</Button></div></section>}
    <div className="admin-user-filters"><label className="admin-user-search">{t('search')}<Input type="search" aria-label={t('search')} value={search} placeholder={t('searchHint')} onChange={event => { setSearch(event.target.value); setPage(1); }} /></label><label>{t('status')}<select aria-label={t('status')} value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="">{t('all')}</option><option value="true">{t('active')}</option><option value="false">{t('inactive')}</option></select></label></div>
    <ContentState pending={query.isPending} error={query.error} retry={query.refetch} />
    {!query.isPending && !query.error && <>{rows.length ? <div className="admin-table-scroll"><table className="admin-users-table"><thead><tr>{['name', 'status', 'usage', 'actions'].map(key => <th key={key} scope="col">{t(key)}</th>)}</tr></thead><tbody>{rows.slice((current - 1) * 10, current * 10).map(item => <tr key={item.id}><td><strong>{item.name}</strong>{Boolean(item.aliases?.length) && <small className="admin-content-aliases">{item.aliases?.join(', ')}</small>}</td><td><span className={`admin-badge${item.isActive ? '' : ' failed'}`}>{t(item.isActive ? 'active' : 'inactive')}</span></td><td>{item.usageCount ?? 0}</td><td><div className="admin-access-buttons"><Button variant="ghost" disabled={remove.isPending} onClick={() => { setEditing(item); setDeleting(null); }}>{t('edit')}</Button><Button variant="ghost" disabled={remove.isPending} onClick={() => { setDeleting(item); setEditing(null); remove.reset(); }}>{t('remove')}</Button></div></td></tr>)}</tbody></table></div> : <div className="admin-state">{t('empty')}</div>}<ContentPagination count={rows.length} page={current} setPage={setPage} /></>}
  </div>;
}
function CatalogForm({ type, item, items, close, saved }: { type: CatalogType; item?: CatalogItem; items: CatalogItem[]; close: () => void; saved: () => void }) {
  const t = useTranslations('AdminContent'), cache = useQueryClient(); const [aliases, setAliases] = useState(item?.aliases?.join(', ') ?? '');
  const form = useForm<z.infer<typeof catalogInputSchema>>({ resolver: zodResolver(catalogInputSchema), defaultValues: { name: item?.name ?? '', isActive: item?.isActive ?? true, parentId: item?.parentId, industryId: item?.industryId, aliases: item?.aliases } });
  const industries = useQuery({ queryKey: ['admin', 'catalog', 'industries'], queryFn: ({ signal }) => getCatalog('industries', signal), enabled: type === 'positions' || type === 'skills', retry: false });
  const mutation = useMutation({ mutationFn: (value: z.infer<typeof catalogInputSchema>) => saveCatalog(type, item?.id, value), onSuccess: async () => { await cache.invalidateQueries({ queryKey: ['admin'] }); saved(); } });
  return <form className="admin-access-panel admin-content-form" aria-label={t(item ? 'edit' : 'add')} onSubmit={form.handleSubmit(value => mutation.mutate({ ...value, ...(type === 'skills' ? { aliases: aliases.split(',').map(value => value.trim()).filter(Boolean) } : {}) }))}>
    <h2>{t(item ? 'edit' : 'add')} · {t(type)}</h2><fieldset disabled={mutation.isPending}>
      <label>{t('name')}<Input autoFocus maxLength={150} aria-invalid={Boolean(form.formState.errors.name)} {...form.register('name')} /></label>{form.formState.errors.name && <p className="admin-error" role="alert">{t('required')}</p>}
      {(type === 'industries' || type === 'locations') && <label>{t('parent')}<select aria-label={t('parent')} {...form.register('parentId', { setValueAs: value => value || undefined })}><option value="">{t('none')}</option>{items.filter(row => row.id !== item?.id).map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>}
      {(type === 'positions' || type === 'skills') && <><label>{t('industry')}<select aria-label={t('industry')} {...form.register('industryId', { setValueAs: value => value || undefined })}><option value="">{t('none')}</option>{industries.data?.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label><ContentState pending={industries.isPending} error={industries.error} retry={industries.refetch} /></>}
      {type === 'skills' && <label>{t('aliases')}<Input value={aliases} maxLength={1000} onChange={event => setAliases(event.target.value)} /></label>}
      <label className="admin-content-check"><Controller control={form.control} name="isActive" render={({ field }) => <Checkbox checked={field.value} onCheckedChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />} />{t('activeLabel')}</label>
    </fieldset>{mutation.error && <p role="alert" className="admin-error">{t(mutation.error instanceof ApiError && [409, 422].includes(mutation.error.status ?? 0) ? 'conflict' : 'failed')}</p>}
    <div className="admin-access-buttons"><Button type="submit" disabled={mutation.isPending || ((type === 'positions' || type === 'skills') && !industries.isSuccess)}>{t('save')}</Button><Button type="button" variant="outline" disabled={mutation.isPending} onClick={close}>{t('cancel')}</Button></div>
  </form>;
}
