import { afterEach, describe, expect, it, vi } from "vitest";
import { handleAuthRequest as proxyRequest } from "@/server/bff/auth/handler";

const backend = "http://backend.test/api/v1";
const payload = () => ({ success: true, data: {
  user: { id: "123e4567-e89b-42d3-a456-426614174000", email: "candidate@example.test", displayName: "Nguyễn An", roles: ["CANDIDATE"], status: "ACTIVE", avatarUrl: null, createdAt: "2026-11-02T03:00:00Z" },
  tokens: { accessToken: "backend-access-secret", refreshToken: "backend-refresh-secret", tokenType: "Bearer", expiresInSeconds: 900 },
} });
function request(body: unknown = { email: "candidate@example.test", password: "Password123!" }, headers: Record<string, string> = {}) {
  return new Request("https://web.test/api/bff/auth/login", { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://web.test", ...headers }, body: JSON.stringify(body) });
}

describe("real BFF login", () => {
  afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

  it("calls Java once and puts its JWT directly in HttpOnly cookies, never JSON", async () => {
    const network = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json(payload()));
    const response = await proxyRequest(request(undefined, { Authorization: "browser-secret", Cookie: "untrusted", "x-mock-scenario": "error" }), backend);
    expect(response.status).toBe(200);
    expect(network).toHaveBeenCalledTimes(1);
    expect(network.mock.calls[0][0]).toBe(`${backend}/auth/login`);
    const options = network.mock.calls[0][1];
    expect(options?.method).toBe("POST");
    expect(options?.headers).toEqual({ Accept: "application/json", "Content-Type": "application/json" });
    const text = await response.text();
    const body = JSON.parse(text);
    expect(body.user).toMatchObject({ fullName: "Nguyễn An", role: "candidate", status: "active" });
    expect(body.redirectTo).toBe("/candidate/dashboard");
    expect(body.csrfToken).toBeTruthy();
    expect(text).not.toContain("backend-access-secret");
    expect(text).not.toContain("backend-refresh-secret");
    expect(response.headers.get("cache-control")).toBe("no-store");
    const cookies = response.headers.get("set-cookie")!;
    expect(cookies).toContain("HttpOnly");
    expect(cookies).toContain("Secure");
    expect(cookies.toLowerCase()).toContain("samesite=lax");
    expect(cookies).toContain("access_token=backend-access-secret");
    expect(cookies).toContain("refresh_token=backend-refresh-secret");
    expect(body.expiresInSeconds).toBe(900);
    expect(body).not.toHaveProperty("idleTimeoutSeconds");
    expect(body).not.toHaveProperty("expiresAt");
  });

  it("blocks cross-origin and invalid requests before contacting the backend", async () => {
    const network = vi.spyOn(globalThis, "fetch");
    expect((await proxyRequest(request(undefined, { Origin: "https://evil.test" }), backend)).status).toBe(403);
    expect((await proxyRequest(request(undefined, { "sec-fetch-site": "cross-site" }), backend)).status).toBe(403);
    expect((await proxyRequest(request({ email: "invalid", password: "" }), backend)).status).toBe(422);
    expect((await proxyRequest(request(undefined, { "Content-Type": "text/plain" }), backend)).status).toBe(422);
    expect((await proxyRequest(new Request("https://web.test/api/bff/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" }), backend)).status).toBe(422);
    expect(network).not.toHaveBeenCalled();
  });

  it.each([[401, 401, "INVALID_CREDENTIALS"], [403, 403, "FORBIDDEN"], [400, 422, "VALIDATION_FAILED"], [429, 429, "RATE_LIMITED"], [500, 503, "SERVICE_UNAVAILABLE"]])("sanitizes upstream %s without setting cookies or retrying", async (status, expected, code) => {
    const network = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("private server details", { status: Number(status) }));
    const response = await proxyRequest(request(), backend);
    expect(response.status).toBe(expected);
    expect((await response.json()).error.code).toBe(code);
    expect(response.headers.has("set-cookie")).toBe(false);
    expect(network).toHaveBeenCalledTimes(1);
  });

  it("rejects malformed upstream JSON and sanitizes network failures", async () => {
    const network = vi.spyOn(globalThis, "fetch");
    for (const content of [{}, { success: true, data: { user: {} } }]) {
      network.mockResolvedValueOnce(Response.json(content));
      const response = await proxyRequest(request(), backend);
      expect(response.status).not.toBe(200);
      expect(response.headers.has("set-cookie")).toBe(false);
    }
    network.mockRejectedValueOnce(new TypeError("network secret"));
    const response = await proxyRequest(request(), backend);
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("network secret");
    expect(network).toHaveBeenCalledTimes(3);
  });
});
