import { afterEach, expect, test, vi } from "vitest";
import { handleBffRequest } from "@/server/bff/handler";
import { NextResponse } from "next/server";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

test("admin workspace authenticates with the gateway while business data is mocked", async () => {
    vi.stubEnv("DATA_MODE", "mock");
    const user = { id: "123e4567-e89b-42d3-a456-426614174000", email: "admin@example.test", displayName: "Admin", roles: ["ADMIN"], status: "ACTIVE" };
    const network = vi.spyOn(globalThis, "fetch").mockImplementation(async url => {
        if (String(url).endsWith("/auth/login")) return Response.json({ success: true, data: { user, tokens: { accessToken: "admin-access", refreshToken: "admin-refresh", tokenType: "Bearer", expiresInSeconds: 900 } } });
        if (String(url).endsWith("/auth/me")) return Response.json({ success: true, data: { profile: user } });
        throw new Error(`Unexpected request: ${String(url)}`);
    });
    const login = await handleBffRequest(new Request("http://localhost/api/bff/auth/login", { method: "POST", headers: { "Content-Type": "application/json", "X-TalentAI-Workspace": "admin" }, body: JSON.stringify({ email: user.email, password: "secret", role: "admin" }) }));
    expect(login.status).toBe(200);
    expect((await login.json()).user.role).toBe("admin");
    expect(network.mock.calls.some(([url]) => String(url).endsWith("/auth/login"))).toBe(true);
    const access = new NextResponse(null, { headers: login.headers }).cookies.get("access_token")?.value;
    const result = await handleBffRequest(new Request("http://localhost/api/bff/admin/stats/overview", { headers: { cookie: `access_token=${access}` } }));
    expect(result.status).toBe(200);
});
