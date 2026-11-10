import { z } from 'zod';
import { apiClient, ApiError } from '@/lib/api';
import { adminWorkspaceHeaders } from '@/lib/api/workspace';
import { catalogPageSchema, catalogItemSchema, catalogInputSchema, reportPageSchema, reportSchema, resolutionSchema, type CatalogType } from '@/features/admin/schemas/content';
export async function contentHeaders() {
  const result = await apiClient.GET('/auth/csrf', { headers: adminWorkspaceHeaders });
  if (result.error) throw new ApiError('SESSION_FAILED', result.response.status, result.error);
  return { ...adminWorkspaceHeaders, 'X-CSRF-Token': z.object({ csrfToken: z.string() }).parse(result.data).csrfToken };
}
export async function getCatalog(type: CatalogType, signal?: AbortSignal) {
  const rows = []; let page = 1, pages = 1;
  do { const result = await apiClient.GET('/admin/catalog/{catalogType}', { params: { path: { catalogType: type }, query: { page, pageSize: 100 } }, signal }); if (result.error) throw new ApiError('CATALOG_FAILED', result.response.status, result.error); const data = catalogPageSchema.parse(result.data); rows.push(...data.items); pages = data.meta.totalPages; page++; } while (page <= pages);
  return rows;
}
export async function saveCatalog(type: CatalogType, id: string | undefined, input: z.infer<typeof catalogInputSchema>) {
  const body = catalogInputSchema.parse(input), headers = await contentHeaders();
  const result = id ? await apiClient.PUT('/admin/catalog/{catalogType}/{itemId}', { params: { path: { catalogType: type, itemId: id } }, body, headers }) : await apiClient.POST('/admin/catalog/{catalogType}', { params: { path: { catalogType: type } }, body, headers });
  if (result.error) throw new ApiError('CATALOG_UPDATE_FAILED', result.response.status, result.error);
  return catalogItemSchema.parse(result.data);
}
export async function deleteCatalog(type: CatalogType, itemId: string) { const result = await apiClient.DELETE('/admin/catalog/{catalogType}/{itemId}', { params: { path: { catalogType: type, itemId } }, headers: await contentHeaders() }); if (result.error) throw new ApiError('CATALOG_DELETE_FAILED', result.response.status, result.error); }
export async function getReports(signal?: AbortSignal) {
  const rows = []; let page = 1, pages = 1;
  do { const result = await apiClient.GET('/admin/reports', { params: { query: { page, pageSize: 100 } }, signal }); if (result.error) throw new ApiError('REPORTS_FAILED', result.response.status, result.error); const data = reportPageSchema.parse(result.data); rows.push(...data.items); pages = data.meta.totalPages; page++; } while (page <= pages);
  return rows;
}
export async function getReport(reportId: string, signal?: AbortSignal) { const result = await apiClient.GET('/admin/reports/{reportId}', { params: { path: { reportId } }, signal }); if (result.error) throw new ApiError('REPORT_FAILED', result.response.status, result.error); return reportSchema.parse(result.data); }
export async function updateReport(reportId: string, input: z.infer<typeof resolutionSchema> | null) {
  const options = { params: { path: { reportId } }, headers: await contentHeaders() };
  const result = input ? await apiClient.POST('/admin/reports/{reportId}/resolve', { ...options, body: resolutionSchema.parse(input) }) : await apiClient.POST('/admin/reports/{reportId}/start-review', { ...options, body: {} });
  if (result.error) throw new ApiError('REPORT_UPDATE_FAILED', result.response.status, result.error); return reportSchema.parse(result.data);
}
