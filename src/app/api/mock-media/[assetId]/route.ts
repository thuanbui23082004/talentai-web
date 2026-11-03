import { NextRequest, NextResponse } from 'next/server';
import { getServerEnv } from '@/lib/env';
import { readRequestIdentity } from '@/server/bff/auth/session';
import { getMockAccounts, getMockMedia } from '@/server/bff/recruiter/account-company-handler';

// Asset serving for mock upload URLs, not a backend API contract endpoint.
export async function GET(request: NextRequest, { params }: { params: Promise<{ assetId: string }> }) {
  if (getServerEnv().DATA_MODE !== 'mock') return new NextResponse(null, { status: 404 });
  const session = await readRequestIdentity(request);
  const user = session?.user;
  const media = getMockMedia().get((await params).assetId);
  if (!user || user.role !== 'recruiter' || !media || media.ownerId !== user.id || getMockAccounts().get(media.ownerId)?.user.status !== 'active') return new NextResponse(null, { status: 404 });
  return new NextResponse(new Blob([Uint8Array.from(media.bytes)], { type: media.type }), { headers: { 'Content-Type': media.type, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; sandbox", 'Content-Disposition': 'inline' } });
}
