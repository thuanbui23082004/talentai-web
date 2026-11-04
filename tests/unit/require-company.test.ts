import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleBffRequest } from "@/server/bff/handler";
import { requireCompany } from "@/server/bff/recruiter/require-company";

vi.mock("next/headers", () => ({ cookies: async () => ({ toString: () => "access_token=test-session" }) }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));
vi.mock("@/server/bff/handler", () => ({ handleBffRequest: vi.fn() }));

const lookup = vi.mocked(handleBffRequest);
beforeEach(() => vi.clearAllMocks());

describe("recruiter company access", () => {
    it("allows a saved company even when auth has no companyId", async () => {
        lookup.mockResolvedValue(Response.json({ id: "saved-company" }));
        await expect(requireCompany()).resolves.toBeUndefined();
        const request = lookup.mock.calls[0][0];
        expect(new URL(request.url).pathname).toBe("/api/bff/recruiter/company");
        expect(request.headers.get("cookie")).toBe("access_token=test-session");
    });

    it("returns an unfinished account to onboarding", async () => {
        lookup.mockResolvedValue(new Response(null, { status: 404 }));
        await expect(requireCompany()).rejects.toThrow("redirect:/recruiter/onboarding");
    });

    it("returns an expired session to login", async () => {
        lookup.mockResolvedValue(new Response(null, { status: 401 }));
        await expect(requireCompany()).rejects.toThrow("redirect:/login?role=recruiter");
    });

    it.each([403, 500, 503])("blocks access on lookup failure %s without treating it as a missing company", async status => {
        lookup.mockResolvedValue(new Response(null, { status }));
        await expect(requireCompany()).rejects.toThrow("Không thể kiểm tra hồ sơ doanh nghiệp");
    });
});
