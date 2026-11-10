import type { CompanyAction, CompanyStatus, ManagedCompany } from '@/features/admin/schemas/companies';
export function canModerateCompany(status: CompanyStatus, action: CompanyAction) {
  if (action === 'verify' || action === 'reject') return status === 'pending';
  return action === 'suspend' ? status !== 'suspended' : status === 'suspended';
}
export function filterCompanies(companies: ManagedCompany[], search: string, status: string) {
  const q = search.trim().toLocaleLowerCase('vi');
  return companies.filter(company => (!status || company.verificationStatus === status) && (!q || company.name.toLocaleLowerCase('vi').includes(q) || company.taxCode?.includes(q)));
}
