import { z } from "zod";
import { applicationSubmitSchema, applicationSubmissionSchema } from "@/lib/api/application-submission-schemas";
import { hasValidCsrf, isTrustedOrigin } from "../auth/cookies";
import { readRequestIdentity } from "../auth/session";
import { apiError } from "../responses";
import { submitMockApplication } from "./mock-application-submission";

export async function handleApplicationSubmission(request: Request, baseUrl?: string): Promise<Response> {
    if (!isTrustedOrigin(request) || !hasValidCsrf(request)) return apiError(403, "CSRF_TOKEN_INVALID", "Phiên thao tác không hợp lệ.");
    try {
        const identity = await readRequestIdentity(request);
        if (!identity) return apiError(401, "UNAUTHENTICATED", "Vui lòng đăng nhập.");
        if (identity.user.role !== "candidate") return apiError(403, "FORBIDDEN", "Chức năng dành cho ứng viên.");
        const parsed = applicationSubmitSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return apiError(422, "VALIDATION_FAILED", "Kiểm tra tin tuyển dụng, CV và thư giới thiệu.");
        if (!baseUrl) return await submitMockApplication(identity.userId, parsed.data, request.headers.get("x-mock-scenario"));

        // A submission creates a record. Never retry POST automatically.
        const response = await fetch(`${baseUrl.replace(/\/$/, "")}/applications`, {
            method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${identity.access}` },
            body: JSON.stringify(parsed.data), cache: "no-store", redirect: "error", signal: AbortSignal.timeout(30000),
        });
        if (response.status === 401) return apiError(401, "SESSION_EXPIRED", "Phiên đăng nhập đã hết hạn.");
        if (response.status === 403) return apiError(403, "FORBIDDEN", "Bạn không có quyền nộp hồ sơ này.");
        if (!response.ok) {
            const body = z.object({ error: z.object({ code: z.string() }) }).safeParse(await response.json().catch(() => null));
            const code = body.success ? body.data.error.code : "";
            if (code === "ALREADY_APPLIED") return apiError(409, "ALREADY_APPLIED", "Bạn đã ứng tuyển vị trí này.");
            if (code === "JOB_CLOSED" || code === "JOB_NOT_OPEN") return apiError(409, code, "Tin không còn nhận hồ sơ.");
            if (code === "PROFILE_INCOMPLETE" || code === "CV_NOT_FOUND" || code === "JOB_NOT_FOUND") return apiError(422, code, "Kiểm tra hồ sơ cá nhân, CV và tin tuyển dụng.");
            if (response.status === 409) return apiError(409, "CONFLICT", "Không thể nộp hồ sơ. Vui lòng kiểm tra trạng thái ứng tuyển.");
            if ([400, 404, 422].includes(response.status)) return apiError(422, "VALIDATION_FAILED", "Tin tuyển dụng hoặc CV không hợp lệ.");
            return apiError(503, "SERVICE_UNAVAILABLE", "Không thể kết nối dịch vụ ứng tuyển.");
        }
        const body = z.object({ success: z.literal(true), data: applicationSubmissionSchema }).parse(await response.json());
        if (response.status !== 201 || body.data.jobId !== parsed.data.jobId || body.data.resumeId !== parsed.data.resumeId) throw new Error("Invalid submission response");
        return Response.json(body.data, { status: 201, headers: { "Cache-Control": "private, no-store" } });
    } catch { return apiError(503, "SERVICE_UNAVAILABLE", "Chưa xác nhận được kết quả nộp hồ sơ. Vui lòng kiểm tra trạng thái ứng tuyển trước khi thử lại."); }
}
