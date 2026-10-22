"use client";

import { CandidatePageTitle } from "@/components/layout/candidate/candidate-page-title";

import { useState, type ReactNode } from "react";
import { BadgeCheck, BookOpen, BriefcaseBusiness, CircleAlert, GraduationCap, Languages, Pencil, Plus, Rocket, Sparkles, UserRound } from "lucide-react";
import { Badge, Select } from "@/components/ui";
import type { AuthUser } from "@/features/auth";
import { EDUCATION_OPTIONS, type ProfileEditorSection } from "../schemas/profile-editor";
import { FixedRecommendedJobs } from "./fixed-recommended-jobs";
import { ProfileAction } from "./profile-action";
import { ProfileDraftProvider, useProfileDraft } from "./profile-draft-provider";
import { ProfileEntries } from "./profile-entries";
import { ProfilePersonalInfo } from "./profile-personal-info";
import { ProfileCvUpload } from "./profile-cv-upload";

function SectionCard({ section, title, description, icon, badge, children, initialDegree }: { section: ProfileEditorSection; title: string; description: string; icon: ReactNode; badge?: string; children?: ReactNode; initialDegree?: string }) {
    const { entries } = useProfileDraft();
    const hasContent = !!entries[section]?.length;
    const edit = hasContent && ["introduction", "skills", "languages"].includes(section);
    return <section aria-label={title} className="rounded-2xl border border-border/80 bg-card p-5 shadow-card sm:p-6">
        <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary [&_svg]:size-4.5">{icon}</span><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{title}</h2>{badge && !hasContent && <Badge variant="new">{badge}</Badge>}</div>{!hasContent && <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{description}</p>}</div></div><ProfileAction section={section} initialDegree={initialDegree} className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-medium text-primary hover:bg-secondary">{edit ? <Pencil className="size-4" /> : <Plus className="size-4" />}{edit ? "Chỉnh sửa" : "Thêm"}</ProfileAction></div>
        {hasContent ? <div className="mt-5"><ProfileEntries section={section} /></div> : children && <div className="mt-5">{children}</div>}
    </section>;
}

export function CandidateProfilePage({ user }: { user: AuthUser }) {
    return <ProfileDraftProvider user={user}><CandidateProfileContent user={user} /></ProfileDraftProvider>;
}

function CandidateProfileContent({ user }: { user: AuthUser }) {
    const [noExperience, setNoExperience] = useState(false);
    const [educationDegree, setEducationDegree] = useState("");
    return <div className="candidate-page">
        <CandidatePageTitle className="mb-5">Hồ sơ của tôi</CandidatePageTitle>
        <p role="status" className="mb-5 rounded-xl border border-info/20 bg-info-soft px-4 py-3 text-xs leading-5 text-info-foreground">Bạn đang chỉnh sửa bản xem trước. Thông tin được giữ trong trang hiện tại và sẽ mất khi tải lại; chưa lưu lên tài khoản.</p>
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-4">
                <ProfilePersonalInfo user={user} />
                <ProfileCvUpload />
                <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-card sm:p-6"><h2 className="font-semibold">Tổng quan hồ sơ</h2><div className="mt-4 flex gap-3 rounded-xl border border-warning/35 bg-warning-soft p-4 text-xs leading-5 text-warning-foreground"><CircleAlert className="mt-0.5 size-4 shrink-0" /><p>Hoàn thiện các mục dưới đây để tăng cơ hội được nhà tuyển dụng chú ý và liên hệ.</p></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><ProfileAction section="experience" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-info/35 text-xs font-medium text-info-foreground hover:bg-info-soft"><BriefcaseBusiness className="size-4" />Thêm kinh nghiệm làm việc</ProfileAction><ProfileAction section="education" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-info/35 text-xs font-medium text-info-foreground hover:bg-info-soft"><GraduationCap className="size-4" />Thêm thông tin học vấn</ProfileAction></div></section>
                <SectionCard section="introduction" title="Giới thiệu bản thân" description="Thêm giới thiệu để nhà tuyển dụng nhanh chóng thấy được điểm mạnh của bạn." icon={<UserRound />}><ProfileAction section="introduction" className="inline-flex min-h-9 items-center gap-1.5 text-xs text-primary hover:underline"><Sparkles className="size-3.5" />Gợi ý viết giới thiệu</ProfileAction></SectionCard>
                <SectionCard section="experience" title="Kinh nghiệm làm việc" description="Hãy thêm kinh nghiệm làm việc để được nhà tuyển dụng ưu tiên liên hệ hơn." icon={<BriefcaseBusiness />} badge="Đề xuất"><div className="flex flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between"><span>{noExperience ? "Bạn đang bắt đầu hành trình nghề nghiệp." : "Bạn đã có kinh nghiệm làm việc chưa?"}</span><div className="grid grid-cols-2 gap-2 sm:w-64"><button type="button" aria-pressed={noExperience} onClick={() => setNoExperience(!noExperience)} className={`min-h-10 rounded-lg border ${noExperience ? "border-primary bg-secondary text-primary" : "border-border hover:text-primary"}`}>Chưa có</button><ProfileAction section="experience" className="flex min-h-10 items-center justify-center rounded-lg border border-border hover:border-primary hover:text-primary">Đã có</ProfileAction></div></div></SectionCard>
                <SectionCard section="education" title="Học vấn" description="Thêm học vấn ngay để không bỏ lỡ cơ hội với nhà tuyển dụng." icon={<GraduationCap />} badge="Đề xuất" initialDegree={educationDegree}><p className="mb-2 text-xs font-medium">Trình độ học vấn cao nhất của bạn là gì?</p><Select aria-label="Trình độ học vấn cao nhất" value={educationDegree || null} onValueChange={(value) => setEducationDegree(value ?? "")} options={EDUCATION_OPTIONS.map((label) => ({ value: label, label }))} placeholder="Chọn trình độ học vấn cao nhất" /></SectionCard>
                <SectionCard section="skills" title="Kỹ năng" description="Thêm các kỹ năng quan trọng để nổi bật hơn trong mắt nhà tuyển dụng." icon={<BadgeCheck />} />
                <SectionCard section="projects" title="Dự án/thành tựu" description="Chia sẻ các dự án hoặc thành tựu nổi bật để chứng minh năng lực thực tế của bạn." icon={<Rocket />} />
                <SectionCard section="certificates" title="Chứng chỉ/bằng cấp" description="Các chứng chỉ và bằng cấp giúp tăng độ tin cậy và tạo lợi thế cạnh tranh so với các ứng viên khác." icon={<BookOpen />} />
                <SectionCard section="languages" title="Ngoại ngữ" description="Thêm thông tin khả năng ngoại ngữ để tăng tỷ lệ cạnh tranh." icon={<Languages />} />
            </div>
            <FixedRecommendedJobs />
        </div>
    </div>;
}
