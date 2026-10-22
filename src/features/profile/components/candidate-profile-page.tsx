"use client";

import { useRef, useState, type ReactNode } from "react";
import { AtSign, BadgeCheck, BookOpen, BriefcaseBusiness, Camera, Check, CircleAlert, FileUp, GraduationCap, Languages, MapPin, Pencil, Plus, Rocket, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { Avatar, Badge, Button, Select } from "@/components/ui";
import type { AuthUser } from "@/features/auth";
import { FixedRecommendedJobs } from "./fixed-recommended-jobs";
import { ProfileAction } from "./profile-action";

function SectionCard({ title, description, icon, badge, children }: { title: string; description: string; icon: ReactNode; badge?: string; children?: ReactNode }) {
    return <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-card sm:p-6">
        <div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-start gap-3"><span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary [&_svg]:size-4.5">{icon}</span><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{title}</h2>{badge && <Badge variant="new">{badge}</Badge>}</div><p className="mt-1.5 text-xs leading-5 text-muted-foreground">{description}</p></div></div><ProfileAction label={title} title={`Thêm ${title.toLocaleLowerCase("vi")}`} className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-medium text-primary hover:bg-secondary"><Plus className="size-4" />Thêm</ProfileAction></div>
        {children && <div className="mt-5">{children}</div>}
    </section>;
}

export function CandidateProfilePage({ user }: { user: AuthUser }) {
    const input = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState<string>();
    const [fileError, setFileError] = useState<string>();
    const chooseCv = (file?: File) => {
        setFileName(undefined);
        setFileError(undefined);
        if (!file) return;
        const extension = file.name.split(".").pop()?.toLocaleLowerCase();
        if (!extension || !["doc", "docx", "pdf"].includes(extension)) return setFileError("Vui lòng chọn tệp PDF, DOC hoặc DOCX.");
        if (file.size > 5 * 1024 * 1024) return setFileError("Tệp CV không được vượt quá 5MB.");
        setFileName(file.name);
    };
    return <div className="mx-auto w-full max-w-[1180px]">
        <h1 className="mb-5 text-2xl font-bold tracking-tight">Hồ sơ của tôi</h1>
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-4">
                <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-card sm:p-6">
                    <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Thông tin cá nhân</h2><ProfileAction label="Thông tin cá nhân" title="Chỉnh sửa thông tin cá nhân" className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-primary"><Pencil className="size-4" /><span className="sr-only">Chỉnh sửa thông tin cá nhân</span></ProfileAction></div>
                    <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center"><div className="relative w-fit"><Avatar name={user.fullName} src={user.avatarUrl} className="size-20 text-xl ring-4 ring-secondary" /><button type="button" disabled title="Cập nhật ảnh: sắp ra mắt" aria-label="Cập nhật ảnh đại diện (sắp ra mắt)" className="absolute right-0 bottom-0 flex size-7 items-center justify-center rounded-full border-2 border-white bg-secondary text-primary"><Camera className="size-3.5" /></button></div><div className="min-w-0 flex-1"><h2 className="text-lg font-semibold capitalize">{user.fullName}</h2><div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><AtSign className="size-3.5" />{user.email}</span>{user.phone && <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-success" />{user.phone}</span>}<span className="inline-flex items-center gap-1.5 text-warning-foreground"><CircleAlert className="size-3.5" />Xác thực ngay</span></div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs"><ProfileAction label="Địa chỉ hiện tại" title="Thêm địa chỉ hiện tại" className="inline-flex items-center gap-1.5 text-primary hover:underline"><MapPin className="size-3.5" />Thêm địa chỉ hiện tại</ProfileAction><ProfileAction label="Ngày sinh" title="Thêm ngày sinh" className="inline-flex items-center gap-1.5 text-primary hover:underline"><Plus className="size-3.5" />Thêm ngày sinh</ProfileAction></div></div></div>
                </section>

                <section className="flex flex-col gap-4 rounded-2xl border border-info/35 bg-info-soft p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold">Tải ngay CV lên để AI điền nhanh hồ sơ</h2><Badge variant="hot">Mới</Badge></div><p className="mt-1 text-xs text-muted-foreground">Hỗ trợ định dạng: doc, docx, pdf; tối đa 5MB</p>{fileName && <p role="status" className="mt-2 flex items-center gap-1.5 text-xs font-medium text-success-foreground"><Check className="size-3.5" />Đã chọn {fileName}</p>}{fileError && <p role="alert" className="mt-2 flex items-center gap-1.5 text-xs font-medium text-destructive"><CircleAlert className="size-3.5" />{fileError}</p>}</div><input ref={input} type="file" accept=".doc,.docx,.pdf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" onChange={(event) => chooseCv(event.target.files?.[0])} /><Button className="shrink-0" onClick={() => input.current?.click()}><FileUp />Tải lên CV</Button></section>

                <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-card sm:p-6"><h2 className="font-semibold">Tổng quan hồ sơ</h2><div className="mt-4 flex gap-3 rounded-xl border border-warning/35 bg-warning-soft p-4 text-xs leading-5 text-warning-foreground"><CircleAlert className="mt-0.5 size-4 shrink-0" /><p>Hoàn thiện các mục dưới đây để tăng cơ hội được nhà tuyển dụng chú ý và liên hệ.</p></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><ProfileAction label="Kinh nghiệm làm việc" title="Thêm kinh nghiệm làm việc" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-info/35 text-xs font-medium text-info-foreground hover:bg-info-soft"><BriefcaseBusiness className="size-4" />Thêm kinh nghiệm làm việc</ProfileAction><ProfileAction label="Thông tin học vấn" title="Thêm thông tin học vấn" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-info/35 text-xs font-medium text-info-foreground hover:bg-info-soft"><GraduationCap className="size-4" />Thêm thông tin học vấn</ProfileAction></div></section>

                <SectionCard title="Giới thiệu bản thân" description="Thêm giới thiệu để nhà tuyển dụng nhanh chóng thấy được điểm mạnh của bạn." icon={<UserRound />}><button type="button" disabled className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Sparkles className="size-3.5 text-primary" />Trợ lý AI hỗ trợ viết nội dung</button></SectionCard>
                <SectionCard title="Kinh nghiệm làm việc" description="Hãy thêm kinh nghiệm làm việc để được nhà tuyển dụng ưu tiên liên hệ hơn." icon={<BriefcaseBusiness />} badge="Đề xuất"><div className="flex flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between"><span>Bạn đã có kinh nghiệm làm việc chưa?</span><div className="grid grid-cols-2 gap-2 sm:w-80"><button type="button" className="min-h-10 rounded-lg border border-border hover:border-primary hover:text-primary">Chưa có</button><button type="button" className="min-h-10 rounded-lg border border-border hover:border-primary hover:text-primary">Đã có</button></div></div></SectionCard>
                <SectionCard title="Học vấn" description="Thêm học vấn ngay để không bỏ lỡ cơ hội với nhà tuyển dụng." icon={<GraduationCap />} badge="Đề xuất"><p className="mb-2 text-xs font-medium">Trình độ học vấn cao nhất của bạn là gì?</p><Select aria-label="Trình độ học vấn cao nhất" options={[{ value: "high_school", label: "Trung học phổ thông" }, { value: "college", label: "Cao đẳng" }, { value: "bachelor", label: "Đại học" }, { value: "master", label: "Thạc sĩ" }]} placeholder="Chọn trình độ học vấn cao nhất" /></SectionCard>
                <SectionCard title="Kỹ năng" description="Thêm các kỹ năng quan trọng để nổi bật hơn trong mắt nhà tuyển dụng." icon={<BadgeCheck />} />
                <SectionCard title="Dự án/thành tựu" description="Chia sẻ các dự án hoặc thành tựu nổi bật để chứng minh năng lực thực tế của bạn." icon={<Rocket />} />
                <SectionCard title="Chứng chỉ/bằng cấp" description="Các chứng chỉ và bằng cấp giúp tăng độ tin cậy và tạo lợi thế cạnh tranh so với các ứng viên khác." icon={<BookOpen />} />
                <SectionCard title="Ngoại ngữ" description="Thêm thông tin khả năng ngoại ngữ để tăng tỷ lệ cạnh tranh." icon={<Languages />} />
            </div>
            <FixedRecommendedJobs />
        </div>
    </div>;
}
