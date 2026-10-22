import { todayCalendarValue } from "@/lib/calendar";
import type { Job, SavedJob } from "./types";

export type SavedJobTab = "all" | "open" | "expiring" | "closed";
export type SavedJobSort = "newest" | "oldest" | "deadline";
export const SAVED_JOB_STATUS = {
    open: { label: "Còn tuyển", tone: "bg-success-soft text-success-foreground" },
    expiring: { label: "Sắp hết hạn", tone: "bg-warning-soft text-warning-foreground" },
    closed: { label: "Đã ngừng tuyển", tone: "bg-muted text-foreground" },
};

export function savedJobStatus(job: Job, today = todayCalendarValue()): "open" | "expiring" | "closed" {
    if (job.status !== "open" || (job.applicationDeadline && job.applicationDeadline < today)) return "closed";
    if (job.applicationDeadline) {
        const days = (Date.parse(`${job.applicationDeadline}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000;
        if (days <= 7) return "expiring";
    }
    return "open";
}

export function filterSavedJobs(items: SavedJob[], filters: { q: string; city: string; tab: SavedJobTab; sort: SavedJobSort }, today = todayCalendarValue()) {
    const normalize = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
    const term = normalize(filters.q.trim());
    return items.filter((item) => {
        const status = savedJobStatus(item.job, today);
        return (!term || normalize(`${item.job.title} ${item.job.company.name}`).includes(term)) &&
            (!filters.city || item.job.location.city === filters.city) &&
            (filters.tab === "all" || (filters.tab === "open" ? status !== "closed" : status === filters.tab));
    }).toSorted((a, b) => {
        if (filters.sort === "deadline") {
            const deadline = (item: SavedJob) => savedJobStatus(item.job, today) === "closed" ? "9999-12-31" : item.job.applicationDeadline ?? "9999-12-30";
            const comparison = deadline(a).localeCompare(deadline(b));
            if (comparison) return comparison;
        }
        return (filters.sort === "oldest" ? 1 : -1) * a.savedAt.localeCompare(b.savedAt) || a.job.id.localeCompare(b.job.id);
    });
}
