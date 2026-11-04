import type { JobSearchFilter } from "@/components/shared/job-search-bar";
import { provinces, provinceCity } from "@/lib/locations/vietnam";

export const JOB_LOCATIONS = [
    { value: "", label: "Tất cả các địa điểm" },
    ...provinces.map((province) => ({ value: provinceCity(province.name), label: provinceCity(province.name) })),
];

export const JOB_SEARCH_FILTERS: JobSearchFilter[] = [
    { key: "experienceLevel", label: "Tất cả kinh nghiệm", options: [
        { value: "INTERN", label: "Thực tập sinh" }, { value: "FRESHER", label: "Mới tốt nghiệp" }, { value: "JUNIOR", label: "Junior" }, { value: "MIDDLE", label: "Middle" }, { value: "SENIOR", label: "Senior" }, { value: "EXPERT", label: "Chuyên gia" },
    ] },
    { key: "salary", label: "Tất cả mức lương", options: [
        { value: ":10000000", label: "Dưới 10 triệu" }, { value: "10000000:20000000", label: "10–20 triệu" }, { value: "20000000:40000000", label: "20–40 triệu" }, { value: "40000000:", label: "Trên 40 triệu" },
    ] },
    { key: "jobType", label: "Tất cả loại hình", options: [
        { value: "FULL_TIME", label: "Toàn thời gian" }, { value: "PART_TIME", label: "Bán thời gian" }, { value: "CONTRACT", label: "Hợp đồng" }, { value: "INTERNSHIP", label: "Thực tập" }, { value: "FREELANCE", label: "Tự do" },
    ] },
    { key: "workMode", label: "Tất cả hình thức", options: [
        { value: "ONSITE", label: "Tại văn phòng" }, { value: "HYBRID", label: "Kết hợp" }, { value: "REMOTE", label: "Từ xa" },
    ] },
];
