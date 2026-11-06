import { afterEach, describe, expect, it, vi } from "vitest";
import { handleApplicationSubmission } from "@/server/bff/candidate/application-submission";
import { resetMockSubmissions } from "@/server/bff/candidate/mock-application-submission";
import { mockCvsRequest, resetMockCvs } from "@/server/bff/candidate/mock-cvs";
import { csrfTokenFor } from "@/server/bff/auth/cookies";
import input from "../../contracts/examples/application-submit.json";
import result from "../../contracts/examples/application-submission.json";
import { pdfCv } from "../support/cv-files";

const base = "http://application.test/api/v1";
const token = "application-test-token";
const userId = "10000000-0000-4000-8000-000000000002";
function request(body: unknown = input, headers: Record<string, string> = {}) {
    return new Request("http://localhost/api/bff/applications", { method: "POST", body: JSON.stringify(body), headers: { Cookie: `access_token=${token}`, Origin: "http://localhost", "X-CSRF-Token": csrfTokenFor({ access: token }), "Content-Type": "application/json", ...headers } });
}
function network(reply: () => Response | Promise<Response>, role = "CANDIDATE") {
    return vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
        if (String(url).endsWith("/auth/me")) return Response.json({ success: true, data: { profile: { id: userId, email: "submit@example.com", displayName: "Submission Test", status: "ACTIVE", roles: [role] } } });
        expect(String(url)).toBe(`${base}/applications`);
        expect(init?.method).toBe("POST");
        expect(new Headers(init?.headers).get("Authorization")).toBe(`Bearer ${token}`);
        expect(JSON.parse(String(init?.body))).toEqual(input);
        return reply();
    });
}
afterEach(() => { vi.restoreAllMocks(); resetMockSubmissions(); resetMockCvs(); });

describe("application submission BFF", () => {
    it("sends exactly the documented request and returns a verified submission", async () => {
        const fetch = network(() => Response.json({ success: true, data: { ...result, applicantSnapshot: { secret: "private" } } }, { status: 201 }));
        const response = await handleApplicationSubmission(request(), base);
        expect(response.status).toBe(201);
        expect(await response.json()).toEqual(result);
        expect(response.headers.get("cache-control")).toBe("private, no-store");
        expect(fetch.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(1);
    });
    it("requires candidate authentication, CSRF and same origin", async () => {
        const fetch = network(() => Response.json({}), "RECRUITER");
        expect((await handleApplicationSubmission(request(input, { Cookie: "" }), base)).status).toBe(403);
        expect((await handleApplicationSubmission(request(input, { "X-CSRF-Token": "bad" }), base)).status).toBe(403);
        expect((await handleApplicationSubmission(request(input, { Origin: "https://evil.example" }), base)).status).toBe(403);
        expect((await handleApplicationSubmission(request(), base)).status).toBe(403);
        expect(fetch.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(0);
    });
    it("rejects invalid IDs, unsupported fields and oversized letters before posting", async () => {
        const fetch = network(() => Response.json({}));
        for (const body of [{ ...input, jobId: "bad" }, { ...input, resumeId: "bad" }, { ...input, allowAi: true }, { ...input, coverLetter: "a".repeat(10001) }]) {
            expect((await handleApplicationSubmission(request(body), base)).status).toBe(422);
        }
        expect(fetch.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(0);
    });
    it.each(["ALREADY_APPLIED", "JOB_CLOSED", "JOB_NOT_OPEN"])("preserves the controlled error %s", async code => {
        network(() => Response.json({ error: { code, message: "private backend details" } }, { status: 409 }));
        const response = await handleApplicationSubmission(request(), base);
        expect(response.status).toBe(409);
        const body = await response.json();
        expect(body.error.code).toBe(code);
        expect(JSON.stringify(body)).not.toContain("private backend details");
    });
    it("never retries POST after a network failure or malformed success", async () => {
        const fetch = network(() => { throw new Error("private network details"); });
        expect((await handleApplicationSubmission(request(), base)).status).toBe(503);
        expect(fetch.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(1);
        network(() => Response.json({ success: true, data: { ...result, resumeId: result.id } }, { status: 201 }));
        expect((await handleApplicationSubmission(request(), base)).status).toBe(503);
    });
    it.each(["PROFILE_INCOMPLETE", "CV_NOT_FOUND", "JOB_NOT_FOUND"])("reports %s without exposing backend text", async code => {
        network(() => Response.json({ error: { code, message: "private backend details" } }, { status: 400 }));
        const response = await handleApplicationSubmission(request(), base);
        expect(response.status).toBe(422);
        expect((await response.json()).error.code).toBe(code);
    });
    it("mock checks CV ownership, rejects duplicates and stores a separate record per account", async () => {
        network(() => Response.json({}));
        const file = new File([pdfCv()], "resume.pdf", { type: "application/pdf" });
        const cv = await (await mockCvsRequest(userId, "POST", undefined, false, file)).json();
        const ownInput = { ...input, resumeId: cv.id };
        expect((await handleApplicationSubmission(request())).status).toBe(422);
        const response = await handleApplicationSubmission(request(ownInput));
        expect(response.status).toBe(201);
        expect(await response.json()).toMatchObject({ jobId: input.jobId, resumeId: cv.id, status: "submitted" });
        expect((await handleApplicationSubmission(request(ownInput))).status).toBe(409);
    });
});
