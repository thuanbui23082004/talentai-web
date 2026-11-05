import { z } from "zod";
import { uploadedCvSchema } from "@/lib/api/cv-schemas";
import { hasValidCsrf, isTrustedOrigin } from "../auth/cookies";
import { readRequestIdentity } from "../auth/session";
import { apiError } from "../responses";
import { readCvFile } from "./cv-file";
import { mockCvsRequest } from "./mock-cvs";

const route = /^\/api\/bff\/cvs(?:\/([^/]+))?(?:\/(default))?$/;
const envelope = z.object({ success: z.literal(true), data: z.unknown() });
const unavailable = () => apiError(503, "SERVICE_UNAVAILABLE", "Không thể kết nối dịch vụ CV. Vui lòng thử lại.");
export function isCvsRequest(request: Request) { return route.test(new URL(request.url).pathname); }

export async function handleCvsRequest(request: Request, baseUrl?: string): Promise<Response> {
    const match = route.exec(new URL(request.url).pathname);
    if (!match) return apiError(404, "NOT_FOUND", "Không tìm thấy chức năng CV.");
    const id = match[1];
    const isDefault = !!match[2];
    if (id && !/^[a-zA-Z0-9_-]{1,200}$/.test(id)) return apiError(404, "NOT_FOUND", "Không tìm thấy CV.");
    const methods = isDefault ? ["PATCH"] : id ? ["GET", "DELETE"] : ["GET", "POST"];
    if (!methods.includes(request.method)) return apiError(405, "BAD_REQUEST", "Thao tác CV này chưa được hỗ trợ.");
    if (request.method !== "GET" && (!isTrustedOrigin(request) || !hasValidCsrf(request))) return apiError(403, "CSRF_TOKEN_INVALID", "Phiên thao tác không hợp lệ.");
    try {
        const identity = await readRequestIdentity(request);
        if (!identity) return apiError(401, "UNAUTHENTICATED", "Vui lòng đăng nhập.");
        if (identity.user.role !== "candidate") return apiError(403, "FORBIDDEN", "Chức năng dành cho ứng viên.");
        const file = request.method === "POST" ? await readCvFile(request) : undefined;
        if (request.method === "POST" && !file) return Response.json({ error: { code: "VALIDATION_FAILED", message: "Tệp CV không hợp lệ.", fieldErrors: [{ field: "file", code: "VALIDATION_FAILED", message: "Chọn tệp PDF/DOCX hợp lệ, không trống và tối đa 5MB." }] } }, { status: 422, headers: { "Cache-Control": "private, no-store" } });
        if (!baseUrl) return await mockCvsRequest(identity.userId, request.method, id, isDefault, file, request.headers.get("x-mock-scenario"));
        const body = file ? new FormData() : undefined;
        if (file) body!.set("file", file);
        const target = `${baseUrl.replace(/\/$/, "")}/cvs${id ? `/${encodeURIComponent(id)}` : ""}${isDefault ? "/default" : ""}`;
        let response: Response | undefined;
        const attempts = request.method === "GET" ? 3 : 1;
        for (let attempt = 0; attempt < attempts; attempt++) {
            try {
                response = await fetch(target, { method: request.method, headers: { Accept: "application/json", Authorization: `Bearer ${identity.access}` }, body, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(file ? 30000 : 5000) });
                if (response.status < 500) break;
            } catch { response = undefined; }
            if (attempt < attempts - 1) await new Promise(resolve => setTimeout(resolve, 1000));
        }
        if (!response) return unavailable();
        if (response.status === 401) return apiError(401, "SESSION_EXPIRED", "Phiên đăng nhập đã hết hạn.");
        if (response.status === 403) return apiError(403, "FORBIDDEN", "Bạn không có quyền truy cập CV này.");
        if (response.status === 404) return apiError(404, "NOT_FOUND", "CV không tồn tại hoặc đã bị xóa.");
        if (response.status === 409) return apiError(409, "CV_IN_USE", "CV đang được sử dụng trong hồ sơ ứng tuyển.");
        if ([400, 413, 415, 422].includes(response.status)) return apiError(422, "VALIDATION_FAILED", "Tệp CV không hợp lệ. Chọn PDF/DOCX tối đa 5MB.");
        if (!response.ok) return unavailable();
        if (["DELETE", "PATCH"].includes(request.method)) return response.status === 204 ? new Response(null, { status: 204, headers: { "Cache-Control": "private, no-store" } }) : unavailable();
        const raw = envelope.parse(await response.json()).data;
        const data = request.method === "GET" && !id ? z.object({ items: uploadedCvSchema.array() }).parse(raw).items : uploadedCvSchema.parse(raw);
        return Response.json(data, { status: request.method === "POST" ? 201 : 200, headers: { "Cache-Control": "private, no-store" } });
    } catch { return unavailable(); }
}
