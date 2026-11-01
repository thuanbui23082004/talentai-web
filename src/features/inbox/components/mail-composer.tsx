'use client';

import { useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { ArrowUpRight, Maximize2, Minimize2, Minus, Send, Save, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mailDraftSchema, mailSendSchema, type MailValues } from '@/features/inbox/mail-schema';
import { MailRichEditor } from '@/features/inbox/components/mail-rich-editor';
import './mail-composer.css';

export type { MailValues } from '@/features/inbox/mail-schema';
export type ComposeState = { id?: string; values: MailValues };

export function MailComposer({ initial, onSave, onClose, onUrl }: { initial: ComposeState; onSave: (values: MailValues, draft: boolean, id?: string) => void; onClose: () => void; onUrl: (url: string) => void }) {
  const t = useTranslations('Inbox');
  const [minimized, setMinimized] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [ccVisible, setCcVisible] = useState(!!initial.values.cc);
  const [bccVisible, setBccVisible] = useState(!!initial.values.bcc);
  const windowRef = useRef<HTMLElement>(null);
  const { register, handleSubmit, setError, setValue, control, formState: { errors } } = useForm<MailValues>({ resolver: zodResolver(mailDraftSchema), defaultValues: initial.values });
  const attachments = useWatch({ control, name: 'attachments' }) ?? [];
  function toggleMinimize() {
    if (!minimized && windowRef.current?.contains(document.activeElement)) windowRef.current.querySelector<HTMLButtonElement>('.mail-window-title')?.focus();
    setMinimized(value => !value);
  }
  return <section ref={windowRef} role="dialog" aria-modal="false" aria-labelledby="mail-window-title" className={`mail-composer mail-compose-window${minimized ? ' mail-compose-minimized' : ''}${expanded && !minimized ? ' mail-compose-expanded' : ''}`}>
    <header className="mail-window-header"><Button id="mail-window-title" className="mail-window-title" variant="ghost" aria-expanded={!minimized} aria-controls="mail-compose-form" onClick={() => { if (minimized) setMinimized(false); }}>{t('newMail')}</Button><div className="mail-window-controls">
      <Button variant="ghost" size="icon" aria-label={t(minimized ? 'restoreCompose' : 'minimizeCompose')} onClick={toggleMinimize}>{minimized ? <ArrowUpRight /> : <Minus />}</Button>
      <Button variant="ghost" size="icon" aria-label={t(expanded ? 'shrinkCompose' : 'expandCompose')} onClick={() => { setMinimized(false); setExpanded(value => !value); }}>{expanded ? <Minimize2 /> : <Maximize2 />}</Button>
      <Button variant="ghost" size="icon" aria-label={t('closeCompose')} onClick={handleSubmit(values => { if (values.to.trim() || values.cc?.trim() || values.bcc?.trim() || values.subject.trim() || values.body.trim() || values.attachments?.length) onSave(values, true, initial.id); else onClose(); })}><X /></Button>
    </div></header>
    <form id="mail-compose-form" hidden={minimized} onSubmit={handleSubmit(values => { const parsed = mailSendSchema.safeParse(values); if (!parsed.success) { setError('root', { message: t('required') }); return; } onSave(parsed.data, false, initial.id); })} noValidate>
      <div className="mail-compose-fields"><div className="mail-compose-recipient"><label htmlFor="mail-to">{t('to')}</label><Input id="mail-to" inputMode="email" autoFocus autoComplete="off" {...register('to')} aria-invalid={!!errors.root || !!errors.to} aria-describedby={Object.keys(errors).length ? 'mail-compose-error' : undefined} /><div className="mail-recipient-toggles"><Button type="button" variant="ghost" size="sm" aria-expanded={ccVisible} aria-controls="mail-cc-row" onClick={() => setCcVisible(value => !value)}>{t('cc')}</Button><Button type="button" variant="ghost" size="sm" aria-expanded={bccVisible} aria-controls="mail-bcc-row" onClick={() => setBccVisible(value => !value)}>{t('bcc')}</Button></div></div>
      <div id="mail-cc-row" className="mail-compose-recipient" hidden={!ccVisible}><label htmlFor="mail-cc">{t('cc')}</label><Input id="mail-cc" inputMode="email" autoComplete="off" {...register('cc')} aria-invalid={!!errors.cc} /></div>
      <div id="mail-bcc-row" className="mail-compose-recipient" hidden={!bccVisible}><label htmlFor="mail-bcc">{t('bcc')}</label><Input id="mail-bcc" inputMode="email" autoComplete="off" {...register('bcc')} aria-invalid={!!errors.bcc} /></div>
      <label htmlFor="mail-subject" className="sr-only">{t('subject')}</label><Input id="mail-subject" placeholder={t('subject')} {...register('subject')} aria-invalid={!!errors.subject} /></div>
      <input type="hidden" {...register('body')} />
      <MailRichEditor initial={initial.values} attachments={attachments} invalid={!!errors.body}
        onChange={(body, nodes) => { setValue('body', body, { shouldDirty: true }); setValue('richBody', nodes, { shouldDirty: true }); }}
        onAttachments={items => setValue('attachments', items, { shouldDirty: true })} onUrl={onUrl}
        actions={<><Button type="submit" className="mail-compose-send"><Send />{t('send')}</Button><Button type="button" variant="ghost" size="icon" title={t('saveDraft')} aria-label={t('saveDraft')} onClick={handleSubmit(values => onSave(values, true, initial.id))}><Save /></Button></>}
        discard={<Button type="button" variant="ghost" size="icon" className="mail-compose-discard" aria-label={t('discardCompose')} onClick={onClose}><Trash2 /></Button>} />
      {Object.keys(errors).length > 0 && <p id="mail-compose-error" role="alert">{t('required')}</p>}
    </form></section>;
}
