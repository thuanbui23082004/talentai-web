export type { Mail, MailFolder, MailLabel } from '@/features/inbox';
// All identities and addresses are fictitious; translated sample text lives in Inbox.samples.
export const inboxFixtures = [
  { id: 'linh', email: 'ha.linh@example.com', date: '2026-10-27T09:30:00+07:00', label: 'candidate', starred: false, read: false },
  { id: 'thao', email: 'thu.thao@example.com', date: '2026-10-26T15:15:00+07:00', label: 'team', starred: true, read: false },
  { id: 'an', email: 'mai.an@example.com', date: '2026-10-26T10:30:00+07:00', label: 'candidate', starred: false, read: true },
  { id: 'huy', email: 'gia.huy@example.com', date: '2026-10-25T10:30:00+07:00', label: 'candidate', starred: false, read: true },
  { id: 'minh', email: 'minh.chau@example.com', date: '2026-10-24T14:20:00+07:00', label: 'team', starred: true, read: true },
  { id: 'vy', email: 'khanh.vy@example.com', date: '2026-10-23T08:45:00+07:00', label: 'candidate', starred: false, read: true },
] as const;
