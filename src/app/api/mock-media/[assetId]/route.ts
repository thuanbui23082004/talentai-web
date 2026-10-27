import { NextRequest, NextResponse } from 'next/server';
import { DATA_MODE } from '@/lib/config/data-mode';
import { getMockAccounts, getMockMedia } from '@/server/bff/account-company-handler';
import { getRecruiterMockStore } from '@/server/bff/recruiter-mock-store';
import { mockRecruiterAccount } from '@/mocks/fixtures/recruiter-account';

// Asset serving for mock upload URLs, not a backend API contract endpoint.
export async function GET(request: NextRequest, { params }: { params: Promise<{ assetId: string }> }) {
  if (DATA_MODE !== 'mock') return new NextResponse(null, { status: 404 });
  const session = getRecruiterMockStore().sessions.get(request.cookies.get('talentai_mock_session')?.value ?? '');
  const media = getMockMedia().get((await params).assetId);
  if (!session || session.role !== 'recruiter' || !media || media.ownerId !== (session.userId ?? mockRecruiterAccount.id) || getMockAccounts().get(media.ownerId)?.user.status !== 'active') return new NextResponse(null, { status: 404 });
  return new NextResponse(new Blob([Uint8Array.from(media.bytes)], { type: media.type }), { headers: { 'Content-Type': media.type, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; sandbox", 'Content-Disposition': 'inline' } });
}
