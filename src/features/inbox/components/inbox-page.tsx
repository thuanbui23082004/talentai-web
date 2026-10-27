'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, ArchiveRestore, ChevronLeft, ChevronRight, FileText, Inbox, MailOpen, Pencil, Reply, Search, Send, ShieldAlert, Star, Trash2, Users, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { inboxFixtures, type Mail, type MailFolder, type MailLabel } from '@/mocks/fixtures/inbox';
import { MailComposer, type ComposeState, type MailValues } from '@/features/inbox/components/mail-composer';
import { MailRichBody } from '@/features/inbox/components/mail-rich-body';
import { MailAttachments } from '@/features/inbox/components/mail-attachments';
import './inbox.css';

const folders = [
  { key: 'inbox', Icon: Inbox }, { key: 'starred', Icon: Star }, { key: 'sent', Icon: Send },
  { key: 'drafts', Icon: FileText }, { key: 'spam', Icon: ShieldAlert }, { key: 'trash', Icon: Trash2 },
] as const;
type Folder = MailFolder | 'starred';

export function InboxPage() {
  const t = useTranslations('Inbox');
  const format = useFormatter();
  const [mails, setMails] = useState<Mail[]>(() => inboxFixtures.map(item => ({ ...item, name: t(`samples.${item.id}.name`), subject: t(`samples.${item.id}.subject`), body: t(`samples.${item.id}.body`), folder: 'inbox' })));
  const [folder, setFolder] = useState<Folder>('inbox');
  const [label, setLabel] = useState<MailLabel | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [compose, setCompose] = useState<ComposeState | null>(null);
  const [notice, setNotice] = useState('');
  const composeButton = useRef<HTMLButtonElement>(null);
  const fileUrls = useRef(new Set<string>());
  useEffect(() => { const urls = fileUrls.current; return () => { urls.forEach(url => URL.revokeObjectURL(url)); }; }, []);
  const visible = mails.filter(mail => (folder === 'starred' ? mail.starred && mail.folder !== 'trash' && mail.folder !== 'spam' : mail.folder === folder) && (!label || mail.label === label) && `${mail.name} ${mail.subject} ${mail.body}`.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')));
  const active = visible.find(mail => mail.id === selected);
  const index = visible.findIndex(mail => mail.id === active?.id);
  const unread = mails.filter(mail => mail.folder === 'inbox' && !mail.read).length;
  function open(mail: Mail) {
    setSelected(mail.id);
    setMails(items => items.map(item => item.id === mail.id ? { ...item, read: true } : item));
    if (mail.folder === 'drafts') setCompose({ id: mail.id, values: { to: mail.email, cc: mail.cc, bcc: mail.bcc, subject: mail.subject, body: mail.body, richBody: mail.richBody, attachments: mail.attachments } });
  }
  function changeFolder(value: Folder) { setFolder(value); setSelected(null); setSearch(''); setLabel(null); }
  function star(mail: Mail) { setMails(items => items.map(item => item.id === mail.id ? { ...item, starred: !item.starred } : item)); }
  function save(values: MailValues, draft: boolean, id?: string) {
    const next: Mail = { id: id ?? crypto.randomUUID(), name: t('me'), email: values.to, cc: values.cc, bcc: values.bcc, subject: values.subject, body: values.body, richBody: values.richBody, attachments: values.attachments, date: new Date().toISOString(), folder: draft ? 'drafts' : 'sent', label: 'candidate', starred: false, read: true };
    setMails(items => [next, ...items.filter(item => item.id !== next.id)]);
    setCompose(null); changeFolder(next.folder); setSelected(next.id); setNotice(t(draft ? 'draftNotice' : 'sentNotice'));
  }
  function move(mail: Mail) {
    const restore = mail.folder === 'trash';
    setMails(items => items.map(item => item.id === mail.id ? { ...item, folder: restore ? 'inbox' : 'trash' } : item));
    setSelected(null); setNotice(t(restore ? 'restoredNotice' : 'deletedNotice'));
  }
  const date = (value: string) => format.dateTime(new Date(value), { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  return <div className="inbox-page">
    <header className="inbox-heading"><div><h1>{t('title')}</h1><p>{t('subtitle')}</p></div><Button ref={composeButton} onClick={() => { setCompose(current => current ?? { values: { to: '', subject: '', body: '' } }); setNotice(''); }}><Pencil />{t('compose')}</Button></header>
    {notice && <p className="inbox-notice" role="status">{notice}</p>}
    <div className={`inbox-workspace${active ? ' inbox-detail-open' : ''}`}>
      <aside className="inbox-folders"><nav aria-label={t('foldersLabel')}>{folders.map(({ key, Icon }) => <Button key={key} variant="ghost" className={folder === key ? 'mail-folder-selected' : ''} aria-pressed={folder === key} onClick={() => changeFolder(key)}><Icon size={17} /><span>{t(`folders.${key}`)}</span>{key === 'inbox' && unread > 0 && <b>{unread}</b>}</Button>)}</nav><div className="inbox-labels"><h2>{t('labels')}</h2>{([{ key: null, Icon: MailOpen }, { key: 'team', Icon: Users }, { key: 'candidate', Icon: UserRound }] as const).map(({ key, Icon }) => <Button key={key ?? 'all'} variant="ghost" aria-pressed={label === key} className={label === key ? 'mail-label-selected' : ''} onClick={() => { setLabel(key); setSelected(null); }}><Icon size={15} />{t(key ?? 'all')}</Button>)}</div></aside>
      <section className="inbox-list" aria-label={t(`folders.${folder}`)}><div className="inbox-list-toolbar"><div className="inbox-search"><Search size={17} aria-hidden="true" /><Input type="search" value={search} onChange={event => { setSearch(event.target.value); setSelected(null); }} placeholder={t('searchPlaceholder')} aria-label={t('search')} /></div><span>{t('count', { count: visible.length })}</span></div>
        <div className="inbox-mail-list">{visible.length ? visible.map(mail => <article key={mail.id} className={`mail-row${mail.id === active?.id ? ' mail-row-selected' : ''}${!mail.read ? ' mail-row-unread' : ''}`}><Button variant="ghost" className="mail-row-main" aria-pressed={mail.id === active?.id} onClick={() => open(mail)}><span className="mail-avatar" aria-hidden="true">{mail.name.split(/\s+/).slice(-2).map(word => word[0]).join('')}</span><span className="mail-row-text"><span className="mail-row-top"><strong>{mail.name}</strong><span className={`mail-label mail-label-${mail.label}`}>{t(mail.label)}</span><time dateTime={mail.date}>{format.dateTime(new Date(mail.date), { day: '2-digit', month: '2-digit' })}</time></span><strong className="mail-row-subject">{mail.subject || t('compose')}</strong><span className="mail-preview">{mail.body}</span></span></Button><Button variant="ghost" size="icon" className="mail-row-star" aria-label={t(mail.starred ? 'unstar' : 'star')} aria-pressed={mail.starred} onClick={() => star(mail)}><Star fill={mail.starred ? 'currentColor' : 'none'} /></Button></article>) : <div className="inbox-empty" role="status"><Inbox size={30} /><h2>{t(search.trim() || label ? 'noResults' : 'empty')}</h2><p>{t('emptyHint')}</p>{(search || label) && <Button variant="outline" onClick={() => { setSearch(''); setLabel(null); }}>{t('reset')}</Button>}</div>}</div>
      </section>
      <section className="inbox-reader" aria-label={t('body')}>
        {active ? <>
          <div className="mail-reader-toolbar"><Button variant="ghost" size="icon" aria-label={t('back')} onClick={() => setSelected(null)}><ArrowLeft /></Button><Button variant="ghost" size="icon" aria-label={t(active.folder === 'trash' ? 'restore' : 'remove')} onClick={() => move(active)}>{active.folder === 'trash' ? <ArchiveRestore /> : <Trash2 />}</Button><div className="mail-pagination"><span>{t('position', { current: index + 1, total: visible.length })}</span><Button variant="ghost" size="icon" aria-label={t('previous')} disabled={index <= 0} onClick={() => open(visible[index - 1])}><ChevronLeft /></Button><Button variant="ghost" size="icon" aria-label={t('next')} disabled={index >= visible.length - 1} onClick={() => open(visible[index + 1])}><ChevronRight /></Button><Button variant="ghost" size="icon" aria-label={t(active.starred ? 'unstar' : 'star')} aria-pressed={active.starred} onClick={() => star(active)}><Star fill={active.starred ? 'currentColor' : 'none'} /></Button></div></div>
          <article className="mail-content"><header><span className="mail-avatar" aria-hidden="true">{active.name.split(/\s+/).slice(-2).map(word => word[0]).join('')}</span><div><strong>{active.name}</strong><p>{active.folder === 'sent' || active.folder === 'drafts' ? `${t('to')}: ` : ''}{active.email}</p></div><time dateTime={active.date}>{date(active.date)}</time></header><h2>{active.subject || t('compose')}</h2><div className="mail-recipient-summary">{active.cc && <p>{t('cc')}: {active.cc}</p>}{active.bcc && (active.folder === 'sent' || active.folder === 'drafts') && <p>{t('bcc')}: {active.bcc}</p>}</div><div className={`mail-body${active.richBody?.length ? ' mail-body-rich' : ''}`}>{active.richBody?.length ? <MailRichBody nodes={active.richBody} /> : active.body}</div>{!!active.attachments?.length && <MailAttachments attachments={active.attachments} />}<footer><Button variant="outline" onClick={() => setCompose({ values: { to: active.folder === 'sent' ? '' : active.email, subject: t('replySubject', { subject: active.subject }), body: '' } })}><Reply />{t('reply')}</Button><Button variant="ghost" onClick={() => setCompose({ values: { to: '', subject: t('forwardSubject', { subject: active.subject }), body: `${t('forwarded')}\n\n${active.body}` } })}><ArrowRight />{t('forward')}</Button></footer></article>
        </> : <div className="inbox-empty inbox-reader-empty"><MailOpen size={36} /><h2>{t('select')}</h2><p>{t('subtitle')}</p></div>}
      </section>
    </div>
    {compose && <MailComposer key={compose.id ?? `${compose.values.to}-${compose.values.subject}`} initial={compose} onSave={save} onUrl={url => fileUrls.current.add(url)} onClose={() => { setCompose(null); composeButton.current?.focus({ preventScroll: true }); }} />}
  </div>;
}
