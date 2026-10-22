import { NextRequest } from 'next/server';
import { DATA_MODE } from '@/lib/config/data-mode';
import { handleMockRequest, mockProblem } from '@/server/bff/mock-adapter';
import { proxyRequest } from '@/server/bff/proxy';

async function handle(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const targetPath = path.join('/');
  if (!/^(auth\/csrf|recruiter\/company|recruiter\/interviews|catalog\/(industries|locations|skills|positions)|recruiter\/jobs(?:\/[\w-]+)?|recruiter\/applications(?:\/[\w-]+(?:\/(cv|status|evaluation))?)?)$/.test(targetPath)) return mockProblem(404, 'NOT_FOUND');
  return DATA_MODE === 'mock' ? handleMockRequest(request, targetPath) : proxyRequest(request, targetPath);
}
export { handle as GET, handle as POST, handle as PATCH, handle as PUT };
