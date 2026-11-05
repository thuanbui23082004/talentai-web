import { z } from "zod";

const selections = (maximum: number, label: string, itemLength = 100) => z.array(z.string().trim().min(1).max(itemLength))
    .max(maximum, `Chỉ được chọn tối đa ${maximum} ${label}.`)
    .refine((values) => new Set(values).size === values.length, `Các ${label} không được trùng nhau.`);

// Form values are mapped to ProfileUpdateRequest in job-preferences-mapping.ts.
export const jobPreferencesDraftSchema = z.object({
    industries: selections(3, "ngành nghề").refine((values) => values.length > 0, "Vui lòng chọn ít nhất một ngành nghề."),
    position: z.string().trim().min(1, "Vui lòng nhập vị trí mong muốn.").max(150, "Vị trí mong muốn tối đa 150 ký tự."),
    experience: z.string().trim().min(1, "Vui lòng chọn số năm kinh nghiệm.").max(50),
    salaryMin: z.string(), salaryMax: z.string(), negotiable: z.boolean(),
    locations: selections(5, "địa điểm", 200).refine((values) => values.length > 0, "Vui lòng chọn ít nhất một địa điểm."),
    levels: selections(5, "cấp bậc"), workTypes: selections(5, "hình thức"),
    hybrid: z.boolean(), thirteenthMonth: z.boolean(), healthInsurance: z.boolean(),
}).superRefine((values, context) => {
    if (values.negotiable) return;
    const valid = (text: string) => /^\d+(\.\d{1,2})?$/.test(text) && Number.isFinite(Number(text)) && Number(text) <= 10000;
    if (!valid(values.salaryMin)) context.addIssue({ code: "custom", path: ["salaryMin"], message: "Nhập lương từ 0 đến 10.000 triệu, tối đa 2 số thập phân." });
    if (!valid(values.salaryMax) || Number(values.salaryMax) <= 0) context.addIssue({ code: "custom", path: ["salaryMax"], message: "Nhập lương tối đa lớn hơn 0 và không quá 10.000 triệu." });
    else if (valid(values.salaryMin) && Number(values.salaryMax) < Number(values.salaryMin)) context.addIssue({ code: "custom", path: ["salaryMax"], message: "Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu." });
});

export type JobPreferencesDraft = z.infer<typeof jobPreferencesDraftSchema>;
export const INITIAL_JOB_PREFERENCES: JobPreferencesDraft = {
    industries: [], position: "", experience: "",
    salaryMin: "", salaryMax: "", negotiable: false, locations: [], levels: [], workTypes: [],
    hybrid: false, thirteenthMonth: false, healthInsurance: false,
};
