"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

export function CvFilePreview({ blob, fileName }: { blob: Blob; fileName: string }) {
    const [url, setUrl] = useState("");
    useEffect(() => {
        const objectUrl = URL.createObjectURL(blob);
        const frame = requestAnimationFrame(() => setUrl(objectUrl));
        return () => { cancelAnimationFrame(frame); URL.revokeObjectURL(objectUrl); };
    }, [blob]);
    if (!url) return <p role="status">Đang hiển thị CV…</p>;
    return <div className="space-y-3">
        <a href={url} download={fileName} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-secondary px-4 text-sm font-medium text-primary hover:underline"><Download className="size-4" />Tải CV</a>
        {blob.type === "application/pdf" ? <iframe src={url} title={`Xem CV ${fileName}`} className="h-[60dvh] min-h-80 w-full rounded-lg border border-border bg-secondary/20" /> : <p className="text-xs text-muted-foreground">Tải tệp DOCX để xem bằng ứng dụng đọc tài liệu.</p>}
    </div>;
}
