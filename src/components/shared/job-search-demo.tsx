"use client";

import { useToast } from "@/components/ui";
import { JobSearchBar } from "./job-search-bar";

/** Interactive presentation example; no API request is made. */
export function JobSearchDemo() {
    const { toast } = useToast();
    return (
        <JobSearchBar
            locations={[
                { value: "", label: "Tất cả các địa điểm" },
                { value: "Hà Nội", label: "Hà Nội" },
                { value: "Đà Nẵng", label: "Đà Nẵng" },
                { value: "TP.HCM", label: "TP.HCM" },
            ]}
            showQuickRecruitment
            filters={[
                { key: "experience", label: "Tất cả kinh nghiệm", options: [
                    { value: "none", label: "Chưa có kinh nghiệm" },
                    { value: "1-3", label: "1–3 năm" },
                    { value: "3-5", label: "3–5 năm" },
                    { value: "5+", label: "Trên 5 năm" },
                ] },
                { key: "salary", label: "Tất cả mức lương", options: [
                    { value: "under-10", label: "Dưới 10 triệu" },
                    { value: "10-20", label: "10–20 triệu" },
                    { value: "20-40", label: "20–40 triệu" },
                    { value: "40+", label: "Trên 40 triệu" },
                ] },
                { key: "level", label: "Tất cả cấp bậc", options: [
                    { value: "intern", label: "Thực tập sinh" },
                    { value: "junior", label: "Nhân viên" },
                    { value: "senior", label: "Chuyên viên cao cấp" },
                    { value: "manager", label: "Quản lý" },
                ] },
                { key: "workType", label: "Tất cả loại hình", options: [
                    { value: "full_time", label: "Toàn thời gian" },
                    { value: "part_time", label: "Bán thời gian" },
                    { value: "remote", label: "Từ xa" },
                ] },
                { key: "gender", label: "Tất cả giới tính", options: [
                    { value: "male", label: "Nam" },
                    { value: "female", label: "Nữ" },
                ] },
            ]}
            onSearch={(values) => toast({
                title: "Đã chọn tiêu chí tìm kiếm",
                description: [values.query || "Mọi công việc", values.location || "Mọi địa điểm", "Bản minh họa giao diện, chưa áp dụng vào danh sách việc làm."].join(" · "),
            })}
        />
    );
}
