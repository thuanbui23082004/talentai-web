import { Bookmark, BriefcaseBusiness, FileUser, LayoutDashboard, Sparkles } from "lucide-react";

export const candidateNavigation = [
    { href: "/candidate/dashboard", label: "Tổng quan", Icon: LayoutDashboard },
    { href: "/candidate/matching", label: "AI Job Matching", Icon: Sparkles },
    { href: "/candidate/cv", label: "CV của tôi", Icon: FileUser },
    { href: "/candidate/applications", label: "Quản lý việc làm", Icon: BriefcaseBusiness },
];
export const candidateSavedJobs = { label: "Việc làm đã lưu", Icon: Bookmark };
