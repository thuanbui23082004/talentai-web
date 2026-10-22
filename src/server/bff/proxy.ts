import { NextRequest, NextResponse } from 'next/server';
import { envSchema } from '@/lib/env';
export async function proxyRequest(request: NextRequest, targetPath: string) {
  const config = envSchema.safeParse(process.env);
  if (!config.success || !config.data.BACKEND_API_URL) return NextResponse.json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'SERVICE_UNAVAILABLE' } }, { status: 503 });
  const url = new URL(config.data.BACKEND_API_URL.replace(/\/$/, '') + '/' + targetPath);
  url.search = request.nextUrl.search;
  const headers = new Headers();
  for (const name of ['accept', 'content-type', 'cookie', 'x-csrf-token', 'idempotency-key']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  try {
    const response = await fetch(url, { method: request.method, headers, body: request.method === 'GET' ? undefined : await request.arrayBuffer(), redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(15000) });
    const result = new NextResponse(response.body, { status: response.status });
    for (const name of ['content-type', 'content-disposition', 'retry-after']) {
      const value = response.headers.get(name);
      if (value) result.headers.set(name, value);
    }
    for (const cookie of response.headers.getSetCookie()) result.headers.append('set-cookie', cookie);
    return result;
  } catch { return NextResponse.json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'SERVICE_UNAVAILABLE' } }, { status: 503 }); }
}
