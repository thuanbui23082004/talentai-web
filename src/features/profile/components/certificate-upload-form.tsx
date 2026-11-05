"use client";

import { useState, type FormEvent } from "react";
import { FileCheck2, Upload } from "lucide-react";
import { Alert, Button, FormField, Input } from "@/components/ui";
import { ApiError } from "@/lib/api/errors";
import { CERTIFICATE_FILE_ACCEPT } from "@/lib/api/certificate-file";
import { certificateUploadSchema } from "../schemas/certificate-upload";
import { useProfileDraft } from "./profile-draft-provider";

export function CertificateUploadForm({ initial, onSaved, onCancel }: {
    initial?: { id: string; name: string }; onSaved: () => void; onCancel: () => void;
}) {
    const { createCertificate, uploadCertificate } = useProfileDraft();
    const [name, setName] = useState(initial?.name ?? "");
    const [certificateId, setCertificateId] = useState(initial?.id);
    const [file, setFile] = useState<File>();
    const [errors, setErrors] = useState<{ name?: string; file?: string }>({});
    const [error, setError] = useState("");
    const [progress, setProgress] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function submit(event: FormEvent) {
        event.preventDefault();
        const result = certificateUploadSchema.safeParse({ name, file });
        if (!result.success) {
            setErrors(Object.fromEntries(result.error.issues.map(issue => [issue.path[0], issue.path[0] === "file" && !file ? "Vui lòng chọn file chứng chỉ." : issue.message])));
            return;
        }
        setErrors({});
        setError("");
        setSubmitting(true);
        try {
            let id = certificateId;
            if (!id) {
                setProgress("Đang lưu tên chứng chỉ…");
                const certificate = await createCertificate(result.data.name);
                id = certificate.id;
                setCertificateId(id);
            }
            setProgress("Đang tải file chứng chỉ…");
            await uploadCertificate(id, result.data.file);
            onSaved();
        } catch (error) {
            setError(error instanceof ApiError ? error.message : "Không thể lưu chứng chỉ. Vui lòng thử lại.");
            if (error instanceof ApiError) for (const issue of error.fieldErrors ?? []) {
                if (issue.field === "name" || issue.field === "file") setErrors(previous => ({ ...previous, [issue.field]: issue.message }));
            }
        } finally {
            setSubmitting(false);
            setProgress("");
        }
    }

    return <form noValidate onSubmit={submit} className="flex min-h-0 flex-1 flex-col" aria-busy={submitting}>
        <fieldset disabled={submitting} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-8">
            <FormField label="Tên chứng chỉ" required error={errors.name}>{field => <Input {...field} value={name} onChange={event => setName(event.target.value)} disabled={!!certificateId} maxLength={200} placeholder="Ví dụ: IELTS, AWS Certified…" />}</FormField>
            <FormField label="File chứng chỉ" required error={errors.file}>{field => <div className="rounded-xl border border-dashed border-primary/30 bg-secondary/30 p-5">
                <Upload aria-hidden="true" className="mb-3 size-6 text-primary" />
                <Input {...field} type="file" accept={CERTIFICATE_FILE_ACCEPT} onChange={event => { setFile(event.target.files?.[0]); setErrors(previous => ({ ...previous, file: undefined })); }} className="peer sr-only" />
                <label htmlFor={field.id} className="inline-flex min-h-11 cursor-pointer items-center rounded-lg bg-secondary px-4 text-sm font-medium text-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-50">Chọn file chứng chỉ</label>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">PDF, JPG, PNG, WEBP hoặc GIF. Tối đa 5 MB.</p>
                {file && <p className="mt-3 flex items-center gap-2 text-xs text-primary"><FileCheck2 aria-hidden="true" className="size-4 shrink-0" /><span className="break-all">{file.name}</span></p>}
            </div>}</FormField>
            {certificateId && error && <p className="text-xs leading-5 text-muted-foreground">Tên chứng chỉ đã được lưu. Thử lại chỉ tải file, không tạo chứng chỉ mới. Bạn cũng có thể tải file sau từ danh sách chứng chỉ.</p>}
            {error && <Alert variant="error" title="Chưa thể lưu chứng chỉ">{error}</Alert>}
            <p role="status" className="text-xs text-muted-foreground">{progress}</p>
        </fieldset>
        <div className="flex shrink-0 justify-end gap-3 border-t border-border px-5 py-4 sm:px-8">
            <Button variant="ghost" disabled={submitting} onClick={onCancel}>Hủy</Button>
            <Button type="submit" loading={submitting}>{certificateId ? "Tải file chứng chỉ" : "Lưu chứng chỉ"}</Button>
        </div>
    </form>;
}
