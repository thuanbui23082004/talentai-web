"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, FileText } from "lucide-react";
import { Alert, Button } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { useJobApplicant } from "../../hooks/use-recruiter-applications";
import { JOB_APPLICANT_STATUS_LABELS } from "../../job-applicant-messages";
import { JobApplicantCvDialog } from "./job-applicant-cv-dialog";

export function JobApplicantDetail({ id }: { id: string }) {
    const query = useJobApplicant(id);
    const [viewCv, setViewCv] = useState(false);
    if (query.isPending) return <p role="status">Đang tải hồ sơ ứng viên…</p>;
    if (query.isError)
        return (
            <Alert variant="error" title="Không thể tải hồ sơ ứng viên">
                <p>
                    Hồ sơ không tồn tại, không thuộc công ty hoặc dịch vụ chưa
                    sẵn sàng.
                </p>
                <Button
                    className="mt-3"
                    variant="outline"
                    onClick={() => void query.refetch()}
                >
                    Thử lại
                </Button>
            </Alert>
        );
    const item = query.data;
    return (
        <div className="mx-auto grid w-full max-w-5xl gap-5">
            <Link
                href={`/recruiter/candidates?jobId=${item.jobId}`}
                className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary"
            >
                <ArrowLeft size={16} aria-hidden="true" />
                Quay lại danh sách ứng viên
            </Link>
            <section className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">
                            {item.fullName || "Chưa cập nhật tên"}
                        </h1>
                        {item.email && (
                            <p className="mt-2 break-all text-sm text-muted-foreground">
                                {item.email}
                            </p>
                        )}
                        {item.headline && (
                            <p className="mt-1 text-sm text-muted-foreground">
                                {item.headline}
                            </p>
                        )}
                    </div>
                    <span className="rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-primary">
                        {JOB_APPLICANT_STATUS_LABELS[item.status]}
                    </span>
                </div>
                <dl className="mt-6 grid gap-5 border-t border-border pt-6 text-sm sm:grid-cols-2">
                    {[
                        ["Vị trí ứng tuyển", item.jobTitle],
                        ["Ngày nộp CV", formatDate(item.appliedAt)],
                        ["Số điện thoại", item.phone],
                        ["Mã hồ sơ", item.id],
                    ].map(([label, value]) => (
                        <div key={label}>
                            <dt className="text-muted-foreground">{label}</dt>
                            <dd className="mt-2 break-words font-medium">
                                {value || "Chưa cung cấp"}
                            </dd>
                        </div>
                    ))}
                </dl>
            </section>
            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="font-semibold">CV đính kèm</h2>
                        <p className="mt-2 break-all text-sm text-muted-foreground">
                            {item.resumeFileName || "CV đã nộp"}
                        </p>
                    </div>
                    <Button onClick={() => setViewCv(true)}>
                        <FileText size={16} aria-hidden="true" />
                        Xem CV
                    </Button>
                </div>
            </section>
            {item.coverLetter && (
                <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                    <h2 className="font-semibold">Thư giới thiệu</h2>
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">
                        {item.coverLetter}
                    </p>
                </section>
            )}
            {viewCv && (
                <JobApplicantCvDialog
                    item={item}
                    onClose={() => setViewCv(false)}
                />
            )}
        </div>
    );
}
