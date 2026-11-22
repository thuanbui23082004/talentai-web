"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, BriefcaseBusiness, CalendarDays, Cake, FileText, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { Alert, Button, Select } from "@/components/ui";
import { toRecruiterJobView, useRecruiterJob } from "@/features/jobs";
import { formatDate } from "@/lib/utils";
import { JOB_APPLICANT_TRANSITIONS } from "@/lib/api/job-applicant-transitions";
import { useJobApplicant } from "../../hooks/use-recruiter-applications";
import { useJobPipelineMove } from "../../hooks/use-job-pipeline";
import { JOB_APPLICANT_STATUS_LABELS } from "../../job-applicant-messages";
import { JobApplicantCvDialog } from "./job-applicant-cv-dialog";
import "./candidate-detail.css";
import "./job-applicant-detail.css";

const stages = ["Đã nhận hồ sơ", "Sơ tuyển", "Phỏng vấn", "Tuyển dụng / Từ chối"] as const;
const stageByStatus = {
    submitted: 0, reviewing: 1, shortlisted: 1, interview_scheduled: 2,
    offered: 3, hired: 3, rejected: 3, withdrawn: 3,
} as const;

function JobSummaryPanel({ jobId, title }: { jobId: string; title?: string }) {
    const query = useRecruiterJob(jobId);
    const job = query.data ? toRecruiterJobView(query.data) : undefined;
    return <section className="candidate-detail-panel job-applicant-job-panel">
        <h2>Vị trí ứng tuyển</h2>
        <div className="job-applicant-job-heading"><span className="job-applicant-job-icon"><BriefcaseBusiness size={17} aria-hidden="true" /></span><div><strong>{title || job?.title || "Không có dữ liệu"}</strong><small>{query.data?.company.name || "Không có dữ liệu"}</small></div></div>
        {query.isPending ? <p className="job-applicant-empty">Đang tải tin tuyển dụng…</p> : query.isError ? <p className="job-applicant-empty">Không tải được thông tin tin tuyển dụng.</p> : <>
            {job?.location && <p className="job-applicant-job-fact"><MapPin size={14} aria-hidden="true" />{job.location}</p>}
            {job?.salary && <p className="job-applicant-job-salary">{job.salary === "negotiable" ? "Thỏa thuận" : job.salary}</p>}
        </>}
        <Link href={`/recruiter/jobs/${jobId}`} className="job-applicant-job-link">Xem chi tiết tin</Link>
    </section>;
}

function ApplicantContent({ id }: { id: string }) {
    const query = useJobApplicant(id);
    const jobId = query.data?.jobId ?? "";
    const move = useJobPipelineMove(jobId);
    const [viewCv, setViewCv] = useState(false);
    if (query.isPending) return <div className="candidate-detail-skeleton" aria-busy="true"><span /><span /><span /></div>;
    if (query.isError) return <section className="candidate-detail-error" role="alert"><h1>Không thể tải hồ sơ ứng viên</h1><p>Hồ sơ không tồn tại, không thuộc công ty hoặc dịch vụ chưa sẵn sàng.</p><Button variant="outline" onClick={() => void query.refetch()}>Thử lại</Button><Link href="/recruiter/candidates">Quay lại danh sách ứng viên</Link></section>;
    const item = query.data;
    const name = item.fullName || "Không có dữ liệu";
    const initials = name.trim().split(/\s+/).slice(-2).map(word => word[0]).join("");
    const targets = JOB_APPLICANT_TRANSITIONS[item.status];
    const stageIndex = stageByStatus[item.status];
    return <div className="candidate-detail-page job-applicant-detail">
        <Link href={`/recruiter/candidates?jobId=${item.jobId}`} className="candidate-detail-back"><ArrowLeft size={16} aria-hidden="true" />Quay lại danh sách ứng viên</Link>
        <div className="candidate-detail-grid">
            <aside className="candidate-personal-panel candidate-detail-panel">
                <div className="candidate-personal-intro">
                    <span className="candidate-detail-avatar" aria-hidden="true">{initials}</span>
                    <h1>{name}</h1>
                    <span className={`candidate-status status-${item.status}`}><span />{JOB_APPLICANT_STATUS_LABELS[item.status]}</span>
                    <div className="job-applicant-headline"><BriefcaseBusiness size={14} aria-hidden="true" /><span>{item.headline || "Không có dữ liệu"}</span></div>
                </div>
                <div className="job-applicant-intro-meta"><CalendarDays size={15} aria-hidden="true" />Đã ứng tuyển ngày {formatDate(item.appliedAt)}</div>
                <div className="job-applicant-quick-actions"><Button onClick={() => setViewCv(true)}><FileText size={15} aria-hidden="true" />Xem CV</Button></div>
                <section className="candidate-resume-section"><h2>Thông tin cá nhân</h2><dl className="job-applicant-personal-fields">
                    <div><span className="job-applicant-field-icon"><UserRound size={14} aria-hidden="true" /></span><div><dt>Giới tính</dt><dd>Không có dữ liệu</dd></div></div>
                    <div><span className="job-applicant-field-icon"><Cake size={14} aria-hidden="true" /></span><div><dt>Ngày sinh</dt><dd>Không có dữ liệu</dd></div></div>
                    <div><span className="job-applicant-field-icon"><Mail size={14} aria-hidden="true" /></span><div><dt>Địa chỉ Email</dt><dd>{item.email || "Không có dữ liệu"}</dd></div></div>
                    <div><span className="job-applicant-field-icon"><Phone size={14} aria-hidden="true" /></span><div><dt>Số điện thoại</dt><dd>{item.phone || "Không có dữ liệu"}</dd></div></div>
                    <div><span className="job-applicant-field-icon"><MapPin size={14} aria-hidden="true" /></span><div><dt>Địa chỉ</dt><dd>Không có dữ liệu</dd></div></div>
                </dl></section>
                <section className="candidate-resume-section"><h2>Liên kết mạng xã hội</h2><p className="job-applicant-personal-empty">Không có dữ liệu</p></section>
                <section className="candidate-resume-section"><h2>Ngôn ngữ</h2><p className="job-applicant-personal-empty">Không có dữ liệu</p></section>
            </aside>
            <div className="candidate-detail-center">
                <section className="candidate-detail-panel candidate-pipeline"><div className="candidate-panel-title"><h2>Tiến trình tuyển dụng</h2></div><ol>{stages.map((stage, index) => <li key={stage} aria-current={stageIndex === index ? "step" : undefined} className={stageIndex >= index ? "completed-stage" : ""}>{stage}</li>)}</ol><p className="candidate-current-round">Trạng thái hiện tại: {JOB_APPLICANT_STATUS_LABELS[item.status]}</p>
                    {targets.length > 0 && <div className="job-applicant-status-control"><Select aria-label="Chuyển trạng thái hồ sơ" placeholder="Chuyển trạng thái" value="" disabled={move.isPending} options={[{ value: "", label: "Chuyển trạng thái", disabled: true }, ...targets.map(status => ({ value: status, label: JOB_APPLICANT_STATUS_LABELS[status] }))]} onValueChange={value => { const status = targets.find(target => target === value); if (status) move.mutate({ id: item.id, values: { status, version: item.version } }); }} /></div>}
                    {move.isError && <Alert variant="error" title="Không thể cập nhật trạng thái"><Button variant="outline" onClick={() => void query.refetch()}>Tải lại hồ sơ</Button></Alert>}
                </section>
                <article className="candidate-detail-panel job-applicant-profile">
                    <section className="candidate-resume-section"><h2>Tổng quan</h2><p>{item.coverLetter || item.headline || "Không có dữ liệu"}</p></section>
                    <section className="candidate-resume-section"><h2>Kinh nghiệm làm việc</h2><p>Không có dữ liệu</p></section>
                    <section className="candidate-resume-section"><h2>Học vấn</h2><p>Không có dữ liệu</p></section>
                    <section className="candidate-resume-section"><h2>Kỹ năng chuyên môn</h2><p>Không có dữ liệu</p></section>
                    <section className="candidate-resume-section"><h2>Chứng chỉ</h2><p>Không có dữ liệu</p></section>
                </article>
            </div>
            <aside className="candidate-detail-right">
                <section className="candidate-detail-panel job-applicant-side-panel"><h2>Điểm đánh giá</h2><p className="job-applicant-empty">Không có dữ liệu đánh giá cho hồ sơ này.</p></section>
                <section className="candidate-detail-panel job-applicant-side-panel"><h2>Lịch trình sắp tới</h2><p className="job-applicant-empty">Không có lịch phỏng vấn.</p></section>
                <JobSummaryPanel jobId={item.jobId} title={item.jobTitle} />
                <section className="candidate-detail-panel job-applicant-attachment-panel"><h2>Tệp đính kèm</h2><Button variant="ghost" title={item.resumeFileName || "Hồ sơ / CV"} onClick={() => setViewCv(true)}><FileText size={16} aria-hidden="true" /><span>{item.resumeFileName || "Hồ sơ / CV"}</span></Button></section>
            </aside>
        </div>
        {viewCv && <JobApplicantCvDialog item={item} onClose={() => setViewCv(false)} />}
    </div>;
}

export function JobApplicantDetail({ id }: { id: string }) {
    return <ApplicantContent id={id} />;
}
