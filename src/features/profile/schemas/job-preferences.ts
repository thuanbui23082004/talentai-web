import { z } from "zod";
import { PREFERENCE_EXPERIENCE, PREFERENCE_INDUSTRIES, PREFERENCE_LEVELS, PREFERENCE_LOCATIONS, PREFERENCE_WORK_TYPES } from "../job-preference-options";

const selections = (options: { value: string }[], maximum: number, label: string) => z.array(z.string())
    .max(maximum, `Chỉ được chọn tối đa ${maximum} ${label}.`)
    .refine((values) => values.every((value) => options.some((option) => option.value === value)), `Vui lòng chọn ${label} trong danh sách.`)
    .refine((values) => new Set(values).size === values.length, `Các ${label} không được trùng nhau.`);

// Presentation draft. Experience, multiple levels and benefits are not in JobPreferences API yet.
export const jobPreferencesDraftSchema = z.object({
    industries: selections(PREFERENCE_INDUSTRIES, 3, "ngành nghề").refine((values) => values.length > 0, "Vui lòng chọn ít nhất một ngành nghề."),
    position: z.string().trim().min(1, "Vui lòng nhập vị trí mong muốn.").max(150, "Vị trí mong muốn tối đa 150 ký tự."),
    experience: z.string().refine((value) => PREFERENCE_EXPERIENCE.some((option) => option.value === value), "Vui lòng chọn số năm kinh nghiệm."),
    salaryMin: z.string(), salaryMax: z.string(), negotiable: z.boolean(),
    locations: selections(PREFERENCE_LOCATIONS, 5, "địa điểm").refine((values) => values.length > 0, "Vui lòng chọn ít nhất một địa điểm."),
    levels: selections(PREFERENCE_LEVELS, 5, "cấp bậc"), workTypes: selections(PREFERENCE_WORK_TYPES, 5, "hình thức"),
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
    industries: ["it-hardware", "it-software", "banking"], position: "Digital marketing", experience: "under-1",
    salaryMin: "15", salaryMax: "20", negotiable: false, locations: ["48"], levels: [], workTypes: [],
    hybrid: false, thirteenthMonth: true, healthInsurance: true,
};
