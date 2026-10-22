"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { formatDeadline, formatSalaryRange } from "@/lib/utils";
import type { Job } from "../types";
import { WORK_TYPE_LABELS } from "../labels";
import { JobHoverPreview } from "./job-hover-preview";
import { SaveJobButton } from "./save-job-button";

export function JobCard({ job, variant = "default", footer, onUnsave }: { job: Job; variant?: "default" | "application" | "saved"; footer?: ReactNode; onUnsave?: () => void }) {
    const wordmark = job.company.name.replace("Công ty mẫu ", "");
    const card =
        <article className={`group flex min-w-0 flex-col gap-3 rounded-xl border border-border/60 bg-card p-3.5 shadow-card transition hover:border-primary/30 hover:shadow-float ${variant !== "default" ? "h-full" : ""}`}>
            <div className="flex min-w-0 items-start gap-3">
            <span aria-hidden="true" className="flex size-16 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-secondary/15 px-1 text-center text-[13px] font-extrabold tracking-tight break-words text-primary sm:size-18">{wordmark}</span>
            <div className="min-w-0 flex-1">
                <h3 className="min-w-0 text-[15px] font-semibold leading-5">
                    {variant === "saved" && job.status !== "open" ? <span className="block truncate" title={job.title}>{job.title}</span> : <Link href={`/jobs/${job.id}`} className="block w-full truncate text-left hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" title={job.title}>{job.title}</Link>}
                </h3>
                <p className="mt-0.5 truncate text-[13px] leading-5 text-muted-foreground" title={job.company.name}>{job.company.name}</p>
                <div className="mt-1.5 flex items-center gap-x-2 text-[13px] leading-5 font-medium text-primary">
                    <span className="shrink-0" title={formatSalaryRange(job.salary)}>{formatSalaryRange(job.salary, true)}</span>
                    <span aria-hidden="true" className="h-3 shrink-0 border-l border-border" />
                    <span className="min-w-0 truncate" title={[job.location.ward, job.location.city].filter(Boolean).join(", ")}>{job.location.city}{job.location.ward ? ` · ${job.location.ward}` : ""}</span>
                </div>
            </div>
            </div>
            <div className={`flex items-end justify-between gap-3 ${variant === "default" ? "mt-auto" : ""}`}>
                <div className="flex min-w-0 flex-wrap gap-1.5 text-xs leading-4 text-muted-foreground">
                    <span className="rounded-lg bg-muted px-2 py-1">{WORK_TYPE_LABELS[job.workType]}</span>
                    <span className="rounded-lg bg-muted px-2 py-1">{job.minExperienceYears ? `${job.minExperienceYears} năm` : "Không yêu cầu KN"}</span>
                    <span className="rounded-lg bg-muted px-2 py-1">{formatDeadline(job.applicationDeadline)}</span>
                </div>
                <SaveJobButton job={job} onUnsave={onUnsave} />
            </div>
            {footer}
        </article>;
    return variant !== "default" ? card : <JobHoverPreview job={job}>{card}</JobHoverPreview>;
}
