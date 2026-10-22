"use client";

import { CandidatePageTitle } from "@/components/layout/candidate/candidate-page-title";

import "./cv-presentation.css";

import { useRef, useState } from "react";
import { ArrowRight, Check, FileUp, Palette, Plus, ScanText, Sparkles, WandSparkles } from "lucide-react";
import { Button, Modal, ModalContent, Pagination } from "@/components/ui";
import { EmptyState } from "@/components/shared/empty-state";
import { CV_TEMPLATES, INITIAL_CV_PREVIEWS, type CvDesign, type CvPreviewDraft } from "../presentation";
import { validateCvSelection, type CvPreviewValues } from "../schemas/cv-preview";
import { CvEditorModal } from "./cv-editor-modal";
import { CvPreviewCard } from "./cv-preview-card";
import { CvTemplateLibrary } from "./cv-template-library";
import { ResumePaper } from "./resume-paper";

type Editor = { cv: CvPreviewDraft; creating: boolean };
const PAGE_SIZE = 2;
const PREVIEW_LIMIT = 5;

export function CvManagementPage() {
    const [cvs, setCvs] = useState(INITIAL_CV_PREVIEWS);
    const [page, setPage] = useState(1);
    const [editor, setEditor] = useState<Editor>();
    const [preview, setPreview] = useState<CvPreviewDraft>();
    const [deleting, setDeleting] = useState<CvPreviewDraft>();
    const [notice, setNotice] = useState<{ title: string; description: string }>();
    const [status, setStatus] = useState("");
    const [fileName, setFileName] = useState("");
    const [fileError, setFileError] = useState("");
    const fileInput = useRef<HTMLInputElement>(null);
    const library = () => document.getElementById("cv-template-library")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
    const chooseTemplate = (design: CvDesign) => {
        if (cvs.length >= PREVIEW_LIMIT) return setNotice({ title: "Đã đạt giới hạn bản xem trước", description: "Bạn đang có 5 CV. Hãy xóa một bản xem trước để thử mẫu mới." });
        const template = CV_TEMPLATES.find((item) => item.id === design)!;
        setEditor({ creating: true, cv: { id: crypto.randomUUID(), title: `CV ${template.name.replace("Mẫu ", "")}`, person: "", position: "", introduction: "", design, searchable: false, updatedAt: new Date().toISOString() } });
    };
    const save = (values: CvPreviewValues) => {
        if (!editor) return;
        const updated = { ...editor.cv, ...values, updatedAt: new Date().toISOString() };
        setCvs((current) => editor.creating ? [...current, updated] : current.map((cv) => cv.id === updated.id ? updated : cv));
        if (editor.creating) setPage(Math.ceil((cvs.length + 1) / PAGE_SIZE));
        setStatus(editor.creating ? "Đã tạo CV trong bản xem trước." : "Đã cập nhật bản xem trước CV.");
        setEditor(undefined);
    };
    const selectFile = (file?: File) => {
        setFileName(""); setFileError("");
        if (!file) return;
        const error = validateCvSelection(file);
        if (error) return setFileError(error);
        setFileName(file.name);
    };
    const aiNotice = (title: string) => setNotice({ title, description: "Công cụ AI cho CV đang được phát triển. Bạn có thể chọn mẫu và chỉnh sửa bản xem trước CV ở bên dưới." });

    return <div className="candidate-page space-y-7">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div><CandidatePageTitle>Quản lý CV & Mẫu CV</CandidatePageTitle><p className="mt-1.5 text-xs leading-5 text-muted-foreground sm:text-sm">Tối ưu hồ sơ năng lực, thu hút nhà tuyển dụng hàng đầu với AI</p></div>
            <div aria-label="Thống kê CV minh họa" className="flex w-fit shrink-0 divide-x divide-border rounded-xl border border-border bg-card py-3 shadow-card"><div className="px-4 text-center"><p className="text-[10px] text-muted-foreground">Tổng CV</p><p className="mt-1 text-sm font-semibold">{cvs.length} / {PREVIEW_LIMIT}</p></div><div className="px-4 text-center"><p className="text-[10px] text-muted-foreground">Lượt xem hồ sơ</p><p className="mt-1 text-sm font-semibold text-primary">148</p></div><div className="px-4 text-center"><p className="text-[10px] text-muted-foreground">Cơ hội tìm việc</p><span className="mt-1 inline-block rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-primary">Đang mở</span></div></div>
        </header>

        <section aria-label="AI Resume Studio Toolkit" className="cv-toolkit flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/35 p-4 sm:p-5">
            <div className="flex items-center gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white"><Sparkles className="size-5" aria-hidden="true" /></span><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-bold">AI Resume Studio Toolkit</h2><span className="rounded bg-primary px-2 py-1 text-[9px] font-bold text-white">2026 PRO</span></div><p className="mt-1 text-xs leading-5 text-muted-foreground">Bộ công cụ nâng cấp chất lượng CV, hướng đến bố cục rõ ràng và chuyên nghiệp.</p></div></div>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto"><Button variant="outline" size="sm" className="max-sm:h-11" onClick={() => aiNotice("Chấm điểm ATS với AI")}><ScanText />Chấm điểm ATS với AI</Button><Button variant="outline" size="sm" className="max-sm:h-11" onClick={() => aiNotice("Tối ưu theo JD việc làm")}><WandSparkles />Tối ưu theo JD việc làm</Button></div>
        </section>

        <div className="grid gap-5 md:grid-cols-2">
            <section aria-labelledby="cv-upload-heading" className="flex flex-col rounded-2xl border-2 border-dashed border-primary/20 bg-card p-5 shadow-card">
                <div className="flex gap-4"><span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary"><FileUp className="size-5" aria-hidden="true" /></span><div><h2 id="cv-upload-heading" className="text-sm font-semibold">Tải lên CV có sẵn</h2><p className="mt-1.5 max-w-xs text-xs leading-5 text-muted-foreground">Chọn tệp CV của bạn để chuẩn bị tải lên và quản lý hồ sơ ứng tuyển.</p></div></div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2"><p className="text-[11px] text-muted-foreground">Hỗ trợ PDF, DOCX (tối đa 5MB)</p><button type="button" onClick={() => fileInput.current?.click()} className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-primary">Chọn tập tin <ArrowRight className="size-3.5" aria-hidden="true" /></button></div>
                <input ref={fileInput} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" aria-label="Chọn tệp CV" className="sr-only" onChange={(event) => { selectFile(event.target.files?.[0]); event.target.value = ""; }} />
                {fileError && <p role="alert" className="text-xs leading-5 text-destructive">{fileError}</p>}
                {fileName && <div role="status" className="space-y-1 text-xs leading-5"><p className="flex items-start gap-1.5 break-all text-success-foreground"><Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" />Đã chọn: {fileName}</p><p className="text-muted-foreground">Tệp chưa được tải lên. Kết nối lưu trữ CV đang được hoàn thiện.</p><button type="button" className="min-h-9 text-primary hover:underline" onClick={() => setFileName("")}>Bỏ chọn tệp</button></div>}
            </section>
            <section aria-labelledby="cv-create-heading" className="flex flex-col rounded-2xl border border-primary/25 bg-card p-5 shadow-card"><div className="flex gap-4"><span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white"><Palette className="size-5" aria-hidden="true" /></span><div><div className="flex flex-wrap items-center gap-2"><h2 id="cv-create-heading" className="text-sm font-semibold">Tạo CV mới từ mẫu</h2><span className="rounded-full bg-secondary px-2 py-1 text-[10px] font-semibold text-primary">6 mẫu nổi bật</span></div><p className="mt-1.5 max-w-xs text-xs leading-5 text-muted-foreground">Chọn mẫu CV được thiết kế chuyên nghiệp để bắt đầu hành trình của bạn.</p></div></div><div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2"><p className="text-[11px] text-muted-foreground">Đa dạng màu sắc, bố cục & phong cách</p><button type="button" onClick={library} className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-primary">Khám phá mẫu ngay <ArrowRight className="size-3.5" aria-hidden="true" /></button></div></section>
        </div>

        <section aria-labelledby="created-cv-heading" className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h2 id="created-cv-heading" className="text-base font-semibold">CV đã tạo trên TalentAI</h2><p className="mt-1 text-xs text-muted-foreground">Danh sách CV trực tuyến được tạo và tối ưu hóa</p></div><Button onClick={library} className="rounded-full"><Plus />Tạo CV</Button></div>
            {status && <p role="status" className="mb-4 rounded-lg bg-success-soft px-3 py-2 text-xs text-success-foreground">{status}</p>}
            {cvs.length > 0 ? <><div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">{cvs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((cv) => <CvPreviewCard key={cv.id} cv={cv} onEdit={() => setEditor({ cv, creating: false })} onPreview={() => setPreview(cv)} onDelete={() => setDeleting(cv)} onToggle={() => { setCvs((current) => current.map((item) => item.id === cv.id ? { ...item, searchable: !item.searchable } : item)); setStatus("Đã cập nhật quyền tìm kiếm trong bản xem trước. Thiết lập chưa áp dụng vào tài khoản."); }} onExport={() => setNotice({ title: "Tải CV dạng PDF", description: "Xuất PDF đang được phát triển. Bạn có thể dùng Xem trước để kiểm tra bố cục và nội dung CV hiện tại." })} />)}</div><Pagination className="mt-6" page={page} totalPages={Math.ceil(cvs.length / PAGE_SIZE)} onPageChange={setPage} /></> : <EmptyState title="Chưa có bản xem trước CV" description="Chọn một mẫu để tạo CV đầu tiên của bạn." action={<Button onClick={library}><Plus />Khám phá mẫu CV</Button>} />}
            <p className="mt-5 text-xs leading-5 text-muted-foreground">Dữ liệu minh họa thiết kế. Chỉnh sửa, quyền tìm kiếm và xóa chỉ áp dụng trong bản xem trước; tải lại trang sẽ khôi phục dữ liệu ban đầu.</p>
        </section>

        <CvTemplateLibrary onChoose={chooseTemplate} />

        {editor && <CvEditorModal key={editor.cv.id} values={editor.cv} creating={editor.creating} onClose={() => setEditor(undefined)} onSave={save} />}
        <Modal open={!!preview} onOpenChange={(open) => { if (!open) setPreview(undefined); }}><ModalContent forceBackdrop title="Xem trước CV" description="Nội dung minh họa từ bản xem trước hiện tại." className="max-w-3xl" footer={<Button variant="outline" onClick={() => setPreview(undefined)}>Đóng</Button>}>{preview && <div className="cv-paper-frame mx-auto max-w-xl overflow-hidden rounded-lg border border-border"><ResumePaper {...preview} /></div>}</ModalContent></Modal>
        <Modal open={!!deleting} onOpenChange={(open) => { if (!open) setDeleting(undefined); }}><ModalContent forceBackdrop title="Xóa bản xem trước CV?" description={`Bạn muốn xóa “${deleting?.title ?? ""}” khỏi bản xem trước này? CV trong tài khoản không bị ảnh hưởng.`} footer={<><Button variant="outline" onClick={() => setDeleting(undefined)}>Hủy</Button><Button variant="destructive" onClick={() => { const remaining = cvs.filter((cv) => cv.id !== deleting?.id); setCvs(remaining); setPage(Math.max(1, Math.min(page, Math.ceil(remaining.length / PAGE_SIZE)))); setDeleting(undefined); setStatus("Đã xóa CV khỏi bản xem trước."); }}>Xóa CV</Button></>} /></Modal>
        <Modal open={!!notice} onOpenChange={(open) => { if (!open) setNotice(undefined); }}><ModalContent forceBackdrop title={notice?.title ?? "Thông tin"} description={notice?.description} footer={<Button variant="outline" onClick={() => setNotice(undefined)}>Đã hiểu</Button>} /></Modal>
    </div>;
}
