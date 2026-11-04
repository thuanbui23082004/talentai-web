import { getServerEnv } from "@/lib/env";
import { handleMockRequest } from "./mock-adapter";
import { proxyRequest } from "./proxy";
import { apiError } from "./responses";
import { handleAuthRequest, isAuthRequest } from "./auth/handler";
import { handleCompanyService, isPublicCompanyRequest } from "./public/company-service";
import { handleRecruiterCompany, isRecruiterCompanyRequest } from "./recruiter/company-service";
import { handleJobService, isPublicJobRequest } from "./public/job-service";
import { handleSavedJobs, isSavedJobsRequest } from "./candidate/saved-jobs-service";

export async function handleBffRequest(request: Request): Promise<Response> {
    try {
        if (isAuthRequest(request)) return await handleAuthRequest(request);
        const env = getServerEnv();
        if (isSavedJobsRequest(request) && (env.JOB_DATA_MODE ?? env.DATA_MODE) === "real") {
            return await handleSavedJobs(request, env.JOB_API_URL);
        }
        if (isRecruiterCompanyRequest(request) && (env.COMPANY_DATA_MODE ?? env.DATA_MODE) === "real") {
            return await handleRecruiterCompany(request, env.COMPANY_API_URL);
        }
        if (isPublicJobRequest(request) && (env.JOB_DATA_MODE ?? env.DATA_MODE) === "real") {
            return await handleJobService(request, env.JOB_API_URL);
        }
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
