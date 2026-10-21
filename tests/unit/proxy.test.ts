import { afterEach, describe, expect, it, vi } from "vitest";
import { proxyRequest } from "@/server/bff/proxy";

describe("public backend proxy", () => {
  afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });
  it("preserves the API prefix and query while stripping browser credentials and mock headers", async () => {
    const network = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ items: [], meta: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 } }));
    const response = await proxyRequest(new Request("http://localhost/api/bff/jobs?q=React", { headers: { Cookie: "secret", Authorization: "secret", "x-mock-scenario": "error" } }), "http://backend.test/api/");
    expect(response.status).toBe(200);
    expect(String(network.mock.calls[0][0])).toBe("http://backend.test/api/jobs?q=React");
    expect(network.mock.calls[0][1]?.headers).toEqual({ Accept: "application/json" });
  });
  it("blocks private routes and writes before sending network requests", async () => {
    const network = vi.spyOn(globalThis, "fetch");
    for (const request of [new Request("http://localhost/api/bff/me"), new Request("http://localhost/api/bff/jobs", { method: "POST" })]) {
      expect((await proxyRequest(request, "http://backend.test/api")).status).toBe(503);
    }
    expect(network).not.toHaveBeenCalled();
  });
  it("sanitizes backend failures and does not retry HTTP errors", async () => {
    const network = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("SQL secret", { status: 500 }));
    const response = await proxyRequest(new Request("http://localhost/api/bff/jobs"), "http://backend.test/api");
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("SQL secret");
    expect(network).toHaveBeenCalledTimes(1);
  });
  it("retries network failures within the fixed GET attempt limit", async () => {
    vi.useFakeTimers();
    const network = vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("offline"));
    const pending = proxyRequest(new Request("http://localhost/api/bff/jobs"), "http://backend.test/api");
    await vi.runAllTimersAsync();
    expect((await pending).status).toBe(503);
    expect(network).toHaveBeenCalledTimes(3);
  });
});
