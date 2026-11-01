'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Building2, UserRound, Upload } from 'lucide-react';
import { ZodError } from 'zod';
import { Button } from '@/components/ui/button';
import { SettingsError } from '@/features/account/errors';
import './settings.css';

export function SettingsFrame({ tab, children }: { tab: 'account' | 'company'; children: ReactNode }) {
  const t = useTranslations('Settings');
  return <div className="settings-page"><nav className="settings-tabs" aria-label={t('tabs')}><Link href="/recruiter/account" aria-current={tab === 'account' ? 'page' : undefined}><UserRound size={15} />{t('account')}</Link><Link href="/recruiter/company" aria-current={tab === 'company' ? 'page' : undefined}><Building2 size={15} />{t('company')}</Link></nav>{children}</div>;
}
export function SettingsField({ id, label, required, error, children }: { id: string; label: string; required?: boolean; error?: string; children: ReactNode }) {
  const t = useTranslations('Settings');
  return <div className="settings-field"><label htmlFor={id} data-required={required}>{label}</label><div>{children}{error && <p id={`${id}-error`} role="alert" className="settings-error">{t(`errors.${error}`)}</p>}</div></div>;
}
export function SettingsErrorMessage({ error }: { error: unknown }) {
  const t = useTranslations('Settings');
  if (!error) return null;
  const key = error instanceof SettingsError ? error.key : error instanceof ZodError ? error.issues[0]?.message ?? 'invalid' : 'request';
  return <p role="alert" className="settings-error">{t(`errors.${key}`)}</p>;
}
export function SettingsLoading() { const t = useTranslations('Settings'); return <div className="settings-skeleton" aria-label={t('loading')} aria-busy="true"><span /><span /><span /></div>; }
export function SettingsLoadError({ retry }: { retry: () => void }) { const t = useTranslations('Settings'); return <div className="settings-load-error" role="alert"><p>{t('errors.request')}</p><Button variant="outline" onClick={retry}>{t('retry')}</Button></div>; }
export function SettingsImage({ title, url, company = false, busy, onUpload, onRemove }: { title: string; url?: string; company?: boolean; busy: boolean; onUpload: (file: File) => Promise<unknown>; onRemove: () => Promise<unknown> }) {
  const t = useTranslations('Settings');
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState<string | null>(null);
  async function upload(file: File) { setError(null); setNotice(null); try { await onUpload(file); setNotice('imageUpdated'); } catch (failure) { setError(failure); } }
  return <section className="settings-image-section"><h2>{title}</h2><div className="settings-image-box"><div className="settings-image-actions"><div className="settings-image-preview">{url && (/^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url)) ? <Image src={url} alt={title} width={80} height={80} unoptimized /> : company ? <Building2 size={30} /> : <UserRound size={30} />}</div><div><input className="settings-file-input" type="file" accept={company ? 'image/png,image/jpeg,image/webp,image/svg+xml' : 'image/png,image/jpeg,image/webp'} ref={input} disabled={busy} aria-label={t('changeImage')} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void upload(file); }} /><Button variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()}><Upload size={12} />{t(busy ? 'saving' : 'changeImage')}</Button><Button className="settings-delete-image" variant="ghost" size="sm" disabled={busy || !url} onClick={async () => { setError(null); setNotice(null); try { await onRemove(); setNotice('imageRemoved'); } catch (failure) { setError(failure); } }}>{t('deleteImage')}</Button></div></div><p>{t(company ? 'logoHint' : 'imageHint')}</p><SettingsErrorMessage error={error} />{notice && <p role="status" className="settings-success">{t(notice)}</p>}</div></section>;
}
