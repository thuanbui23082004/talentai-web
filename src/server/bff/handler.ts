import { getServerEnv } from "@/lib/env";
import { handleMockRequest } from "./mock-adapter";
import { proxyRequest } from "./proxy";
import { apiError } from "./responses";
import { handleAuthRequest, isAuthRequest } from "./auth/handler";
import { handleCompanyService, isPublicCompanyRequest } from "./public/company-service";
import { handleRecruiterCompany, isRecruiterCompanyRequest } from "./recruiter/company-service";
import { handleJobService, isPublicJobRequest } from "./public/job-service";
import { handleSavedJobs, isSavedJobsRequest } from "./candidate/saved-jobs-service";
import { handleProfileRequest, isProfileRequest } from "./candidate/profile-service";
import { handleCvsRequest, isCvsRequest } from "./candidate/cv-service";
import { handleRecruiterJobPostings, isRecruiterJobPostingRequest } from './recruiter/job-posting-service';
import { mockJobPostingOptions } from './recruiter/job-posting-mock';
import { handleApplicationSubmission } from "./candidate/application-submission";
import { handleJobApplicants } from './recruiter/job-applicants-service';
import { handleJobApplicationDetail } from './recruiter/job-application-detail-service';
import { handleJobApplicantStatus } from './recruiter/job-applicant-status-service';

export async function handleBffRequest(request: Request): Promise<Response> {
    try {
        if (isAuthRequest(request)) return await handleAuthRequest(request);
        const env = getServerEnv();
        const applicantStatus = new URL(request.url).pathname.match(/^\/api\/bff\/recruiter\/job-applications\/([^/]+)\/status$/);
        if (applicantStatus) return await handleJobApplicantStatus(request, applicantStatus[1], (env.APPLICATION_DATA_MODE ?? env.DATA_MODE) === 'real' ? env.APPLICATION_API_URL : undefined);
        const applicantDetail = new URL(request.url).pathname.match(/^\/api\/bff\/recruiter\/job-applications\/([^/]+)(?:\/(resume|cv))?$/);
        if (applicantDetail) return await handleJobApplicationDetail(request, applicantDetail[1], applicantDetail[2] === 'cv' ? 'cv' : applicantDetail[2] === 'resume' ? 'resume' : 'detail', (env.APPLICATION_DATA_MODE ?? env.DATA_MODE) === 'real' ? env.APPLICATION_API_URL : undefined);
        const applicantsJobId = new URL(request.url).pathname.match(/^\/api\/bff\/recruiter\/jobs\/([^/]+)\/applications$/)?.[1];
        if (applicantsJobId) return await handleJobApplicants(request, applicantsJobId, (env.APPLICATION_DATA_MODE ?? env.DATA_MODE) === 'real' ? env.APPLICATION_API_URL : undefined);
        if (request.method === "POST" && new URL(request.url).pathname === "/api/bff/applications") {
            return await handleApplicationSubmission(request, (env.APPLICATION_DATA_MODE ?? env.DATA_MODE) === "real" ? env.APPLICATION_API_URL : undefined);
        }
        if (isRecruiterJobPostingRequest(request)) {
            if ((env.JOB_DATA_MODE ?? env.DATA_MODE) === 'real') return await handleRecruiterJobPostings(request, env.JOB_API_URL, env.COMPANY_API_URL);
            if (new URL(request.url).pathname === '/api/bff/recruiter/jobs/options') return await mockJobPostingOptions(request);
            return await handleMockRequest(request);
        }
        if (isCvsRequest(request)) return await handleCvsRequest(request, (env.PROFILE_DATA_MODE ?? env.DATA_MODE) === "real" ? env.PROFILE_API_URL : undefined);
        if (isProfileRequest(request)) {
            return await handleProfileRequest(request, (env.PROFILE_DATA_MODE ?? env.DATA_MODE) === "real" ? env.PROFILE_API_URL : undefined);
        }
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
