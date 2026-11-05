import { z } from "zod";

export const cvPreviewSchema = z.object({
    title: z.string().trim().min(1, "Nhập tên CV của bạn.").max(150, "Tên CV không quá 150 ký tự."),
    person: z.string().trim().min(1, "Nhập họ và tên.").max(100, "Họ tên không quá 100 ký tự."),
    position: z.string().trim().min(1, "Nhập vị trí ứng tuyển.").max(150, "Vị trí không quá 150 ký tự."),
    introduction: z.string().trim().max(1000, "Giới thiệu không quá 1.000 ký tự."),
});
export type CvPreviewValues = z.infer<typeof cvPreviewSchema>;

export { cvFileError as validateCvSelection } from "@/lib/api/cv-schemas";
