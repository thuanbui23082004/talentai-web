import { z } from "zod";

export const PROFILE_SECTIONS = ["personal", "introduction", "experience", "education", "skills", "projects", "certificates", "languages"] as const;
export const LANGUAGE_LEVELS = [{ value: "beginner", label: "Sơ cấp" }, { value: "intermediate", label: "Trung cấp" }, { value: "advanced", label: "Cao cấp" }] as const;
export const EDUCATION_OPTIONS = ["Trung học phổ thông", "Trung cấp", "Cao đẳng", "Đại học", "Thạc sĩ", "Tiến sĩ", "Khác"];
export const LANGUAGE_OPTIONS = ["Tiếng Anh", "Tiếng Nhật", "Tiếng Hàn", "Tiếng Trung", "Tiếng Pháp", "Tiếng Đức", "Tiếng Tây Ban Nha", "Tiếng Việt", "Khác"];
export const SKILL_SUGGESTIONS = ["Giao tiếp", "Làm việc nhóm", "Thuyết trình", "Thuyết trình trước đám đông", "Soạn slide", "Quản lý thời gian", "Giải quyết vấn đề", "Tư duy phản biện", "Excel", "React", "JavaScript", "TypeScript", "SQL", "Digital Marketing", "Tiếng Anh"];

// Local UI draft only, not an API payload.
export const profileEditorSchema = z.object({
    section: z.enum(PROFILE_SECTIONS),
    name: z.string().trim().max(200, "Tối đa 200 ký tự."),
    company: z.string().trim().max(200, "Tối đa 200 ký tự."),
    position: z.string().trim().max(200, "Tối đa 200 ký tự."),
    startDate: z.string(), endDate: z.string(), current: z.boolean(),
    major: z.string().trim().max(200, "Tối đa 200 ký tự."), degree: z.string(),
    description: z.string().trim().max(3000, "Tối đa 3.000 ký tự."),
    email: z.string().trim(), phone: z.string().trim(), address: z.string().trim().max(300, "Tối đa 300 ký tự."), birthDate: z.string(),
    skills: z.array(z.string().trim().min(1).max(60)).max(20, "Bạn chỉ có thể chọn tối đa 20 kỹ năng."),
    languages: z.array(z.object({ name: z.string(), level: z.enum(["beginner", "intermediate", "advanced"]) })).max(10, "Tối đa 10 ngoại ngữ."),
    image: z.custom<File | null>((value) => value === null || (typeof File !== "undefined" && value instanceof File), "Tệp ảnh không hợp lệ."),
}).superRefine((values, ctx) => {
    const required = (field: "name" | "company" | "position" | "description" | "startDate" | "endDate", label: string) => {
        if (!values[field].trim()) ctx.addIssue({ code: "custom", path: [field], message: `Vui lòng nhập ${label}.` });
    };
    if (values.section === "personal") {
        required("name", "họ và tên");
        if (!z.email().safeParse(values.email).success) ctx.addIssue({ code: "custom", path: ["email"], message: "Vui lòng nhập email hợp lệ." });
        if (values.phone && !/^\+?\d{9,15}$/.test(values.phone)) ctx.addIssue({ code: "custom", path: ["phone"], message: "Số điện thoại cần có 9–15 chữ số." });
        if (values.birthDate && (!/^\d{4}-\d{2}-\d{2}$/.test(values.birthDate) || !Number.isFinite(Date.parse(values.birthDate)) || Date.parse(values.birthDate) > Date.now())) ctx.addIssue({ code: "custom", path: ["birthDate"], message: "Vui lòng chọn ngày sinh hợp lệ trong quá khứ." });
    }
    if (values.section === "introduction") {
        required("description", "giới thiệu bản thân");
        if (values.description.length > 1000) ctx.addIssue({ code: "custom", path: ["description"], message: "Giới thiệu bản thân tối đa 1.000 ký tự." });
    }
    if (values.section === "experience") { required("company", "tên công ty"); required("position", "vị trí công việc"); }
    if (["education", "projects", "certificates"].includes(values.section)) required("name", values.section === "education" ? "tên trường" : values.section === "projects" ? "tên dự án/thành tựu" : "tên chứng chỉ");
    if (["experience", "education", "projects"].includes(values.section)) {
        const pattern = values.section === "education" ? /^(19|20)\d{2}$/ : /^(19|20)\d{2}-(0[1-9]|1[0-2])$/;
        for (const field of ["startDate", "endDate"] as const) {
            if (field === "endDate" && values.current && values.section === "experience") continue;
            required(field, field === "startDate" ? "thời gian bắt đầu" : "thời gian kết thúc");
            if (values[field] && !pattern.test(values[field])) ctx.addIssue({ code: "custom", path: [field], message: values.section === "education" ? "Vui lòng nhập năm hợp lệ (1900–2099)." : "Vui lòng chọn tháng và năm hợp lệ." });
        }
        if (!(values.current && values.section === "experience") && values.startDate && values.endDate && values.endDate < values.startDate) ctx.addIssue({ code: "custom", path: ["endDate"], message: "Thời gian kết thúc phải từ thời gian bắt đầu trở đi." });
    }
    if (values.section === "skills") {
        if (!values.skills.length) ctx.addIssue({ code: "custom", path: ["skills"], message: "Vui lòng chọn ít nhất một kỹ năng." });
        if (new Set(values.skills.map((skill) => skill.toLocaleLowerCase("vi"))).size !== values.skills.length) ctx.addIssue({ code: "custom", path: ["skills"], message: "Các kỹ năng không được trùng nhau." });
    }
    if (values.section === "languages") {
        if (!values.languages.length) ctx.addIssue({ code: "custom", path: ["languages"], message: "Vui lòng thêm ít nhất một ngoại ngữ." });
        const names = new Set<string>();
        values.languages.forEach((language, index) => {
            if (!language.name) ctx.addIssue({ code: "custom", path: ["languages", index, "name"], message: "Vui lòng chọn ngoại ngữ." });
            else if (names.has(language.name)) ctx.addIssue({ code: "custom", path: ["languages", index, "name"], message: "Ngoại ngữ này đã được chọn." });
            names.add(language.name);
        });
    }
    if (values.image) {
        if (!/\.(png|jpe?g)$/i.test(values.image.name) || !["image/png", "image/jpeg"].includes(values.image.type)) ctx.addIssue({ code: "custom", path: ["image"], message: "Vui lòng chọn ảnh PNG, JPG hoặc JPEG." });
        if (values.image.size > 5 * 1024 * 1024) ctx.addIssue({ code: "custom", path: ["image"], message: "Ảnh không được vượt quá 5MB." });
    }
});

export type ProfileDraftValues = z.infer<typeof profileEditorSchema>;
export type ProfileEditorSection = ProfileDraftValues["section"];
export type ProfileDraftEntry = { id: string; values: ProfileDraftValues };

export function emptyProfileDraft(section: ProfileEditorSection): ProfileDraftValues {
    return { section, name: "", company: "", position: "", startDate: "", endDate: "", current: false, major: "", degree: "", description: "", email: "", phone: "", address: "", birthDate: "", skills: [], languages: [{ name: "", level: "beginner" }], image: null };
}
