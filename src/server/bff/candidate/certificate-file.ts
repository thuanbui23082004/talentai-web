import { certificateFileSchema } from "@/lib/api/certificate-file";

export async function readCertificateFile(request: Request): Promise<File | undefined> {
    const form = await request.formData().catch(() => null);
    const result = certificateFileSchema.safeParse(form?.get("file"));
    if (!result.success) return;
    const file = result.data;
    const bytes = Buffer.from(await file.slice(0, 16).arrayBuffer());
    const valid = file.type === "application/pdf" ? bytes.toString("ascii", 0, 5) === "%PDF-"
        : file.type === "image/png" ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : file.type === "image/jpeg" ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        : file.type === "image/webp" ? bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP"
        : file.type === "image/gif" && ["GIF87a", "GIF89a"].includes(bytes.toString("ascii", 0, 6));
    return valid ? file : undefined;
}
