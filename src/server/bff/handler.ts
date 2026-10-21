import { getServerEnv } from "@/lib/env";
import { handleMockRequest } from "./mock-adapter";
import { proxyRequest } from "./proxy";
import { apiError } from "./responses";

export async function handleBffRequest(request: Request): Promise<Response> {
  try {
    const env = getServerEnv();
    return env.DATA_MODE === "mock"
      ? await handleMockRequest(request)
      : await proxyRequest(request, env.BACKEND_API_URL!);
  } catch {
    return apiError(503, "SERVICE_UNAVAILABLE", "Dịch vụ chưa sẵn sàng. Vui lòng thử lại sau.");
  }
}
