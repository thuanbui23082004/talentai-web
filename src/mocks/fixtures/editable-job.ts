import type { components } from '@/lib/api/generated/schema';
import { mockJobs } from '@/mocks/fixtures/recruiter-jobs';
export const mockEditableJob: components['schemas']['RecruiterJob'] = {
  ...mockJobs[0], status: 'draft', position: { id: '00000000-0000-4000-8000-000000000301', name: 'Kỹ sư phần mềm' },
  location: { ...mockJobs[0].location, district: 'Cầu Giấy', address: 'Địa chỉ công ty', locationId: '00000000-0000-4000-8000-000000000011' },
  maxExperienceYears: 8, educationLevel: 'bachelor', salary: { min: 45000, max: 65000, currency: 'USD', period: 'year', negotiable: false },
  skills: ['React', 'TypeScript'], requiredSkills: [{ name: 'React', skillId: '00000000-0000-4000-8000-000000000401', required: true }, { name: 'TypeScript', skillId: '00000000-0000-4000-8000-000000000402', required: false }],
};
