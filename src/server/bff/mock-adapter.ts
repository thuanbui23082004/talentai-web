import type { components } from "@/lib/api/generated/schema";
import { searchMockJobs } from "./mock-jobs";
import { apiError } from "./responses";
import { handleMockAuth } from "./mock-auth";
import { createMockJobDetails } from "@/mocks/fixtures/job-details";
import { mockJobs } from "@/mocks/fixtures/jobs";

const mockJobDetails = createMockJobDetails(mockJobs);

export async function handleMockRequest(request: Request): Promise<Response> {
  const auth = await handleMockAuth(request);
  if (auth) return auth;
  const path = new URL(request.url).pathname;
  const detailId = path.match(/^\/api\/bff\/jobs\/([0-9a-f-]{36})$/i)?.[1];
  if (request.method !== "GET" || (!detailId && !["/api/bff/jobs", "/api/bff/health"].includes(path))) {
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
  if (detailId) {
    const job = scenario === "empty" ? undefined : mockJobDetails.find((item) => item.id === detailId && item.status === "open");
    return job ? Response.json(job, { headers: { "Cache-Control": "no-store" } }) : apiError(404, "NOT_FOUND", "Tin tuyển dụng không tồn tại hoặc đã ngừng hiển thị.");
  }
  if (path === "/api/bff/health") {
    const body: components["schemas"]["HealthResponse"] = { status: "ok", version: "mock" };
    return Response.json(body, { headers: { "Cache-Control": "no-store" } });
  }
  return searchMockJobs(new URL(request.url).searchParams, scenario === "empty");
}
