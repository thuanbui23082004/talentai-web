import type { JobSearchFilter } from "@/components/shared/job-search-bar";

export const JOB_LOCATIONS = [
    { value: "", label: "Tất cả các địa điểm" },
    ...["TP.HCM", "Hà Nội", "Đà Nẵng", "An Giang", "Bà Rịa - Vũng Tàu", "Bạc Liêu", "Bến Tre"].map((city) => ({ value: city, label: city })),
];

export const JOB_SEARCH_FILTERS: JobSearchFilter[] = [
    { key: "experience", label: "Tất cả kinh nghiệm", options: [
        { value: "0:0", label: "Không yêu cầu kinh nghiệm" }, { value: "1:3", label: "1–3 năm" }, { value: "3:5", label: "3–5 năm" }, { value: "5:", label: "Trên 5 năm" },
    ] },
    { key: "salary", label: "Tất cả mức lương", options: [
        { value: ":10000000", label: "Dưới 10 triệu" }, { value: "10000000:20000000", label: "10–20 triệu" }, { value: "20000000:40000000", label: "20–40 triệu" }, { value: "40000000:", label: "Trên 40 triệu" },
    ] },
    { key: "level", label: "Tất cả cấp bậc", options: [
        { value: "intern", label: "Thực tập sinh" }, { value: "junior", label: "Nhân viên" }, { value: "middle", label: "Chuyên viên" }, { value: "senior", label: "Chuyên viên cao cấp" }, { value: "manager", label: "Quản lý" },
    ] },
    { key: "workType", label: "Tất cả loại hình", options: [
        { value: "full_time", label: "Toàn thời gian" }, { value: "part_time", label: "Bán thời gian" }, { value: "remote", label: "Từ xa" }, { value: "internship", label: "Thực tập" },
    ] },
    { key: "gender", label: "Tất cả giới tính", disabled: true, options: [] },
];
