import { afterEach, describe, expect, it, vi } from "vitest";
import { handleRecruiterCompany } from "@/server/bff/recruiter/company-service";
import { csrfTokenFor } from "@/server/bff/auth/cookies";
import { settingsError } from "@/features/account";

const base = "http://localhost:3003/api/v1";
const token = "test-company-access";
const id = "90000000-0000-4000-8000-000000000099";
const company = { id, name: "Sao Mai", taxCode: "0123456789", description: "Phần mềm doanh nghiệp", verificationStatus: "UNVERIFIED", createdAt: "2026-11-04T10:00:00Z", updatedAt: null, website: null, industry: { id: 1, name: "Công nghệ thông tin" }, location: { id: 21, name: "Thành phố Đà Nẵng" }, contactPhone: "0912345678", address: "12 Đường Hoa" };
const input = { name: company.name, taxCode: company.taxCode, description: company.description, industryIds: ["1"], city: "Đà Nẵng", contactPhone: company.contactPhone, address: company.address };
function request(method = "GET", body?: unknown, extraHeaders: Record<string, string> = {}, path = "") {
    return new Request(`http://localhost/api/bff/recruiter/company${path}`, {
        method, headers: { cookie: `access_token=${token}`, "content-type": "application/json", "x-csrf-token": csrfTokenFor({ access: token }), ...extraHeaders },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
}
function network(role = "RECRUITER", companyResponse = () => Response.json({ data: company })) {
    return vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
        const path = new URL(String(url)).pathname;
        if (path.endsWith("/auth/me")) return Response.json({ success: true, data: { profile: { id, email: "test@example.com", displayName: "Recruiter", status: "ACTIVE", roles: [role] } } });
        if (path.endsWith("/industries")) return Response.json({ data: [company.industry] });
        if (path.endsWith("/locations")) return Response.json({ data: [company.location] });
        expect(new Headers(init?.headers).get("Authorization")).toBe(`Bearer ${token}`);
        return companyResponse();
    });
}
afterEach(() => vi.restoreAllMocks());

describe("real recruiter company adapter", () => {
    it("loads catalogs with actual backend IDs", async () => {
        network();
        const response = await handleRecruiterCompany(request("GET", undefined, {}, "/catalogs"), base);
        expect(await response.json()).toEqual({ industries: [{ id: "1", name: company.industry.name }], locations: [{ id: "21", name: company.location.name }] });
    });
    it("sends a single PUT with numeric IDs and normalizes the saved company", async () => {
        const fetch = network();
        const response = await handleRecruiterCompany(request("POST", input), base);
        expect(response.status).toBe(201);
        expect(await response.json()).toMatchObject({ id, city: "Đà Nẵng", industries: [{ id: "1" }], verificationStatus: "unverified" });
        const writes = fetch.mock.calls.filter(([, init]) => init?.method === "PUT");
        expect(writes).toHaveLength(1);
        expect(JSON.parse(String(writes[0][1]?.body))).toEqual({ name: input.name, description: input.description, taxCode: input.taxCode, industryId: 1, locationId: 21, address: input.address, contactPhone: input.contactPhone });
    });
    it("rejects missing sessions, wrong roles, forged CSRF and cross-origin writes", async () => {
        const fetch = network();
        const noSession = new Request("http://localhost/api/bff/recruiter/company");
        expect((await handleRecruiterCompany(noSession, base)).status).toBe(401);
        expect(fetch).not.toHaveBeenCalled();
        for (const headers of [{ "x-csrf-token": "bad" }, { origin: "https://untrusted.example" }] as Record<string, string>[]) {
            expect((await handleRecruiterCompany(request("POST", input, headers), base)).status).toBe(403);
        }
        expect(fetch).not.toHaveBeenCalled();
        vi.restoreAllMocks(); network("CANDIDATE");
        expect((await handleRecruiterCompany(request(), base)).status).toBe(403);
    });
    it("does not write invalid fields or replace numeric IDs with mock IDs", async () => {
        const fetch = network();
        for (const change of [{ description: "" }, { taxCode: "" }, { industryIds: ["2"] }, { city: "unknown" }, { industryIds: ["1", "2"] }]) {
            expect((await handleRecruiterCompany(request("POST", { ...input, ...change }), base)).status).toBe(422);
        }
        expect(fetch.mock.calls.some(([, init]) => init?.method === "PUT")).toBe(false);
    });
    it("returns the duplicate tax code to the correct field without exposing raw errors", async () => {
        network("RECRUITER", () => Response.json({ error: { code: "TAX_CODE_ALREADY_EXISTS", message: "private database details" } }, { status: 409 }));
        const response = await handleRecruiterCompany(request("POST", input), base);
        expect(response.status).toBe(422);
        const body = await response.json();
        expect(JSON.stringify(body)).not.toContain("private database details");
        expect(settingsError(body, 422).fieldErrors).toEqual([{ field: "taxCode", message: "Mã số thuế đã được một công ty khác sử dụng." }]);
    });
    it("preserves missing-company and expired-session responses and never retries a save", async () => {
        for (const status of [401, 403, 404, 500]) {
            vi.restoreAllMocks();
            const fetch = network("RECRUITER", () => Response.json({}, { status }));
            const response = await handleRecruiterCompany(request("POST", input), base);
            expect(response.status).toBe(status === 500 ? 503 : status);
            expect(fetch.mock.calls.filter(([, init]) => init?.method === "PUT")).toHaveLength(1);
        }
    });
});
