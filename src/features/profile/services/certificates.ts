import { apiClient, ensureApiSession } from "@/lib/api";
import { toApiError } from "@/lib/api/errors";
import { certificateFileSchema } from "@/lib/api/certificate-file";
import { certificateSchema } from "@/lib/api/profile-schemas";

export async function createCertificate(name: string) {
    const result = await apiClient.POST("/candidate/certificates", {
        body: { name }, headers: { "X-CSRF-Token": await ensureApiSession() },
    });
    if (result.error) throw toApiError(result.response.status, result.error);
    return certificateSchema.parse(result.data);
}

export async function uploadCertificateFile(id: string, file: File) {
    certificateFileSchema.parse(file);
    const body = new FormData();
    body.set("file", file);
    const result = await apiClient.POST("/candidate/certificates/{id}/attachment", {
        params: { path: { id } }, body: { file: file.name }, bodySerializer: () => body,
        headers: { "X-CSRF-Token": await ensureApiSession() },
    });
    if (result.error) throw toApiError(result.response.status, result.error);
    return certificateSchema.parse(result.data);
}
