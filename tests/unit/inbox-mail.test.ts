import { describe, expect, it } from 'vitest';
import { mailDraftSchema, mailSendSchema, richNodeSchema, safeMailLink, splitMailRecipients } from '@/features/inbox/mail-schema';

describe('mock mail composer validation', () => {
  const mail = { to: 'candidate@example.com', subject: 'Interview', body: 'Hello' };
  it('accepts multiple recipients and rejects invalid Cc/Bcc', () => {
    expect(splitMailRecipients(' one@example.com; two@example.com, ')).toEqual(['one@example.com', 'two@example.com']);
    expect(mailSendSchema.safeParse({ ...mail, to: 'one@example.com;two@example.com', cc: 'team@example.com', bcc: '' }).success).toBe(true);
    expect(mailSendSchema.safeParse({ ...mail, cc: 'invalid' }).success).toBe(false);
    expect(mailSendSchema.safeParse({ ...mail, bcc: 'invalid' }).success).toBe(false);
    expect(mailSendSchema.safeParse({ ...mail, to: ' , ; ' }).success).toBe(false);
  });
  it('allows incomplete drafts but requires content before sending', () => {
    expect(mailDraftSchema.safeParse({ to: '', subject: '', body: '' }).success).toBe(true);
    expect(mailSendSchema.safeParse({ ...mail, body: '   ' }).success).toBe(false);
    expect(mailDraftSchema.safeParse({ ...mail, body: 'x'.repeat(10001) }).success).toBe(false);
  });
  it('retains safe rich text, rejects executable links and unsupported markup', () => {
    expect(richNodeSchema.safeParse({ tag: 'b', children: [{ text: 'Hello' }] }).success).toBe(true);
    expect(richNodeSchema.safeParse({ tag: 'script', children: [] }).success).toBe(false);
    for (const value of ['javascript:alert(1)', 'data:text/html,test', 'file:///test', 'https://']) {
      expect(safeMailLink(value)).toBeUndefined();
      expect(richNodeSchema.safeParse({ tag: 'a', href: value }).success).toBe(false);
    }
    expect(safeMailLink(' https://example.com/path ')).toBe('https://example.com/path');
    expect(safeMailLink('mailto:team@example.com')).toBe('mailto:team@example.com');
  });
  it('rejects oversized or nonlocal mock attachments', () => {
    const file = { id: 'mock-file', name: 'demo.txt', size: 10, type: 'text/plain', url: 'blob:local-demo' };
    expect(mailDraftSchema.safeParse({ ...mail, attachments: [file] }).success).toBe(true);
    expect(mailDraftSchema.safeParse({ ...mail, attachments: [{ ...file, size: 11 * 1024 * 1024 }] }).success).toBe(false);
    expect(mailDraftSchema.safeParse({ ...mail, attachments: [{ ...file, url: 'https://example.com/file' }] }).success).toBe(false);
    expect(mailDraftSchema.safeParse({ ...mail, attachments: Array.from({ length: 11 }, () => file) }).success).toBe(false);
  });
});
