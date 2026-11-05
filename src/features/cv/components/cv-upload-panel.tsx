"use client";

import { useRef, useState, type DragEvent } from "react";
import { CheckCircle2, FileUp, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { ApiError } from "@/lib/api/errors";
import { CV_FILE_ACCEPT, cvFileError } from "@/lib/api/cv-schemas";
import { useCvActions } from "../hooks/use-cvs";

export function CvUploadPanel({ userId }: { userId: string }) {
    const input = useRef<HTMLInputElement>(null);
    const inFlight = useRef(false);
    const dragDepth = useRef(0);
    const [dragging, setDragging] = useState(false);
    const [file, setFile] = useState<File>();
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const { upload } = useCvActions(userId);

    async function uploadFile(selected: File) {
        if (inFlight.current) return;
        const validationError = cvFileError(selected);
        setError(validationError ?? "");
        setNotice("");
        setFile(validationError ? undefined : selected);
        if (validationError) return;

        inFlight.current = true;
        try {
            await upload.mutateAsync(selected);
            setFile(undefined);
            setNotice("Đã tải CV lên tài khoản.");
        } catch (error) {
            setError(error instanceof ApiError ? error.message : "Không thể tải CV. Vui lòng thử lại.");
        } finally {
            inFlight.current = false;
        }
    }

    function dropFile(event: DragEvent<HTMLElement>) {
        event.preventDefault();
        dragDepth.current = 0;
        setDragging(false);
        if (inFlight.current) return;
        if (event.dataTransfer.files.length > 1) {
            setError("Vui lòng tải lên một CV mỗi lần.");
            setNotice("");
            return;
        }
        const selected = event.dataTransfer.files[0];
        if (selected) void uploadFile(selected);
    }

    return <section
        aria-labelledby="cv-upload-heading"
        aria-busy={upload.isPending}
        className={`relative flex flex-col rounded-2xl border-2 border-dashed p-5 shadow-card transition-colors ${dragging ? "border-primary bg-secondary ring-4 ring-primary/10" : "border-primary/20 bg-card hover:border-primary/50 hover:bg-secondary/20"}`}
        onDragEnter={event => {
            event.preventDefault();
            if (!event.dataTransfer.types.includes("Files") || inFlight.current) return;
            dragDepth.current++;
            setDragging(true);
        }}
        onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = inFlight.current ? "none" : "copy"; }}
        onDragLeave={event => {
            event.preventDefault();
            dragDepth.current = Math.max(0, dragDepth.current - 1);
            if (!dragDepth.current) setDragging(false);
        }}
        onDrop={dropFile}
    >
        <button type="button" aria-label="Chọn hoặc kéo thả CV để tải lên" disabled={upload.isPending} onClick={() => input.current?.click()} className="absolute inset-0 rounded-2xl disabled:cursor-wait" />
        <input ref={input} type="file" accept={CV_FILE_ACCEPT} aria-label="Chọn tệp CV" tabIndex={-1} className="sr-only" disabled={upload.isPending} onChange={event => {
            const selected = event.target.files?.[0];
            event.target.value = "";
            if (selected) void uploadFile(selected);
        }} />

        <div className="pointer-events-none flex gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                {upload.isPending ? <LoaderCircle className="size-5 motion-safe:animate-spin" aria-hidden="true" /> : <FileUp className="size-5" aria-hidden="true" />}
            </span>
            <div>
                <h2 id="cv-upload-heading" className="text-sm font-semibold">Tải lên CV có sẵn</h2>
                <p className="mt-1.5 max-w-xs text-xs leading-5 text-muted-foreground">{dragging ? "Thả file vào đây để tải lên" : "Nhấn vào khung hoặc kéo thả file CV để tải lên ngay."}</p>
            </div>
        </div>
        <div className="pointer-events-none mt-4 border-t border-border/60 pt-4 text-xs text-muted-foreground">PDF, DOCX · Tối đa 5MB</div>

        {upload.isPending && <div className="pointer-events-none mt-4 space-y-2">
            <p className="break-all text-xs text-primary">{file?.name}</p>
            <div role="progressbar" aria-label="Tiến trình tải CV" aria-valuetext="Đang tải CV lên" className="h-1.5 overflow-hidden rounded-full bg-secondary">
                <span className="block h-full w-1/3 rounded-full bg-primary motion-safe:animate-[cv-upload-progress_1.2s_ease-in-out_infinite]" />
            </div>
        </div>}
        {error && <div className="mt-3">
            <p role="alert" className="pointer-events-none text-xs leading-5 text-destructive">{error}</p>
            {file && !upload.isPending && <div className="relative mt-2 flex flex-wrap items-center gap-2">
                <p className="min-w-0 break-all text-xs text-muted-foreground">{file.name}</p>
                <Button variant="outline" onClick={() => void uploadFile(file)}>Thử lại</Button>
            </div>}
        </div>}
        <p role="status" className="pointer-events-none mt-3 flex items-center gap-1.5 text-xs text-success-foreground">
            {upload.isPending ? "Đang tải CV lên…" : notice && <><CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />{notice}</>}
        </p>
    </section>;
}
