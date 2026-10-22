import { z } from "zod";

export const cvPreviewSchema = z.object({
    title: z.string().trim().min(1, "Nhập tên CV của bạn.").max(150, "Tên CV không quá 150 ký tự."),
    person: z.string().trim().min(1, "Nhập họ và tên.").max(100, "Họ tên không quá 100 ký tự."),
    position: z.string().trim().min(1, "Nhập vị trí ứng tuyển.").max(150, "Vị trí không quá 150 ký tự."),
    introduction: z.string().trim().max(1000, "Giới thiệu không quá 1.000 ký tự."),
});
export type CvPreviewValues = z.infer<typeof cvPreviewSchema>;

// Temporary 5MB UI limit until catalog metadata is integrated.
export function validateCvSelection(file: Pick<File, "name" | "type" | "size">) {
    const extension = file.name.split(".").pop()?.toLowerCase();
    const mime = extension === "pdf" ? "application/pdf" : extension === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : undefined;
    if (!mime || (file.type && file.type !== mime)) return "Vui lòng chọn tệp PDF hoặc DOCX hợp lệ.";
    if (file.size === 0) return "Tệp CV trống. Vui lòng chọn tệp khác.";
    if (file.size > 5 * 1024 * 1024) return "Tệp CV không được vượt quá 5MB.";
    return undefined;
}
