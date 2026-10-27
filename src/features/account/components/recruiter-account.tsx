'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Check, KeyRound, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAccount, useAccountActions } from '@/features/account/hooks/use-account';
import { changePassword } from '@/features/account/services/account';
import { accountInputSchema, passwordInputSchema, type Account } from '@/features/account/schemas/account';
import { SettingsErrorMessage, SettingsField, SettingsFrame, SettingsImage, SettingsLoadError, SettingsLoading } from '@/features/account/components/settings-shared';

function PasswordForm({ onClose }: { onClose: () => void }) {
  const t = useTranslations('Settings');
  const form = useForm<z.infer<typeof passwordInputSchema>>({ resolver: zodResolver(passwordInputSchema), defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [saved, setSaved] = useState(false);
  // Password values stay only in this form; they never enter the query/mutation cache.
  return <section className="settings-password-panel"><h2>{t('changePassword')}</h2><form noValidate onSubmit={form.handleSubmit(async values => { setBusy(true); setError(null); setSaved(false); try { await changePassword(values); form.reset(); setSaved(true); } catch (failure) { setError(failure); } finally { setBusy(false); } })}>{(['currentPassword', 'newPassword', 'confirmPassword'] as const).map(name => <SettingsField key={name} id={name} label={t(name)} required error={form.formState.errors[name]?.message}><Input id={name} type="password" autoComplete={name === 'currentPassword' ? 'current-password' : 'new-password'} {...form.register(name)} disabled={busy} aria-invalid={!!form.formState.errors[name]} /></SettingsField>)}<p className="settings-password-hint">{t('errors.passwordRules')}</p><SettingsErrorMessage error={error} />{saved && <p role="status" className="settings-success">{t('passwordChanged')}</p>}<div className="settings-form-buttons"><Button type="submit" disabled={busy}>{t(busy ? 'saving' : 'changePassword')}</Button><Button type="button" variant="outline" disabled={busy} onClick={() => { form.reset(); onClose(); }}>{t('close')}</Button></div></form></section>;
}
function AccountContent({ account }: { account: Account }) {
  const t = useTranslations('Settings');
  const actions = useAccountActions();
  const defaults = { fullName: account.fullName, phone: account.phone ?? '', address: account.address ?? '' };
  const form = useForm<z.infer<typeof accountInputSchema>>({ resolver: zodResolver(accountInputSchema), defaultValues: defaults });
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (!form.formState.isDirty) form.reset({ fullName: account.fullName, phone: account.phone ?? '', address: account.address ?? '' }); }, [account, form]);
  return <><header className="settings-section-heading"><h1>{t('account')}</h1><span className={`settings-status settings-status-${account.status}`}>● {t(`accountStatuses.${account.status}`)}</span></header><div className="settings-account-grid"><div><section className="settings-login"><h2><KeyRound size={14} />{t('login')}</h2><SettingsField id="account-email" label={t('email')}><Input id="account-email" type="email" value={account.email} readOnly /></SettingsField><SettingsField id="account-password" label={t('password')}><Input id="account-password" type="password" value="********" readOnly autoComplete="off" /><Button className="settings-password-toggle" variant="ghost" size="sm" aria-expanded={passwordOpen} onClick={() => setPasswordOpen(value => !value)}>{t('changePassword')}</Button></SettingsField>{passwordOpen && <PasswordForm onClose={() => setPasswordOpen(false)} />}</section><section className="settings-contact"><h2><Mail size={14} />{t('contact')}</h2><form noValidate onSubmit={form.handleSubmit(async values => { setSaved(false); try { const account = await actions.save.mutateAsync(values); form.reset({ fullName: account.fullName, phone: account.phone ?? '', address: account.address ?? '' }); setSaved(true); } catch {} })}>{(['fullName', 'phone', 'address'] as const).map(name => <SettingsField key={name} id={`account-${name}`} label={t(name)} required={name === 'fullName'} error={form.formState.errors[name]?.message}><Input id={`account-${name}`} {...form.register(name)} disabled={actions.save.isPending} aria-invalid={!!form.formState.errors[name]} autoComplete={name === 'fullName' ? 'name' : name === 'phone' ? 'tel' : 'street-address'} /></SettingsField>)}<SettingsErrorMessage error={actions.save.error} />{saved && <p className="settings-success" role="status">{t('saved')}</p>}<div className="settings-form-buttons"><Button type="submit" disabled={actions.save.isPending}><Check size={14} />{t(actions.save.isPending ? 'saving' : 'update')}</Button><Button type="button" variant="outline" disabled={actions.save.isPending} onClick={() => { form.reset(defaults); actions.save.reset(); setSaved(false); }}>{t('cancel')}</Button></div></form></section></div><aside><SettingsImage title={t('avatar')} url={account.avatarUrl} busy={actions.upload.isPending || actions.remove.isPending} onUpload={file => actions.upload.mutateAsync(file)} onRemove={() => actions.remove.mutateAsync()} /></aside></div></>;
}
export function RecruiterAccount() {
  const query = useAccount();
  return <SettingsFrame tab="account">{query.isPending ? <SettingsLoading /> : !query.data ? <SettingsLoadError retry={() => void query.refetch()} /> : <AccountContent account={query.data} />}</SettingsFrame>;
}
