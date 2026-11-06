import { expect, it, vi } from 'vitest';
import { createSessionFetch } from '@/lib/api/session-fetch';

const baseUrl = 'http://localhost/api/bff';
const expired = () => Response.json({ error: { code: 'SESSION_EXPIRED' } }, { status: 401 });
const renewed = () => Response.json({ csrfToken: 'new-csrf', expiresInSeconds: 900 });

it('shares refresh across concurrent reads and retries each read once', async () => {
  let ready = false;
  const network = vi.fn<typeof fetch>(async input => {
    const path = String(input instanceof Request ? input.url : input);
    if (path.endsWith('/auth/refresh')) { ready = true; return renewed(); }
    return ready ? Response.json({ ok: true }) : expired();
  });
  const session = createSessionFetch({ baseUrl, fetch: network });
  const responses = await Promise.all(['/profile', '/cv'].map(path => session.fetch(baseUrl + path)));
  expect(responses.map(response => response.status)).toEqual([200, 200]);
  expect(network.mock.calls.filter(([input]) => String(input).endsWith('/auth/refresh'))).toHaveLength(1);
  expect(network).toHaveBeenCalledTimes(5);
});

it('authenticates before upload, replaces stale CSRF and never replays a write', async () => {
  let ready = false;
  let writes = 0;
  const network = vi.fn<typeof fetch>(async input => {
    const request = input instanceof Request ? input : new Request(input);
    if (request.url.endsWith('/auth/refresh')) { ready = true; return renewed(); }
    if (request.url.endsWith('/me')) return ready ? Response.json({ id: 'user' }) : expired();
    if (request.url.endsWith('/auth/csrf')) return Response.json({ csrfToken: 'new-csrf' });
    writes++;
    expect(request.headers.get('X-CSRF-Token')).toBe('new-csrf');
    expect((await request.formData()).get('name')).toBe('My CV');
    return expired();
  });
  const session = createSessionFetch({ baseUrl, fetch: network });
  const body = new FormData();
  body.set('name', 'My CV');
  expect((await session.fetch(baseUrl + '/cv', { method: 'POST', headers: { 'X-CSRF-Token': 'old' }, body })).status).toBe(401);
  expect(writes).toBe(1);
});

it.each([403, 503])('does not refresh a business response with status %s', async status => {
  const network = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status }));
  const session = createSessionFetch({ baseUrl, fetch: network });
  expect((await session.fetch(baseUrl + '/jobs')).status).toBe(status);
  expect(network).toHaveBeenCalledTimes(1);
});

it('does not expire the session on a refresh outage', async () => {
  const network = vi.fn<typeof fetch>().mockResolvedValueOnce(expired()).mockResolvedValueOnce(new Response(null, { status: 503 }));
  const onExpired = vi.fn();
  const session = createSessionFetch({ baseUrl, fetch: network, onExpired });
  await expect(session.fetch(baseUrl + '/profile')).rejects.toMatchObject({ status: 503 });
  expect(onExpired).not.toHaveBeenCalled();
});

it('notifies session expiry only when refresh is rejected', async () => {
  const network = vi.fn<typeof fetch>().mockImplementation(async () => expired());
  const onExpired = vi.fn();
  const session = createSessionFetch({ baseUrl, fetch: network, onExpired });
  expect((await session.fetch(baseUrl + '/profile')).status).toBe(401);
  expect(onExpired).toHaveBeenCalledOnce();
});

it('does not refresh anonymous /me or retry public login', async () => {
  const network = vi.fn<typeof fetch>().mockImplementation(async () => Response.json({ error: { code: 'UNAUTHENTICATED' } }, { status: 401 }));
  const session = createSessionFetch({ baseUrl, fetch: network });
  await session.fetch(baseUrl + '/me');
  await session.fetch(baseUrl + '/auth/login', { method: 'POST' });
  expect(network).toHaveBeenCalledTimes(2);
});
