import { cvFileError, CV_DOCX_TYPE } from "@/lib/api/cv-schemas";

// DOCX is a ZIP package. Require the Word document and content-types directory entries.
function isDocx(bytes: Buffer) {
    if (bytes.readUInt32LE(0) !== 0x04034b50) return false;
    const names = new Set<string>();
    const signature = Buffer.from([0x50, 0x4b, 0x01, 0x02]);
    let offset = bytes.indexOf(signature);
    while (offset >= 0 && offset + 46 <= bytes.length) {
        const nameLength = bytes.readUInt16LE(offset + 28);
        const extraLength = bytes.readUInt16LE(offset + 30);
        const commentLength = bytes.readUInt16LE(offset + 32);
        const end = offset + 46 + nameLength;
        if (end > bytes.length) return false;
        names.add(bytes.toString("utf8", offset + 46, end));
        offset = bytes.indexOf(signature, end + extraLength + commentLength);
    }
    return names.has("[Content_Types].xml") && names.has("word/document.xml");
}

export async function readCvFile(request: Request): Promise<File | undefined> {
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File) || cvFileError(file)) return;
    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.length < 5) return;
    const pdf = file.name.toLowerCase().endsWith(".pdf");
    if (pdf ? bytes.toString("ascii", 0, 5) !== "%PDF-" : !isDocx(bytes)) return;
    return new File([bytes], file.name, { type: pdf ? "application/pdf" : CV_DOCX_TYPE });
}
