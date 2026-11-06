"use client";

import { useId, useRef, useState, type ComponentProps, type ReactNode } from "react";
import Link from "next/link";
import { FileText, FolderOpen, Info, MapPin, Send, UploadCloud, X } from "lucide-react";
import { Alert, Button, Checkbox, Modal, ModalContent, Select } from "@/components/ui";
import { useCvs, useCvActions, validateCvSelection, type CvPreviewDraft } from "@/features/cv";
import { useSession } from "@/features/auth";
import { ApiError } from "@/lib/api/errors";
import { cn, formatDate } from "@/lib/utils";
import type { Application } from "../types";
import { applicationPreviewSchema } from "../schemas/application-preview";

type Job = Pick<Application["job"], "title" | "location" | "status" | "hasApplied"> & { company: Pick<Application["job"]["company"], "name"> };
type CvOption = Pick<CvPreviewDraft, "id" | "title" | "person" | "updatedAt"> & { isDefault?: boolean };
type ApplicationDialogProps = {
    job: Job;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** UI-only adapter until the API supports a job's location list. */
    locations?: Job["location"][];
    cvs?: CvOption[];
    finalFocus?: ComponentProps<typeof ModalContent>["finalFocus"];
};

export function ApplicationButton({ job, children, className, variant = "primary" }: {
    job: Job; children?: ReactNode; className?: string;
    variant?: ComponentProps<typeof Button>["variant"];
}) {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    return <>
        <Button ref={triggerRef} variant={variant} className={className} disabled={job.status !== "open" || job.hasApplied} onClick={() => setOpen(true)}>
            {children ?? <><Send className="size-4" />{job.hasApplied ? "Đã ứng tuyển" : job.status !== "open" ? "Đã ngừng tuyển" : "Ứng tuyển"}</>}
        </Button>
        <ApplicationDialog job={job} open={open} onOpenChange={setOpen} finalFocus={triggerRef} />
    </>;
}

export function ApplicationDialog({ job, open, onOpenChange, locations = [job.location], cvs, finalFocus }: ApplicationDialogProps) {
    return <Modal open={open} onOpenChange={onOpenChange}>
        <ModalContent title="Ứng tuyển" description={job.title} finalFocus={finalFocus}
            className="flex max-h-[min(840px,calc(100dvh-4rem))] max-w-[680px] flex-col overflow-hidden p-0"
            headerClassName="shrink-0 border-b border-border/60 px-5 py-4 pr-14 sm:px-6"
            bodyClassName="ui-scrollbar-subtle mt-0 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
            {open && (cvs ? <ApplicationForm job={job} locations={locations} cvs={cvs} /> : <AccountApplicationForm job={job} locations={locations} />)}
        </ModalContent>
    </Modal>;
}

function AccountApplicationForm(props: { job: Job; locations: Job["location"][] }) {
    const { user, isPending } = useSession();
    if (isPending) return <p role="status" className="text-sm">Đang tải tài khoản…</p>;
    if (!user) return <p className="text-sm">Vui lòng <Link href="/login" className="text-primary underline">đăng nhập tài khoản ứng viên</Link> để chọn hoặc tải CV lên.</p>;
    if (user.role !== "candidate") return <p className="text-sm">Chỉ tài khoản ứng viên có thể chọn CV để ứng tuyển.</p>;
    return <AccountCvForm key={user.id} {...props} userId={user.id} />;
}

function AccountCvForm({ userId, ...props }: { userId: string; job: Job; locations: Job["location"][] }) {
    const query = useCvs(userId);
    const { upload } = useCvActions(userId);
    if (query.isPending) return <p role="status" className="text-sm">Đang tải danh sách CV…</p>;
    if (query.isError) return <Alert variant="error" title="Không tải được danh sách CV"><Button variant="outline" onClick={() => void query.refetch()}>Thử lại</Button></Alert>;
    const cvs = query.data.map(cv => ({ id: cv.id, title: cv.cvTitle || cv.fileName, person: cv.fileName, updatedAt: cv.createdAt, isDefault: cv.isDefault }));
    return <ApplicationForm {...props} cvs={cvs} onUpload={async file => (await upload.mutateAsync(file)).id} />;
}

function ApplicationForm({ job, locations, cvs, onUpload }: { job: Job; locations: Job["location"][]; cvs: CvOption[]; onUpload?: (file: File) => Promise<string> }) {
    const id = useId();
    const fileInput = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const noticeRef = useRef<HTMLDivElement>(null);
    // Unique labels avoid duplicate options without inventing API location IDs.
    const options = [...new Set(locations.map((item) => [item.address, item.ward, item.district, item.city].filter(Boolean).join(", ")))];
    const [selection, setSelectedCv] = useState("");
    const selectedCv = selection || cvs.find(cv => cv.isDefault)?.id || cvs[0]?.id || "upload";
    const uploadingRef = useRef(false);
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File>();
    const [fileError, setFileError] = useState("");
    const [dragging, setDragging] = useState(false);
    const [location, setLocation] = useState(options.length === 1 ? options[0] : "");
    const [coverLetter, setCoverLetter] = useState("");
    const [allowAi, setAllowAi] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [showErrors, setShowErrors] = useState(false);
    const [notice, setNotice] = useState(false);
    const [termsOpen, setTermsOpen] = useState(false);
    const parsed = applicationPreviewSchema.safeParse({ cv: selectedCv === "upload" ? (onUpload ? "" : file?.name ?? "") : cvs.some((cv) => cv.id === selectedCv) ? selectedCv : "", location: options.includes(location) ? location : "", coverLetter, allowAi, acceptedTerms });
    const errors = showErrors && !parsed.success ? parsed.error.flatten().fieldErrors : {};

    async function chooseFiles(files: File[]) {
        if (uploadingRef.current) return;
        setNotice(false);
        if (files.length !== 1) return setFileError("Vui lòng chọn một tệp CV mỗi lần.");
        const error = validateCvSelection(files[0]);
        if (error) return setFileError(error);
        setFileError("");
        setFile(files[0]);
        setSelectedCv("upload");
        if (!onUpload) return;
        uploadingRef.current = true;
        setUploading(true);
        try {
            const cvId = await onUpload(files[0]);
            setSelectedCv(cvId);
            setFile(undefined);
        } catch (error) {
            setFileError(error instanceof ApiError ? error.message : "Không thể tải CV. Vui lòng thử lại.");
        } finally {
            uploadingRef.current = false;
            setUploading(false);
        }
    }

    return <form ref={formRef} noValidate className="space-y-5" onChange={() => setNotice(false)} onSubmit={(event) => {
        event.preventDefault();
        if (uploadingRef.current) return;
        setShowErrors(true);
        if (!parsed.success) {
            requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]')?.focus());
            return;
        }
        setNotice(true);
        requestAnimationFrame(() => noticeRef.current?.scrollIntoView({ block: "nearest", behavior: "instant" }));
    }}>
        <p className="flex items-start gap-2 rounded-lg bg-info-soft px-3 py-2 text-[11px] leading-5 text-info-foreground"><Info className="mt-0.5 size-3.5 shrink-0" />{onUpload ? "CV tải lên sẽ được lưu vào tài khoản. Chức năng gửi hồ sơ ứng tuyển đang được phát triển." : "Bản xem trước giao diện. CV bên dưới là minh họa; chưa tải tệp hoặc gửi hồ sơ lên hệ thống."}</p>
        <fieldset disabled={uploading} aria-busy={uploading} aria-describedby={errors.cv ? `${id}-cv-error` : undefined} className="min-w-0 space-y-2.5">
            <legend className="mb-3 flex items-center gap-2 text-sm font-semibold"><FolderOpen className="size-4 text-primary" />Chọn CV để ứng tuyển</legend>
            {cvs.length === 0 && <p className="text-xs text-muted-foreground">Chưa có CV để chọn. Bạn có thể chọn tệp từ máy ở bên dưới.</p>}
            {cvs.map((cv) => <label key={cv.id} className={cn("flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors hover:border-primary/50", selectedCv === cv.id ? "border-primary/50 bg-secondary/20" : "border-border bg-card")}>
                <input type="radio" name={`${id}-cv`} value={cv.id} checked={selectedCv === cv.id} onChange={() => setSelectedCv(cv.id)} className="ui-choice shrink-0" />
                <span className="min-w-0"><span className="block break-all text-[13px] font-semibold">{cv.title}{cv.isDefault && <span className="ml-2 text-xs font-normal text-primary">Mặc định</span>}</span><span className="mt-1 block break-all text-[11px] text-muted-foreground">{onUpload ? `Tải lên ${formatDate(cv.updatedAt)}` : `${cv.person} · Cập nhật ${formatDate(cv.updatedAt)}`}</span></span>
                <FileText aria-hidden="true" className="ml-auto size-4 shrink-0 text-muted-foreground" />
            </label>)}
            <div data-cv-dropzone className={cn("relative rounded-xl border border-dashed px-4 py-4 transition-colors", dragging ? "border-primary bg-secondary" : selectedCv === "upload" && file ? "border-primary/50 bg-secondary/20" : "border-border bg-card")}
                onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
                onDragLeave={(event) => { if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setDragging(false); }}
                onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFiles(Array.from(event.dataTransfer.files)); }}>
                <label className="absolute top-3.5 left-3.5"><input type="radio" name={`${id}-cv`} aria-label="Chọn CV từ máy tính" data-invalid={!!errors.cv && selectedCv === "upload"} aria-describedby={errors.cv ? `${id}-cv-error` : undefined} checked={selectedCv === "upload"} onChange={() => setSelectedCv("upload")} className="ui-choice" /></label>
                <div className="flex flex-col items-center gap-2 px-3 text-center">
                    <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground"><UploadCloud className="size-5" /></span>
                    {file ? <><p className="max-w-full break-all text-xs font-semibold">{file.name}</p><p role="status" className="text-[11px] text-muted-foreground">{uploading ? "Đang tải CV lên…" : onUpload ? "Chưa tải lên thành công" : "Đã chọn trên máy · Chưa tải lên"}</p></> : <><p className="text-xs font-medium">Tải CV từ máy tính, chọn hoặc kéo thả</p><p className="text-[11px] text-muted-foreground">Hỗ trợ PDF, DOCX · Tối đa 5 MB</p></>}
                    <input ref={fileInput} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" aria-label="Tệp CV" className="sr-only" tabIndex={-1} onChange={(event) => { if (event.target.files?.length) chooseFiles(Array.from(event.target.files)); event.target.value = ""; }} />
                    <div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => fileInput.current?.click()}>{file ? "Đổi tệp CV" : "Chọn CV"}</Button>{file && <Button size="icon-sm" variant="ghost" aria-label="Bỏ tệp CV" onClick={() => { setFile(undefined); setFileError(""); setSelectedCv(cvs[0]?.id ?? "upload"); }}><X /></Button>}</div>
                </div>
                {fileError && <p role="alert" className="mt-3 text-xs text-destructive">{fileError}</p>}
                {fileError && file && onUpload && <Button type="button" variant="outline" size="sm" onClick={() => void chooseFiles([file])}>Thử lại tải CV</Button>}
            </div>
            {errors.cv && <p role="alert" id={`${id}-cv-error`} className="text-xs text-destructive">{errors.cv[0]}</p>}
        </fieldset>
        <div className="space-y-2">
            <p id={`${id}-location-label`} className="text-xs font-semibold">Địa điểm làm việc mong muốn <span className="text-destructive">*</span></p>
            {options.length === 1 ? <div aria-label="Địa điểm làm việc mặc định" className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 text-xs"><MapPin className="size-4 shrink-0 text-primary" /><span>{options[0]}</span><span className="ml-auto shrink-0 text-[10px] font-medium text-muted-foreground">Mặc định</span></div> : <Select aria-labelledby={`${id}-location-label`} aria-describedby={errors.location ? `${id}-location-error` : undefined} aria-invalid={!!errors.location} options={options.map((label) => ({ value: label, label }))} value={location || null} onValueChange={(value) => { setLocation(value ?? ""); setNotice(false); }} placeholder="Chọn địa điểm bạn muốn làm việc" className="text-xs" />}
            {options.length === 0 && <p className="text-xs text-muted-foreground">Tin tuyển dụng chưa cung cấp địa điểm làm việc.</p>}
            {errors.location && <p role="alert" id={`${id}-location-error`} className="text-xs text-destructive">{errors.location[0]}</p>}
        </div>
        <div className="space-y-2">
            <div className="flex items-center justify-between"><label htmlFor={`${id}-letter`} className="text-xs font-semibold">Thư giới thiệu</label><span className="text-[10px] text-muted-foreground">Không bắt buộc</span></div>
            <textarea id={`${id}-letter`} value={coverLetter} onChange={(event) => setCoverLetter(event.target.value)} maxLength={3000} rows={3} placeholder="Viết giới thiệu ngắn gọn về bản thân, mong muốn..." className="ui-input h-auto min-h-24 resize-y py-3 text-xs leading-6" />
            <p className="text-right text-[10px] text-muted-foreground">{coverLetter.length}/3.000 ký tự</p>
        </div>
        <div className="space-y-3">
            <Checkbox checked={allowAi} onChange={(event) => setAllowAi(event.target.checked)} className="text-xs leading-5 text-muted-foreground" label={<>Cho phép TalentAI sử dụng <span className="text-primary">công nghệ AI</span> để phân tích độ phù hợp CV của bạn.</>} />
            <Checkbox checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} aria-invalid={!!errors.acceptedTerms} aria-describedby={errors.acceptedTerms ? `${id}-terms-error` : undefined} className="text-xs leading-5 text-muted-foreground" label={<>Tôi đã đọc và đồng ý với <button type="button" className="text-primary underline underline-offset-2" onClick={() => setTermsOpen(true)}>Thỏa thuận sử dụng dữ liệu cá nhân</button> của Nhà tuyển dụng.</>} />
            {errors.acceptedTerms && <p role="alert" id={`${id}-terms-error`} className="text-xs text-destructive">{errors.acceptedTerms[0]}</p>}
        </div>
        {notice && <div ref={noticeRef}><Alert variant="info" title="Chưa gửi hồ sơ">{onUpload ? "CV đã lưu trong tài khoản. Hồ sơ ứng tuyển, thư giới thiệu và các lựa chọn chưa được gửi tới nhà tuyển dụng." : "Đây là bản xem trước giao diện. CV, địa điểm và các lựa chọn của bạn chưa được tải lên hoặc lưu vào tài khoản."}</Alert></div>}
        <div className="sticky -bottom-4 border-t border-border/50 bg-card pt-3 pb-1"><Button type="submit" disabled={uploading} className="w-full bg-linear-to-r from-brand-bright to-primary"><Send className="size-4" />Nộp hồ sơ ứng tuyển</Button></div>
        <Modal open={termsOpen} onOpenChange={setTermsOpen}><ModalContent title="Thỏa thuận sử dụng dữ liệu cá nhân" description={`Nhà tuyển dụng: ${job.company.name}`}><p className="text-sm leading-6 text-muted-foreground">Bản xem trước chưa có nội dung thỏa thuận do nhà tuyển dụng cung cấp. Việc chọn ô đồng ý ở đây chỉ minh họa giao diện, không ghi nhận sự chấp thuận hoặc gửi dữ liệu cá nhân.</p><Button className="mt-5" variant="outline" onClick={() => setTermsOpen(false)}>Đã hiểu</Button></ModalContent></Modal>
    </form>;
}
