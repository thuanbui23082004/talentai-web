"use client";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    ArrowLeft,
    BriefcaseBusiness,
    CalendarDays,
    Check,
    ChevronLeft,
    ChevronRight,
    FileText,
    History,
    Mail,
    MapPin,
    Phone,
    RefreshCw,
    Search,
    Sparkles,
    Trophy,
    UserRound,
} from "lucide-react";
import { Alert, Avatar, Button } from "@/components/ui";
import { ApplicantStatusActions } from "@/features/applications";
import { useRecruiterJobs } from "@/features/jobs";
import { formatDate } from "@/lib/utils";
import type { components } from "@/lib/api/generated/schema";
import {
    recruiterMatchKeys,
    useApplicationMatch,
    useMatchRankings,
    useRankedJobApplicants,
} from "../../hooks/use-recruiter-results";
import { MatchingCriteria } from "../candidate-matching-result";
import { ApplicantProfileContent } from "./applicant-profile-content";
import "./recruiter-ai-results.css";
type Applicant = components["schemas"]["JobApplicant"];
type MatchDetails = components["schemas"]["RecruiterMatchDetails"];
const scoreFormat = new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 1,
});
function CandidateAvatar({ name }: { name?: string }) {
    return (
        <Avatar
            name={name || "Ứng viên"}
            className="size-full text-base ring-4 ring-secondary/50"
        />
    );
}
function MatchScores({
    details,
    score,
}: {
    details: MatchDetails;
    score: number;
}) {
    const radius = 62;
    const circumference = 2 * Math.PI * radius;
    return (
        <>
            <div className="air-scores-section">
                <div className="air-gauge-container">
                    <svg
                        className="air-gauge-svg"
                        width="160"
                        height="160"
                        viewBox="0 0 160 160"
                        aria-hidden="true"
                    >
                        <circle
                            cx="80"
                            cy="80"
                            r={radius}
                            fill="none"
                            stroke="var(--secondary)"
                            strokeWidth="12"
                        />
                        <circle
                            cx="80"
                            cy="80"
                            r={radius}
                            fill="none"
                            stroke="var(--primary)"
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference * (1 - score / 100)}
                            transform="rotate(-90 80 80)"
                        />
                    </svg>
                    <div className="air-gauge-content">
                        <strong className="air-gauge-number">
                            {scoreFormat.format(score)}%
                        </strong>
                        <span className="air-gauge-label">Mức độ phù hợp</span>
                    </div>
                </div>
                <div className="air-breakdown-bars">
                    {[
                        {
                            label: "Điểm ngữ nghĩa (Semantic)",
                            score: details.semantic_score,
                            color: "air-bar-blue",
                        },
                        {
                            label: "Điểm kỹ năng (Skill)",
                            score: details.skill_score,
                            color: "air-bar-purple",
                        },
                    ].map((item) => (
                        <div className="air-bar-item" key={item.label}>
                            <div className="air-bar-label-row">
                                <span className="air-bar-title">
                                    {item.label}
                                </span>
                                <strong className="air-bar-value">
                                    {scoreFormat.format(item.score)}%
                                </strong>
                            </div>
                            <div className="air-bar-track">
                                <div
                                    className={`air-bar-fill ${item.color}`}
                                    style={{ width: `${item.score}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="air-skills-grid">
                {[
                    {
                        title: "Kỹ năng phù hợp",
                        skills: details.matched_skills,
                        variant: "matched",
                        color: "green",
                    },
                    {
                        title: "Kỹ năng còn thiếu",
                        skills: details.missing_skills,
                        variant: "missing",
                        color: "red",
                    },
                ].map((group) => (
                    <section
                        className={`air-skill-card air-skill-card-${group.variant}`}
                        key={group.title}
                    >
                        <div className="air-skill-card-header">
                            <h3
                                className={`air-skill-title air-skill-title-${group.color}`}
                            >
                                {group.title} ({group.skills.length})
                            </h3>
                        </div>
                        <div className="air-pills-wrap">
                            {group.skills.length ? (
                                group.skills.map((skill) => (
                                    <span
                                        key={skill}
                                        className={`air-pill air-pill-${group.color}`}
                                    >
                                        <Check size={13} aria-hidden="true" />
                                        {skill}
                                    </span>
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    Chưa ghi nhận kỹ năng.
                                </p>
                            )}
                        </div>
                    </section>
                ))}
            </div>
            <section className="air-comment-card">
                <div className="air-comment-header">
                    <Sparkles size={18} aria-hidden="true" />
                    <h3 className="air-comment-title">Nhận xét của AI</h3>
                </div>
                <p className="air-comment-body">
                    {details.explanation || "Chưa có nhận xét."}
                </p>
            </section>
            <MatchingCriteria fields={details.field_scores} />
        </>
    );
}
function CandidateDetail({
    applicationId,
    applicant,
}: {
    applicationId: string;
    applicant?: Applicant;
}) {
    const match = useApplicationMatch(applicationId);
    const [activeTab, setActiveTab] = useState("ai");
    const snapshot = applicant?.applicantSnapshot;
    const queryClient = useQueryClient();
    const tabs = [
        { id: "ai", title: "Đánh giá AI", Icon: Sparkles },
        { id: "profile", title: "Thông tin hồ sơ", Icon: UserRound },
        { id: "experience", title: "Kinh nghiệm", Icon: BriefcaseBusiness },
        { id: "history", title: "Lịch sử ứng tuyển", Icon: History },
    ];
    return (
        <section className="air-detail-card">
            <header className="air-detail-header">
                <div className="air-detail-profile-row">
                    <div className="air-detail-avatar">
                        <CandidateAvatar name={applicant?.fullName} />
                    </div>
                    <div className="air-detail-meta-group">
                        <h2 className="air-detail-name">
                            {applicant?.fullName || "Ứng viên"}
                        </h2>
                        <div className="air-detail-contact-row">
                            <span className="air-detail-contact-item">
                                <Mail size={15} aria-hidden="true" />
                                {applicant?.email || "Chưa có email"}
                            </span>
                            <span className="air-detail-contact-item">
                                <Phone size={15} aria-hidden="true" />
                                {applicant?.phone || "Chưa có số điện thoại"}
                            </span>
                        </div>
                        <div className="air-detail-contact-row">
                            <span className="air-detail-contact-item">
                                <BriefcaseBusiness
                                    size={15}
                                    aria-hidden="true"
                                />
                                {snapshot?.yearsOfExperience !== undefined
                                    ? `${snapshot.yearsOfExperience} năm kinh nghiệm`
                                    : "Chưa cập nhật kinh nghiệm"}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="air-detail-header-tools">
                {applicant && <ApplicantStatusActions
                    compact
                    applicant={applicant}
                    onUpdated={() => { void queryClient.invalidateQueries({ queryKey: recruiterMatchKeys.applicants(applicant.jobId) }); }}
                />}
                <Link
                    href={`/recruiter/candidates/${applicationId}?from=job`}
                    prefetch={false}
                    className="air-btn-view-cv"
                    aria-label="Xem hồ sơ ứng viên"
                >
                    <FileText size={16} aria-hidden="true" />
                    Xem hồ sơ
                </Link>
                </div>
            </header>
            <div className="air-detail-tabs-bar" aria-label="Nội dung hồ sơ">
                {tabs.map(({ id, title, Icon }) => (
                    <button
                        key={id}
                        type="button"
                        aria-pressed={activeTab === id}
                        className={`air-tab-item ${activeTab === id ? "air-tab-active" : ""}`}
                        onClick={() => setActiveTab(id)}
                    >
                        <Icon size={16} aria-hidden="true" />
                        {title}
                    </button>
                ))}
            </div>
            <div className="air-tab-panel">
                {activeTab === "ai" &&
                    (match.isPending ? (
                        <p role="status">Đang tải kết quả AI…</p>
                    ) : match.isError ? (
                        <Alert
                            variant="error"
                            title="Không tải được kết quả AI"
                        >
                            <Button
                                variant="outline"
                                onClick={() => void match.refetch()}
                            >
                                Thử lại
                            </Button>
                        </Alert>
                    ) : match.data.status !== "SCORED" ||
                      match.data.score === null ||
                      !match.data.details ? (
                        <p>Chưa có kết quả AI cho hồ sơ này.</p>
                    ) : (
                        <MatchScores
                            details={match.data.details}
                            score={match.data.score}
                        />
                    ))}
                {activeTab === "profile" && (
                    <ApplicantProfileContent applicant={applicant} />
                )}
                {activeTab === "experience" && (
                    <ApplicantProfileContent
                        applicant={applicant}
                        experienceOnly
                    />
                )}
                {activeTab === "history" && (
                    <div className="air-timeline">
                        <article className="air-timeline-item">
                            <span className="air-timeline-dot" />
                            <div className="air-timeline-content">
                                <h3>Đã nộp hồ sơ ứng tuyển</h3>
                                <p>
                                    {applicant?.jobTitle || "Vị trí đang chọn"}
                                </p>
                                <span className="air-timeline-date">
                                    {applicant
                                        ? formatDate(applicant.appliedAt)
                                        : "Đang tải ngày ứng tuyển…"}
                                </span>
                            </div>
                        </article>
                    </div>
                )}
                <p className="mt-5 text-xs leading-5 text-muted-foreground">
                    Gợi ý từ AI · Chỉ để tham khảo. Nhà tuyển dụng quyết định
                    sau khi xem đầy đủ hồ sơ.
                </p>
            </div>
        </section>
    );
}
export function RecruiterAiResults() {
    const rankingRef = useRef<HTMLElement>(null);
    useEffect(() => {
        const ranking = rankingRef.current;
        if (!ranking) return;
        let frame = 0;
        function updateHeight() {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                if (!ranking) return;
                const availableHeight = window.innerHeight - ranking.getBoundingClientRect().top - 16;
                ranking.style.setProperty('--air-ranking-height', `${Math.max(240, availableHeight)}px`);
            });
        }
        updateHeight();
        window.addEventListener('resize', updateHeight);
        window.addEventListener('scroll', updateHeight, { passive: true });
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('resize', updateHeight);
            window.removeEventListener('scroll', updateHeight);
        };
    }, []);
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const jobs = useRecruiterJobs({ page: 1, pageSize: 100 });
    const jobId = searchParams.get("jobId") ?? jobs.data?.items[0]?.id ?? "";
    const job = jobs.data?.items.find((item) => item.id === jobId);
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState("");
    const [selectedApplicationId, setSelectedApplicationId] = useState<
        string | null
    >(null);
    const rankings = useMatchRankings(jobId, page);
    const applicants = useRankedJobApplicants(jobId);
    const rankedItems = rankings.data?.items ?? [];
    const filteredItems = rankedItems.filter(
        (item) =>
            !search.trim() ||
            applicants.data
                ?.find((applicant) => applicant.id === item.applicationId)
                ?.fullName?.toLocaleLowerCase("vi")
                .includes(search.trim().toLocaleLowerCase("vi")),
    );
    const selectedId =
        selectedApplicationId &&
        rankedItems.some((item) => item.applicationId === selectedApplicationId)
            ? selectedApplicationId
            : rankedItems[0]?.applicationId;
    const totalPages = Math.max(1, Math.ceil((rankings.data?.total ?? 0) / 20));
    function refresh() {
        void queryClient.invalidateQueries({
            queryKey: recruiterMatchKeys.all,
        });
    }
    return (
        <div className="air-page-wrapper">
            <Link
                className="mb-5 inline-flex items-center gap-2 text-sm text-primary"
                href={
                    jobId
                        ? `/recruiter/candidates?jobId=${jobId}`
                        : "/recruiter/candidates"
                }
            >
                <ArrowLeft size={16} aria-hidden="true" />
                Danh sách ứng viên
            </Link>

            <div className="air-main-grid">
                <header className="air-job-card">
                    <div className="air-job-info-col">
                        <div className="air-job-icon-box">
                            <Avatar
                                name={job?.company.name || "Doanh nghiệp"}
                                src={job?.company.logoUrl}
                                className="size-full rounded-xl bg-card text-base"
                            />
                        </div>
                        <div className="air-job-title-group">
                            <h2 className="air-job-title">
                                {job?.title || "Tin tuyển dụng"}
                            </h2>
                            {job?.company.name && (
                                <p className="air-job-company">
                                    {job.company.name}
                                </p>
                            )}
                            <div className="air-job-meta-row">
                                {job?.location.city && (
                                    <span className="air-meta-item">
                                        <MapPin size={15} aria-hidden="true" />
                                        {job.location.city}
                                    </span>
                                )}
                                {job?.createdAt && (
                                    <span className="air-meta-item">
                                        <CalendarDays
                                            size={15}
                                            aria-hidden="true"
                                        />
                                        {formatDate(job.createdAt)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="air-job-actions-col">
                        <div className="air-stats-group">
                            <div className="air-stat-box air-stat-purple">
                                <strong className="air-stat-num">
                                    {applicants.data?.length ?? "—"}
                                </strong>
                                <span className="air-stat-lbl">
                                    Hồ sơ ứng tuyển
                                </span>
                            </div>
                            <div className="air-stat-box air-stat-green">
                                <strong className="air-stat-num">
                                    {rankings.data?.total ?? "—"}
                                </strong>
                                <span className="air-stat-lbl">
                                    Đã chấm điểm
                                </span>
                            </div>
                            <div className="air-stat-box air-stat-orange">
                                <strong className="air-stat-num">
                                    {applicants.data && rankings.data
                                        ? Math.max(
                                              0,
                                              applicants.data.length -
                                                  rankings.data.total,
                                          )
                                        : "—"}
                                </strong>
                                <span className="air-stat-lbl">
                                    Chưa có điểm
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="air-btn-score-ai"
                            onClick={refresh}
                            disabled={
                                !jobId ||
                                rankings.isFetching ||
                                applicants.isFetching
                            }
                        >
                            <RefreshCw size={18} aria-hidden="true" />
                            Cập nhật kết quả
                        </button>
                    </div>
                </header>
                {jobs.isError && (
                    <Alert
                        variant="error"
                        title="Không tải được tin tuyển dụng"
                    >
                        <Button
                            variant="outline"
                            onClick={() => void jobs.refetch()}
                        >
                            Thử lại
                        </Button>
                    </Alert>
                )}
                {jobs.isPending && (
                    <p role="status">Đang tải tin tuyển dụng…</p>
                )}
                <aside ref={rankingRef} className="air-ranking-card">
                    <div className="air-ranking-header">
                        <div className="air-ranking-title-row">
                            <Trophy
                                size={20}
                                className="air-trophy-icon"
                                aria-hidden="true"
                            />
                            <h2 className="air-ranking-title">
                                Xếp hạng ứng viên
                            </h2>
                        </div>
                        <p className="air-sort-label">
                            Theo điểm phù hợp từ AI · Cao đến thấp
                        </p>
                    </div>
                    <div className="air-search-container">
                        <Search
                            size={18}
                            className="air-search-icon"
                            aria-hidden="true"
                        />
                        <input
                            type="search"
                            className="air-search-input"
                            aria-label="Tìm ứng viên trong trang hiện tại"
                            placeholder="Tìm theo tên ứng viên…"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>
                    {applicants.isError && (
                        <Alert
                            variant="error"
                            title="Không tải được hồ sơ ứng viên"
                        >
                            <Button
                                variant="outline"
                                onClick={() => void applicants.refetch()}
                            >
                                Thử lại
                            </Button>
                        </Alert>
                    )}
                    {rankings.isError ? (
                        <Alert
                            variant="error"
                            title="Không tải được bảng xếp hạng"
                        >
                            <Button
                                variant="outline"
                                onClick={() => void rankings.refetch()}
                            >
                                Thử lại
                            </Button>
                        </Alert>
                    ) : rankings.isPending ? (
                        <p role="status" className="p-5">
                            {jobId
                                ? "Đang tải bảng xếp hạng…"
                                : "Chọn tin tuyển dụng để xem kết quả."}
                        </p>
                    ) : (
                        <>
                            <div className="air-candidates-list">
                                {filteredItems.map((item) => {
                                    const applicant = applicants.data?.find(
                                        (value) =>
                                            value.id === item.applicationId,
                                    );
                                    return (
                                        <button
                                            type="button"
                                            key={item.applicationId}
                                            aria-pressed={
                                                selectedId ===
                                                item.applicationId
                                            }
                                            onClick={() =>
                                                setSelectedApplicationId(
                                                    item.applicationId,
                                                )
                                            }
                                            className={`air-candidate-item ${selectedId === item.applicationId ? "air-candidate-active" : ""}`}
                                        >
                                            <span
                                                className={`air-rank-badge ${item.rank <= 3 ? `air-rank-${item.rank}` : "air-rank-other"}`}
                                            >
                                                {item.rank}
                                            </span>
                                            <span className="air-candidate-avatar">
                                                <CandidateAvatar
                                                    name={applicant?.fullName}
                                                />
                                            </span>
                                            <span className="air-candidate-info">
                                                <span className="air-candidate-name">
                                                    {applicant?.fullName ||
                                                        "Ứng viên"}
                                                </span>
                                                <span className="air-candidate-headline">
                                                    {applicant?.headline ||
                                                        item.applicationId.slice(
                                                            -8,
                                                        )}
                                                </span>
                                                <span className="air-mini-bar-track">
                                                    <span
                                                        className="air-mini-bar-fill"
                                                        style={{
                                                            display: "block",
                                                            width: `${item.score}%`,
                                                        }}
                                                    />
                                                </span>
                                            </span>
                                            <span className="air-candidate-score">
                                                {scoreFormat.format(item.score)}
                                                %
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            {!filteredItems.length && (
                                <p className="p-5 text-sm text-muted-foreground">
                                    {search
                                        ? "Không tìm thấy ứng viên trong trang này."
                                        : "Chưa có hồ sơ đã được AI chấm điểm."}
                                </p>
                            )}
                            <footer className="air-ranking-footer">
                                <span className="air-footer-count">
                                    {rankings.data.total} ứng viên đã chấm ·
                                    Trang {page + 1}/{totalPages}
                                </span>
                                <div className="air-pagination-buttons">
                                    <button
                                        className="air-page-btn"
                                        type="button"
                                        aria-label="Trang trước"
                                        disabled={page === 0}
                                        onClick={() => {
                                            setPage((value) => value - 1);
                                            setSelectedApplicationId(null);
                                        }}
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button
                                        className="air-page-btn"
                                        type="button"
                                        aria-label="Trang sau"
                                        disabled={page + 1 >= totalPages}
                                        onClick={() => {
                                            setPage((value) => value + 1);
                                            setSelectedApplicationId(null);
                                        }}
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </footer>
                        </>
                    )}
                </aside>
                {selectedId ? (
                    <CandidateDetail
                        key={selectedId}
                        applicationId={selectedId}
                        applicant={applicants.data?.find(
                            (item) => item.id === selectedId,
                        )}
                    />
                ) : (
                    <section className="air-detail-card p-6 text-sm text-muted-foreground">
                        Chọn ứng viên để xem kết quả AI và thông tin hồ sơ.
                    </section>
                )}
            </div>
        </div>
    );
}
