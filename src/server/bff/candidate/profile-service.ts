import { z } from "zod";
import { profileResourceSchemas, profileSkillsInputSchema, profileSkillsSchema } from "@/lib/api/profile-schemas";
import { hasValidCsrf, isTrustedOrigin } from "../auth/cookies";
import { readRequestIdentity } from "../auth/session";
import { apiError } from "../responses";
import { mockProfileRequest } from "./mock-profile";

const route = /^\/api\/bff\/candidate\/(experience|education|skills|certificates)(?:\/([^/]+))?$/;
const envelope = z.object({ success: z.literal(true), data: z.unknown() });
const backendError = z.object({ error: z.object({ fieldErrors: z.array(z.object({ field: z.string() })).optional() }) });
export function isProfileRequest(request: Request) { return route.test(new URL(request.url).pathname); }
const unavailable = () => apiError(503, "SERVICE_UNAVAILABLE", "Không thể kết nối dịch vụ hồ sơ. Vui lòng thử lại.");
function invalid(fields: string[]) {
    return Response.json({ error: { code: "VALIDATION_FAILED", message: "Vui lòng kiểm tra thông tin.", fieldErrors: fields.map(field => ({ field, code: "VALIDATION_FAILED", message: "Vui lòng kiểm tra thông tin này." })) } }, { status: 422, headers: { "Cache-Control": "private, no-store" } });
}

export async function handleProfileRequest(request: Request, baseUrl?: string): Promise<Response> {
    const match = route.exec(new URL(request.url).pathname);
    if (!match) return apiError(404, "NOT_FOUND", "Không tìm thấy chức năng hồ sơ.");
    const resource = match[1] as keyof typeof profileResourceSchemas | "skills";
    const id = match[2];
    if (id && !/^[a-zA-Z0-9_-]{1,200}$/.test(id)) return apiError(404, "NOT_FOUND", "Không tìm thấy mục hồ sơ.");
    let methods = ["GET", "POST"];
    if (id) methods = resource === "certificates" ? ["DELETE"] : ["PUT", "DELETE"];
    if (resource === "skills") methods = id ? [] : ["GET", "PUT"];
    if (!methods.includes(request.method)) return apiError(405, "BAD_REQUEST", "Thao tác này chưa được hỗ trợ.");
    if (request.method !== "GET" && (!isTrustedOrigin(request) || !hasValidCsrf(request))) return apiError(403, "CSRF_TOKEN_INVALID", "Phiên thao tác không hợp lệ.");
    try {
        const identity = await readRequestIdentity(request);
        if (!identity) return apiError(401, "UNAUTHENTICATED", "Vui lòng đăng nhập.");
        if (identity.user.role !== "candidate") return apiError(403, "FORBIDDEN", "Chức năng dành cho ứng viên.");
        const schemas = resource === "skills" ? undefined : profileResourceSchemas[resource];
        let input: unknown;
        if (["POST", "PUT"].includes(request.method)) {
            const result = (schemas?.input ?? profileSkillsInputSchema).safeParse(await request.json().catch(() => null));
            if (!result.success) return invalid(result.error.issues.map(issue => String(issue.path[0])));
            input = result.data;
        }
        if (!baseUrl) return await mockProfileRequest(identity.userId, resource, id, request.method, input, request.headers.get("x-mock-scenario"));

        const target = `${baseUrl.replace(/\/$/, "")}/candidate/${resource}${id ? `/${encodeURIComponent(id)}` : ""}`;
        let response: Response | undefined;
        const attempts = request.method === "GET" ? 3 : 1;
        for (let attempt = 0; attempt < attempts; attempt++) {
            try {
                response = await fetch(target, {
                    method: request.method, headers: { Accept: "application/json", Authorization: `Bearer ${identity.access}`, ...(input ? { "Content-Type": "application/json" } : {}) },
                    ...(input ? { body: JSON.stringify(input) } : {}), cache: "no-store", redirect: "error", signal: AbortSignal.timeout(5000),
                });
                if (response.status < 500) break;
            } catch { response = undefined; }
            if (attempt < attempts - 1) await new Promise(resolve => setTimeout(resolve, 1000));
        }
        if (!response) return unavailable();
        if (response.status === 401) return apiError(401, "SESSION_EXPIRED", "Phiên đăng nhập đã hết hạn.");
        if (response.status === 403) return apiError(403, "FORBIDDEN", "Bạn không có quyền cập nhật hồ sơ này.");
        if (response.status === 404) return apiError(404, "NOT_FOUND", "Mục hồ sơ không tồn tại hoặc đã bị xóa.");
        if ([400, 422].includes(response.status)) {
            const error = backendError.safeParse(await response.json().catch(() => null));
            return invalid(error.success ? (error.data.error.fieldErrors ?? []).map(issue => issue.field) : []);
        }
        if (!response.ok) return unavailable();
        if (request.method === "DELETE") return response.status === 204 ? new Response(null, { status: 204, headers: { "Cache-Control": "private, no-store" } }) : unavailable();
        const raw = envelope.parse(await response.json()).data;
        let data: unknown;
        if (!schemas) data = profileSkillsSchema.parse(raw);
        else if (request.method === "GET") data = z.object({ items: z.array(schemas.record) }).parse(raw).items;
        else data = schemas.record.parse(raw);
        return Response.json(data, { status: request.method === "POST" ? 201 : 200, headers: { "Cache-Control": "private, no-store" } });
    } catch { return unavailable(); }
}
