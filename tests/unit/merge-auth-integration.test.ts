import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { handleBffRequest } from "@/server/bff/handler";
import { readServerSession } from "@/server/bff/auth/session";
import { csrfTokenFor } from "@/server/bff/auth/cookies";
import { accountSchema } from "@/features/account/schemas/account";

const user = { id: "123e4567-e89b-42d3-a456-426614174000", email: "real@example.test", displayName: "Real User", status: "ACTIVE", roles: ["CANDIDATE"], createdAt: "2026-11-02T03:00:00Z" };
const tokens = { accessToken: "java-access", refreshToken: "java-refresh", tokenType: "Bearer", expiresInSeconds: 900 };
const cookie = `access_token=${tokens.accessToken}; refresh_token=${tokens.refreshToken}`;
const csrf = csrfTokenFor({ refresh: tokens.refreshToken });
const authResult = () => Response.json({ success: true, data: { user, tokens } });
const profile = () => Response.json({ success: true, data: { profile: user } });
function request(path: string, body?: unknown, cookies = "", token?: string) {
  return handleBffRequest(new Request("http://localhost/api/bff" + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { Cookie: cookies, ...(body === undefined ? {} : { "Content-Type": "application/json", Origin: "http://localhost" }), ...(token ? { "X-CSRF-Token": token } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }));
}
const cookies = (response: Response) => response.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
beforeEach(() => { vi.stubEnv("AUTH_API_URL", "http://auth.test/api/v1"); });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.useRealTimers(); });

it.each(["mock", "real"])("uses Java auth independently of DATA_MODE=%s", async mode => {
  vi.stubEnv("DATA_MODE", mode); vi.stubEnv("BACKEND_API_URL", "http://business.test/api");
  const network = vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
    if (String(url).endsWith("/login")) return authResult();
    if (String(url).endsWith("/me")) {
      expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer java-access");
      return profile();
    }
    return Response.json({ success: true, message: "ok" });
  });
  expect((await request("/auth/csrf")).status).toBe(401);
  const login = await request("/auth/login", { email: user.email, password: "Password123!" });
  expect(login.status).toBe(200);
  expect(cookies(login)).toBe(cookie);
  const body = await login.json();
  expect((await readServerSession(cookie))?.email).toBe(user.email);
  expect((await request("/me", undefined, cookie)).status).toBe(200);
  expect((await request("/auth/logout", {}, cookie, "wrong")).status).toBe(403);
  const logout = await request("/auth/logout", {}, cookie, body.csrfToken);
  expect(logout.status).toBe(204);
  expect(logout.headers.getSetCookie().every(value => value.includes("Max-Age=0"))).toBe(true);
  expect(await readServerSession(cookies(logout))).toBeNull();
  // Java documents that an old access JWT remains valid until its own expiry.
  expect((await readServerSession(cookie))?.email).toBe(user.email);
  expect(network.mock.calls.every(([url]) => String(url).startsWith("http://auth.test/api/v1/auth/"))).toBe(true);
});

it("deduplicates in-flight refresh HTTP calls without keeping a BFF session", async () => {
  const network = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ success: true, data: { tokens: { ...tokens, accessToken: "new-access", refreshToken: "new-refresh" } } }));
  const [a, b] = await Promise.all([request("/auth/refresh", {}, cookie), request("/auth/refresh", {}, cookie)]);
  expect(a.status).toBe(200); expect(b.status).toBe(200);
  expect(cookies(a)).toBe(cookies(b));
  expect(network).toHaveBeenCalledTimes(1);
  expect(JSON.parse(String(network.mock.calls[0][1]?.body))).toEqual({ refreshToken: "java-refresh" });
  expect(await a.json()).toEqual({ expiresInSeconds: 900, csrfToken: csrfTokenFor({ refresh: "new-refresh" }) });
  network.mockResolvedValueOnce(new Response(null, { status: 401 }));
  expect((await request("/auth/refresh", {}, cookie)).status).toBe(401);
});

it("does not clear cookies or fake successful logout on backend outage", async () => {
  vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
  const response = await request("/auth/logout", {}, cookie, csrf);
  expect(response.status).toBe(503); expect(response.headers.getSetCookie()).toEqual([]);
  await expect(readServerSession(cookie)).rejects.toThrow();
});

it("returns independent error bodies to concurrent refresh callers", async () => {
  const network = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 401 }));
  const [a, b] = await Promise.all([request("/auth/refresh", {}, cookie), request("/auth/refresh", {}, cookie)]);
  expect(a.status).toBe(401); expect(b.status).toBe(401);
  expect(await a.json()).toEqual(await b.json());
  expect(network).toHaveBeenCalledTimes(1);
});

it("maps registration and does not send a hidden logout command to Java", async () => {
  const network = vi.spyOn(globalThis, "fetch").mockImplementation(async () => authResult());
  const response = await request("/auth/register", { fullName: "New User", email: user.email, phone: "0901234567", password: "Password123!", confirmPassword: "Password123!", role: "candidate", acceptedPrivacyPolicy: true });
  expect(response.status).toBe(201); expect(cookies(response)).toBe(cookie);
  const body = await response.json();
  expect(body.redirectTo).toBe("/");
  expect(body.csrfToken).toBe(csrf);
  expect(JSON.stringify(body)).not.toContain(tokens.accessToken);
  expect(JSON.stringify(body)).not.toContain(tokens.refreshToken);
  expect(network).toHaveBeenCalledTimes(1);
  expect(JSON.parse(String(network.mock.calls[0][1]?.body))).toEqual({ displayName: "New User", email: user.email, password: "Password123!", role: "CANDIDATE" });
});

it.each([null, undefined])("accepts registration when Java returns createdAt=%s, without inventing a date", async createdAt => {
  const network = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ success: true, data: { user: { ...user, createdAt }, tokens } }, { status: 201 }));
  const response = await request("/auth/register", { fullName: "New User", email: user.email, password: "Password123!", role: "candidate" });
  expect(response.status).toBe(201);
  expect(cookies(response)).toBe(cookie);
  const body = await response.json();
  expect(body.user).toMatchObject({ id: user.id, email: user.email, role: "candidate" });
  expect(body.user).not.toHaveProperty("createdAt");
  expect(accountSchema.safeParse(body.user).success).toBe(true);
  expect(network).toHaveBeenCalledTimes(1);
});

it("accepts login and profile with a null createdAt while retaining token and identity validation", async () => {
  const javaUser = { ...user, createdAt: null };
  const network = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(Response.json({ success: true, data: { user: javaUser, tokens } }));
  const login = await request("/auth/login", { email: user.email, password: "Password123!" });
  expect(login.status).toBe(200);
  expect(cookies(login)).toBe(cookie);
  expect((await login.json()).user).not.toHaveProperty("createdAt");
  network.mockResolvedValueOnce(Response.json({ success: true, data: { profile: javaUser } }));
  const me = await request("/me", undefined, cookie);
  expect(me.status).toBe(200);
  expect(await me.json()).not.toHaveProperty("createdAt");
});

it("still rejects an invalid non-null createdAt returned by Java", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ success: true, data: { user: { ...user, createdAt: "not-a-date" }, tokens } }, { status: 201 }));
  expect((await request("/auth/register", { fullName: "New User", email: user.email, password: "Password123!", role: "candidate" })).status).toBe(503);
});

it("keeps auth available when business configuration is missing", async () => {
  vi.stubEnv("DATA_MODE", "real"); vi.stubEnv("BACKEND_API_URL", "");
  vi.spyOn(globalThis, "fetch").mockImplementation(async () => authResult());
  expect((await request("/auth/login", { email: user.email, password: "Password123!" })).status).toBe(200);
});

it("delegates password validation and revocation to Java, clearing only this browser", async () => {
  const network = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ success: true, message: "ok" }));
  const input = { currentPassword: "same", newPassword: "same", confirmPassword: "different" };
  const response = await request("/auth/change-password", input, cookie, csrf);
  expect(response.status).toBe(200);
  expect(JSON.parse(String(network.mock.calls[0][1]?.body))).toEqual(input);
  expect(new Headers(network.mock.calls[0][1]?.headers).get("Authorization")).toBe("Bearer java-access");
  expect(response.headers.getSetCookie().every(value => value.includes("Max-Age=0"))).toBe(true);
  network.mockResolvedValueOnce(profile());
  expect((await readServerSession(cookie))?.email).toBe(user.email);
});

it("does not invent an idle timeout over Java refresh validity", async () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-02T10:00:00Z"));
  vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ success: true, data: { tokens } }));
  vi.setSystemTime(new Date("2026-11-02T14:00:00Z"));
  expect((await request("/auth/refresh", {}, cookie)).status).toBe(200);
});

it("leaves the refresh cookie available after Java rejects the access token", async () => {
  const network = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(null, { status: 401 }));
  const me = await request("/me", undefined, cookie);
  expect(me.status).toBe(401); expect(me.headers.getSetCookie()).toEqual([]);
  network.mockResolvedValueOnce(Response.json({ success: true, data: { tokens } }));
  expect((await request("/auth/refresh", {}, cookie)).status).toBe(200);
});

it("asks Java to validate forged cookies rather than trusting decoded claims", async () => {
  const network = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 401 }));
  expect(await readServerSession("access_token=forged")).toBeNull();
  expect((await request("/me", undefined, "access_token=forged")).status).toBe(401);
  expect(network).toHaveBeenCalledTimes(2);
  expect(await readServerSession(null)).toBeNull();
});

it("reads current Java role/status without a previous local login", async () => {
  const network = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(profile());
  expect((await readServerSession(cookie))?.role).toBe("candidate");
  network.mockResolvedValueOnce(Response.json({ success: true, data: { profile: { ...user, roles: ["RECRUITER"] } } }));
  expect((await readServerSession(cookie))?.role).toBe("recruiter");
  network.mockResolvedValueOnce(new Response(null, { status: 403 }));
  expect(await readServerSession(cookie)).toBeNull();
});

it("binds browser-CSRF to the refresh cookie without storing a second session", async () => {
  expect((await request("/auth/csrf", undefined, cookie)).status).toBe(200);
  const network = vi.spyOn(globalThis, "fetch");
  expect((await request("/auth/logout", {}, "access_token=java-access; refresh_token=other", csrf)).status).toBe(403);
  expect(network).not.toHaveBeenCalled();
});

it.each(["development", "production"])("forwards recovery to Java and restricts test tokens in %s", async mode => {
  vi.stubEnv("NODE_ENV", mode);
  const network = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ success: true, message: "upstream text", resetToken: "java-reset-token" }));
  const response = await request("/auth/forgot-password", { email: user.email, role: "ADMIN" });
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  const body = await response.json();
  expect(body).toEqual({ message: "Yêu cầu khôi phục mật khẩu đã được tiếp nhận.", ...(mode === "development" ? { resetToken: "java-reset-token" } : {}) });
  expect(network).toHaveBeenCalledTimes(1);
  expect(network.mock.calls[0][0]).toBe("http://auth.test/api/v1/auth/forgot-password");
  expect(JSON.parse(String(network.mock.calls[0][1]?.body))).toEqual({ email: user.email });
  expect(new Headers(network.mock.calls[0][1]?.headers).has("Authorization")).toBe(false);
});

it("accepts recovery without a token for unknown emails and rejects invalid upstream responses", async () => {
  const network = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(Response.json({ success: true, message: "ok" }));
  const response = await request("/auth/forgot-password", { email: "unknown@example.test" });
  expect(response.status).toBe(200);
  expect(await response.json()).not.toHaveProperty("resetToken");
  network.mockResolvedValueOnce(Response.json({ success: false, message: "failed" }));
  expect((await request("/auth/forgot-password", { email: user.email })).status).toBe(503);
});

it("delegates password reset to Java and maps its used/expired token error", async () => {
  const network = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(Response.json({ success: true, message: "ok" }));
  const body = { token: "java-reset-token", newPassword: "abcdefgh", confirmPassword: "abcdefgh" };
  const success = await request("/auth/reset-password", body);
  expect(success.status).toBe(200);
  expect(await success.json()).toEqual({ message: "Đặt lại mật khẩu thành công." });
  expect(network.mock.calls[0][0]).toBe("http://auth.test/api/v1/auth/reset-password");
  expect(JSON.parse(String(network.mock.calls[0][1]?.body))).toEqual(body);
  network.mockResolvedValueOnce(Response.json({ error: { code: "PASSWORD_RESET_TOKEN_INVALID", message: "internal info" } }, { status: 400 }));
  const used = await request("/auth/reset-password", body);
  expect(used.status).toBe(400);
  expect((await used.json()).error.code).toBe("INVALID_RESET_TOKEN");
});

it.each(["GOOGLE", "FACEBOOK"])("exchanges %s provider tokens for HttpOnly Java cookies", async provider => {
  const network = vi.spyOn(globalThis, "fetch").mockResolvedValue(authResult());
  const response = await request("/auth/social-login", { provider, token: "provider-test-token", role: "candidate" });
  expect(response.status).toBe(200);
  expect(network.mock.calls[0][0]).toBe("http://auth.test/api/v1/auth/social-login");
  expect(JSON.parse(String(network.mock.calls[0][1]?.body))).toEqual({ provider, token: "provider-test-token", role: "CANDIDATE" });
  expect(response.headers.getSetCookie().every(value => value.includes("HttpOnly"))).toBe(true);
  expect(cookies(response)).toBe(cookie);
  const body = await response.json();
  // The verified Java identity must match the selected login role.
  expect(body.user.role).toBe("candidate");
  expect(body.redirectTo).toBe("/candidate/dashboard");
  expect(body.csrfToken).toBe(csrf);
  for (const token of [tokens.accessToken, tokens.refreshToken, "provider-test-token"])
    expect(JSON.stringify(body)).not.toContain(token);
});

it.each(["GOOGLE", "FACEBOOK"])("rejects %s login when Java returns a different role", async provider => {
  const network = vi.spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(authResult())
    .mockResolvedValueOnce(Response.json({ success: true, message: "Logged out" }));
  const response = await request("/auth/social-login", { provider, token: "provider-test-token", role: "recruiter" });
  expect(response.status).toBe(403);
  expect((await response.json()).error.code).toBe("AUTH_ROLE_MISMATCH");
  expect(response.headers.has("set-cookie")).toBe(false);
  expect(network.mock.calls[1][0]).toBe("http://auth.test/api/v1/auth/logout");
});

it("rejects social admin/local inputs and cross-origin requests before contacting Java", async () => {
  const network = vi.spyOn(globalThis, "fetch");
  for (const change of [{ role: "admin" }, { provider: "LOCAL" }, { token: "" }]) {
    expect((await request("/auth/social-login", { provider: "GOOGLE", token: "test", role: "candidate", ...change })).status).toBe(422);
  }
  const crossOrigin = await handleBffRequest(new Request("http://localhost/api/bff/auth/social-login", {
    method: "POST", headers: { Origin: "https://untrusted.test", "Content-Type": "application/json" },
    body: JSON.stringify({ provider: "GOOGLE", token: "test", role: "candidate" }),
  }));
  expect(crossOrigin.status).toBe(403);
  expect(network).not.toHaveBeenCalled();
});

it("returns social login failure without creating cookies when Java rejects the provider token", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ error: { code: "SOCIAL_AUTH_FAILED", message: "provider diagnostics" } }, { status: 401 }));
  const response = await request("/auth/social-login", { provider: "GOOGLE", token: "invalid-token", role: "candidate" });
  expect(response.status).toBe(401);
  expect(response.headers.getSetCookie()).toEqual([]);
  expect((await response.json()).error.code).toBe("INVALID_CREDENTIALS");
});
