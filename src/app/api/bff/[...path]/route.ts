import { NextRequest } from 'next/server';
import { DATA_MODE } from '@/lib/config/data-mode';
import { handleMockRequest, mockProblem } from '@/server/bff/mock-adapter';
import { proxyRequest } from '@/server/bff/proxy';

async function handle(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const targetPath = path.join('/');
  if (!/^(auth\/(csrf|change-password)|me(?:\/avatar)?|analysis-tasks\/[\w-]+|recruiter\/stats\/(overview|funnel|timeseries)|recruiter\/company(?:\/(logo|verification-documents))?|recruiter\/interviews(?:\/[\w-]+(?:\/(result|send-invitation|cancel))?)?|catalog\/(industries|locations|skills|positions)|recruiter\/jobs(?:\/[\w-]+(?:\/(publish|pause|reopen|close|screening|recommended-candidates|applications))?)?|recruiter\/applications(?:\/[\w-]+(?:\/(cv|status|evaluation|matching|interviews))?)?)$/.test(targetPath)) return mockProblem(404, 'NOT_FOUND');
  return DATA_MODE === 'mock' ? handleMockRequest(request, targetPath) : proxyRequest(request, targetPath);
}
export { handle as GET, handle as POST, handle as PATCH, handle as PUT, handle as DELETE };
