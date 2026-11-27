import { z } from 'zod';
import { apiClient, ensureApiSession } from '@/lib/api';
import { toApiError } from '@/lib/api/errors';
import type { components } from '@/lib/api/generated/schema';

export type RecruiterMatchResult = components['schemas']['RecruiterMatchResult'];
export type RecruiterMatchRankingPage = components['schemas']['RecruiterMatchRankingPage'];

export async function getApplicationMatch(applicationId: string, signal?: AbortSignal) {
  await ensureApiSession();
  const response = await apiClient.GET('/matching/applications/{applicationId}', {
    params: { path: { applicationId: z.uuid().parse(applicationId) } }, signal,
  });
  if (!response.data || response.error) throw toApiError(response.response.status, response.error);
  return response.data;
}

export async function getApplicationMatches(jobId: string, applicationIds: string[], signal?: AbortSignal) {
  const token = await ensureApiSession();
  if (!applicationIds.length) return [];
  const response = await apiClient.POST('/matching/applications/results:batch', {
    headers: { 'X-CSRF-Token': token },
    body: { jobId: z.uuid().parse(jobId), applicationIds: applicationIds.map(id => z.uuid().parse(id)) },
    signal,
  });
  if (!response.data || response.error) throw toApiError(response.response.status, response.error);
  return response.data;
}

export async function getMatchRankings(jobId: string, page: number, size: number, signal?: AbortSignal) {
  await ensureApiSession();
  const response = await apiClient.GET('/matching/jobs/{jobId}/rankings', {
    params: { path: { jobId: z.uuid().parse(jobId) }, query: { page, size } }, signal,
  });
  if (!response.data || response.error) throw toApiError(response.response.status, response.error);
  return response.data;
}

export async function listRankingApplicants(jobId: string, signal?: AbortSignal) {
  await ensureApiSession();
  const items: components['schemas']['JobApplicant'][] = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    const response = await apiClient.GET('/recruiter/jobs/{jobId}/applications', {
      params: { path: { jobId: z.uuid().parse(jobId) }, query: { page, pageSize: 100 } }, signal,
    });
    if (!response.data || response.error) throw toApiError(response.response.status, response.error);
    items.push(...response.data.items);
    totalPages = response.data.meta.totalPages;
    page++;
  }
  return items;
}
