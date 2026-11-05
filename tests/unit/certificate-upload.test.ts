import { describe, expect, it } from "vitest";
import { certificateUploadSchema } from "@/features/profile/schemas/certificate-upload";

describe("certificate upload form", () => {
    const file = new File(["%PDF-1.7"], "certificate.pdf", { type: "application/pdf" });
    it("requires only a name and a supported file", () => {
        expect(certificateUploadSchema.parse({ name: " Certificate ", file })).toEqual({ name: "Certificate", file });
        expect(certificateUploadSchema.safeParse({ name: "", file }).success).toBe(false);
        expect(certificateUploadSchema.safeParse({ name: "Certificate" }).success).toBe(false);
    });
    it("rejects empty, oversized and unsupported files", () => {
        for (const file of [new File([], "empty.pdf", { type: "application/pdf" }), new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.pdf", { type: "application/pdf" }), new File(["html"], "certificate.html", { type: "text/html" }), new File(["pdf"], "certificate.exe", { type: "application/pdf" })]) {
            expect(certificateUploadSchema.safeParse({ name: "Certificate", file }).success).toBe(false);
        }
    });
});
