import type { components } from '@/lib/api/generated/schema';
import { mockManagedUsers } from '@/mocks/fixtures/admin-users';
import { additionalAdminActivity } from '@/mocks/fixtures/admin-activity';
import { adminLogs } from '@/mocks/fixtures/admin';
import { getMockAccounts } from '@/server/bff/recruiter/account-company-handler';
type Detail = components['schemas']['AdminUserDetail'];
const shared = globalThis as typeof globalThis & { talentaiAdminUsers?: Map<string, Detail>; talentaiAdminLogs?: components['schemas']['ActivityLog'][] };
export function getAdminUsers() {
  const users = shared.talentaiAdminUsers ??= new Map(structuredClone(mockManagedUsers).map(user => [user.id, user]));
  // Reuse accounts already managed by the recruiter workspace, rather than duplicating them.
  for (const { user } of getMockAccounts().values()) users.set(user.id, { ...users.get(user.id), ...user });
  return users;
}
export function getAdminActivity() {
  return shared.talentaiAdminLogs ??= structuredClone([...adminLogs, ...additionalAdminActivity]).map(log => log.action === 'user.lock' ? {
    ...log, targetType: 'user', targetId: mockManagedUsers[1].id,
    occurredAt: mockManagedUsers[1].violations?.[0]?.createdAt ?? log.occurredAt,
    metadata: { reason: mockManagedUsers[1].lockReason },
  } : log);
}
