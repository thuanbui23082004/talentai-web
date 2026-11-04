import { apiClient, ensureApiSession } from "@/lib/api";
import {
    companySchema,
    companyInputSchema,
    logoFileSchema,
    verificationFilesSchema,
    type CompanyInput,
} from "@/features/company/schemas/company";
import { settingsError, settingsRequest } from "@/features/account";
import { z } from "zod";
export function getCompany() {
    return settingsRequest(async () => {
        await ensureApiSession();
        const result = await apiClient.GET("/recruiter/company");
        if (result.response.status === 404) return null;
        if (result.error)
            throw settingsError(result.error, result.response.status);
        return companySchema.parse(result.data);
    });
}
export function saveCompany(input: CompanyInput, creating: boolean) {
    return settingsRequest(async () => {
        const token = await ensureApiSession();
        const options = {
            body: companyInputSchema.parse(input),
            headers: { "X-CSRF-Token": token },
        };
        const result = creating
            ? await apiClient.POST("/recruiter/company", options)
            : await apiClient.PUT("/recruiter/company", options);
        if (result.error)
            throw settingsError(result.error, result.response.status);
        return companySchema.parse(result.data);
    });
}
export function uploadLogo(file: File) {
    return settingsRequest(async () => {
        logoFileSchema.parse(file);
        const token = await ensureApiSession();
        const data = new FormData();
        data.set("file", file);
        const result = await apiClient.PUT("/recruiter/company/logo", {
            body: { file: file.name },
            bodySerializer: () => data,
            headers: { "X-CSRF-Token": token },
        });
        if (result.error)
            throw settingsError(result.error, result.response.status);
        return companySchema.parse(result.data);
    });
}
export function removeLogo() {
    return settingsRequest(async () => {
        const token = await ensureApiSession();
        const result = await apiClient.DELETE("/recruiter/company/logo", {
            headers: { "X-CSRF-Token": token },
        });
        if (result.error)
            throw settingsError(result.error, result.response.status);
    });
}
export function submitDocuments(files: File[]) {
    return settingsRequest(async () => {
        verificationFilesSchema.parse(files);
        const token = await ensureApiSession();
        const data = new FormData();
        files.forEach((file) => data.append("files", file));
        const result = await apiClient.POST(
            "/recruiter/company/verification-documents",
            {
                body: { files: files.map((file) => file.name) },
                bodySerializer: () => data,
                headers: { "X-CSRF-Token": token },
            },
        );
        if (result.error)
            throw settingsError(result.error, result.response.status);
        return companySchema.parse(result.data);
    });
}
const companyCatalogsSchema = z.object({
    industries: z.array(z.object({ id: z.string(), name: z.string() })),
    locations: z.array(z.object({ id: z.string(), name: z.string() })),
});
export function getCompanyCatalogs() {
    return settingsRequest(async () => {
        await ensureApiSession();
        const result = await apiClient.GET("/recruiter/company/catalogs");
        if (result.error) throw settingsError(result.error, result.response.status);
        return companyCatalogsSchema.parse(result.data);
    });
}
