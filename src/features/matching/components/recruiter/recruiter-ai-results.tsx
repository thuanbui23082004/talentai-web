'use client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, BriefcaseBusiness, CalendarDays, Check, ChevronLeft, ChevronRight, FileText, History, Mail, MapPin, Phone, RefreshCw, Search, Sparkles, Trophy, UserRound } from 'lucide-react';
import { Alert, Button, Select } from '@/components/ui';
import { useRecruiterJobs } from '@/features/jobs';
import { formatDate } from '@/lib/utils';
import type { components } from '@/lib/api/generated/schema';
import { recruiterMatchKeys, useApplicationMatch, useMatchRankings, useRankedJobApplicants } from '../../hooks/use-recruiter-results';
import { MatchingCriteria } from '../candidate-matching-result';
import './recruiter-ai-results.css';
type Applicant = components['schemas']['JobApplicant'];
type MatchDetails = components['schemas']['RecruiterMatchDetails'];
const scoreFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });
function CandidateAvatar({ name }: {
    name?: string;
}) {
    return <span className="air-avatar-initials" aria-hidden="true">{name?.trim().split(/\s+/).slice(-2).map(word => word[0]).join('') || <UserRound size={24} />}</span>;
}
function MatchScores({ details, score }: {
    details: MatchDetails;
    score: number;
}) {
    const radius = 62;
    const circumference = 2 * Math.PI * radius;
    return <>
        <div className="air-scores-section">
            <div className="air-gauge-container">
                <svg className="air-gauge-svg" width="160" height="160" viewBox="0 0 160 160" aria-hidden="true">
                    <circle cx="80" cy="80" r={radius} fill="none" stroke="var(--secondary)" strokeWidth="12" />
                    <circle cx="80" cy="80" r={radius} fill="none" stroke="var(--primary)" strokeWidth="12" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - score / 100)} transform="rotate(-90 80 80)" />
                </svg>
                <div className="air-gauge-content">
                    <strong className="air-gauge-number">{scoreFormat.format(score)}%</strong>
                    <span className="air-gauge-label">Mức độ phù hợp</span>
                </div>
            </div>
            <div className="air-breakdown-bars">
                {[{ label: 'Điểm ngữ nghĩa (Semantic)', score: details.semantic_score, color: 'air-bar-blue' }, { label: 'Điểm kỹ năng (Skill)', score: details.skill_score, color: 'air-bar-purple' }].map(item => (<div className="air-bar-item" key={item.label}>
                    <div className="air-bar-label-row">
                        <span className="air-bar-title">{item.label}</span>
                        <strong className="air-bar-value">{scoreFormat.format(item.score)}%</strong>
                    </div>
                    <div className="air-bar-track">
                        <div className={`air-bar-fill ${item.color}`} style={{ width: `${item.score}%` }} />
                    </div>
                </div>))}
            </div>
        </div>
        <div className="air-skills-grid">
            {[{ title: 'Kỹ năng phù hợp', skills: details.matched_skills, variant: 'matched', color: 'green' }, { title: 'Kỹ năng còn thiếu', skills: details.missing_skills, variant: 'missing', color: 'red' }].map(group => (<section className={`air-skill-card air-skill-card-${group.variant}`} key={group.title}>
                <div className="air-skill-card-header">
                    <h3 className={`air-skill-title air-skill-title-${group.color}`}>{group.title} ({group.skills.length})</h3>
                </div>
                <div className="air-pills-wrap">{group.skills.length ? group.skills.map(skill => <span key={skill} className={`air-pill air-pill-${group.color}`}>
                    <Check size={13} aria-hidden="true" />{skill}</span>) : <p className="text-xs text-muted-foreground">Chưa ghi nhận kỹ năng.</p>}</div>
            </section>))}
        </div>
        <section className="air-comment-card">
            <div className="air-comment-header">
                <Sparkles size={18} aria-hidden="true" />
                <h3 className="air-comment-title">Nhận xét của AI</h3>
            </div>
            <p className="air-comment-body">{details.explanation || 'Chưa có nhận xét.'}</p>
        </section>
        <MatchingCriteria fields={details.field_scores} />
    </>;
}
function CandidateDetail({ applicationId, applicant }: {
    applicationId: string;
    applicant?: Applicant;
}) {
    const match = useApplicationMatch(applicationId);
    const [activeTab, setActiveTab] = useState('ai');
    const snapshot = applicant?.applicantSnapshot;
    const tabs = [{ id: 'ai', title: 'Đánh giá AI', Icon: Sparkles }, { id: 'profile', title: 'Thông tin hồ sơ', Icon: UserRound }, { id: 'experience', title: 'Kinh nghiệm', Icon: BriefcaseBusiness }, { id: 'history', title: 'Lịch sử ứng tuyển', Icon: History }];
    return <section className="air-detail-card">
        <header className="air-detail-header">
            <div className="air-detail-profile-row">
                <div className="air-detail-avatar">
                    <CandidateAvatar name={applicant?.fullName} />
                </div>
                <div className="air-detail-meta-group">
                    <h2 className="air-detail-name">{applicant?.fullName || 'Ứng viên'}</h2>
                    <div className="air-detail-contact-row">
                        <span className="air-detail-contact-item">
                            <Mail size={15} aria-hidden="true" />{applicant?.email || 'Chưa có email'}</span>
                        <span className="air-detail-contact-item">
                            <Phone size={15} aria-hidden="true" />{applicant?.phone || 'Chưa có số điện thoại'}</span>
                    </div>
                    <div className="air-detail-contact-row">
                        <span className="air-detail-contact-item">
                            <BriefcaseBusiness size={15} aria-hidden="true" />{snapshot?.yearsOfExperience !== undefined ? `${snapshot.yearsOfExperience} năm kinh nghiệm` : 'Chưa cập nhật kinh nghiệm'}</span>
                    </div>
                </div>
            </div>
            <Link href={`/recruiter/candidates/${applicationId}`} className="air-btn-view-cv">
                <FileText size={16} aria-hidden="true" />Xem hồ sơ / CV</Link>
        </header>
        <div className="air-detail-tabs-bar" aria-label="Nội dung hồ sơ">
            {tabs.map(({ id, title, Icon }) => <button key={id} type="button" aria-pressed={activeTab === id} className={`air-tab-item ${activeTab === id ? 'air-tab-active' : ''}`} onClick={() => setActiveTab(id)}>
                <Icon size={16} aria-hidden="true" />{title}</button>)}
        </div>
        <div className="air-tab-panel">
            {activeTab === 'ai' && (match.isPending ? <p role="status">Đang tải kết quả AI…</p> : match.isError ? <Alert variant="error" title="Không tải được kết quả AI">
                <Button variant="outline" onClick={() => void match.refetch()}>Thử lại</Button>
            </Alert> : match.data.status !== 'SCORED' || match.data.score === null || !match.data.details ? <p>Chưa có kết quả AI cho hồ sơ này.</p> : <MatchScores details={match.data.details} score={match.data.score} />)}
            {activeTab === 'profile' && <div className="air-info-grid">
                {[['Họ và tên', applicant?.fullName], ['Email liên hệ', applicant?.email], ['Số điện thoại', applicant?.phone], ['Vị trí ứng tuyển', applicant?.jobTitle], ['Học vấn', snapshot?.educations?.map(item => [item.degree, item.fieldOfStudy, item.school].filter(Boolean).join(' · ')).join('; ')], ['Ngày ứng tuyển', applicant ? formatDate(applicant.appliedAt) : undefined]].map(([label, value]) => <div className="air-info-item" key={label}>
                    <span className="air-info-label">{label}</span>
                    <strong className="air-info-val">{value || 'Chưa có dữ liệu'}</strong>
                </div>)}
            </div>}
            {activeTab === 'experience' && (snapshot?.experiences?.length ? <div className="air-timeline">{snapshot.experiences.map((experience, index) => <article className="air-timeline-item" key={experience.id ?? index}>
                <span className="air-timeline-dot" />
                <div className="air-timeline-content">
                    <h3>{[experience.title, experience.company].filter(Boolean).join(' — ') || 'Kinh nghiệm làm việc'}</h3>
                    <span className="air-timeline-date">{experience.startDate || 'Chưa cập nhật'} – {experience.current ? 'Hiện tại' : experience.endDate || 'Chưa cập nhật'}</span>{experience.description && <p>{experience.description}</p>}</div>
            </article>)}</div> : <p>Chưa có dữ liệu kinh nghiệm trong hồ sơ.</p>)}
            {activeTab === 'history' && <div className="air-timeline"><article className="air-timeline-item"><span className="air-timeline-dot" /><div className="air-timeline-content"><h3>Đã nộp hồ sơ ứng tuyển</h3><p>{applicant?.jobTitle || 'Vị trí đang chọn'}</p><span className="air-timeline-date">{applicant ? formatDate(applicant.appliedAt) : 'Đang tải ngày ứng tuyển…'}</span></div></article></div>}
            <p className="mt-5 text-xs leading-5 text-muted-foreground">Gợi ý từ AI · Chỉ để tham khảo. Nhà tuyển dụng quyết định sau khi xem đầy đủ hồ sơ.</p>
        </div>
    </section>;
}
export function RecruiterAiResults() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const jobs = useRecruiterJobs({ page: 1, pageSize: 100 });
    const jobId = searchParams.get('jobId') ?? jobs.data?.items[0]?.id ?? '';
    const job = jobs.data?.items.find(item => item.id === jobId);
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
    const rankings = useMatchRankings(jobId, page);
    const applicants = useRankedJobApplicants(jobId);
    const rankedItems = rankings.data?.items ?? [];
    const filteredItems = rankedItems.filter(item => !search.trim() || applicants.data?.find(applicant => applicant.id === item.applicationId)?.fullName?.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')));
    const selectedId = selectedApplicationId && rankedItems.some(item => item.applicationId === selectedApplicationId) ? selectedApplicationId : rankedItems[0]?.applicationId;
    const totalPages = Math.max(1, Math.ceil((rankings.data?.total ?? 0) / 20));
    function refresh() { void queryClient.invalidateQueries({ queryKey: recruiterMatchKeys.all }); }
    return <div className="air-page-wrapper">
        <Link className="mb-5 inline-flex items-center gap-2 text-sm text-primary" href={jobId ? `/recruiter/candidates?jobId=${jobId}` : '/recruiter/candidates'}>
            <ArrowLeft size={16} aria-hidden="true" />Danh sách ứng viên</Link>
        <header className="air-job-card">
            <div className="air-job-info-col">
                <div className="air-job-icon-box">
                    <BriefcaseBusiness className="air-job-icon" size={28} aria-hidden="true" />
                </div>
                <div className="air-job-title-group">
                    <h1 className="air-job-title">{job?.title || 'Bảng xếp hạng ứng viên'}</h1>
                    {job?.company.name && <p className="air-job-company">{job.company.name}</p>}
                    <div className="air-job-meta-row">{job?.location.city && <span className="air-meta-item">
                        <MapPin size={15} aria-hidden="true" />{job.location.city}</span>}{job?.createdAt && <span className="air-meta-item">
                            <CalendarDays size={15} aria-hidden="true" />{formatDate(job.createdAt)}</span>}</div>
                    <div className="mt-3">
                        <Select aria-label="Tin tuyển dụng" value={jobId} placeholder="Chọn tin tuyển dụng" options={jobs.data?.items.map(item => ({ value: item.id, label: item.title })) ?? []} disabled={jobs.isPending} onValueChange={value => { setPage(0); setSelectedApplicationId(null); setSearch(''); router.push(`/recruiter/candidates/ai?jobId=${encodeURIComponent(value ?? '')}`); }} />
                    </div>
                </div>
            </div>
            <div className="air-job-actions-col">
                <div className="air-stats-group">
                    <div className="air-stat-box air-stat-purple">
                        <strong className="air-stat-num">{applicants.data?.length ?? '—'}</strong>
                        <span className="air-stat-lbl">Hồ sơ ứng tuyển</span>
                    </div>
                    <div className="air-stat-box air-stat-green">
                        <strong className="air-stat-num">{rankings.data?.total ?? '—'}</strong>
                        <span className="air-stat-lbl">Đã chấm điểm</span>
                    </div>
                    <div className="air-stat-box air-stat-orange">
                        <strong className="air-stat-num">{applicants.data && rankings.data ? Math.max(0, applicants.data.length - rankings.data.total) : '—'}</strong>
                        <span className="air-stat-lbl">Chưa có điểm</span>
                    </div>
                </div>
                <button type="button" className="air-btn-score-ai" onClick={refresh} disabled={!jobId || rankings.isFetching || applicants.isFetching}>
                    <RefreshCw size={18} aria-hidden="true" />Cập nhật kết quả</button>
            </div>
        </header>
        {jobs.isError && <Alert variant="error" title="Không tải được tin tuyển dụng">
            <Button variant="outline" onClick={() => void jobs.refetch()}>Thử lại</Button>
        </Alert>}
        {jobs.isPending && <p role="status">Đang tải tin tuyển dụng…</p>}
        <div className="air-main-grid">
            <aside className="air-ranking-card">
                <div className="air-ranking-header">
                    <div className="air-ranking-title-row">
                        <Trophy size={20} className="air-trophy-icon" aria-hidden="true" />
                        <h2 className="air-ranking-title">Bảng xếp hạng ứng viên</h2>
                    </div>
                    <p className="air-sort-label">Sắp xếp theo: <strong>Điểm phù hợp giảm dần</strong>
                    </p>
                </div>
                <div className="air-search-container">
                    <Search size={18} className="air-search-icon" aria-hidden="true" />
                    <input type="search" className="air-search-input" aria-label="Tìm ứng viên trong trang hiện tại" placeholder="Tìm ứng viên trong trang…" value={search} onChange={event => setSearch(event.target.value)} />
                </div>
                {applicants.isError && <Alert variant="error" title="Không tải được hồ sơ ứng viên">
                    <Button variant="outline" onClick={() => void applicants.refetch()}>Thử lại</Button>
                </Alert>}
                {rankings.isError ? <Alert variant="error" title="Không tải được bảng xếp hạng">
                    <Button variant="outline" onClick={() => void rankings.refetch()}>Thử lại</Button>
                </Alert> : rankings.isPending ? <p role="status" className="p-5">{jobId ? 'Đang tải bảng xếp hạng…' : 'Chọn tin tuyển dụng để xem kết quả.'}</p> : <>
                    <div className="air-candidates-list">{filteredItems.map(item => {
                        const applicant = applicants.data?.find(value => value.id === item.applicationId);
                        return <button type="button" key={item.applicationId} aria-pressed={selectedId === item.applicationId} onClick={() => setSelectedApplicationId(item.applicationId)} className={`air-candidate-item ${selectedId === item.applicationId ? 'air-candidate-active' : ''}`}>
                            <span className={`air-rank-badge ${item.rank <= 3 ? `air-rank-${item.rank}` : 'air-rank-other'}`}>{item.rank}</span>
                            <span className="air-candidate-avatar">
                                <CandidateAvatar name={applicant?.fullName} />
                            </span>
                            <span className="air-candidate-info">
                                <span className="air-candidate-name">{applicant?.fullName || 'Ứng viên'}</span>
                                <span className="air-candidate-headline">{applicant?.headline || item.applicationId.slice(-8)}</span>
                                <span className="air-mini-bar-track">
                                    <span className="air-mini-bar-fill" style={{ display: 'block', width: `${item.score}%` }} />
                                </span>
                            </span>
                            <span className="air-candidate-score">{scoreFormat.format(item.score)}%</span>
                        </button>;
                    })}</div>
                    {!filteredItems.length && <p className="p-5 text-sm text-muted-foreground">{search ? 'Không tìm thấy ứng viên trong trang này.' : 'Chưa có hồ sơ đã được AI chấm điểm.'}</p>}
                    <footer className="air-ranking-footer">
                        <span className="air-footer-count">{rankings.data.total} ứng viên đã chấm · Trang {page + 1}/{totalPages}</span>
                        <div className="air-pagination-buttons">
                            <button className="air-page-btn" type="button" aria-label="Trang trước" disabled={page === 0} onClick={() => { setPage(value => value - 1); setSelectedApplicationId(null); }}>
                                <ChevronLeft size={16} />
                            </button>
                            <button className="air-page-btn" type="button" aria-label="Trang sau" disabled={page + 1 >= totalPages} onClick={() => { setPage(value => value + 1); setSelectedApplicationId(null); }}>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </footer>
                </>}
            </aside>
            {selectedId ? <CandidateDetail key={selectedId} applicationId={selectedId} applicant={applicants.data?.find(item => item.id === selectedId)} /> : <section className="air-detail-card p-6 text-sm text-muted-foreground">Chọn ứng viên để xem kết quả AI và thông tin hồ sơ.</section>}
        </div>
    </div>;
}
