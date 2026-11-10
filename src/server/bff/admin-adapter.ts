import { NextRequest, NextResponse } from 'next/server';
import { mockProblem } from '@/server/bff/mock-adapter';
import { ADMIN_MOCK_COOKIE, getRecruiterMockStore } from '@/server/bff/recruiter/mock-store';
import { handleAdminRequest } from '@/server/bff/admin-handler';

export async function handleAdminMockRequest(request: NextRequest, path: string): Promise<Response> {
  const scenario = request.headers.get('x-mock-scenario');
  const scenarios: Record<string, [number, string]> = { unauthorized: [401, 'UNAUTHENTICATED'], forbidden: [403, 'FORBIDDEN'], error: [500, 'INTERNAL_ERROR'], locked: [423, 'ACCOUNT_LOCKED'], conflict: [409, 'CONFLICT'] };
  if (scenario && scenarios[scenario]) return mockProblem(...scenarios[scenario]);
  await new Promise(resolve => setTimeout(resolve, scenario === 'slow' ? 1500 : 200));
  const store = getRecruiterMockStore();
  const adminWorkspace = path.startsWith('admin/') || request.headers.get('X-TalentAI-Workspace') === 'admin';
  const cookieName = adminWorkspace ? ADMIN_MOCK_COOKIE : 'talentai_mock_session';
  let session = store.sessions.get(request.cookies.get(cookieName)?.value ?? '');
  if (session?.expiresAt && session.expiresAt <= Date.now()) {
    store.sessions.delete(request.cookies.get(cookieName)?.value ?? '');
    session = undefined;
  }
  // Repair admin sessions written to the recruiter cookie by the previous mock.
  if (!adminWorkspace && session?.role === 'admin') {
    store.sessions.delete(request.cookies.get(cookieName)?.value ?? '');
    session = undefined;
  }
  if (adminWorkspace && path === 'auth/csrf' && request.method === 'GET') {
    if (!session) return mockProblem(401, 'UNAUTHENTICATED');
    if (session.role !== 'admin') return mockProblem(403, 'FORBIDDEN');
    return NextResponse.json({ csrfToken: session.csrf }, { headers: { 'Cache-Control': 'private, no-store' } });
  }
  const adminResponse = await handleAdminRequest(request, path, session);
  if (adminResponse) return adminResponse;
  return mockProblem(404, 'NOT_FOUND');
}
