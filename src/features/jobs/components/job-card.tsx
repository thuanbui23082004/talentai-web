"use client";

import Link from "next/link";
import { Banknote, Clock3, Heart, MapPin } from "lucide-react";
import { Button, Modal, ModalContent, ModalTrigger, Badge } from "@/components/ui";
import { formatDate, formatSalaryRange } from "@/lib/utils";
import type { Job } from "../types";
import { JOB_LEVEL_LABELS, WORK_TYPE_LABELS } from "../labels";

export function JobCard({ job }: { job: Job }) {
    const wordmark = job.company.name.replace("Công ty mẫu ", "");
    return <Modal>
        <article className="group relative flex min-w-0 gap-3 rounded-xl border border-border/60 bg-card p-3.5 shadow-card transition hover:border-primary/30 hover:shadow-float">
            <span aria-hidden="true" className="flex size-16 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-secondary/15 px-1 text-center text-[11px] font-extrabold tracking-tight text-primary sm:size-18">{wordmark}</span>
            <div className="min-w-0 flex-1 pr-4">
                <h3 className="truncate text-[13px] font-semibold leading-5">
                    <ModalTrigger className="max-w-full truncate text-left hover:text-primary" title={job.title}>{job.title}</ModalTrigger>
                </h3>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground" title={job.company.name}>{job.company.name}</p>
                <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-primary">
                    <Banknote className="size-3.5 shrink-0" />
                    <span className="truncate" title={formatSalaryRange(job.salary)}>{formatSalaryRange(job.salary)}</span>
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                    <span className="inline-flex items-center gap-0.5 rounded bg-muted px-1 py-0.5">
                        <MapPin className="size-2.5" />{job.location.city}</span>
                    <span className="inline-flex items-center gap-0.5 rounded bg-muted px-1 py-0.5">
                        <Clock3 className="size-2.5" />{WORK_TYPE_LABELS[job.workType]}</span>
                    <span className="rounded bg-muted px-1 py-0.5">{job.minExperienceYears ? `${job.minExperienceYears} năm` : "Không yêu cầu KN"}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
                    <span className="text-muted-foreground">{job.postedAt ? `Đăng ${formatDate(job.postedAt)}` : "Đang tuyển"}</span>
                    <ModalTrigger className="min-h-8 shrink-0 font-medium text-primary hover:underline">Ứng tuyển</ModalTrigger>
                </div>
            </div>
            <button disabled type="button" title="Lưu việc: sắp ra mắt" aria-label={`Lưu ${job.title} (sắp ra mắt)`} className="absolute top-3 right-2 flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground disabled:cursor-not-allowed">
                <Heart className="size-4" />
            </button>
        </article>
        <ModalContent title={job.title} description={job.company.name} footer={<>
            <Button variant="outline" nativeButton={false} role="link" render={<Link href="/login" />}>Đăng nhập</Button>
            <Button disabled>Ứng tuyển · Sắp ra mắt</Button>
        </>}>
            <div className="space-y-4 text-sm">
                <p className="font-semibold text-primary">{formatSalaryRange(job.salary)}</p>
                <p>{job.location.city} · {WORK_TYPE_LABELS[job.workType]} · {JOB_LEVEL_LABELS[job.level]}</p>
                <div className="flex flex-wrap gap-2">{job.skills?.map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>)}</div>
                <p className="leading-relaxed text-muted-foreground">Thông tin tóm tắt từ tin tuyển dụng. Chức năng ứng tuyển và lưu việc đang được hoàn thiện; hiện chưa gửi hồ sơ từ cửa sổ này.</p>
            </div>
        </ModalContent>
    </Modal>;
}
