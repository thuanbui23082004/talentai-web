"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { formatDeadline, formatSalaryRange } from "@/lib/utils";
import type { Job } from "../types";
import { WORK_TYPE_LABELS } from "../labels";
import { JobHoverPreview } from "./job-hover-preview";

export function JobCard({ job }: { job: Job }) {
    const wordmark = job.company.name.replace("Công ty mẫu ", "");
    return <JobHoverPreview job={job}>
        <article className="group flex min-w-0 flex-col gap-3 rounded-xl border border-border/60 bg-card p-3.5 shadow-card transition hover:border-primary/30 hover:shadow-float">
            <div className="flex min-w-0 items-start gap-3">
            <span aria-hidden="true" className="flex size-16 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-secondary/15 px-1 text-center text-[13px] font-extrabold tracking-tight break-words text-primary sm:size-18">{wordmark}</span>
            <div className="min-w-0 flex-1">
                <h3 className="min-w-0 text-[15px] font-semibold leading-5">
                    <Link href={`/jobs/${job.id}`} className="block w-full truncate text-left hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" title={job.title}>{job.title}</Link>
                </h3>
                <p className="mt-0.5 truncate text-[13px] leading-5 text-muted-foreground" title={job.company.name}>{job.company.name}</p>
                <div className="mt-1.5 flex items-center gap-x-2 text-[13px] leading-5 font-medium text-primary">
                    <span className="shrink-0" title={formatSalaryRange(job.salary)}>{formatSalaryRange(job.salary, true)}</span>
                    <span aria-hidden="true" className="h-3 shrink-0 border-l border-border" />
                    <span className="min-w-0 truncate" title={[job.location.ward, job.location.city].filter(Boolean).join(", ")}>{job.location.city}{job.location.ward ? ` · ${job.location.ward}` : ""}</span>
                </div>
            </div>
            </div>
            <div className="mt-auto flex items-end justify-between gap-3">
                <div className="flex min-w-0 flex-wrap gap-1.5 text-xs leading-4 text-muted-foreground">
                    <span className="rounded-lg bg-muted px-2 py-1">{WORK_TYPE_LABELS[job.workType]}</span>
                    <span className="rounded-lg bg-muted px-2 py-1">{job.minExperienceYears ? `${job.minExperienceYears} năm` : "Không yêu cầu KN"}</span>
                    <span className="rounded-lg bg-muted px-2 py-1">{formatDeadline(job.applicationDeadline)}</span>
                </div>
            <button disabled type="button" title="Lưu việc: sắp ra mắt" aria-label={`Lưu ${job.title} (sắp ra mắt)`} className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground disabled:cursor-not-allowed">
                <Heart className="size-4" />
            </button>
            </div>
        </article>
        </JobHoverPreview>;
}
