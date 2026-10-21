import { describe, expect, it } from "vitest";
import { searchMockCompanies } from "@/server/bff/mock-companies";
import example from "../../contracts/examples/companies.json";

describe("company search", () => {
    const run = async (query: string) => await searchMockCompanies(new URLSearchParams(query)).json();
    it("matches the contract example and paginates without duplicates", async () => {
        expect(await run("pageSize=1")).toEqual(example);
        const first = await run("pageSize=12");
        const second = await run("page=2&pageSize=12");
        expect(first.items).toHaveLength(12);
        expect(second.items).toHaveLength(6);
        expect(new Set([...first.items, ...second.items].map((item: { id: string }) => item.id)).size).toBe(18);
    });
    it("searches unaccented names and combines filters before pagination", async () => {
        expect((await run("q=sao+viet")).items[0].name).toBe("Sao Việt");
        const result = await run("industryId=30000000-0000-4000-8000-000000000001&size=11-50&isVerified=true&hiringOnly=true");
        expect(result.items).toHaveLength(2);
        expect(result.items.every((item: { size: string; isVerified: boolean }) => item.size === "11-50" && item.isVerified)).toBe(true);
        expect((await run("q=not-a-company")).meta.totalItems).toBe(0);
    });
    it("rejects invalid and unsupported filters", () => {
        for (const query of ["page=0", "size=huge", "isVerified=maybe", "industryId=bad", "rating=5", "pageSize=101"]) expect(searchMockCompanies(new URLSearchParams(query)).status).toBe(422);
    });
});
