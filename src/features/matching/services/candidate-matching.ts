import { apiClient } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { components } from "@/lib/api/generated/schema";

export async function previewCandidateMatching(cvId: string, jobId: string): Promise<components["schemas"]["MatchingPreview"]> {
  const { data, error, response } = await apiClient.POST("/matching/previews", { body: { cvId, jobId } });
  if (!data || error) throw toApiError(response.status, error);
  return data;
}
