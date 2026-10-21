import { z } from "zod";

export const companySearchSchema = z.object({
    q: z.string().trim().max(200).optional(),
    city: z.string().max(100).optional(),
    industryId: z.string().uuid().optional(),
    size: z.enum(["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"]).optional(),
    isVerified: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
    hiringOnly: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(12),
});
export const parseCompanySearch = (params: URLSearchParams) => companySearchSchema.safeParse(Object.fromEntries(params));

export const COMPANY_INDUSTRIES = [
    { value: "30000000-0000-4000-8000-000000000001", label: "Công nghệ thông tin" },
    { value: "30000000-0000-4000-8000-000000000002", label: "Tài chính - Ngân hàng" },
    { value: "30000000-0000-4000-8000-000000000003", label: "Dịch vụ - Thương mại" },
];
export const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];
