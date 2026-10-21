import type { components } from "@/lib/api/generated/schema";
import { searchMockJobs } from "./mock-jobs";
import { apiError } from "./responses";
import { handleMockAuth } from "./mock-auth";

export async function handleMockRequest(request: Request): Promise<Response> {
  const auth = await handleMockAuth(request);
  if (auth) return auth;
  const path = new URL(request.url).pathname;
  if (request.method !== "GET" || !["/api/bff/jobs", "/api/bff/health"].includes(path)) {
    return apiError(503, "SERVICE_UNAVAILABLE", "Endpoint chưa có mock. Xem docs/project-status.md.");
  }
  const scenario = request.headers.get("x-mock-scenario");
  await new Promise((resolve) => setTimeout(resolve, scenario === "slow" ? 1500 : 200));
  const errors = {
    error: [500, "INTERNAL_ERROR"], unauthorized: [401, "UNAUTHENTICATED"],
    forbidden: [403, "FORBIDDEN"], conflict: [409, "CONFLICT"], locked: [423, "ACCOUNT_LOCKED"],
  } as const;
  const error = scenario && Object.hasOwn(errors, scenario) ? errors[scenario as keyof typeof errors] : undefined;
  if (error) return apiError(error[0], error[1], "Không thể thực hiện yêu cầu. Vui lòng thử lại.");
  if (path === "/api/bff/health") {
    const body: components["schemas"]["HealthResponse"] = { status: "ok", version: "mock" };
    return Response.json(body, { headers: { "Cache-Control": "no-store" } });
  }
  return searchMockJobs(new URL(request.url).searchParams, scenario === "empty");
}
