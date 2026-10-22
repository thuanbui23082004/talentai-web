"use client";

import { useRef, useState } from "react";
import { Check, FileUp } from "lucide-react";
import { Badge, Button } from "@/components/ui";

export function ProfileCvUpload() {
    const input = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState<string>();
    const [fileError, setFileError] = useState<string>();
    const chooseCv = (file?: File) => {
        setFileName(undefined); setFileError(undefined);
        if (!file) return;
        if (!/\.(doc|docx|pdf)$/i.test(file.name)) return setFileError("Vui lòng chọn tệp PDF, DOC hoặc DOCX.");
        if (file.size > 5 * 1024 * 1024) return setFileError("Tệp CV không được vượt quá 5MB.");
        setFileName(file.name);
    };
    return <section className="flex flex-col gap-4 rounded-2xl border border-info/35 bg-info-soft p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold">Tải ngay CV lên để AI điền nhanh hồ sơ</h2><Badge variant="hot">Mới</Badge></div><p className="mt-1 text-xs text-muted-foreground">Hỗ trợ định dạng: doc, docx, pdf; tối đa 5MB</p>{fileName && <p role="status" className="mt-2 flex items-center gap-1.5 text-xs font-medium text-success-foreground"><Check className="size-3.5" />Đã chọn {fileName}</p>}{fileError && <p role="alert" className="mt-2 text-xs text-destructive">{fileError}</p>}</div><input ref={input} type="file" aria-label="Tệp CV" accept=".doc,.docx,.pdf" className="sr-only" onChange={(event) => chooseCv(event.target.files?.[0])} /><Button className="shrink-0" onClick={() => input.current?.click()}><FileUp />Tải lên CV</Button></section>;
}
