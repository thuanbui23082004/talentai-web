import {
    Bookmark,
    BriefcaseBusiness,
    LayoutDashboard,
    Sparkles,
} from "lucide-react";

export const candidateNavigation = [
    { href: "/candidate/dashboard", label: "Tổng quan", Icon: LayoutDashboard },
    { href: "/candidate/matching", label: "AI Job Matching", Icon: Sparkles },
    {
        href: "/candidate/applications",
        label: "Việc làm đã ứng tuyển",
        Icon: BriefcaseBusiness,
    },
];
export const candidateSavedJobs = {
    href: "/candidate/saved-jobs",
    label: "Việc làm đã lưu",
    Icon: Bookmark,
};
export const candidateProfileNavigation = [
    { href: "/candidate/profile", label: "Hồ sơ của tôi" },
    { href: "/candidate/job-preferences", label: "Tiêu chí tìm việc" },
    { href: "/candidate/cv", label: "Quản lý CV" },
];
