'use client';

import { useCallback, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { AlignCenter, AlignLeft, AlignRight, Bold, CaseSensitive, ImagePlus, Italic, Link2, List, ListOrdered, Paperclip, PenLine, Redo2, Smile, Underline, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { attachmentSchema, safeMailLink, type MailAttachment, type MailValues, type RichNode } from '@/features/inbox/mail-schema';
import { mountMailEditor, readMailEditor } from '@/features/inbox/rich-editor-dom';
import { mailColors } from '@/features/inbox/components/mail-rich-body';
import { MailAttachments } from '@/features/inbox/components/mail-attachments';

export function MailRichEditor({ initial, attachments, onChange, onAttachments, onUrl, actions, discard, invalid }: {
  initial: MailValues; attachments: MailAttachment[]; onChange: (body: string, nodes: RichNode[]) => void;
  onAttachments: (items: MailAttachment[]) => void; onUrl: (url: string) => void; actions: ReactNode; discard: ReactNode; invalid: boolean;
}) {
  const t = useTranslations('Inbox');
  const editor = useRef<HTMLDivElement | null>(null);
  const selection = useRef<Range | null>(null);
  const files = useRef<HTMLInputElement>(null);
  const images = useRef<HTMLInputElement>(null);
  const [formatting, setFormatting] = useState(true);
  const [panel, setPanel] = useState<'link' | 'emoji' | null>(null);
  const [link, setLink] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [error, setError] = useState('');
  const [font, setFont] = useState('Arial');
  const [size, setSize] = useState('3');
  const [color, setColor] = useState<keyof typeof mailColors>('text');
  const [active, setActive] = useState<Record<string, boolean>>({});
  const mount = useCallback((node: HTMLDivElement | null) => {
    editor.current = node;
    if (node) mountMailEditor(node, initial.richBody ?? [], initial.body);
  }, [initial]);
  function remember() {
    const current = window.getSelection();
    if (current?.rangeCount && editor.current?.contains(current.anchorNode) && editor.current.contains(current.focusNode)) selection.current = current.getRangeAt(0).cloneRange();
    setActive(Object.fromEntries(['bold', 'italic', 'underline', 'insertUnorderedList', 'insertOrderedList'].map(command => [command, document.queryCommandState(command)])));
  }
  function sync() { if (editor.current) onChange(editor.current.innerText, readMailEditor(editor.current)); }
  function restore() {
    const root = editor.current; if (!root) return;
    root.focus();
    const current = window.getSelection();
    if (selection.current && root.contains(selection.current.commonAncestorContainer)) { current?.removeAllRanges(); current?.addRange(selection.current); }
    else { const range = document.createRange(); range.selectNodeContents(root); range.collapse(false); current?.removeAllRanges(); current?.addRange(range); }
  }
  function command(name: string, value?: string) {
    restore(); document.execCommand(name, false, value); sync(); remember();
  }
  function addLink() {
    const href = safeMailLink(link);
    if (!href || !linkLabel.trim()) { setError(t('editor.invalidLink')); return; }
    restore();
    const anchor = document.createElement('a'); anchor.href = href; anchor.textContent = linkLabel.trim();
    // Both the URL and label are validated/escaped through DOM setters before insertion.
    document.execCommand('insertHTML', false, anchor.outerHTML); sync(); remember(); setPanel(null); setError(''); setLink(''); setLinkLabel('');
  }
  function attach(list: FileList | null, imageOnly: boolean) {
    if (!list) return;
    const chosen = Array.from(list);
    if (attachments.length + chosen.length > 10 || chosen.some(file => file.size > 10 * 1024 * 1024) || attachments.reduce((sum, file) => sum + file.size, 0) + chosen.reduce((sum, file) => sum + file.size, 0) > 25 * 1024 * 1024) { setError(t('editor.fileLimit')); return; }
    if (imageOnly && chosen.some(file => !['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type))) { setError(t('editor.imageType')); return; }
    const next = chosen.map(file => { const url = URL.createObjectURL(file); onUrl(url); return attachmentSchema.parse({ id: crypto.randomUUID(), name: file.name, size: file.size, type: file.type, url }); });
    onAttachments([...attachments, ...next]); setError('');
  }
  const commands = [
    { name: 'undo', label: 'undo', Icon: Undo2 }, { name: 'redo', label: 'redo', Icon: Redo2 },
    { name: 'bold', label: 'bold', Icon: Bold }, { name: 'italic', label: 'italic', Icon: Italic }, { name: 'underline', label: 'underline', Icon: Underline },
    { name: 'justifyLeft', label: 'left', Icon: AlignLeft }, { name: 'justifyCenter', label: 'center', Icon: AlignCenter }, { name: 'justifyRight', label: 'right', Icon: AlignRight },
    { name: 'insertOrderedList', label: 'ordered', Icon: ListOrdered }, { name: 'insertUnorderedList', label: 'unordered', Icon: List },
  ] as const;
  return <>
    <div id="mail-body" ref={mount} role="textbox" aria-label={t('body')} aria-multiline="true" aria-invalid={invalid} contentEditable suppressContentEditableWarning className="mail-compose-body mail-rich-editor" onInput={() => { sync(); remember(); }} onKeyUp={remember} onMouseUp={remember} onBlur={remember} onPaste={event => { event.preventDefault(); command('insertText', event.clipboardData.getData('text/plain')); }} onDrop={event => event.preventDefault()} />
    {attachments.length > 0 && <div className="mail-compose-attachment-area"><MailAttachments attachments={attachments} onRemove={id => onAttachments(attachments.filter(item => item.id !== id))} /></div>}
    <div className="mail-editor-controls">
      {formatting && <div className="mail-format-toolbar" role="toolbar" aria-label={t('editor.formatting')}>
        {commands.slice(0, 2).map(({ name, label, Icon }) => <Button key={name} type="button" size="icon-sm" variant="ghost" title={t(`editor.${label}`)} aria-label={t(`editor.${label}`)} onMouseDown={event => event.preventDefault()} onClick={() => command(name)}><Icon /></Button>)}
        <Select value={font} onValueChange={value => { if (value) { setFont(value); command('fontName', value); } }}><SelectTrigger size="sm" aria-label={t('editor.font')}><SelectValue>{t(font === 'Georgia' ? 'editor.serif' : font === 'monospace' ? 'editor.mono' : 'editor.sans')}</SelectValue></SelectTrigger><SelectContent><SelectItem value="Arial">{t('editor.sans')}</SelectItem><SelectItem value="Georgia">{t('editor.serif')}</SelectItem><SelectItem value="monospace">{t('editor.mono')}</SelectItem></SelectContent></Select>
        <Select value={size} onValueChange={value => { if (value) { setSize(value); command('fontSize', value); } }}><SelectTrigger size="sm" aria-label={t('editor.size')}><SelectValue>{t(size === '2' ? 'editor.small' : size === '5' ? 'editor.large' : 'editor.normal')}</SelectValue></SelectTrigger><SelectContent><SelectItem value="2">{t('editor.small')}</SelectItem><SelectItem value="3">{t('editor.normal')}</SelectItem><SelectItem value="5">{t('editor.large')}</SelectItem></SelectContent></Select>
        {commands.slice(2).map(({ name, label, Icon }) => <Button key={name} type="button" size="icon-sm" variant="ghost" title={t(`editor.${label}`)} aria-label={t(`editor.${label}`)} aria-pressed={active[name] ?? false} onMouseDown={event => event.preventDefault()} onClick={() => command(name)}><Icon /></Button>)}
        <Select value={color} onValueChange={value => { if (value && editor.current && value in mailColors) { setColor(value as keyof typeof mailColors); command('foreColor', getComputedStyle(editor.current).getPropertyValue(mailColors[value as keyof typeof mailColors]).trim()); } }}><SelectTrigger size="sm" aria-label={t('editor.color')}><SelectValue>{t(`editor.colors.${color}`)}</SelectValue></SelectTrigger><SelectContent>{(Object.keys(mailColors) as (keyof typeof mailColors)[]).map(key => <SelectItem key={key} value={key}>{t(`editor.colors.${key}`)}</SelectItem>)}</SelectContent></Select>
      </div>}
      {panel === 'link' && <div className="mail-insert-panel" role="group" aria-label={t('editor.link')}><label htmlFor="mail-link-label">{t('editor.linkLabel')}</label><Input id="mail-link-label" value={linkLabel} onChange={event => setLinkLabel(event.target.value)} /><label htmlFor="mail-link-url">{t('editor.linkUrl')}</label><Input id="mail-link-url" value={link} onChange={event => setLink(event.target.value)} type="url" /><div><Button type="button" onClick={addLink}>{t('editor.insert')}</Button><Button type="button" variant="ghost" onClick={() => { setPanel(null); setError(''); }}>{t('cancel')}</Button></div></div>}
      {panel === 'emoji' && <div className="mail-emoji-panel" role="group" aria-label={t('editor.emoji')}>{['😀', '😊', '👍', '🎉', '🙏', '❤️', '✅', '📅'].map(emoji => <Button key={emoji} type="button" variant="ghost" onMouseDown={event => event.preventDefault()} aria-label={t('editor.insertEmoji', { emoji })} onClick={() => { command('insertText', emoji); setPanel(null); }}>{emoji}</Button>)}</div>}
      {error && <p role="alert">{error}</p>}
      <footer className="mail-compose-footer">{actions}<div className="mail-compose-insert-actions">
        <Button type="button" variant="ghost" size="icon" title={t('editor.formatting')} aria-label={t('editor.formatting')} aria-pressed={formatting} onClick={() => setFormatting(value => !value)}><CaseSensitive /></Button>
        <Button type="button" variant="ghost" size="icon" title={t('editor.attach')} aria-label={t('editor.attach')} onClick={() => files.current?.click()}><Paperclip /></Button>
        <Button type="button" variant="ghost" size="icon" title={t('editor.link')} aria-label={t('editor.link')} aria-expanded={panel === 'link'} onClick={() => { setLinkLabel(window.getSelection()?.toString() ?? ''); setPanel(value => value === 'link' ? null : 'link'); setError(''); }}><Link2 /></Button>
        <Button type="button" variant="ghost" size="icon" title={t('editor.emoji')} aria-label={t('editor.emoji')} aria-expanded={panel === 'emoji'} onClick={() => setPanel(value => value === 'emoji' ? null : 'emoji')}><Smile /></Button>
        <Button type="button" variant="ghost" size="icon" title={t('editor.image')} aria-label={t('editor.image')} onClick={() => images.current?.click()}><ImagePlus /></Button>
        <Button type="button" variant="ghost" size="icon" title={t('editor.signature')} aria-label={t('editor.signature')} onMouseDown={event => event.preventDefault()} onClick={() => command('insertText', `\n\n${t('editor.signatureText')}`)}><PenLine /></Button>
      </div>{discard}</footer>
      <Input ref={files} type="file" hidden multiple aria-label={t('editor.attach')} onChange={event => { attach(event.target.files, false); event.target.value = ''; }} />
      <Input ref={images} type="file" hidden multiple accept="image/png,image/jpeg,image/webp,image/gif" aria-label={t('editor.image')} onChange={event => { attach(event.target.files, true); event.target.value = ''; }} />
    </div>
  </>;
}
