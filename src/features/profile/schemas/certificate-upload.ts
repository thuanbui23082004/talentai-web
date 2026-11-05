import { z } from "zod";
import { certificateFileSchema } from "@/lib/api/certificate-file";

export const certificateUploadSchema = z.object({
    name: z.string().trim().min(1, "Vui lòng nhập tên chứng chỉ.").max(200, "Tên chứng chỉ tối đa 200 ký tự."),
    file: certificateFileSchema,
});
