import { z } from 'zod';
import { ApiError } from './errors';

export const SESSION_EXPIRED_EVENT = 'talentai:session-expired';
const publicAuthPaths = new Set([
  '/auth/login', '/auth/register', '/auth/social-login', '/auth/forgot-password',
  '/auth/reset-password', '/auth/refresh', '/auth/logout', '/auth/csrf',
]);

export function createSessionFetch({
  baseUrl = '/api/bff',
  fetch: network = (input, init) => globalThis.fetch(input, init),
  onExpired = () => {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  },
}: { baseUrl?: string; fetch?: typeof globalThis.fetch; onExpired?: () => void } = {}) {
  let pendingRefresh: Promise<boolean> | undefined;
  let generation = 0;

  function authRequest(path: string, method = 'GET') {
    return network(`${baseUrl}${path}`, { method, credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } });
  }

  function refresh() {
    pendingRefresh ??= (async () => {
      let response: Response;
      try { response = await authRequest('/auth/refresh', 'POST'); }
      catch { throw new ApiError('Không thể làm mới phiên. Vui lòng thử lại.', 503, 'SERVICE_UNAVAILABLE'); }
      if (response.status === 401) { onExpired(); return false; }
      if (!response.ok) throw new ApiError('Không thể làm mới phiên. Vui lòng thử lại.', response.status, response.status === 429 ? 'RATE_LIMITED' : 'SERVICE_UNAVAILABLE');
      const body = z.object({ csrfToken: z.string().min(1), expiresInSeconds: z.number().positive() }).safeParse(await response.json().catch(() => null));
      if (!body.success) throw new ApiError('Phản hồi làm mới phiên không hợp lệ.', 503, 'SERVICE_UNAVAILABLE');
      generation++;
      return true;
    })().finally(() => { pendingRefresh = undefined; });
    return pendingRefresh;
  }

  async function read(request: Request, path: string) {
    const startedAt = generation;
    const retry = request.clone();
    const response = await network(request);
    if (response.status !== 401) return response;
    if (path === '/me') {
      const error = await response.clone().json().catch(() => null);
      // /me distinguishes visitors without a refresh cookie from expired access tokens.
      if (error?.error?.code === 'UNAUTHENTICATED') return response;
    }
    // A slower concurrent request may return 401 after another request already refreshed.
    if (startedAt === generation && !(await refresh())) return response;
    return network(retry); // Retry a read once; never recurse on a second 401.
  }

  const authenticatedFetch: typeof globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    const base = new URL(baseUrl, typeof location === 'undefined' ? request.url : location.origin);
    if (url.origin !== base.origin || !url.pathname.startsWith(`${base.pathname}/`)) return network(request);
    const path = url.pathname.slice(base.pathname.length);
    if (publicAuthPaths.has(path)) return network(request);
    if (request.method === 'GET' || request.method === 'HEAD') return read(request, path);

    // Authenticate before sending any business write, including multipart uploads.
    const session = await read(new Request(`${base.href}/me`, { credentials: 'same-origin', cache: 'no-store', signal: request.signal }), '/me');
    if (!session.ok) return session;
    if (pendingRefresh) await pendingRefresh;
    const csrf = await authRequest('/auth/csrf');
    if (!csrf.ok) return csrf;
    const token = z.object({ csrfToken: z.string().min(1) }).parse(await csrf.json()).csrfToken;
    request.headers.set('X-CSRF-Token', token);
    return network(request); // POST/PUT/PATCH/DELETE are sent exactly once.
  };

  return { fetch: authenticatedFetch, refresh };
}

export const sessionFetch = createSessionFetch();
