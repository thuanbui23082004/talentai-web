import { z } from "zod";

/** Presentation-only form, deliberately not an API request schema. */
export const applicationPreviewSchema = z.object({
    cv: z.string().min(1, "Vui lòng chọn CV có sẵn hoặc chọn một tệp CV hợp lệ."),
    location: z.string().min(1, "Vui lòng chọn địa điểm làm việc của tin tuyển dụng."),
    coverLetter: z.string().trim().max(3000, "Thư giới thiệu không quá 3.000 ký tự."),
    allowAi: z.boolean(),
    acceptedTerms: z.boolean().refine(Boolean, "Vui lòng xác nhận thỏa thuận sử dụng dữ liệu."),
});
