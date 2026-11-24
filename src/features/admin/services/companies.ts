import { z } from 'zod';
import { apiClient, ApiError } from '@/lib/api';
import { adminWorkspaceHeaders } from '@/lib/api/workspace';
import { managedCompanySchema, companyPageSchema, companyReasonSchema, companyDocumentDecisionSchema, companyTaxLookupSchema, type CompanyAction } from '@/features/admin/schemas/companies';
export async function getManagedCompanies(signal?: AbortSignal) {
  const companies = []; let page = 1, pages = 1;
  do {
    const result = await apiClient.GET('/admin/companies', { params: { query: { page, pageSize: 100 } }, signal });
    if (result.error) throw new ApiError('ADMIN_COMPANIES_FAILED', result.response.status, result.error);
    const data = companyPageSchema.parse(result.data); companies.push(...data.items); pages = data.meta.totalPages; page++;
  } while (page <= pages);
  return companies;
}
export async function getManagedCompany(companyId: string, signal?: AbortSignal) {
  const result = await apiClient.GET('/admin/companies/{companyId}', { params: { path: { companyId } }, signal });
  if (result.error) throw new ApiError('ADMIN_COMPANY_FAILED', result.response.status, result.error);
  return managedCompanySchema.parse(result.data);
}
export async function moderateCompany(companyId: string, action: CompanyAction, reason: string) {
  companyReasonSchema.parse({ reason });
  const csrf = await apiClient.GET('/auth/csrf', { headers: adminWorkspaceHeaders });
  if (csrf.error) throw new ApiError('ADMIN_COMPANY_SESSION_FAILED', csrf.response.status, csrf.error);
  const token = z.object({ csrfToken: z.string() }).parse(csrf.data).csrfToken;
  const options = { params: { path: { companyId } }, headers: { ...adminWorkspaceHeaders, 'X-CSRF-Token': token } };
  const result = action === 'verify' ? await apiClient.POST('/admin/companies/{companyId}/verify', { ...options, body: { note: reason } })
    : action === 'reject' ? await apiClient.POST('/admin/companies/{companyId}/reject', { ...options, body: { reason } })
    : action === 'suspend' ? await apiClient.POST('/admin/companies/{companyId}/suspend', { ...options, body: { reason } })
    : await apiClient.POST('/admin/companies/{companyId}/restore', { ...options, body: { note: reason } });
  if (result.error) throw new ApiError('ADMIN_COMPANY_UPDATE_FAILED', result.response.status, result.error);
  return managedCompanySchema.parse(result.data);
}
export async function getCompanyDocument(companyId: string, documentId: string, signal?: AbortSignal) {
  const result = await apiClient.GET('/admin/companies/{companyId}/documents/{documentId}', { params: { path: { companyId, documentId } }, parseAs: 'blob', signal });
  if (result.error) throw new ApiError('ADMIN_COMPANY_DOCUMENT_FAILED', result.response.status, result.error);
  return z.instanceof(Blob).refine(blob => blob.size > 0 && ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'].includes(blob.type)).parse(result.data);
}
export async function lookupCompanyTax(companyId: string, signal?: AbortSignal) {
  const result = await apiClient.GET('/admin/companies/{companyId}/tax-lookup', { params: { path: { companyId } }, signal });
  if (result.error) throw new ApiError('COMPANY_TAX_LOOKUP_FAILED', result.response.status, result.error);
  return companyTaxLookupSchema.parse(result.data);
}
export async function reviewCompanyDocument(companyId: string, documentId: string, input: z.infer<typeof companyDocumentDecisionSchema>) {
  const csrf = await apiClient.GET('/auth/csrf', { headers: adminWorkspaceHeaders });
  if (csrf.error) throw new ApiError('ADMIN_COMPANY_SESSION_FAILED', csrf.response.status, csrf.error);
  const token = z.object({ csrfToken: z.string() }).parse(csrf.data).csrfToken;
  const result = await apiClient.PATCH('/admin/companies/{companyId}/documents/{documentId}/verification', {
    params: { path: { companyId, documentId } }, body: companyDocumentDecisionSchema.parse(input),
    headers: { ...adminWorkspaceHeaders, 'X-CSRF-Token': token },
  });
  if (result.error) throw new ApiError('ADMIN_COMPANY_DOCUMENT_REVIEW_FAILED', result.response.status, result.error);
  return managedCompanySchema.parse(result.data);
}
