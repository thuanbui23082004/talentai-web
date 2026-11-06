import { describe, expect, it } from "vitest";
import { provinces, findProvinceByCity, normalizeLocation, resolveLocation } from "@/lib/locations/vietnam";
import { parseJobSearchParams } from "@/lib/jobs/validation";
import { searchMockJobs } from "@/server/bff/public/mock-jobs";
import { mockJobs } from "@/mocks/fixtures/jobs";

describe("current Vietnamese administrative locations", () => {
    it("preserves unique administrative codes and valid parent-child relationships", () => {
        const wards = provinces.flatMap((province) => province.wards);
        expect(provinces).toHaveLength(34);
        expect(wards).toHaveLength(3321);
        expect(new Set(provinces.map((province) => province.code)).size).toBe(provinces.length);
        expect(new Set(wards.map((ward) => ward.code)).size).toBe(wards.length);
        expect(provinces.every((province) => /^[1-9]\d?$/.test(province.code) && province.wards.length > 0)).toBe(true);
        expect(wards.every((ward) => /^\d{5}$/.test(ward.code) && ward.name)).toBe(true);
        expect(findProvinceByCity("TP.HCM")?.code).toBe("79");
        expect(findProvinceByCity("Hà Nội")?.code).toBe("1");
        expect(findProvinceByCity("Đà Nẵng")?.code).toBe("48");
        expect(findProvinceByCity("Tây Ninh")?.code).toBe("80");
        expect(findProvinceByCity("Cà Mau")?.code).toBe("96");
        expect(findProvinceByCity("Điện Biên")?.code).toBe("11");
        expect(provinces.map((province) => Number(province.code)).sort((a, b) => a - b)).toEqual([1, 4, 8, 11, 12, 14, 15, 19, 20, 22, 24, 25, 31, 33, 37, 38, 40, 42, 44, 46, 48, 51, 52, 56, 66, 68, 75, 79, 80, 82, 86, 91, 92, 96]);
        expect(normalizeLocation("Đà Nẵng")).toBe("da nang");
    });

    it("rejects unknown codes, mismatched city names and wards in another province", () => {
        const ward = provinces.find((province) => province.code === "1")!.wards[0];
        expect(resolveLocation(`1:${ward.code}`).ward?.code).toBe(ward.code);
        for (const query of ["provinceCode=99", "provinceCode=01", `wardCode=${ward.code}`, `provinceCode=29&wardCode=${ward.code}`, "provinceCode=1&city=TP.HCM", "provinceCode=1&wardCode=99999"]) {
            expect(parseJobSearchParams(new URLSearchParams(query)).success).toBe(false);
        }
    });

    it("filters at ward level before pagination and preserves legacy city-only searches", async () => {
        const { provinceCode, wardCode } = mockJobs[0].location;
        const expected = mockJobs.filter((job) => job.location.provinceCode === provinceCode && job.location.wardCode === wardCode);
        const body = await searchMockJobs(new URLSearchParams({ provinceCode, wardCode, pageSize: "1" })).json();
        expect(body.meta.totalItems).toBe(expected.length);
        expect(body.items).toHaveLength(1);
        expect(body.items.every((job: { location: { wardCode: string } }) => job.location.wardCode === wardCode)).toBe(true);
        const oldSearch = await searchMockJobs(new URLSearchParams({ city: "Đà Nẵng" })).json();
        expect(oldSearch.meta.totalItems).toBe(mockJobs.filter((job) => job.location.city === "Đà Nẵng").length);
        expect(searchMockJobs(new URLSearchParams("provinceCode=99")).status).toBe(422);
    });
});
