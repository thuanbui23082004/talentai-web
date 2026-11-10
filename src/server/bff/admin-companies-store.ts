import type { components } from '@/lib/api/generated/schema';
import { mockAdminCompanies, mockCompanyOwners } from '@/mocks/fixtures/admin-companies';
import { syntheticCompanyDocument } from '@/mocks/fixtures/company-verification-document';
import { getMockCompanies, getRecruiterMockStore, getDeletedJobIds } from '@/server/bff/recruiter/mock-store';
import { getMockAccounts } from '@/server/bff/recruiter/account-company-handler';
import { getVerificationFiles } from '@/server/bff/company-verification-store';
type Status = components['schemas']['CompanyVerificationStatus'];
const shared = globalThis as typeof globalThis & { talentaiCompanyHistory?: Map<string, components['schemas']['ModerationEntry'][]>; talentaiCompanyPreviousStatus?: Map<string, Status> };
export function companyHistories() { return shared.talentaiCompanyHistory ??= new Map(); }
export function previousCompanyStatuses() { return shared.talentaiCompanyPreviousStatus ??= new Map(); }
export function adminCompanies() {
  const companies = getMockCompanies();
  for (const fixture of mockAdminCompanies) {
    if (companies.has(fixture.id)) continue;
    companies.set(fixture.id, structuredClone(fixture));
    if (fixture.verificationStatus === 'suspended') previousCompanyStatuses().set(fixture.id, 'verified');
    for (const file of fixture.verificationDocuments ?? []) if (file.id) getVerificationFiles().set(file.id, { companyId: fixture.id, type: file.mimeType, bytes: syntheticCompanyDocument() });
  }
  return companies;
}
export function adminCompanyDetail(id: string): components['schemas']['AdminCompanyDetail'] | undefined {
  const company = adminCompanies().get(id); if (!company) return;
  const owner = [...getMockAccounts().values()].find(record => record.user.companyId === id)?.user;
  return { ...company, owner: owner ? { id: owner.id, fullName: owner.fullName, email: owner.email } : mockCompanyOwners[id], jobCount: getRecruiterMockStore().jobs.filter(job => job.company.id === id && !getDeletedJobIds().has(job.id)).length, history: companyHistories().get(id) ?? [] };
}
export function companyOverview() {
  const companies = [...adminCompanies().values()];
  return { total: companies.length, verified: companies.filter(c => c.verificationStatus === 'verified').length, pending: companies.filter(c => c.verificationStatus === 'pending').length, suspended: companies.filter(c => c.verificationStatus === 'suspended').length };
}
