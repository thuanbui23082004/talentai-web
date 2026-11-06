import { z } from "zod";

/** Form fields; the service sends only jobId, resumeId and coverLetter. */
export const applicationFormSchema = z.object({
    cv: z.string().min(1, "Vui lòng chọn CV có sẵn hoặc chọn một tệp CV hợp lệ."),
    location: z.string(),
    coverLetter: z.string().trim().max(10000, "Thư giới thiệu không quá 10.000 ký tự."),
    allowAi: z.boolean(),
    acceptedTerms: z.boolean(),
});
export const applicationPreviewSchema = applicationFormSchema.extend({
    location: z.string().min(1, "Vui lòng chọn địa điểm làm việc của tin tuyển dụng."),
    coverLetter: z.string().trim().max(3000, "Thư giới thiệu không quá 3.000 ký tự."),
    acceptedTerms: z.boolean().refine(Boolean, "Vui lòng xác nhận thỏa thuận sử dụng dữ liệu."),
});
