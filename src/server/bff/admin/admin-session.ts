import 'server-only';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { connection } from 'next/server';
import { getServerEnv } from '@/lib/env';
import { ADMIN_MOCK_COOKIE, getRecruiterMockStore } from '@/server/bff/recruiter/mock-store';
import { proxyRequest } from '@/server/bff/proxy';
import { adminUserSchema } from '@/features/admin/schemas';

export async function hasAdminSession() {
  await connection();
  const jar = await cookies();
  if (getServerEnv().DATA_MODE === 'mock') {
    const session = getRecruiterMockStore().sessions.get(jar.get(ADMIN_MOCK_COOKIE)?.value ?? '');
    return session?.role === 'admin' && !!session.expiresAt && session.expiresAt > Date.now();
  }
  const response = await proxyRequest(new NextRequest('http://localhost/api/bff/me', { headers: { cookie: jar.toString() } }), 'me');
  if (!response.ok) return false;
  const user = adminUserSchema.safeParse(await response.json().catch(() => null));
  return user.success && user.data.role === 'admin' && user.data.status === 'active';
}
