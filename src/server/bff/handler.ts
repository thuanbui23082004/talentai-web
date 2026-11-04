import { getServerEnv } from "@/lib/env";
import { handleMockRequest } from "./mock-adapter";
import { proxyRequest } from "./proxy";
import { apiError } from "./responses";
import { handleAuthRequest, isAuthRequest } from "./auth/handler";
import { handleCompanyService, isPublicCompanyRequest } from "./public/company-service";

export async function handleBffRequest(request: Request): Promise<Response> {
    try {
        if (isAuthRequest(request)) return await handleAuthRequest(request);
        const env = getServerEnv();
        if (isPublicCompanyRequest(request) && (env.COMPANY_DATA_MODE ?? env.DATA_MODE) === "real") {
            return await handleCompanyService(request, env.COMPANY_API_URL);
        }
        return env.DATA_MODE === "mock"
            ? await handleMockRequest(request)
            : await proxyRequest(request, env.BACKEND_API_URL!);
    } catch {
        return apiError(
            503,
            "SERVICE_UNAVAILABLE",
            "Dịch vụ chưa sẵn sàng. Vui lòng thử lại sau.",
        );
    }
}
