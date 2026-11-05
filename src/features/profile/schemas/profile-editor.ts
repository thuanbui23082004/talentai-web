import { z } from "zod";

export const PROFILE_SECTIONS = ["personal", "introduction", "experience", "education", "skills", "projects", "certificates", "languages"] as const;
export const LANGUAGE_LEVELS = [{ value: "beginner", label: "Sơ cấp" }, { value: "intermediate", label: "Trung cấp" }, { value: "advanced", label: "Cao cấp" }] as const;
export const EDUCATION_OPTIONS = ["Trung học phổ thông", "Trung cấp", "Cao đẳng", "Đại học", "Thạc sĩ", "Tiến sĩ", "Khác"];
export const LANGUAGE_OPTIONS = ["Tiếng Anh", "Tiếng Nhật", "Tiếng Hàn", "Tiếng Trung", "Tiếng Pháp", "Tiếng Đức", "Tiếng Tây Ban Nha", "Tiếng Việt", "Khác"];
export const SKILL_SUGGESTIONS = ["Giao tiếp", "Làm việc nhóm", "Thuyết trình", "Thuyết trình trước đám đông", "Soạn slide", "Quản lý thời gian", "Giải quyết vấn đề", "Tư duy phản biện", "Excel", "React", "JavaScript", "TypeScript", "SQL", "Digital Marketing", "Tiếng Anh"];

// Form values are mapped to the API payload in career-mapping.ts.
export const profileEditorSchema = z.object({
    section: z.enum(PROFILE_SECTIONS),
    name: z.string().trim().max(200, "Tối đa 200 ký tự."),
    company: z.string().trim().max(200, "Tối đa 200 ký tự."),
    position: z.string().trim().max(200, "Tối đa 200 ký tự."),
    startDate: z.string(), endDate: z.string(), current: z.boolean(),
    major: z.string().trim().max(200, "Tối đa 200 ký tự."), degree: z.string(),
    description: z.string().trim().max(4000, "Tối đa 4.000 ký tự."),
    issuer: z.string().trim().max(200, "Tối đa 200 ký tự."), credentialId: z.string().trim().max(200, "Tối đa 200 ký tự."),
    credentialUrl: z.string().trim().max(1000, "Đường dẫn tối đa 1.000 ký tự."),
    email: z.string().trim(), phone: z.string().trim(), address: z.string().trim().max(300, "Tối đa 300 ký tự."), birthDate: z.string(),
    skills: z.array(z.string().trim().min(1).max(100, "Tên kỹ năng tối đa 100 ký tự.")),
    languages: z.array(z.object({ name: z.string(), level: z.enum(["beginner", "intermediate", "advanced"]) })).max(10, "Tối đa 10 ngoại ngữ."),
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
    if (["experience", "education", "certificates"].includes(values.section)) {
        for (const field of ["startDate", "endDate"] as const) {
            if (field === "endDate" && values.current && values.section !== "certificates") continue;
            if (values[field] && !z.iso.date().safeParse(values[field]).success) ctx.addIssue({ code: "custom", path: [field], message: "Vui lòng chọn ngày hợp lệ." });
        }
        if (!(values.current && values.section !== "certificates") && values.startDate && values.endDate && values.endDate < values.startDate) ctx.addIssue({ code: "custom", path: ["endDate"], message: "Thời gian kết thúc phải từ thời gian bắt đầu trở đi." });
    }
    if (values.section === "experience" && values.address.length > 200) ctx.addIssue({ code: "custom", path: ["address"], message: "Địa điểm tối đa 200 ký tự." });
    if (values.section === "education") {
        for (const field of ["major", "degree"] as const) if (values[field].length > 150) ctx.addIssue({ code: "custom", path: [field], message: "Tối đa 150 ký tự." });
        if (values.description.length > 2000) ctx.addIssue({ code: "custom", path: ["description"], message: "Mô tả học vấn tối đa 2.000 ký tự." });
    }
    if (values.section === "certificates" && values.credentialUrl && (!z.url().safeParse(values.credentialUrl).success || !/^https?:\/\//i.test(values.credentialUrl))) ctx.addIssue({ code: "custom", path: ["credentialUrl"], message: "Vui lòng nhập đường dẫn HTTP hoặc HTTPS hợp lệ." });
    if (values.section === "projects") {
        const pattern = /^(19|20)\d{2}-(0[1-9]|1[0-2])$/;
        for (const field of ["startDate", "endDate"] as const) {
            required(field, field === "startDate" ? "thời gian bắt đầu" : "thời gian kết thúc");
            if (values[field] && !pattern.test(values[field])) ctx.addIssue({ code: "custom", path: [field], message: "Vui lòng chọn tháng và năm hợp lệ." });
        }
        if (values.startDate && values.endDate && values.endDate < values.startDate) ctx.addIssue({ code: "custom", path: ["endDate"], message: "Thời gian kết thúc phải từ thời gian bắt đầu trở đi." });
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
});

export type ProfileDraftValues = z.infer<typeof profileEditorSchema>;
export type ProfileEditorSection = ProfileDraftValues["section"];
export type ProfileDraftEntry = { id: string; values: ProfileDraftValues };

export function emptyProfileDraft(section: ProfileEditorSection): ProfileDraftValues {
    return { section, name: "", company: "", position: "", startDate: "", endDate: "", current: false, major: "", degree: "", description: "", issuer: "", credentialId: "", credentialUrl: "", email: "", phone: "", address: "", birthDate: "", skills: [], languages: [{ name: "", level: "beginner" }] };
}
