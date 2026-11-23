"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, ChevronDown, Code2, FileText, Info, Sparkles, UploadCloud, X } from "lucide-react";
import { Input, Modal, ModalContent, Pagination } from "@/components/ui";
import { JobCard, useJobs, type Job } from "@/features/jobs";
import type { components } from "@/lib/api/generated/schema";
import { previewCandidateMatching } from "../services/candidate-matching";
import { CandidateMatchingResult } from "./candidate-matching-result";
import { ApiError } from "@/lib/api/errors";
import { CandidatePageTitle } from "@/components/layout/candidate/candidate-page-title";
import { useCvs } from "@/features/cv";
import "./candidate-matching-page.css";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // TODO: Replace with the upload contract limit when available.

export function CandidateMatchingPageContent({ userId }: { userId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cvs = useCvs(userId);
  const [selectedCvId, setSelectedCvId] = useState<string | null>("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [jobPickerOpen, setJobPickerOpen] = useState(false);
  const [jobSearch, setJobSearch] = useState("");
  const [jobPage, setJobPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [preview, setPreview] = useState<components["schemas"]["MatchingPreview"] | null>(null);
  const [previewPending, setPreviewPending] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const jobs = useJobs({ q: jobSearch.trim() || undefined, pageSize: 8, page: jobPage }, undefined, jobPickerOpen);
  const selectedCv = selectedCvId === null ? undefined : cvs.data?.find((cv) => cv.id === selectedCvId)
    ?? (selectedCvId === "" ? cvs.data?.find((cv) => cv.isDefault) ?? cvs.data?.[0] : undefined);

  function selectFile(nextFile?: File) {
    if (!nextFile) return;
    const extension = nextFile.name.split(".").pop()?.toLowerCase();
    if (extension !== "pdf" && extension !== "docx") {
      setError("Chỉ hỗ trợ tệp PDF hoặc DOCX. Vui lòng chọn tệp khác.");
      return;
    }
    if (nextFile.size > MAX_FILE_SIZE) {
      setError("Tệp vượt quá 5 MB. Vui lòng chọn tệp nhỏ hơn.");
      return;
    }
    setFile(nextFile);
    setPreview(null);
    setHasStarted(false);
    setSelectedCvId(null);
    setError("");
  }

  async function analyze() {
    if (!selectedCv || !selectedJob || file) return;
    setHasStarted(true);
    setPreviewPending(true);
    setPreviewError("");
    setPreview(null);
    try {
      const result = await previewCandidateMatching(selectedCv.id, selectedJob.id);
      if (result.status === "FAILED") setPreviewError("AI hiện chưa thể chấm CV. Vui lòng thử lại.");
      else setPreview(result);
    } catch (cause) {
      setPreviewError(cause instanceof ApiError && cause.status === 403
        ? cause.code === "CSRF_TOKEN_INVALID" ? "Phiên thao tác không hợp lệ. Tải lại trang rồi thử lại." : "Dịch vụ Matching từ chối CV hoặc tin tuyển dụng. Kiểm tra CV thuộc tài khoản đang đăng nhập."
        : "Không thể chấm CV. Vui lòng thử lại.");
    } finally {
      setPreviewPending(false);
    }
  }

  return <main className="candidate-page pb-12">
    <header className="matching-hero relative isolate -mx-4 -mt-4 overflow-hidden px-5 pb-5 pt-9 sm:-mx-6 sm:-mt-6 sm:px-8 lg:-mx-8 lg:-mt-8">
      <div aria-hidden="true" className="matching-hero-orb pointer-events-none absolute -right-12 -top-24 size-72 rounded-full" />
      <div aria-hidden="true" className="matching-hero-glow pointer-events-none absolute bottom-0 right-36 h-28 w-72 rounded-full" />
      <Sparkles aria-hidden="true" className="matching-twinkle absolute right-5 top-5 size-5 text-brand-bright sm:right-8" />
      <div className="relative z-10 max-w-[68%] sm:max-w-[62%]"><span className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary"><Sparkles className="size-4" /> KHÔNG GIAN AI</span><CandidatePageTitle className="text-2xl text-brand-deep sm:text-3xl">AI Matching CV</CandidatePageTitle><p className="mt-2 text-xs leading-5 text-muted-foreground sm:text-sm">Phân tích mức độ phù hợp giữa CV của bạn và vị trí công việc bằng AI.</p></div>
      <div aria-hidden="true" className="matching-document absolute right-18 top-5 hidden h-24 w-20 rotate-6 rounded-xl border border-primary/10 bg-card/90 p-3 shadow-float sm:block"><span className="text-sm font-bold text-brand-bright">CV</span><span className="mt-2 block h-1.5 w-11 rounded-full bg-secondary-hover" /><span className="mt-1.5 block h-1.5 w-9 rounded-full bg-secondary-hover" /><span className="mt-1.5 block h-1.5 w-12 rounded-full bg-secondary-hover" /></div>
      <div className="matching-character absolute -bottom-16 -right-5 h-50 w-46 sm:-bottom-25 sm:right-2 sm:h-72 sm:w-64"><Image src="/images/image 16.png" alt="Nhân vật TalentAI cầm CV" fill priority sizes="(max-width: 640px) 184px, 256px" className="object-contain object-bottom drop-shadow-xl" /></div>
    </header>

    <div className={`matching-layout mt-4 ${hasStarted ? "matching-layout--active" : ""}`}>
      <section aria-labelledby="matching-setup-title" className="matching-setup rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
        <h2 id="matching-setup-title" className="sr-only">Thiết lập đối sánh</h2>
        <div className="flex items-center gap-2"><span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">1</span><h3 className="font-semibold">Chọn CV của bạn</h3></div>
        <div className="mt-3 space-y-2" aria-label="CV đã tải lên">
          {cvs.isPending ? <p role="status" className="rounded-xl bg-secondary/40 p-3 text-xs text-muted-foreground">Đang tải danh sách CV…</p>
            : cvs.isError ? <div className="rounded-xl border border-destructive/20 p-3 text-xs"><p className="text-destructive">Không tải được danh sách CV.</p><button type="button" onClick={() => void cvs.refetch()} className="mt-2 min-h-10 font-semibold text-primary hover:underline">Thử lại</button></div>
              : cvs.data?.length ? cvs.data.map((cv) => <label key={cv.id} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${selectedCv?.id === cv.id && !file ? "border-primary bg-secondary/30" : "border-border hover:border-primary/40"}`}>
                <input type="radio" name="matching-cv-source" checked={selectedCv?.id === cv.id && !file} onChange={() => { setSelectedCvId(cv.id); setFile(null); setPreview(null); setHasStarted(false); setError(""); }} className="accent-primary" />
                <FileText className="size-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-xs font-medium" title={cv.fileName}>{cv.cvTitle || cv.fileName}</span>
                {cv.isDefault && <span className="shrink-0 text-[11px] text-primary">Mặc định</span>}
              </label>) : <p className="rounded-xl bg-secondary/30 p-3 text-xs text-muted-foreground">Bạn chưa tải CV nào lên tài khoản.</p>}
        </div>
        <input ref={inputRef} id="matching-cv" aria-label="Chọn tệp CV" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" onChange={(event) => selectFile(event.target.files?.[0])} />
        <div onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files[0]); }} className={`mt-3 rounded-xl border border-dashed p-3 transition-colors ${dragging ? "border-primary bg-secondary" : "border-primary/30 bg-secondary/20"}`}>
          {file ? <div className="flex items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive-soft text-destructive"><FileText className="size-5" /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold" title={file.name}>{file.name}</p><p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p></div><button type="button" aria-label="Bỏ CV đã chọn" onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = ""; }} className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"><X className="size-4" /></button></div> : <button type="button" onClick={() => inputRef.current?.click()} className="flex min-h-16 w-full items-center gap-3 text-left"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary"><UploadCloud className="size-5" /></span><span><strong className="block text-xs">Chọn hoặc kéo thả CV</strong><small className="text-xs text-muted-foreground">PDF, DOCX · Tối đa 5 MB</small></span></button>}
        </div>
        {file && <button type="button" onClick={() => inputRef.current?.click()} className="mt-2 min-h-9 text-xs font-medium text-primary hover:underline">Chọn CV khác</button>}
        {error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}

        <div className="my-6 h-px bg-border" />
        <div className="flex items-center gap-2"><span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">2</span><h3 className="font-semibold">Chọn vị trí công việc</h3></div>
        <button type="button" onClick={() => setJobPickerOpen(true)} className="mt-3 flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary"><Code2 className="size-5" /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{selectedJob?.title ?? "Vị trí bạn quan tâm"}</span><span className="block truncate text-xs text-muted-foreground">{selectedJob?.company.name ?? "Chọn từ danh sách việc làm"}</span></span><ChevronDown className="size-4 text-muted-foreground" /></button>
        <Link href="/jobs" className="mt-2 inline-flex min-h-9 items-center gap-1 text-xs font-medium text-primary hover:underline">Xem việc làm đang tuyển <ArrowRight className="size-3.5" /></Link>
        <button type="button" onClick={() => void analyze()} disabled={!selectedCv || !selectedJob || !!file || previewPending} className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 font-semibold text-white disabled:opacity-60"><Sparkles className="size-4" /> {previewPending ? "Đang chấm CV…" : "Phân tích mức độ phù hợp"}</button>
        <p className="mt-2 text-center text-xs leading-5 text-muted-foreground"><Info className="mr-1 inline size-3.5" /> Chọn CV đã lưu và một tin tuyển dụng để chấm.</p>
      </section>

      {hasStarted && <section aria-labelledby="matching-result-title" className="matching-result min-w-0 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
          <h2 id="matching-result-title" className="text-base font-bold sm:text-lg">Kết quả AI Matching</h2>
          <p className="text-xs text-muted-foreground">Gợi ý từ AI · Chỉ để tham khảo</p>
        </div>
        {previewPending ? <div className="matching-loading py-8" role="status" aria-live="polite">
          <div className="matching-loading-orbit mx-auto flex size-20 items-center justify-center rounded-full bg-secondary text-primary"><Sparkles className="size-9" /></div>
          <h3 className="mt-5 text-center text-base font-semibold">Đang phân tích mức độ phù hợp</h3>
          <p className="mt-2 text-center text-sm text-muted-foreground">Đang đối chiếu CV với vị trí công việc. Quá trình này có thể mất khoảng một phút.</p>
          <div aria-hidden="true" className="mt-8 space-y-4">
            <div className="matching-loading-line h-4 w-2/3 rounded-full bg-secondary" />
            <div className="matching-loading-line h-3 w-full rounded-full bg-secondary" />
            <div className="matching-loading-line h-3 w-4/5 rounded-full bg-secondary" />
            <div className="grid grid-cols-2 gap-3 pt-3"><div className="matching-loading-line h-24 rounded-xl bg-secondary" /><div className="matching-loading-line h-24 rounded-xl bg-secondary" /></div>
          </div>
        </div> : preview ? <CandidateMatchingResult result={preview} jobTitle={selectedJob?.title ?? ""} /> : <div className="py-10 text-center" role="alert">
          <p className="text-sm text-destructive">{previewError || "Chưa có kết quả phân tích."}</p>
          <button type="button" onClick={() => void analyze()} className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white">Thử lại</button>
        </div>}
      </section>}
    </div>
    <div className="mt-5 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground"><BriefcaseBusiness className="size-5 shrink-0 text-primary" /><p>Muốn xem thêm cơ hội? <Link href="/jobs" className="font-semibold text-primary hover:underline">Khám phá việc làm đang tuyển</Link>.</p></div>
    <Modal open={jobPickerOpen} onOpenChange={setJobPickerOpen}>
      <ModalContent title="Chọn vị trí công việc" description="Chọn một tin đang tuyển để đối sánh với CV của bạn." className="max-w-5xl" bodyClassName="mt-4">
        <Input type="search" value={jobSearch} onChange={(event) => { setJobSearch(event.target.value); setJobPage(1); }} placeholder="Tìm vị trí hoặc công ty" aria-label="Tìm tin tuyển dụng" />
        <div className="mt-4 max-h-[min(65vh,650px)] overflow-y-auto pr-1" aria-live="polite">
          {jobs.isPending ? <p className="py-8 text-center text-sm text-muted-foreground">Đang tải tin tuyển dụng…</p>
            : jobs.isError ? <div className="py-8 text-center text-sm"><p>Không tải được tin tuyển dụng.</p><button type="button" onClick={() => void jobs.refetch()} className="mt-2 font-semibold text-primary hover:underline">Thử lại</button></div>
              : !jobs.data?.items.length ? <p className="py-8 text-center text-sm text-muted-foreground">Không tìm thấy tin đang tuyển phù hợp.</p>
                : <div className="grid gap-3 md:grid-cols-2">{jobs.data.items.map((job) => <JobCard key={job.id} job={job} onSelect={() => { setSelectedJob(job); setPreview(null); setHasStarted(false); setJobPickerOpen(false); }} className={selectedJob?.id === job.id ? "border-primary!" : ""} />)}</div>}
        </div>
        {jobs.data && jobs.data.meta.totalPages > 1 && <Pagination page={jobPage} totalPages={jobs.data.meta.totalPages} onPageChange={setJobPage} disabled={jobs.isFetching} className="mt-5" />}
      </ModalContent>
    </Modal>
  </main>;
}

