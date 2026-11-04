import { experienceLabel } from "../labels";
import { CalendarDays, Clock3, MapPin, Send } from "lucide-react";
import { SaveJobButton } from "./save-job-button";
import { ApplicationButton } from "@/features/applications";
import { formatDate, formatSalaryRange } from "@/lib/utils";
import type { JobDetail } from "../types";

export function JobDetailHeader({ job }: { job: JobDetail }) {
    const facts = [
        {
            Icon: MapPin,
            label: "Địa điểm",
            value: [job.location.ward, job.location.city]
                .filter(Boolean)
                .join(", "),
        },
        {
            Icon: Clock3,
            label: "Kinh nghiệm",
            value: experienceLabel(job),
        },
        {
            Icon: CalendarDays,
            label: "Hạn ứng tuyển",
            value: job.applicationDeadline
                ? formatDate(job.applicationDeadline)
                : "Chưa cập nhật",
        },
    ];
    return (
            <section
                aria-labelledby="job-title"
                className="flex min-w-0 flex-col rounded-2xl border border-border/50 bg-card p-4 shadow-card sm:p-5"
            >
                <h1
                    id="job-title"
                    className="text-lg leading-snug font-bold sm:text-xl"
                >
                    {job.title}
                </h1>
                <p
                    aria-label="Mức lương"
                    className="mt-3 text-xl leading-snug font-bold text-primary"
                >
                    {formatSalaryRange(job.salary, true)}
                </p>
                <dl className="my-5 grid gap-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
                    {facts.map(({ Icon, label, value }) => (
                        <div
                            key={label}
                            className="flex min-w-0 items-start gap-3"
                        >
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary/60 text-primary">
                                <Icon aria-hidden="true" className="size-6" />
                            </span>
                            <div className="min-w-0 text-sm">
                                <dt className="text-xs text-muted-foreground">
                                    {label}
                                </dt>
                                <dd className="mt-1 leading-5 font-medium">
                                    {value}
                                </dd>
                            </div>
                        </div>
                    ))}
                </dl>
                <div className="mt-auto flex gap-2.5">
                    <ApplicationButton
                        job={job}
                        className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-deep"
                    >
                        <Send className="size-4" />
                        {job.hasApplied ? "Đã ứng tuyển" : "Ứng tuyển ngay"}
                    </ApplicationButton>
                    <SaveJobButton job={job} showLabel />
                </div>
            </section>
    );
}
