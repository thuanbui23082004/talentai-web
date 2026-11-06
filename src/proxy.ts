import { NextRequest, NextResponse } from 'next/server';
import { handleAuthRequest } from '@/server/bff/auth/handler';
import { readServerSession } from '@/server/bff/auth/session';

// Renew cookies before Server Components run. Role guards still verify the user.
export async function proxy(request: NextRequest) {
  if (!request.cookies.has('refresh_token')) return NextResponse.next();
  try {
    if (await readServerSession(request.headers.get('cookie'))) return NextResponse.next();
    const refreshUrl = new URL('/api/bff/auth/refresh', request.url);
    const renewed = await handleAuthRequest(new Request(refreshUrl, {
      method: 'POST',
      headers: { cookie: request.headers.get('cookie') ?? '', origin: refreshUrl.origin },
    }));
    if (!renewed) return unavailable();
    const cookies = new NextResponse(null, { headers: renewed.headers }).cookies.getAll();
    if (renewed.ok) {
      for (const cookie of cookies) request.cookies.set(cookie.name, cookie.value);
      const response = NextResponse.next({ request: { headers: request.headers } });
      for (const cookie of renewed.headers.getSetCookie()) response.headers.append('Set-Cookie', cookie);
      return response;
    }
    if (renewed.status === 401) {
      const response = NextResponse.redirect(new URL('/login?reason=expired', request.url));
      for (const cookie of renewed.headers.getSetCookie()) response.headers.append('Set-Cookie', cookie);
      return response;
    }
    return unavailable();
  } catch {
    return unavailable();
  }
}

function unavailable() {
  return new NextResponse('Dịch vụ đăng nhập tạm thời không khả dụng. Vui lòng tải lại trang.', {
    status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export const config = { matcher: ['/candidate/:path*', '/recruiter/:path*', '/admin/:path*'] };
