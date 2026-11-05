import { apiClient, ensureApiSession } from "@/lib/api";
import { toApiError } from "@/lib/api/errors";
import { uploadedCvSchema } from "@/lib/api/cv-schemas";
import { cvUploadSchema } from "../schemas/cv-upload";

export async function listCvs(signal?: AbortSignal) {
    const result = await apiClient.GET("/cvs", { signal });
    if (result.error) throw toApiError(result.response.status, result.error);
    return uploadedCvSchema.array().parse(result.data);
}

export async function getCv(cvId: string, signal?: AbortSignal) {
    const result = await apiClient.GET("/cvs/{cvId}", { params: { path: { cvId } }, signal });
    if (result.error) throw toApiError(result.response.status, result.error);
    return uploadedCvSchema.parse(result.data);
}

export async function uploadCv(file: File) {
    cvUploadSchema.parse(file);
    const body = new FormData();
    body.set("file", file);
    const result = await apiClient.POST("/cvs", { body: { file: file.name }, bodySerializer: () => body, headers: { "X-CSRF-Token": await ensureApiSession() } });
    if (result.error) throw toApiError(result.response.status, result.error);
    return uploadedCvSchema.parse(result.data);
}

export async function setDefaultCv(cvId: string) {
    const result = await apiClient.PATCH("/cvs/{cvId}/default", { params: { path: { cvId } }, headers: { "X-CSRF-Token": await ensureApiSession() } });
    if (!result.response.ok) throw toApiError(result.response.status, result.error);
}

export async function deleteCv(cvId: string) {
    const result = await apiClient.DELETE("/cvs/{cvId}", { params: { path: { cvId } }, headers: { "X-CSRF-Token": await ensureApiSession() } });
    if (!result.response.ok) throw toApiError(result.response.status, result.error);
}
