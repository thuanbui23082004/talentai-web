import { z } from 'zod';

export const richTags = ['div', 'p', 'br', 'b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'a', 'span', 'font'] as const;
export const richStyleSchema = z.object({
  bold: z.boolean().optional(), italic: z.boolean().optional(), underline: z.boolean().optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  font: z.enum(['sans', 'serif', 'mono']).optional(),
  size: z.enum(['small', 'normal', 'large']).optional(),
  color: z.enum(['text', 'primary', 'danger', 'muted']).optional(),
});
export type RichNode = { text?: string; tag?: typeof richTags[number]; href?: string; style?: z.infer<typeof richStyleSchema>; children?: RichNode[] };
export function safeMailLink(value: string): string | undefined {
  try { const url = new URL(value.trim()); return ['https:', 'http:', 'mailto:'].includes(url.protocol) ? url.href : undefined; } catch { return undefined; }
}
export const richNodeSchema: z.ZodType<RichNode, RichNode> = z.lazy(() => z.object({
  text: z.string().max(10000).optional(), tag: z.enum(richTags).optional(),
  href: z.string().max(2048).refine(value => safeMailLink(value) !== undefined).optional(),
  style: richStyleSchema.optional(), children: z.array(richNodeSchema).max(1000).optional(),
}));
export const attachmentSchema = z.object({ id: z.string(), name: z.string().max(255), size: z.number().int().min(0).max(10 * 1024 * 1024), type: z.string(), url: z.string().startsWith('blob:') });
export type MailAttachment = z.infer<typeof attachmentSchema>;
export function splitMailRecipients(value: string): string[] { return value.split(/[,;]+/).map(item => item.trim()).filter(Boolean); }
const recipients = z.string().max(2000).refine(value => splitMailRecipients(value).every(email => z.email().safeParse(email).success));
export const mailDraftSchema = z.object({
  to: z.string().max(2000), cc: z.string().max(2000).optional(), bcc: z.string().max(2000).optional(),
  subject: z.string().max(200), body: z.string().max(10000),
  richBody: z.array(richNodeSchema).max(1000).optional(), attachments: z.array(attachmentSchema).max(10).optional(),
});
export const mailSendSchema = mailDraftSchema.extend({
  to: recipients.refine(value => splitMailRecipients(value).length > 0), cc: recipients.optional(), bcc: recipients.optional(),
  subject: z.string().trim().min(1).max(200), body: z.string().trim().min(1).max(10000),
});
export type MailValues = z.infer<typeof mailDraftSchema>;
