import { z } from "zod";
import type { components } from "@/lib/api/generated/schema";
import { mockJobs } from "@/mocks/fixtures/jobs";
import { hasValidCsrf, isTrustedOrigin } from "../auth/cookies";
import { readRequestIdentity } from "../auth/session";
import { mockCvsRequest } from "./mock-cvs";
import { apiError } from "../responses";

type Preview = components["schemas"]["MatchingPreview"];
const requestSchema = z.object({ cvId: z.uuid(), jobId: z.uuid() }).strict();
const responseSchema = z.object({
  matchId: z.uuid(), cvId: z.uuid(), jobId: z.uuid(), jobVersion: z.number().int(),
  status: z.enum(["SCORED", "FAILED"]), score: z.number().min(0).max(100).optional(),
  semantic_score: z.number().min(0).max(100).optional(), skill_score: z.number().min(0).max(100).optional(),
  matched_skills: z.array(z.string()).optional(), missing_skills: z.array(z.string()).optional(),
  explanation: z.string().optional(),
  field_scores: z.record(z.string(), z.object({
    score: z.number().nonnegative(), reason: z.string(), status: z.string(),
    evidence: z.string(), requirement: z.string(), model: z.string().optional(),
  })).optional(),
  errorCode: z.literal("AI_UNAVAILABLE").optional(),
}).superRefine((value, context) => {
  if (value.status === "SCORED" && [value.score, value.semantic_score, value.skill_score].some(score => score === undefined))
    context.addIssue({ code: "custom", message: "Missing score" });
  if (value.status === "FAILED" && value.errorCode !== "AI_UNAVAILABLE")
    context.addIssue({ code: "custom", message: "Missing error code" });
});

export async function handleMatchingPreview(request: Request, baseUrl?: string): Promise<Response> {
  if (request.method !== "POST") return apiError(405, "BAD_REQUEST", "Phương thức không được hỗ trợ.");
  if (!isTrustedOrigin(request) || !hasValidCsrf(request)) return apiError(403, "CSRF_TOKEN_INVALID", "Phiên thao tác không hợp lệ.");
  try {
    const identity = await readRequestIdentity(request);
    if (!identity) return apiError(401, "UNAUTHENTICATED", "Vui lòng đăng nhập.");
    if (identity.user.role !== "candidate") return apiError(403, "FORBIDDEN", "Chỉ ứng viên được chấm CV.");
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) return apiError(422, "VALIDATION_FAILED", "Vui lòng chọn CV và tin tuyển dụng hợp lệ.");
    const { cvId, jobId } = parsed.data;

    if (!baseUrl) {
      const cvsResponse = await mockCvsRequest(identity.userId, "GET");
      const cvs = await cvsResponse.json() as components["schemas"]["UploadedCv"][];
      if (!cvs.some(cv => cv.cvId === cvId || cv.id === cvId)) return apiError(403, "FORBIDDEN", "CV không thuộc tài khoản của bạn.");
      if (!mockJobs.some(job => job.id === jobId && job.status === "open")) return apiError(404, "NOT_FOUND", "Tin tuyển dụng không còn mở.");
      await new Promise(resolve => setTimeout(resolve, 400));
      const failed = request.headers.get("x-mock-scenario") === "error";
      const result: Preview = failed
        ? { matchId: "00000000-0000-4000-8000-000000000001", cvId, jobId, jobVersion: 1, status: "FAILED", errorCode: "AI_UNAVAILABLE" }
        : {
            matchId: "00000000-0000-4000-8000-000000000001", cvId, jobId, jobVersion: 1,
            status: "SCORED", score: 75, semantic_score: 70, skill_score: 80,
            matched_skills: ["TypeScript"], missing_skills: ["React"],
            explanation: "CV phù hợp một phần với vị trí được chọn.",
            field_scores: {
              roles: { score: 15, reason: "Vai trò trong CV gần với vị trí tuyển dụng.", status: "partial", evidence: "", requirement: "" },
              education: { score: 10, reason: "Đáp ứng yêu cầu học vấn.", status: "met", evidence: "", requirement: "" },
              languages: { score: 5, reason: "JD không nêu yêu cầu ngoại ngữ.", status: "not_required", evidence: "", requirement: "" },
              locations: { score: 5, reason: "Địa điểm phù hợp.", status: "met", evidence: "", requirement: "" },
              experience: { score: 15, reason: "Kinh nghiệm đáp ứng một phần.", status: "partial", evidence: "", requirement: "" },
              skills: { score: 25, reason: "Có kỹ năng phù hợp và kỹ năng cần bổ sung.", status: "partial", evidence: "TypeScript", requirement: "TypeScript; React" },
            },
          };
      return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
    }

    const target = `${baseUrl.replace(/\/$/, "")}/matching/previews`;
    console.info("[matching-preview] BE request", {
      url: target, method: "POST", body: parsed.data,
      headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: "Bearer <redacted>" },
    });
    const upstream = await fetch(target, {
      method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${identity.access}` },
      body: JSON.stringify(parsed.data), cache: "no-store", redirect: "error", signal: AbortSignal.timeout(90000),
    });
    const upstreamBody: unknown = await upstream.clone().json().catch(() => null);
    console.info("[matching-preview] BE response", {
      status: upstream.status,
      body: upstreamBody,
    });
    if (!upstream.ok) {
      if (upstream.status === 401) return apiError(401, "SESSION_EXPIRED", "Phiên đăng nhập với dịch vụ Matching đã hết hạn.");
      if (upstream.status === 403) return apiError(403, "FORBIDDEN", "Dịch vụ Matching từ chối quyền truy cập CV hoặc tin tuyển dụng đã chọn.");
      if (upstream.status === 422) return apiError(422, "VALIDATION_FAILED", "Dịch vụ Matching không chấp nhận CV hoặc tin tuyển dụng đã chọn.");
      return apiError(503, "SERVICE_UNAVAILABLE", "Dịch vụ Matching chưa sẵn sàng.");
    }
    const result = responseSchema.parse(await upstream.json()) satisfies Preview;
    // Matching resolves a root CV ID to the scored version's ID in its response.
    if (result.jobId !== jobId) throw new Error("Mismatched job in matching response");
    return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[matching-preview] BFF error", error);
    return apiError(503, "SERVICE_UNAVAILABLE", "Không thể chấm CV. Vui lòng thử lại.");
  }
}
