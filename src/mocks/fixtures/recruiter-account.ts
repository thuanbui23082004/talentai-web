import type { components } from '@/lib/api/generated/schema';
export const mockRecruiterAccount: components['schemas']['User'] = {
  id: '00000000-0000-4000-8000-000000000101', email: 'recruiter@example.test', fullName: 'Minh An', phone: '+84000000000', address: 'Hà Nội',
  role: 'recruiter', status: 'active', companyId: '00000000-0000-4000-8000-000000000100', companyVerificationStatus: 'verified', createdAt: '2026-10-01T00:00:00Z',
};
// Fake credential for the in-memory mock only. Never used by real authentication.
export const mockRecruiterPassword = 'TalentAI2026!';
