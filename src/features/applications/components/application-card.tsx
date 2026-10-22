"use client";

import { ArrowUpRight, CalendarPlus, Check, CheckCheck, Clock3, FileText, MapPin, Video } from "lucide-react";
import { Alert, Button } from "@/components/ui";
import { JobCard } from "@/features/jobs";
import { formatDate } from "@/lib/utils";
import { APPLICATION_LABELS, APPLICATION_TONES } from "../labels";
import { applicationProgress, downloadInterviewCalendar, formatInterviewTime } from "../presentation";
import type { Application, Interview } from "../types";
import { useAcceptInterview } from "../hooks/use-applications";

export function InterviewActions({ interview }: { interview: Interview }) {
    const accept = useAcceptInterview();
    return <div className="space-y-3">
        {interview.invitationStatus === "pending" && <Button loading={accept.isPending} onClick={() => accept.mutate(interview.id)}><Check />Xác nhận tham gia</Button>}
        {accept.isError && <Alert variant="error" title="Chưa thể xác nhận lời mời">Vui lòng tải lại lịch và thử lại. Lời mời có thể đã được cập nhật.</Alert>}
        {accept.isSuccess && <p role="status" className="text-sm text-success">Đã xác nhận tham gia phỏng vấn.</p>}
    </div>;
}

export function InterviewSchedule({ interview }: { interview: Interview }) {
    return <div className="rounded-xl border border-primary/10 bg-secondary/40 p-3">
        <div className="flex items-start gap-3">
            <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg border border-primary/10 bg-card text-primary"><span className="text-lg font-bold leading-5">{formatDate(interview.startTime).slice(0, 2)}</span><span className="text-[10px] font-medium whitespace-nowrap">TH {formatDate(interview.startTime).slice(3, 5)}</span></div>
            <div className="min-w-0"><p className="text-sm font-semibold">{interview.round ?? "Lịch phỏng vấn"}</p><p className="mt-0.5 text-xs text-muted-foreground">{formatInterviewTime(interview.startTime)} – {formatInterviewTime(interview.endTime)} · {formatDate(interview.startTime)} (GMT+7)</p><p className="mt-1 flex items-start gap-1.5 text-xs text-primary">{interview.mode === "online" ? <Video className="size-3.5 shrink-0" /> : <MapPin className="size-3.5 shrink-0" />}<span>{interview.mode === "online" ? "Phỏng vấn trực tuyến" : interview.location ?? "Chờ nhà tuyển dụng gửi địa điểm"}</span></p></div>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">{interview.invitationStatus === "accepted" ? <CheckCheck className="size-3.5 text-success" /> : <Clock3 className="size-3.5 text-warning" />}{interview.invitationStatus === "accepted" ? "Bạn đã xác nhận tham gia" : "Lời mời đang chờ bạn xác nhận"}</p>
    </div>;
}

export function ApplicationCard({ application, interview, interviewState, onDetails }: { application: Application; interview?: Interview; interviewState: "loading" | "error" | "ready"; onDetails: () => void }) {
    const progress = applicationProgress(application.status);
    return <JobCard job={application.job} variant="application"
        header={<div className="flex flex-wrap items-center justify-between gap-2"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${APPLICATION_TONES[application.status]}`}><span aria-hidden="true" className="size-1.5 rounded-full bg-current" />{APPLICATION_LABELS[application.status]}</span><span className="text-xs text-muted-foreground">Nộp {formatDate(application.appliedAt)}</span></div>}
        footer={<div className="space-y-3 border-t border-border/60 pt-3">
            {application.status === "interview" ? interview ? <InterviewSchedule interview={interview} /> : <div className="rounded-lg bg-secondary/40 p-3 text-xs leading-5 text-muted-foreground">{interviewState === "loading" ? "Đang tải lịch phỏng vấn…" : interviewState === "error" ? "Chưa tải được lịch. Bạn có thể thử lại ở thông báo phía trên." : "Chưa có lịch phỏng vấn đang chờ hoặc đã xác nhận. Xem tiến trình để theo dõi hồ sơ."}</div> : progress > 0 ? <div><div aria-label={`Tiến trình: ${APPLICATION_LABELS[application.status]}`} className="flex gap-1.5">{[1, 2, 3, 4].map((step) => <span key={step} className={`h-1 flex-1 rounded-full ${step <= progress ? application.status === "hired" ? "bg-success" : "bg-primary" : "bg-muted"}`} />)}</div><p className="mt-2 flex items-center gap-1.5 text-xs leading-5 text-muted-foreground">{application.status === "hired" ? <Check className="size-3.5 shrink-0 text-success" /> : <Clock3 className="size-3.5 shrink-0" />}{application.status === "hired" ? "Chúc mừng bạn! Theo dõi hướng dẫn nhận việc từ nhà tuyển dụng." : application.status === "reviewing" ? "Nhà tuyển dụng đang xem xét hồ sơ của bạn." : "Hồ sơ đã gửi thành công. Bạn sẽ được thông báo khi có cập nhật."}</p></div> : <p className="rounded-lg bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">{application.status === "withdrawn" ? "Bạn đã rút hồ sơ cho vị trí này." : "Hồ sơ chưa phù hợp ở lần tuyển này. Cơ hội tiếp theo vẫn đang chờ bạn."}</p>}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><FileText className="size-3.5 shrink-0" /><span className="truncate" title={application.cvTitle}>{application.cvTitle ?? "CV đã ứng tuyển"}</span></div>
            <div className="flex flex-wrap items-center justify-between gap-2">{interview && interview.invitationStatus === "accepted" ? <Button variant="secondary" className="h-11 px-3 text-xs" onClick={() => downloadInterviewCalendar(interview)}><CalendarPlus />Thêm vào lịch</Button> : <span className="text-xs text-muted-foreground">Cập nhật {formatDate(application.updatedAt)}</span>}<Button variant="ghost" className="ml-auto h-11 px-3 text-xs text-primary" onClick={onDetails}>{interview?.invitationStatus === "pending" ? "Xem lời mời" : "Xem tiến trình"}<ArrowUpRight /></Button></div>
        </div>} />;
}
