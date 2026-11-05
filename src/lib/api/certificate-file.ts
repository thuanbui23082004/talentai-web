import { z } from "zod";

export const CERTIFICATE_FILE_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.gif";
const extensions: Record<string, string[]> = {
    "application/pdf": ["pdf"], "image/jpeg": ["jpg", "jpeg"], "image/png": ["png"],
    "image/webp": ["webp"], "image/gif": ["gif"],
};
export const certificateFileSchema = z.file()
    .min(1, "File đang trống. Vui lòng chọn file khác.")
    .max(5 * 1024 * 1024, "File chứng chỉ tối đa 5 MB.")
    .refine(file => extensions[file.type]?.includes(file.name.split(".").at(-1)?.toLowerCase() ?? ""), "Chọn file PDF, JPG, PNG, WEBP hoặc GIF.");
