import { randomUUID } from 'node:crypto';
import { mockJobs } from '@/mocks/fixtures/recruiter-jobs';
import { recruiterCompany } from '@/mocks/fixtures/recruiter-company';
import { recruiterIndustries } from '@/mocks/fixtures/recruiter-catalog';
import type { components } from '@/lib/api/generated/schema';
type RecruiterJob = components['schemas']['RecruiterJob'];
export type RecruiterContext = { role: 'recruiter' | 'candidate' | 'admin'; csrf: string; companyId?: string; userId?: string };
type MockStore = { jobs: RecruiterJob[]; workspaces: Map<string, RecruiterContext>; companies?: Map<string, components['schemas']['Company']>; deletedJobIds?: Set<string> };
const mockGlobal = globalThis as typeof globalThis & { talentaiRecruiterStore?: MockStore };
export function getRecruiterMockStore(): MockStore {
  const store = mockGlobal.talentaiRecruiterStore ??= { jobs: structuredClone(mockJobs), workspaces: new Map() };
  store.workspaces ??= new Map(); // Preserve business fixtures across hot reloads from the old structure.
  return store;
}
export function getMockCompanies() {
  return getRecruiterMockStore().companies ??= new Map([[recruiterCompany.id, structuredClone(recruiterCompany)]]);
}
export function getDeletedJobIds() { return getRecruiterMockStore().deletedJobIds ??= new Set<string>(); }

export function createMockJob(input: components['schemas']['JobInput'], companyId = recruiterCompany.id): RecruiterJob {
  const now = new Date().toISOString();
  const { skills, industryId, positionId, ...fields } = input;
  const company = getMockCompanies().get(companyId);
  if (!company) throw new Error('COMPANY_REQUIRED');
  const job: RecruiterJob = {
    ...fields, id: randomUUID(), company: { id: company.id, name: company.name, logoUrl: company.logoUrl },
    industry: recruiterIndustries.find(item => item.id === industryId),
    ...(positionId ? { position: { id: positionId, name: input.title } } : {}),
    skills: skills?.map(skill => skill.name), requiredSkills: skills, status: 'draft', createdAt: now, updatedAt: now,
    stats: { applicationCount: 0, viewCount: 0 },
  };
  getRecruiterMockStore().jobs.unshift(job);
  return job;
}
