"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import {
    ChevronLeft,
    ChevronRight,
    FileText,
    LayoutGrid,
    Kanban,
    RotateCcw,
    SlidersHorizontal,
    Users,
} from "lucide-react";
import { Alert, Button, Select } from "@/components/ui";
import { useRecruiterJobs } from "@/features/jobs";
import { ApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/utils";
import { jobApplicantQuerySchema } from "@/lib/api/job-applicant-schemas";
import { useJobApplicants } from "../../hooks/use-recruiter-applications";
import {
    JOB_APPLICANT_STATUS_LABELS,
    JOB_EMPLOYMENT_LABELS,
} from "../../job-applicant-messages";
import { JobApplicantCvDialog } from "./job-applicant-cv-dialog";
import type { JobApplicant } from "../../types";
import "./recruiter-candidates.css";
import "./job-applicants.css";

function ApplicantIdentity({ item }: { item: JobApplicant }) {
    const name = item.fullName || "Chưa cập nhật tên";
    const employment = item.employmentType && JOB_EMPLOYMENT_LABELS[item.employmentType];
    return (
        <div className="candidate-identity">
            <span className="candidate-avatar" aria-hidden="true">
                {name
                    .trim()
                    .split(/\s+/)
                    .slice(-2)
                    .map((word) => word[0])
                    .join("")}
            </span>
            <div>
                <div className="job-applicant-name-row">
                    <h2>{name}</h2>
                    <span className={`candidate-status status-${item.status}`}>
                        <span />
                        {JOB_APPLICANT_STATUS_LABELS[item.status]}
                    </span>
                </div>
                <p>{item.email || item.headline || "Chưa cung cấp email"}</p>
                {employment && <span className="job-applicant-employment"><span />{employment}</span>}
            </div>
        </div>
    );
}

function ApplicantCard({
    item,
    jobTitle,
    onViewCv,
}: {
    item: JobApplicant;
    jobTitle?: string;
    onViewCv: (item: JobApplicant) => void;
}) {
    return (
        <article className="job-applicant-card">
            <Link
                href={`/recruiter/candidates/${item.id}?from=job`}
                prefetch={false}
                className="job-applicant-card-link"
                aria-label={`Xem chi tiết ứng viên ${item.fullName || "chưa cập nhật tên"}`}
            >
                <span className="sr-only">Xem chi tiết ứng viên</span>
            </Link>
            <div className="job-applicant-card-intro">
                <ApplicantIdentity item={item} />
            </div>
            <dl className="job-applicant-card-info">
                <div>
                    <dt>Vị trí ứng tuyển</dt>
                    <dd className="job-applicant-position-name">
                        {item.jobTitle || jobTitle || "Chưa cung cấp vị trí"}
                    </dd>
                </div>
                <div>
                    <dt>Mã hồ sơ</dt>
                    <dd title={item.id} className="job-applicant-reference">
                        {item.id.slice(-8)}
                    </dd>
                </div>
                <div>
                    <dt>Ngày nộp CV</dt>
                    <dd>{formatDate(item.appliedAt)}</dd>
                </div>
                <div>
                    <dt>CV đính kèm</dt>
                    <dd>
                        <button
                            type="button"
                            className="job-applicant-view-cv"
                            onClick={() => onViewCv(item)}
                        >
                            <FileText size={17} aria-hidden="true" />
                            Xem CV
                        </button>
                    </dd>
                </div>
            </dl>
        </article>
    );
}

export function RecruiterCandidates() {
    const router = useRouter();
    const params = useSearchParams();
    const jobId = params.get("jobId") ?? "";
    const status = params.get("status") ?? "";
    const parsed = jobApplicantQuerySchema.safeParse({
        status: status || undefined,
        page: params.get("page") ?? 1,
        pageSize: 9,
    });
    const valid =
        parsed.success && (!jobId || z.uuid().safeParse(jobId).success);
    const query = parsed.success ? parsed.data : { page: 1, pageSize: 9 };
    const [requireJob, setRequireJob] = useState(false);
    const [jobPage, setJobPage] = useState(1);
    const [activeCv, setActiveCv] = useState<JobApplicant | null>(null);
    const jobs = useRecruiterJobs({ page: jobPage, pageSize: 100 });
    const applications = useJobApplicants(jobId, query, valid);
    const data = applications.data;
    const page = query.page;
    const total = data?.meta.totalItems ?? 0;
    const items = jobs.data?.items ?? [];
    const selectedJobTitle =
        items.find((job) => job.id === jobId)?.title ||
        data?.items[0]?.jobTitle;
    const jobOptions = [
        { value: "", label: "Chọn tin tuyển dụng" },
        ...items.map((job) => ({ value: job.id, label: job.title })),
    ];
    if (jobId && !items.some((job) => job.id === jobId))
        jobOptions.push({
            value: jobId,
            label: data?.items[0]?.jobTitle || "Tin tuyển dụng đang chọn",
        });
    function update(values: Record<string, string>) {
        const next = new URLSearchParams(params);
        for (const [key, value] of Object.entries(values)) {
            if (value) next.set(key, value);
            else next.delete(key);
        }
        router.push(`/recruiter/candidates${next.size ? `?${next}` : ""}`, {
            scroll: false,
        });
    }
    const error =
        applications.error instanceof ApiError &&
        applications.error.status === 404
            ? "Tin tuyển dụng không tồn tại hoặc không thuộc công ty của bạn."
            : applications.error instanceof ApiError &&
                applications.error.status === 403
              ? "Bạn không có quyền xem ứng viên của tin này."
              : "Không tải được danh sách ứng viên. Vui lòng thử lại.";

    return (
        <div className="candidates-page job-applicants-page">
            <header className="candidates-page-heading">
                <div>
                    <h1>Ứng viên</h1>
                    <p>
                        Theo dõi hồ sơ và tìm ứng viên phù hợp cho từng vị trí.
                    </p>
                </div>
            </header>
            <section
                className="job-applicants-filter"
                aria-label="Lọc ứng viên"
            >
                <div className="job-applicants-filter-title">
                    <SlidersHorizontal size={16} aria-hidden="true" />
                    <span>Bộ lọc hồ sơ</span>
                </div>
                <div className="job-applicants-filter-fields">
                    <div className="job-applicants-field">
                        <span>Tin tuyển dụng</span>
                        <Select
                            aria-label="Tin tuyển dụng"
                            aria-invalid={requireJob && !jobId}
                            aria-describedby={requireJob && !jobId ? 'applicants-job-error' : undefined}
                            placeholder="Chọn tin tuyển dụng"
                            value={jobId}
                            options={jobOptions}
                            disabled={jobs.isPending}
                            onValueChange={(value) =>
                                update({ jobId: value ?? "", page: "" })
                            }
                        />
                        {requireJob && !jobId && <p id="applicants-job-error" role="alert">Vui lòng chọn tin tuyển dụng trước khi mở bảng theo dõi.</p>}
                    </div>
                    <div className="job-applicants-field">
                        <span>Trạng thái hồ sơ</span>
                        <Select
                            aria-label="Trạng thái hồ sơ"
                            placeholder="Tất cả trạng thái"
                            value={status}
                            options={[
                                { value: "", label: "Tất cả trạng thái" },
                                ...Object.entries(
                                    JOB_APPLICANT_STATUS_LABELS,
                                ).map(([value, label]) => ({ value, label })),
                            ]}
                            disabled={!jobId}
                            onValueChange={(value) =>
                                update({ status: value ?? "", page: "" })
                            }
                        />
                    </div>
                    <Button
                        className="job-applicants-reset"
                        variant="ghost"
                        disabled={!status}
                        onClick={() => update({ status: "", page: "" })}
                    >
                        <RotateCcw size={15} aria-hidden="true" />
                        Xóa lọc trạng thái
                    </Button>
                </div>
                {(jobs.data?.meta.totalPages ?? 0) > 1 && (
                    <div className="candidates-filter-row">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={jobPage <= 1 || jobs.isFetching}
                            onClick={() => setJobPage((value) => value - 1)}
                        >
                            Tin trang trước
                        </Button>
                        <span>
                            Danh mục tin: trang {jobPage}/
                            {jobs.data?.meta.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={
                                jobPage >= (jobs.data?.meta.totalPages ?? 0) ||
                                jobs.isFetching
                            }
                            onClick={() => setJobPage((value) => value + 1)}
                        >
                            Tin trang sau
                        </Button>
                    </div>
                )}
                {jobs.isError && (
                    <Alert
                        variant="error"
                        title="Không tải được danh sách tin tuyển dụng"
                    >
                        <Button
                            variant="outline"
                            onClick={() => void jobs.refetch()}
                        >
                            Thử lại
                        </Button>
                    </Alert>
                )}
            </section>
            <div className="job-applicants-results-heading">
                <div>
                    <span className="job-applicants-heading-icon">
                        <Users size={18} aria-hidden="true" />
                    </span>
                    <h2>
                        Hồ sơ ứng tuyển
                        {jobId && selectedJobTitle && (
                            <span className="job-applicants-job-title">
                                {" "}
                                · {selectedJobTitle}
                            </span>
                        )}
                    </h2>
                    {jobId && (
                        <span className="job-applicants-count">
                            {applications.isFetching ? "…" : total}
                        </span>
                    )}
                </div>
                <div
                    className="candidate-view-toggle"
                    aria-label="Kiểu hiển thị"
                >
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                            if (!jobId || !valid) {
                                setRequireJob(true);
                                document.querySelector<HTMLElement>('[aria-label="Tin tuyển dụng"]')?.focus();
                                return;
                            }
                            router.push(`/recruiter/candidates/pipeline?jobId=${jobId}`);
                        }}
                    >
                        <Kanban size={15} aria-hidden="true" />
                        Bảng theo dõi
                    </Button>
                    <Button
                        size="sm"
                        variant="secondary"
                        aria-pressed="true"
                    >
                        <LayoutGrid size={15} aria-hidden="true" />
                        Dạng thẻ
                    </Button>
                </div>
            </div>
            {!valid ? (
                <Alert
                    variant="error"
                    title="Mã tin hoặc bộ lọc không hợp lệ"
                />
            ) : !jobId ? (
                <section className="candidate-empty">
                    <h2>Chọn tin tuyển dụng để xem ứng viên</h2>
                    <p>Chỉ hiển thị hồ sơ đã ứng tuyển vào tin bạn chọn.</p>
                </section>
            ) : applications.isError ? (
                <section className="candidate-empty" role="alert">
                    <h2>{error}</h2>
                    <Button
                        variant="outline"
                        onClick={() => void applications.refetch()}
                    >
                        Thử lại
                    </Button>
                </section>
            ) : applications.isPending ? (
                <div
                    className="candidate-card-grid candidate-skeleton"
                    aria-label="Đang tải ứng viên"
                    aria-busy="true"
                >
                    {Array.from({ length: 3 }, (_, index) => (
                        <span key={index} />
                    ))}
                </div>
            ) : !data?.items.length ? (
                <section className="candidate-empty">
                    <h2>Chưa có ứng viên ứng tuyển</h2>
                    <p>
                        {status
                            ? "Thử chọn trạng thái khác để xem thêm hồ sơ."
                            : "Các hồ sơ gửi vào tin này sẽ xuất hiện tại đây."}
                    </p>
                </section>
            ) : (
                <section
                    aria-label="Danh sách ứng viên"
                    className="job-applicants-results"
                >
                    {data.items.map((item) => (
                        <ApplicantCard
                            item={item}
                            jobTitle={
                                items.find((job) => job.id === jobId)?.title
                            }
                            onViewCv={setActiveCv}
                            key={item.id}
                        />
                    ))}
                </section>
            )}
            {activeCv && (
                <JobApplicantCvDialog
                    item={activeCv}
                    onClose={() => setActiveCv(null)}
                />
            )}
            {jobId && data && total > 0 && (
                <footer className="candidates-results-footer">
                    <span>
                        {total} hồ sơ · Trang {page}/{data.meta.totalPages}
                    </span>
                    <nav aria-label="Phân trang ứng viên">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1 || applications.isFetching}
                            onClick={() => update({ page: String(page - 1) })}
                        >
                            <ChevronLeft size={14} />
                            Trang trước
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={
                                page >= data.meta.totalPages ||
                                applications.isFetching
                            }
                            onClick={() => update({ page: String(page + 1) })}
                        >
                            Trang sau
                            <ChevronRight size={14} />
                        </Button>
                    </nav>
                </footer>
            )}
        </div>
    );
}
