import type { MailAttachment, RichNode } from './mail-schema';
export type MailFolder = 'inbox' | 'sent' | 'drafts' | 'spam' | 'trash';
export type MailLabel = 'team' | 'candidate';
export type Mail = {
  id: string; name: string; email: string; subject: string; body: string;
  date: string; folder: MailFolder; label: MailLabel; starred: boolean; read: boolean;
  cc?: string; bcc?: string; richBody?: RichNode[]; attachments?: MailAttachment[];
};
