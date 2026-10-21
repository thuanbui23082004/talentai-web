"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { PreviewCard } from "@base-ui/react/preview-card";
import { BriefcaseBusiness, CalendarClock, GraduationCap, MapPin } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { formatDate, formatDeadline, formatSalaryRange } from "@/lib/utils";
import { JOB_LEVEL_LABELS, WORK_TYPE_LABELS } from "../labels";
import type { Job } from "../types";

export function JobHoverPreview({ job, children }: { job: Job; children: ReactElement }) {
    return <PreviewCard.Root>
        <PreviewCard.Trigger render={children} delay={350} closeDelay={200} tabIndex={0} aria-label={`Xem nhanh: ${job.title}`} />
        <PreviewCard.Portal>
            <PreviewCard.Positioner side="right" align="start" sideOffset={12} collisionPadding={16} className="z-40 max-w-[calc(100vw-2rem)]">
                <PreviewCard.Popup aria-label="Xem nhanh công việc" role="region" className="max-h-[min(640px,calc(100dvh-2rem))] w-[min(600px,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-float outline-none sm:p-6">
                    <h2 className="text-xl leading-snug font-bold">{job.title}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{job.company.name}</p>
                    <p className="mt-5 text-xl font-bold text-primary">{formatSalaryRange(job.salary, true)}</p>
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                        <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" aria-hidden="true" />{job.location.city}</span>
                        <span className="inline-flex items-center gap-1.5"><BriefcaseBusiness className="size-4" aria-hidden="true" />{job.minExperienceYears ? `${job.minExperienceYears} năm kinh nghiệm` : "Không yêu cầu kinh nghiệm"}</span>
                        <span className="inline-flex items-center gap-1.5"><GraduationCap className="size-4" aria-hidden="true" />{JOB_LEVEL_LABELS[job.level]}</span>
                        {job.applicationDeadline && <span className="inline-flex items-center gap-1.5"><CalendarClock className="size-4" aria-hidden="true" />Hạn nộp: {formatDate(job.applicationDeadline)}</span>}
                    </div>
                    <p className="mt-4 text-sm font-medium text-primary">{formatDeadline(job.applicationDeadline)}</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <Button nativeButton={false} role="link" render={<Link href={`/jobs/${job.id}`} />}>Xem chi tiết</Button>
                        <Button variant="outline" disabled>Ứng tuyển · Sắp ra mắt</Button>
                    </div>
                    <div className="mt-5 space-y-4 border-t border-border pt-5 text-sm leading-relaxed">
                        <section>
                            <h3 className="text-base font-semibold">Thông tin công việc</h3>
                            <p className="mt-2">Hình thức: {WORK_TYPE_LABELS[job.workType]}</p>
                            <p className="mt-1">Cấp bậc: {JOB_LEVEL_LABELS[job.level]}</p>
                        </section>
                        <section>
                            <h3 className="text-base font-semibold">Kỹ năng</h3>
                            {job.skills?.length ? <div className="mt-2 flex flex-wrap gap-2">{job.skills.map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>)}</div> : <p className="mt-2 text-muted-foreground">Chưa có thông tin kỹ năng.</p>}
                        </section>
                        <section>
                            <h3 className="text-base font-semibold">Mô tả công việc</h3>
                            <p className="mt-2 text-muted-foreground">Chưa có mô tả chi tiết cho tin tuyển dụng này.</p>
                        </section>
                    </div>
                </PreviewCard.Popup>
            </PreviewCard.Positioner>
        </PreviewCard.Portal>
    </PreviewCard.Root>;
}
