import { randomUUID } from "node:crypto";
import type { components } from "@/lib/api/generated/schema";
import { mockJobs } from "@/mocks/fixtures/jobs";
import { mockCvsRequest } from "./mock-cvs";
import { apiError } from "../responses";

type Application = components["schemas"]["Application"];
type Input = components["schemas"]["ApplicationCreateRequest"];
const shared = globalThis as typeof globalThis & { talentaiSubmittedApplications?: Map<string, Application[]> };
export function getSubmittedMockApplications(userId: string) {
    shared.talentaiSubmittedApplications ??= new Map();
    if (!shared.talentaiSubmittedApplications.has(userId)) shared.talentaiSubmittedApplications.set(userId, []);
    return shared.talentaiSubmittedApplications.get(userId)!;
}
export function resetMockSubmissions() { delete shared.talentaiSubmittedApplications; }

export async function submitMockApplication(userId: string, input: Input, scenario?: string | null) {
    if (scenario === "error") return apiError(503, "SERVICE_UNAVAILABLE", "Không thể gửi hồ sơ.");
    const items = getSubmittedMockApplications(userId);
    if (items.some(item => item.jobId === input.jobId)) return apiError(409, "ALREADY_APPLIED", "Bạn đã ứng tuyển vị trí này.");
    const job = mockJobs.find(job => job.id === input.jobId);
    if (!job || job.status !== "open") return apiError(409, "JOB_NOT_OPEN", "Tin không còn nhận hồ sơ.");
    const cvResponse = await mockCvsRequest(userId, "GET", input.resumeId);
    if (!cvResponse.ok) return apiError(422, "VALIDATION_FAILED", "CV không tồn tại hoặc không thuộc tài khoản.");
    const cv: components["schemas"]["UploadedCv"] = await cvResponse.json();
    const now = new Date().toISOString();
    const application: Application = { id: randomUUID(), jobId: job.id, job, cvId: cv.id, cvTitle: cv.cvTitle, status: "submitted", coverLetter: input.coverLetter, appliedAt: now, updatedAt: now };
    items.unshift(application);
    const result: components["schemas"]["ApplicationSubmission"] = { id: application.id, jobId: job.id, resumeId: cv.id, coverLetter: input.coverLetter, status: "submitted", createdAt: now, version: 0 };
    return Response.json(result, { status: 201, headers: { "Cache-Control": "private, no-store" } });
}
