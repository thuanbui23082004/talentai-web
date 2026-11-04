import { afterEach, describe, expect, it, vi } from "vitest";
import { handleCompanyService } from "@/server/bff/public/company-service";
import { handleBffRequest } from "@/server/bff/handler";
import { getMockCompanyCatalogs } from "@/server/bff/public/mock-companies";
import catalogsExample from "../../contracts/examples/company-catalogs.json";

const id = "90000000-0000-4000-8000-000000000001";
const item = { id, name: "Sao Mai", companySize: 150, locationId: 21, industryId: 1, logoUrl: null, description: null, website: null, address: "12 Hoa" };
const catalog = { industries: { data: [{ id: 1, name: "Công nghệ thông tin" }] }, locations: { data: [{ id: 21, name: "Đà Nẵng" }] } };
const request = (query = "") => new Request(`http://localhost/api/bff/companies${query}`);
function network(body: unknown = { content: [item], number: 1, size: 12, totalElements: 13, totalPages: 2 }) {
    return vi.spyOn(globalThis, "fetch").mockImplementation(async input => {
        const url = new URL(String(input));
        if (url.pathname.endsWith("/industries")) return Response.json(catalog.industries);
        if (url.pathname.endsWith("/locations")) return Response.json(catalog.locations);
        return Response.json(body);
    });
}
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe("company service adapter", () => {
    it("maps filters and zero-based pagination and resolves actual catalog IDs", async () => {
        const fetch = network();
        const response = await handleCompanyService(request("?q=Sao&industryId=1&locationId=21&size=51-200&page=2"), "http://localhost:3003/api/v1");
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.meta).toEqual({ page: 2, pageSize: 12, totalItems: 13, totalPages: 2 });
        expect(body.items[0]).toMatchObject({ id, companySize: 150, city: "Đà Nẵng", industries: [{ id: "1", name: "Công nghệ thông tin" }] });
        expect(body.items[0]).not.toHaveProperty("isVerified");
        expect(body.items[0]).not.toHaveProperty("openJobsCount");
        const url = new URL(String(fetch.mock.calls.at(-1)?.[0]));
        expect(Object.fromEntries(url.searchParams)).toEqual({ page: "1", size: "12", name: "Sao", industryId: "1", locationId: "21", minSize: "51", maxSize: "200" });
        expect(fetch.mock.calls.every(call => !(call[1]?.headers as Record<string, string>)?.Authorization)).toBe(true);
    });
    it("strips internal data and unsafe URLs from public detail", async () => {
        network({ data: { ...item, location: catalog.locations.data[0], industry: catalog.industries.data[0], verificationStatus: "VERIFIED", taxCode: "internal", contactEmail: "private@example.com", contactPhone: "private", version: 2, logoUrl: "javascript:alert(1)", website: "https://saomai.vn", coverImageUrl: "https://saomai.vn/cover.png" } });
        const response = await handleCompanyService(request(`/${id}`), "http://localhost:3003/api/v1");
        const body = await response.json();
        expect(body).toMatchObject({ id, isVerified: true, website: "https://saomai.vn/", coverImageUrl: "https://saomai.vn/cover.png" });
        for (const field of ["taxCode", "contactEmail", "contactPhone", "version", "logoUrl"]) expect(body).not.toHaveProperty(field);
    });
    it("normalizes empty results and validates min/max ranges before fetching", async () => {
        const fetch = network({ content: [], number: 0, size: 12, totalElements: 0, totalPages: 0 });
        expect((await (await handleCompanyService(request(), "http://localhost:3003/api/v1")).json()).items).toEqual([]);
        fetch.mockClear();
        for (const query of ["?page=0", "?industryId=bad", "?minSize=200&maxSize=100", "?isVerified=true", "?hiringOnly=true"]) expect((await handleCompanyService(request(query), "http://localhost:3003/api/v1")).status).toBe(422);
        expect(fetch).not.toHaveBeenCalled();
    });
    it("keeps backend failures safe and does not return fake company or job data", async () => {
        for (const status of [401, 403, 404]) {
            vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ secret: "sensitive" }, { status }));
            const response = await handleCompanyService(request(`/${id}`), "http://localhost:3003/api/v1");
            expect(response.status).toBe(status);
            expect(JSON.stringify(await response.json())).not.toContain("sensitive");
            vi.restoreAllMocks();
        }
        network({ content: "broken" });
        expect((await handleCompanyService(request(), "http://localhost:3003/api/v1")).status).toBe(503);
        expect((await handleCompanyService(request(`/${id}/jobs`), "http://localhost:3003/api/v1")).status).toBe(503);
    });
    it("routes only public company requests to the real service with mock jobs unaffected", async () => {
        vi.stubEnv("DATA_MODE", "mock"); vi.stubEnv("COMPANY_DATA_MODE", "real");
        network();
        expect((await handleBffRequest(request())).status).toBe(200);
        expect(await getMockCompanyCatalogs().json()).toEqual(catalogsExample);
    });
});
