import { z } from "zod";

export const CV_FILE_ACCEPT = ".pdf,.docx";
export const CV_MAX_SIZE = 5 * 1024 * 1024;
export const CV_DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function cvFileError(file: Pick<File, "name" | "type" | "size">): string | undefined {
    const extension = file.name.split(".").at(-1)?.toLowerCase();
    const expected = extension === "pdf" ? "application/pdf" : extension === "docx" ? CV_DOCX_TYPE : undefined;
    if (!expected || file.type && file.type !== expected) return "Vui lòng chọn tệp PDF hoặc DOCX hợp lệ.";
    if (file.size === 0) return "Tệp CV trống. Vui lòng chọn tệp khác.";
    if (file.size > CV_MAX_SIZE) return "Tệp CV không được vượt quá 5MB.";
}

export const uploadedCvSchema = z.object({
    id: z.string().min(1), cvId: z.string().min(1), fileName: z.string().min(1), cvTitle: z.string(),
    fileUrl: z.string().refine(value => /^https?:\/\//i.test(value) && z.url().safeParse(value).success || /^\/api\/mock-media\/[a-zA-Z0-9-]+$/.test(value)),
    contentType: z.string(), sizeBytes: z.number().int().nonnegative(), version: z.number().int().positive(),
    isDefault: z.boolean(), createdAt: z.iso.datetime({ offset: true }),
});
