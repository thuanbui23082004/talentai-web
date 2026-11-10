import type { components } from '@/lib/api/generated/schema';
export const mockAdmin: components['schemas']['User'] = { id: '00000000-0000-4000-8000-000000000901', email: 'admin@example.test', fullName: 'Quản trị TalentAI', role: 'admin', status: 'active', createdAt: '2026-10-01T00:00:00Z' };
// Synthetic credentials exclusively for local mock demonstration.
export const mockAdminPassword = 'TalentAI2026!';
export const adminDailyActivity = [
  { date: '2026-11-01', candidates: 42, recruiters: 8, jobs: 15, applications: 92 },
  { date: '2026-11-02', candidates: 58, recruiters: 12, jobs: 21, applications: 115 },
  { date: '2026-11-03', candidates: 47, recruiters: 9, jobs: 18, applications: 104 },
  { date: '2026-11-04', candidates: 76, recruiters: 14, jobs: 28, applications: 148 },
  { date: '2026-11-05', candidates: 64, recruiters: 11, jobs: 24, applications: 132 },
];
export const adminOverview: components['schemas']['AdminOverviewStats'] = { users: { total: 1570, candidates: 1284, recruiters: 286 }, companies: { total: 214, pending: 12, verified: 202 }, jobs: { total: 842, byStatus: { open: 368, pending_review: 18, closed: 456 } }, reports: { open: 7, inReview: 3 } };
export const adminLogs: components['schemas']['ActivityLog'][] = [
  { id: '00000000-0000-4000-8000-000000000911', occurredAt: '2026-11-05T03:30:00Z', actorName: 'Quản trị TalentAI', actorId: mockAdmin.id, actorRole: 'admin', action: 'company.verify', result: 'success' },
  { id: '00000000-0000-4000-8000-000000000912', occurredAt: '2026-11-04T08:15:00Z', actorName: 'Quản trị TalentAI', actorId: mockAdmin.id, actorRole: 'admin', action: 'user.lock', result: 'success' },
  { id: '00000000-0000-4000-8000-000000000913', occurredAt: '2026-11-03T02:00:00Z', actorName: 'Quản trị TalentAI', actorId: mockAdmin.id, actorRole: 'admin', action: 'job.hide', result: 'success' },
];
