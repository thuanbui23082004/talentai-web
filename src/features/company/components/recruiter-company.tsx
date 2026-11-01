'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { FileCheck2, Upload, Bold, Italic, List, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SettingsErrorMessage, SettingsField, SettingsFrame, SettingsImage, SettingsLoadError, SettingsLoading } from '@/features/account';
import { useCompany, useCompanyActions, useCompanyCatalogs, useCompanyBusy } from '@/features/company/hooks/use-company';
import { companyMainFormSchema, companyIntroFormSchema, companySizes, companyToInput, type Company } from '@/features/company/schemas/company';

function mainDefaults(company: Company | null): z.infer<typeof companyMainFormSchema> {
  return { name: company?.name ?? '', taxCode: company?.taxCode ?? '', industryIds: company?.industries?.map(item => item.id) ?? [], size: company?.size ?? '', city: company?.city ?? '', address: company?.address ?? '', contactPhone: company?.contactPhone ?? '' };
}
function MainForm({ company, disabled }: { company: Company | null; disabled: boolean }) {
  const t = useTranslations('Settings');
  const actions = useCompanyActions();
  const catalogs = useCompanyCatalogs();
  const form = useForm<z.infer<typeof companyMainFormSchema>>({ resolver: zodResolver(companyMainFormSchema), defaultValues: mainDefaults(company) });
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (!form.formState.isDirty) form.reset(mainDefaults(company)); }, [company, form]);
  const locations = [{ value: '', label: t('chooseCity') }, ...(catalogs.data?.locations ?? []).map(item => ({ value: item.name, label: item.name }))];
  if (company?.city && !locations.some(item => item.value === company.city)) locations.push({ value: company.city, label: company.city });
  const sizes = [{ value: '', label: t('chooseSize') }, ...companySizes.map(size => ({ value: size, label: t('sizeOption', { size }) }))];
  const busy = disabled || actions.save.isPending;
  return <form className="settings-company-main" noValidate onSubmit={form.handleSubmit(async values => {
    setSaved(false);
    const previous = company ? companyToInput(company) : {};
    try { const result = await actions.save.mutateAsync({ creating: !company, input: { ...previous, ...values, size: values.size || undefined } }); form.reset(mainDefaults(result)); setSaved(true); } catch {}
  })}>
    <SettingsField id="company-taxCode" label={t('taxCode')} error={form.formState.errors.taxCode?.message}><Input id="company-taxCode" {...form.register('taxCode')} disabled={busy} /></SettingsField>
    <SettingsField id="company-name" label={t('companyName')} required error={form.formState.errors.name?.message}><Input id="company-name" {...form.register('name')} disabled={busy} aria-invalid={!!form.formState.errors.name} /></SettingsField>
    <Controller control={form.control} name="size" render={({ field }) => <SettingsField id="company-size" label={t('size')}><Select items={sizes} value={field.value} onValueChange={field.onChange} disabled={busy}><SelectTrigger id="company-size"><SelectValue /></SelectTrigger><SelectContent>{sizes.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></SettingsField>} />
    <Controller control={form.control} name="city" render={({ field }) => <SettingsField id="company-city" label={t('city')} required error={form.formState.errors.city?.message}><Select items={locations} value={field.value} onValueChange={field.onChange} disabled={busy || catalogs.isPending}><SelectTrigger id="company-city"><SelectValue /></SelectTrigger><SelectContent>{locations.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></SettingsField>} />
    <SettingsField id="company-address" label={t('companyAddress')} error={form.formState.errors.address?.message}><Input id="company-address" {...form.register('address')} disabled={busy} autoComplete="street-address" /></SettingsField>
    <SettingsField id="company-phone" label={t('companyPhone')}><Input id="company-phone" {...form.register('contactPhone')} disabled={busy} autoComplete="tel" /></SettingsField>
    <Controller control={form.control} name="industryIds" render={({ field }) => <SettingsField id="company-industry" label={t('industry')} required error={form.formState.errors.industryIds?.message}><div id="company-industry" className="settings-industries" role="group" aria-label={t('industry')}>{(catalogs.data?.industries ?? []).map(item => <label key={item.id}><Checkbox checked={field.value.includes(item.id)} disabled={busy} onCheckedChange={checked => field.onChange(checked ? [...field.value, item.id] : field.value.filter(id => id !== item.id))} />{item.name}</label>)}</div></SettingsField>} />
    {catalogs.isError && <div className="settings-catalog-error" role="alert"><p>{t('errors.request')}</p><Button type="button" size="sm" variant="outline" onClick={() => void catalogs.refetch()}>{t('retry')}</Button></div>}
    <SettingsErrorMessage error={actions.save.error} />{saved && <p className="settings-success" role="status">{t('saved')}</p>}
    <div className="settings-form-buttons"><Button type="submit" disabled={busy || catalogs.isPending || catalogs.isError}>{t(actions.save.isPending ? 'saving' : company ? 'save' : 'createCompany')}</Button><Button type="button" variant="outline" disabled={busy} onClick={() => { form.reset(mainDefaults(company)); actions.save.reset(); setSaved(false); }}>{t('cancel')}</Button></div>
  </form>;
}
function IntroForm({ company, disabled }: { company: Company; disabled: boolean }) {
  const t = useTranslations('Settings'); const actions = useCompanyActions();
  const form = useForm<z.infer<typeof companyIntroFormSchema>>({ resolver: zodResolver(companyIntroFormSchema), defaultValues: { description: company.description ?? '', website: company.website ?? '' } });
  const area = useRef<HTMLTextAreaElement | null>(null); const history = useRef<string[]>([]);
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (!form.formState.isDirty) form.reset({ description: company.description ?? '', website: company.website ?? '' }); }, [company, form]);
  const binding = form.register('description');
  function format(before: string, after = '') {
    const text = form.getValues('description'); const start = area.current?.selectionStart ?? text.length; const end = area.current?.selectionEnd ?? text.length;
    history.current.push(text); form.setValue('description', text.slice(0, start) + before + text.slice(start, end) + after + text.slice(end), { shouldDirty: true, shouldValidate: true }); area.current?.focus();
  }
  return <section className="settings-company-section"><h2>{t('businessInfo')}</h2><form noValidate onSubmit={form.handleSubmit(async values => { setSaved(false); try { const result = await actions.save.mutateAsync({ input: { ...companyToInput(company), description: values.description, website: values.website || undefined }, creating: false }); form.reset({ description: result.description ?? '', website: result.website ?? '' }); setSaved(true); } catch {} })}>
    <SettingsField id="company-description" label={t('description')} error={form.formState.errors.description?.message}><div className="settings-editor"><div className="settings-editor-toolbar">{([{ label: 'bold', Icon: Bold, before: '**', after: '**' }, { label: 'italic', Icon: Italic, before: '*', after: '*' }, { label: 'bullet', Icon: List, before: '\n- ', after: '' }] as const).map(item => <Button key={item.label} type="button" size="icon-xs" variant="ghost" disabled={disabled || actions.save.isPending} aria-label={t(item.label)} onClick={() => format(item.before, item.after)}><item.Icon size={12} /></Button>)}<Button type="button" size="icon-xs" variant="ghost" disabled={disabled || actions.save.isPending} aria-label={t('undo')} onClick={() => { const previous = history.current.pop(); if (previous !== undefined) form.setValue('description', previous, { shouldDirty: true }); }}><Undo2 size={12} /></Button></div><Textarea id="company-description" {...binding} ref={element => { binding.ref(element); area.current = element; }} maxLength={5000} rows={6} disabled={disabled || actions.save.isPending} placeholder={t('descriptionPlaceholder')} /></div></SettingsField>
    <SettingsField id="company-website" label={t('website')} error={form.formState.errors.website?.message}><Input id="company-website" {...form.register('website')} type="url" disabled={disabled || actions.save.isPending} placeholder="https://" /></SettingsField><SettingsErrorMessage error={actions.save.error} />{saved && <p role="status" className="settings-success">{t('saved')}</p>}<div className="settings-form-buttons"><Button type="submit" disabled={disabled || actions.save.isPending}>{t(actions.save.isPending ? 'saving' : 'save')}</Button></div></form>
  </section>;
}
function CompanyDocuments({ company, disabled }: { company: Company; disabled: boolean }) {
  const t = useTranslations('Settings'); const actions = useCompanyActions(); const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]); const [error, setError] = useState<unknown>(null); const [saved, setSaved] = useState(false);
  async function send(values: File[]) { setError(null); setSaved(false); try { await actions.documents.mutateAsync(values); setFiles([]); setSaved(true); } catch (failure) { setError(failure); } }
  return <section className="settings-documents"><div className="settings-documents-title"><h2><FileCheck2 size={15} />{t('businessLicense')}</h2><span className={`settings-status settings-status-${company.verificationStatus}`}>● {t(`companyStatuses.${company.verificationStatus}`)}</span></div><p>{t('documentHint')}</p>{company.verificationDocuments?.length ? <p>{t('documentsCount', { count: company.verificationDocuments.length })}</p> : null}{company.rejectionReason && <p className="settings-error">{company.rejectionReason}</p>}<input className="settings-file-input" type="file" multiple ref={input} accept="application/pdf,image/png,image/jpeg,image/webp" disabled={disabled || actions.documents.isPending} aria-label={t('uploadDocuments')} onChange={event => { const values = Array.from(event.target.files ?? []); event.target.value = ''; if (values.length) { setFiles(values); void send(values); } }} /><Button size="sm" disabled={disabled || actions.documents.isPending} onClick={() => input.current?.click()}><Upload size={13} />{t(actions.documents.isPending ? 'sending' : 'uploadDocuments')}</Button><SettingsErrorMessage error={error} />{!!error && files.length > 0 && <Button size="sm" variant="outline" disabled={disabled || actions.documents.isPending} onClick={() => void send(files)}>{t('retry')}</Button>}{saved && <p role="status" className="settings-success">{t('documentsSent')}</p>}</section>;
}
export function RecruiterCompany() {
  const t = useTranslations('Settings'); const query = useCompany(); const actions = useCompanyActions();
  const busy = useCompanyBusy();
  const [busyCount, setBusyCount] = useState(0);
  async function imageAction(action: () => Promise<unknown>) { setBusyCount(value => value + 1); try { return await action(); } finally { setBusyCount(value => value - 1); } }
  return <SettingsFrame tab="company">{query.isPending ? <SettingsLoading /> : query.isError ? <SettingsLoadError retry={() => void query.refetch()} /> : <><header className="settings-section-heading"><h1>{t('company')}</h1>{query.data && <span className={`settings-status settings-status-${query.data.verificationStatus}`}>● {t(`companyStatuses.${query.data.verificationStatus}`)}</span>}</header>{!query.data && <p className="settings-empty">{t('noCompany')}</p>}<section className="settings-company-section"><MainForm company={query.data ?? null} disabled={busy || busyCount > 0} />{query.data && <CompanyDocuments company={query.data} disabled={busy || busyCount > 0} />}</section>{query.data && <><IntroForm company={query.data} disabled={busy || busyCount > 0} /><section className="settings-company-section"><SettingsImage title={t('logo')} company url={query.data.logoUrl} busy={busy || actions.logo.isPending || actions.remove.isPending} onUpload={file => imageAction(() => actions.logo.mutateAsync(file))} onRemove={() => imageAction(() => actions.remove.mutateAsync())} /></section></>}</>}</SettingsFrame>;
}
