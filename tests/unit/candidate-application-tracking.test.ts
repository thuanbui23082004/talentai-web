import { afterEach, describe, expect, it, vi } from "vitest";
import { handleCandidateApplicationTracking } from "@/server/bff/candidate/application-tracking";
import example from "../../contracts/examples/candidate-application-tracking.json";

const baseUrl = "http://application.test/api/v1";
const token = "candidate-tracking-token";
const id = example.items[0].id;
const upstream = {
    id, jobId: example.items[0].jobId, resumeId: example.items[0].resumeId,
    status: "reviewing", version: 1, createdAt: example.items[0].appliedAt,
    updatedAt: example.items[0].updatedAt, resumeFileName: example.items[0].resumeFileName,
    jobSnapshot: { title: example.items[0].jobTitle, storageKey: "private-job-key" },
    applicantSnapshot: { email: "private@example.test" },
};
const history = [{ newStatus: "reviewing", previousStatus: "submitted", createdAt: example.items[0].updatedAt, applicationVersion: 1, note: "Đã xem hồ sơ", changedBy: "private-user-id" }];

function request(path = "", cookie = `access_token=${token}`) {
    return new Request(`http://localhost/api/bff/candidate/application-tracking${path}`, { headers: { cookie } });
}

function network(role = "CANDIDATE", result?: (url: string) => Response) {
    return vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
        const target = String(url);
        if (target.endsWith("/auth/me")) return Response.json({ success: true, data: { profile: { id: "10000000-0000-4000-8000-000000000002", email: "candidate@example.test", displayName: "Ứng viên", status: "ACTIVE", roles: [role] } } });
        expect(new Headers(init?.headers).get("Authorization")).toBe(`Bearer ${token}`);
        return result?.(target) ?? Response.json({ success: true, data: { items: [upstream], page: 0, size: 6, totalElements: 1, totalPages: 1 } });
    });
}

afterEach(() => vi.restoreAllMocks());

describe("candidate application tracking BFF", () => {
    it("reuses public company logos for applications and loads each company once", async () => {
        const companyId = '10000000-0000-4000-8000-000000000003';
        const fetcher = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
            const target = String(url);
            if (target.endsWith('/auth/me')) return Response.json({ success: true, data: { profile: { id, email: 'candidate@example.test', displayName: 'Candidate', status: 'ACTIVE', roles: ['CANDIDATE'] } } });
            if (target.endsWith(`/companies/${companyId}`)) {
                expect(new Headers(init?.headers).has('Authorization')).toBe(false);
                return Response.json({ data: { id: companyId, name: 'Công ty ITECHWX', logoUrl: 'https://example.test/company.png' } });
            }
            return Response.json({ success: true, data: { items: [{ ...upstream, companyId }, { ...upstream, id: companyId, jobSnapshot: { ...upstream.jobSnapshot, companyId } }], page: 0, size: 6, totalElements: 2, totalPages: 1 } });
        });
        const response = await handleCandidateApplicationTracking(request(), baseUrl, baseUrl);
        expect(response.status).toBe(200);
        const page = await response.json();
        expect(page.items).toHaveLength(2);
        for (const item of page.items) expect(item).toMatchObject({ companyName: 'Công ty ITECHWX', companyLogoUrl: 'https://example.test/company.png' });
        expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith(`/companies/${companyId}`))).toHaveLength(1);
    });

    it("preserves the application snapshot if its company is unavailable", async () => {
        const companyId = '10000000-0000-4000-8000-000000000003';
        vi.spyOn(globalThis, 'fetch').mockImplementation(async url => {
            const target = String(url);
            if (target.endsWith('/auth/me')) return Response.json({ success: true, data: { profile: { id, email: 'candidate@example.test', displayName: 'Candidate', status: 'ACTIVE', roles: ['CANDIDATE'] } } });
            if (target.endsWith(`/companies/${companyId}`)) return new Response(null, { status: 404 });
            return Response.json({ success: true, data: { ...upstream, companyId, jobSnapshot: { ...upstream.jobSnapshot, companyName: 'Tên công ty khi ứng tuyển' } } });
        });
        const response = await handleCandidateApplicationTracking(request(`/${id}`), baseUrl, baseUrl);
        expect(response.status).toBe(200);
        expect(await response.json()).toMatchObject({ id, companyName: 'Tên công ty khi ứng tuyển' });
    });
    it("converts paging and exposes only fields needed by the candidate", async () => {
        const fetch = network();
        const response = await handleCandidateApplicationTracking(request("?page=1&pageSize=6&status=reviewing"), baseUrl);
        expect(response.status).toBe(200);
        expect(response.headers.get("cache-control")).toBe("private, no-store");
        expect(await response.json()).toEqual(example);
        expect(String(fetch.mock.calls.at(-1)?.[0])).toBe(`${baseUrl}/applications?page=0&size=6&status=reviewing`);
    });

    it("reads detail and the backend status history without leaking private snapshots", async () => {
        network("CANDIDATE", url => Response.json({ success: true, data: url.endsWith("/history") ? history : upstream }));
        const detail = await handleCandidateApplicationTracking(request(`/${id}`), baseUrl);
        expect(await detail.json()).toEqual(example.items[0]);
        const response = await handleCandidateApplicationTracking(request(`/${id}/history`), baseUrl);
        const body = await response.json();
        expect(body).toEqual([{ status: "reviewing", previousStatus: "submitted", changedAt: example.items[0].updatedAt, version: 1, note: "Đã xem hồ sơ" }]);
        expect(JSON.stringify(body)).not.toContain("private-user-id");
    });

    it("checks role and input before forwarding to Java", async () => {
        const fetch = network("RECRUITER");
        expect((await handleCandidateApplicationTracking(request("", ""), baseUrl)).status).toBe(401);
        expect((await handleCandidateApplicationTracking(request(), baseUrl)).status).toBe(403);
        expect((await handleCandidateApplicationTracking(request("?status=invalid"), baseUrl)).status).toBe(422);
        expect((await handleCandidateApplicationTracking(request("/not-an-id"), baseUrl)).status).toBe(404);
        expect(fetch.mock.calls.filter(([url]) => String(url).includes("application.test"))).toHaveLength(0);
    });

    it("does not replace an upstream error or invalid response with mock records", async () => {
        network("CANDIDATE", () => Response.json({ error: { code: "PRIVATE", message: "backend details" } }, { status: 403 }));
        const forbidden = await handleCandidateApplicationTracking(request(), baseUrl);
        expect(forbidden.status).toBe(403);
        expect(await forbidden.text()).not.toContain("backend details");
        network("CANDIDATE", () => Response.json({ success: true, data: { items: [{ ...upstream, status: "unknown" }], page: 0, size: 6, totalElements: 1, totalPages: 1 } }));
        expect((await handleCandidateApplicationTracking(request(), baseUrl)).status).toBe(503);
    });
});
