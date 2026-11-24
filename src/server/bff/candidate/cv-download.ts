import { CV_MAX_SIZE, uploadedCvSchema } from "@/lib/api/cv-schemas";
import { getMockMedia } from "../recruiter/account-company-handler";
import { apiError } from "../responses";
import { mockCvsRequest } from "./mock-cvs";

export async function downloadCandidateCv(id: string, userId: string, access: string, baseUrl: string | undefined, disposition: "inline" | "attachment") {
    try {
        const metadataResponse = baseUrl
            ? await fetch(`${baseUrl.replace(/\/$/, "")}/cvs/${encodeURIComponent(id)}`, { headers: { Accept: "application/json", Authorization: `Bearer ${access}` }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10000) })
            : await mockCvsRequest(userId, "GET", id);
        if (metadataResponse.status === 401) return apiError(401, "SESSION_EXPIRED", "Phiên đăng nhập đã hết hạn.");
        if (metadataResponse.status === 403) return apiError(403, "FORBIDDEN", "Bạn không có quyền xem CV này.");
        if (metadataResponse.status === 404) return apiError(404, "NOT_FOUND", "Không tìm thấy CV.");
        if (!metadataResponse.ok) throw new Error("CV metadata unavailable");
        const raw = await metadataResponse.json();
        const cv = uploadedCvSchema.parse(baseUrl ? raw.data : raw);
        let bytes: Uint8Array;
        if (baseUrl) {
            const url = new URL(cv.fileUrl);
            if (url.protocol !== "https:" || !["res.cloudinary.com", "api.cloudinary.com"].includes(url.hostname) || url.port) throw new Error("Untrusted CV storage URL");
            const response = await fetch(url, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(30000) });
            if (!response.ok || Number(response.headers.get("content-length")) > CV_MAX_SIZE) throw new Error("CV file unavailable");
            bytes = new Uint8Array(await response.arrayBuffer());
        } else {
            const mediaId = cv.fileUrl.split("/").at(-1) ?? "";
            const media = getMockMedia().get(mediaId);
            if (!media || media.ownerId !== userId || media.ownerRole !== "candidate") return apiError(404, "NOT_FOUND", "Không tìm thấy CV.");
            bytes = media.bytes;
        }
        if (!bytes.length || bytes.length > CV_MAX_SIZE) throw new Error("Invalid CV size");
        const pdf = cv.contentType === "application/pdf";
        const prefix = new TextDecoder("latin1").decode(bytes.slice(0, 1024));
        if (pdf ? !/^[\t\n\f\r ]*%PDF-/.test(prefix) : bytes[0] !== 0x50 || bytes[1] !== 0x4b) return apiError(422, "CV_INVALID_FORMAT", "Tệp CV không hợp lệ.");
        const fileName = cv.fileName.replace(/[^A-Za-z0-9._-]/g, "_");
        return new Response(new Uint8Array(bytes), { headers: {
            "Content-Type": pdf ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "Content-Disposition": `${disposition}; filename="${fileName}"`,
            "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store",
        } });
    } catch { return apiError(503, "SERVICE_UNAVAILABLE", "Không thể tải tệp CV. Vui lòng thử lại."); }
}
