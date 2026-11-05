"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button, Modal, ModalContent, Pagination } from "@/components/ui";
import { CV_TEMPLATES, type CvDesign, type CvPreviewDraft } from "../presentation";
import { type CvPreviewValues } from "../schemas/cv-preview";
import { CvEditorModal } from "./cv-editor-modal";
import { CvPreviewCard } from "./cv-preview-card";
import { CvTemplateLibrary } from "./cv-template-library";
import { ResumePaper } from "./resume-paper";

type Editor = { cv: CvPreviewDraft; creating: boolean };
const PAGE_SIZE = 2;
const PREVIEW_LIMIT = 5;

export function CvTemplateStudio() {
    const [cvs, setCvs] = useState<CvPreviewDraft[]>([]);
    const [page, setPage] = useState(1);
    const [editor, setEditor] = useState<Editor>();
    const [preview, setPreview] = useState<CvPreviewDraft>();
    const [deleting, setDeleting] = useState<CvPreviewDraft>();
    const [notice, setNotice] = useState<{ title: string; description: string }>();
    const [status, setStatus] = useState("");
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
    return <div className="candidate-page space-y-7">
        {cvs.length > 0 && <section aria-labelledby="created-cv-heading" className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h2 id="created-cv-heading" className="text-base font-semibold">Bản nháp CV từ mẫu</h2><p className="mt-1 text-xs text-muted-foreground">Các bản thử chưa được lưu vào tài khoản.</p></div><Button onClick={library} className="rounded-full"><Plus />Tạo CV</Button></div>
            {status && <p role="status" className="mb-4 rounded-lg bg-success-soft px-3 py-2 text-xs text-success-foreground">{status}</p>}
            <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">{cvs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((cv) => <CvPreviewCard key={cv.id} cv={cv} onEdit={() => setEditor({ cv, creating: false })} onPreview={() => setPreview(cv)} onDelete={() => setDeleting(cv)} onToggle={() => { setCvs((current) => current.map((item) => item.id === cv.id ? { ...item, searchable: !item.searchable } : item)); setStatus("Đã cập nhật quyền tìm kiếm trong bản xem trước. Thiết lập chưa áp dụng vào tài khoản."); }} onExport={() => setNotice({ title: "Tải CV dạng PDF", description: "Xuất PDF đang được phát triển. Bạn có thể dùng Xem trước để kiểm tra bố cục và nội dung CV hiện tại." })} />)}</div><Pagination className="mt-6" page={page} totalPages={Math.ceil(cvs.length / PAGE_SIZE)} onPageChange={setPage} />
            <p className="mt-5 text-xs leading-5 text-muted-foreground">Dữ liệu minh họa thiết kế. Chỉnh sửa, quyền tìm kiếm và xóa chỉ áp dụng trong bản xem trước; tải lại trang sẽ khôi phục dữ liệu ban đầu.</p>
        </section>}

        <CvTemplateLibrary onChoose={chooseTemplate} />

        {editor && <CvEditorModal key={editor.cv.id} values={editor.cv} creating={editor.creating} onClose={() => setEditor(undefined)} onSave={save} />}
        <Modal open={!!preview} onOpenChange={(open) => { if (!open) setPreview(undefined); }}><ModalContent forceBackdrop title="Xem trước CV" description="Nội dung minh họa từ bản xem trước hiện tại." className="max-w-3xl" footer={<Button variant="outline" onClick={() => setPreview(undefined)}>Đóng</Button>}>{preview && <div className="cv-paper-frame mx-auto max-w-xl overflow-hidden rounded-lg border border-border"><ResumePaper {...preview} /></div>}</ModalContent></Modal>
        <Modal open={!!deleting} onOpenChange={(open) => { if (!open) setDeleting(undefined); }}><ModalContent forceBackdrop title="Xóa bản xem trước CV?" description={`Bạn muốn xóa “${deleting?.title ?? ""}” khỏi bản xem trước này? CV trong tài khoản không bị ảnh hưởng.`} footer={<><Button variant="outline" onClick={() => setDeleting(undefined)}>Hủy</Button><Button variant="destructive" onClick={() => { const remaining = cvs.filter((cv) => cv.id !== deleting?.id); setCvs(remaining); setPage(Math.max(1, Math.min(page, Math.ceil(remaining.length / PAGE_SIZE)))); setDeleting(undefined); setStatus("Đã xóa CV khỏi bản xem trước."); }}>Xóa CV</Button></>} /></Modal>
        <Modal open={!!notice} onOpenChange={(open) => { if (!open) setNotice(undefined); }}><ModalContent forceBackdrop title={notice?.title ?? "Thông tin"} description={notice?.description} footer={<Button variant="outline" onClick={() => setNotice(undefined)}>Đã hiểu</Button>} /></Modal>
    </div>;
}
