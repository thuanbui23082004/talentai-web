import { provinces, provinceCity } from "@/lib/locations/vietnam";

export const PREFERENCE_INDUSTRIES = [
    { value: "it-hardware", label: "IT Phần cứng - Mạng" }, { value: "it-software", label: "IT Phần mềm" },
    { value: "banking", label: "Ngân hàng" }, { value: "marketing", label: "Marketing / Truyền thông" },
    { value: "sales", label: "Kinh doanh / Bán hàng" }, { value: "finance", label: "Tài chính / Kế toán" },
    { value: "hr", label: "Nhân sự" }, { value: "design", label: "Thiết kế / Sáng tạo" },
    { value: "education", label: "Giáo dục / Đào tạo" }, { value: "logistics", label: "Vận tải / Logistics" },
];
export const PREFERENCE_EXPERIENCE = [
    { value: "no-experience", label: "Chưa có kinh nghiệm" }, { value: "under-1", label: "Dưới 1 năm" },
    { value: "1-2", label: "1–2 năm" }, { value: "2-3", label: "2–3 năm" }, { value: "3-5", label: "3–5 năm" },
    { value: "5-10", label: "5–10 năm" }, { value: "over-10", label: "Trên 10 năm" },
];
export const PREFERENCE_LEVELS = [
    { value: "intern", label: "Thực tập sinh" }, { value: "fresher", label: "Mới tốt nghiệp" },
    { value: "junior", label: "Nhân viên" }, { value: "middle", label: "Chuyên viên" },
    { value: "senior", label: "Chuyên viên cao cấp" }, { value: "lead", label: "Trưởng nhóm" },
    { value: "manager", label: "Quản lý" }, { value: "director", label: "Giám đốc" },
];
export const PREFERENCE_WORK_TYPES = [
    { value: "full_time", label: "Toàn thời gian" }, { value: "part_time", label: "Bán thời gian" },
    { value: "internship", label: "Thực tập" }, { value: "contract", label: "Hợp đồng" },
    { value: "freelance", label: "Freelance" }, { value: "remote", label: "Làm việc từ xa" }, { value: "hybrid", label: "Kết hợp (Hybrid)" },
];
export const PREFERENCE_LOCATIONS = provinces.map((province) => ({ value: province.code, label: provinceCity(province.name) }));
