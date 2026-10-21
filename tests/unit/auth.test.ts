import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleMockAuth } from "@/server/bff/mock-auth";
import { getAuthStore, resetMockAuth } from "@/server/bff/mock-auth-store";
import { readServerSession } from "@/server/bff/session";
import { loginSchema, registerSchema } from "@/lib/auth/validation";
import { toApiError } from "@/lib/api/errors";
import example from "../../contracts/examples/auth.json";

const origin = "http://localhost";
function req(path: string, body?: unknown, cookie = "", headers: Record<string, string> = {}) {
  return new Request(`${origin}/api/bff${path}`, { method: body === undefined ? "GET" : "POST", headers: { ...(body === undefined ? {} : { "Content-Type": "application/json", Origin: origin }), Cookie: cookie, ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}
function cookies(response: Response) { return response.headers.getSetCookie().map((entry) => entry.split(";")[0]).join("; "); }
async function call(request: Request) { const result = await handleMockAuth(request); expect(result).toBeDefined(); return result!; }
async function login(email = "candidate@example.com", cookie = "") {
  const response = await call(req("/auth/login", { ...example.loginRequest, email }, cookie));
  expect(response.status).toBe(200);
  return { response, cookie: cookies(response), body: await response.json() };
}

describe("contract-driven mock authentication", () => {
  beforeEach(() => { resetMockAuth(); vi.stubEnv("DATA_MODE", "mock"); });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); resetMockAuth(); });

  it("normalizes email, validates password rules and refuses admin registration", () => {
    expect(loginSchema.parse({ email: " Candidate@Example.com ", password: "x" }).email).toBe("candidate@example.com");
    for (const change of [{ role: "admin" }, { acceptedPrivacyPolicy: false }, { confirmPassword: "mismatch" }, { password: "alllowercase" }, { password: "A".repeat(65) }, { fullName: "A" }, { phone: "" }, { phone: "123" }, { phone: "090abc1234" }, { phone: "1".repeat(16) }]) {
      expect(registerSchema.safeParse({ ...example.registerRequest, ...change }).success).toBe(false);
    }
  });

  it("creates a user without a session and reports duplicate email at the field", async () => {
    const response = await call(req("/auth/register", example.registerRequest));
    expect(response.status).toBe(201);
    expect(response.headers.getSetCookie()).toEqual([]);
    const body = await response.json();
    expect(body.user.role).toBe("candidate");
    expect(body.user.phone).toBe(example.registerRequest.phone);
    expect(JSON.stringify(body)).not.toContain(example.registerRequest.password);
    const record = getAuthStore().accounts.get(body.user.email)!;
    expect(record.hash.toString("hex")).not.toContain(example.registerRequest.password);
    const duplicate = await call(req("/auth/register", example.registerRequest));
    expect(duplicate.status).toBe(409);
    expect(await duplicate.json()).toEqual(example.emailAlreadyExists);
    expect((await login(body.user.email)).body.user.id).toBe(body.user.id);
  });

  it("sets server-owned roles, httpOnly cookies and safe session bodies", async () => {
    for (const [email, role] of [["candidate@example.com", "candidate"], ["recruiter@example.com", "recruiter"], ["admin@example.com", "admin"]]) {
      const result = await login(email);
      expect(result.body.user.role).toBe(role);
      expect(result.body.redirectTo).toBe(`/${role}/dashboard`);
      expect(result.body.idleTimeoutSeconds).toBe(1800);
      expect(result.body.csrfToken).toBeTruthy();
      expect(result.body.access_token).toBeUndefined();
      for (const cookie of result.response.headers.getSetCookie()) {
        expect(cookie).toContain("HttpOnly"); expect(cookie).toContain("SameSite=lax"); expect(cookie).toContain("Path=/");
      }
      expect((await (await call(req("/me", undefined, result.cookie))).json()).role).toBe(role);
      expect(readServerSession(result.cookie)?.role).toBe(role);
    }
    expect(readServerSession("access_token=admin; role=admin")).toBeNull();
  });

  it("uses identical credential errors for wrong email and wrong password", async () => {
    for (const email of ["candidate@example.com", "missing@example.com"]) {
      const response = await call(req("/auth/login", { email, password: "wrong" }));
      expect(response.status).toBe(401); expect(await response.json()).toEqual(example.invalidCredentials);
    }
  });

  it("locks after more than five failures in ten minutes, then unlocks after fifteen minutes", async () => {
    vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-10-20T00:00:00Z"));
    for (let count = 0; count < 6; count++) {
      const response = await call(req("/auth/login", { ...example.loginRequest, password: "wrong" }));
      expect(response.status).toBe(count < 5 ? 401 : 423);
      if (count === 5) expect((await response.json()).error.details.lockedUntil).toBe("2026-10-20T00:15:00.000Z");
    }
    expect((await call(req("/auth/login", example.loginRequest))).status).toBe(423);
    vi.setSystemTime(new Date("2026-10-20T00:15:01Z"));
    await login();
  });

  it("refuses locked users, invalid payloads, self-assigned roles and cross-site submissions", async () => {
    expect((await call(req("/auth/login", { ...example.loginRequest, email: "locked@example.com" }))).status).toBe(423);
    expect((await call(req("/auth/register", { ...example.registerRequest, role: "admin" }))).status).toBe(422);
    expect((await call(req("/auth/login", { email: "not-an-email", password: "" }))).status).toBe(422);
    expect((await call(req("/auth/login", example.loginRequest, "", { Origin: "https://attacker.test" }))).status).toBe(403);
    expect((await call(req("/auth/login", example.loginRequest, "", { Origin: "http://127.0.0.1:3100", Host: "127.0.0.1:3100" }))).status).toBe(200);
    expect((await call(req("/auth/login", example.loginRequest, "", { Origin: "null" }))).status).toBe(403);
    const response = await call(req("/auth/login", { ...example.loginRequest, role: "admin" }));
    expect((await response.json()).user.role).toBe("candidate");
  });

  it("requires CSRF for logout, does not mutate on GET, and revokes both tokens", async () => {
    const session = await login();
    expect((await call(req("/auth/logout", undefined, session.cookie))).status).toBe(405);
    expect((await call(req("/auth/logout", {}, session.cookie))).status).toBe(403);
    expect((await call(req("/me", undefined, session.cookie))).status).toBe(200);
    const csrf = await (await call(req("/auth/csrf", undefined, session.cookie))).json();
    const response = await call(req("/auth/logout", {}, session.cookie, { "X-CSRF-Token": csrf.csrfToken }));
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(response.headers.getSetCookie().every((entry) => entry.includes("Max-Age=0"))).toBe(true);
    expect((await call(req("/me", undefined, session.cookie))).status).toBe(401);
    expect((await call(req("/auth/refresh", {}, session.cookie))).status).toBe(401);
    expect(readServerSession(session.cookie)).toBeNull();
  });

  it("rotates refresh tokens once, invalidates old credentials and preserves the absolute expiry", async () => {
    const first = await login();
    const response = await call(req("/auth/refresh", {}, first.cookie));
    expect(response.status).toBe(200);
    expect((await response.json()).expiresAt).toBe(first.body.expiresAt);
    expect(cookies(response)).not.toBe(first.cookie);
    expect((await call(req("/auth/refresh", {}, first.cookie))).status).toBe(401);
    expect((await call(req("/me", undefined, first.cookie))).status).toBe(401);
    expect((await call(req("/me", undefined, cookies(response)))).status).toBe(200);
  });

  it("expires access after fifteen minutes and the full session after thirty idle minutes", async () => {
    vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-10-20T00:00:00Z"));
    const first = await login();
    vi.setSystemTime(new Date("2026-10-20T00:16:00Z"));
    const expiredAccess = await call(req("/me", undefined, first.cookie));
    expect(expiredAccess.status).toBe(401);
    expect((await expiredAccess.json()).error.code).toBe("SESSION_EXPIRED");
    expect(readServerSession(first.cookie)?.email).toBe("candidate@example.com");
    vi.setSystemTime(new Date("2026-10-20T00:31:00Z"));
    expect(readServerSession(first.cookie)).toBeNull();
    expect((await call(req("/auth/refresh", {}, first.cookie))).status).toBe(401);
  });

  it("prevents session fixation and uses secure cookies in HTTPS", async () => {
    const first = await login();
    await login("recruiter@example.com", first.cookie);
    expect(readServerSession(first.cookie)).toBeNull();
    const response = await call(new Request("https://localhost/api/bff/auth/login", { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://localhost" }, body: JSON.stringify(example.loginRequest) }));
    expect(response.headers.getSetCookie().every((entry) => entry.includes("Secure"))).toBe(true);
  });

  it("never shows raw server messages or drops field error locations", () => {
    const error = toApiError(409, { error: { code: "EMAIL_ALREADY_EXISTS", message: "SQL secret", fieldErrors: [{ field: "email", code: "EMAIL_ALREADY_EXISTS", message: "SQL secret" }] } });
    expect(error.fieldErrors?.[0].field).toBe("email");
    expect(error.message).not.toContain("SQL"); expect(error.fieldErrors?.[0].message).not.toContain("SQL");
  });
});
