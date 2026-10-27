import Image from 'next/image';
import { Paperclip, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { MailAttachment } from '@/features/inbox/mail-schema';
import { Button } from '@/components/ui/button';

export function MailAttachments({ attachments, onRemove }: { attachments: MailAttachment[]; onRemove?: (id: string) => void }) {
  const t = useTranslations('Inbox');
  return <ul className="mail-attachment-previews" aria-label={t('editor.attachments')}>{attachments.map(file => <li key={file.id}><a href={file.url} download={file.name}>
    {['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type) && <Image src={file.url} alt={file.name} width={180} height={110} unoptimized />}
    <span><Paperclip size={14} />{file.name}</span><small>{t('editor.fileSize', { size: Math.max(1, Math.ceil(file.size / 1024)) })}</small>
  </a>{onRemove && <Button className="mail-file-remove" type="button" variant="ghost" size="icon-xs" aria-label={t('editor.removeFile', { name: file.name })} onClick={() => onRemove(file.id)}><X /></Button>}</li>)}</ul>;
}
