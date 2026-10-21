import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import type { components } from "@/lib/api/generated/schema";
import { loginSchema, registerSchema } from "@/lib/auth/validation";
import { apiError } from "./responses";
import { readAuthCookies, setSessionCookies } from "./cookies";
import { addAccount, findUser, getAuthStore, IDLE_TIMEOUT_SECONDS, issueSession, readSession, revokeSession, verifyPassword, type MockSession } from "./mock-auth-store";

function validationError(error: ZodError) {
  const body: components["schemas"]["ApiError"] = { error: { code: "VALIDATION_FAILED", message: "Dữ liệu không hợp lệ.", fieldErrors: error.issues.map((issue) => ({ field: String(issue.path[0] ?? "form"), code: "VALIDATION_FAILED", message: issue.message })) } };
  return NextResponse.json(body, { status: 422, headers: { "Cache-Control": "no-store" } });
}

function sessionResponse(request: Request, session: MockSession) {
  const user = findUser(session)!;
  const body: components["schemas"]["AuthSessionResponse"] = { user, csrfToken: session.csrf, expiresAt: new Date(session.expiresAt).toISOString(), idleTimeoutSeconds: IDLE_TIMEOUT_SECONDS, redirectTo: `/${user.role}/dashboard` };
  return setSessionCookies(NextResponse.json(body), request, session);
}

function expired(request: Request) {
  return setSessionCookies(NextResponse.json({ error: { code: "SESSION_EXPIRED", message: "Phiên đăng nhập đã hết hạn." } } satisfies components["schemas"]["ApiError"], { status: 401 }), request);
}

function locked(lockedUntil?: number) {
  const body: components["schemas"]["ApiError"] = { error: { code: "ACCOUNT_LOCKED", message: "Tài khoản đang bị khóa hoặc tạm khóa.", ...(lockedUntil ? { details: { lockedUntil: new Date(lockedUntil).toISOString() } } : {}) } };
  return NextResponse.json(body, { status: 423, headers: { "Cache-Control": "no-store" } });
}

export async function handleMockAuth(request: Request): Promise<Response | undefined> {
  const path = new URL(request.url).pathname.replace("/api/bff", "");
  if (!["/auth/register", "/auth/login", "/auth/logout", "/auth/refresh", "/auth/csrf", "/me"].includes(path)) return undefined;
  const expectedMethod = ["/me", "/auth/csrf"].includes(path) ? "GET" : "POST";
  if (request.method !== expectedMethod) return apiError(405, "BAD_REQUEST", "Phương thức không được hỗ trợ.");
  // Protect anonymous login/registration and refresh too; don't rely on SameSite alone.
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  const requestUrl = new URL(request.url);
  // Next may normalize request.url to its internal hostname. The HTTP Host
  // describes the browser-facing target; never trust a client-supplied role or
  // an arbitrary forwarded-host value when checking browser Origin.
  let sameOrigin = !origin;
  if (origin) {
    try {
      const source = new URL(origin);
      sameOrigin = source.host === (request.headers.get("host") ?? requestUrl.host) && source.protocol === requestUrl.protocol;
    } catch { sameOrigin = false; }
  }
  if (request.method !== "GET" && (!sameOrigin || fetchSite === "cross-site")) return apiError(403, "CSRF_TOKEN_INVALID", "Yêu cầu không hợp lệ.");
  const cookie = readAuthCookies(request.headers.get("cookie"));

  if (path === "/auth/register" || path === "/auth/login") {
    if (!request.headers.get("content-type")?.includes("application/json")) return apiError(422, "VALIDATION_FAILED", "Vui lòng gửi dữ liệu JSON.");
    const text = await request.text();
    if (text.length > 16_384) return apiError(422, "VALIDATION_FAILED", "Dữ liệu gửi lên quá dài.");
    let body: unknown;
    try { body = JSON.parse(text); } catch { return apiError(422, "VALIDATION_FAILED", "Dữ liệu gửi lên không hợp lệ."); }
    if (path === "/auth/register") {
      const parsed = registerSchema.safeParse(body);
      if (!parsed.success) return validationError(parsed.error);
      if (getAuthStore().accounts.has(parsed.data.email)) {
        return NextResponse.json({ error: { code: "EMAIL_ALREADY_EXISTS", message: "Email đã được sử dụng.", fieldErrors: [{ field: "email", code: "EMAIL_ALREADY_EXISTS", message: "Email đã được sử dụng." }] } } satisfies components["schemas"]["ApiError"], { status: 409, headers: { "Cache-Control": "no-store" } });
      }
      const user = addAccount(parsed.data);
      const response: components["schemas"]["RegisterResponse"] = { user, message: "Đăng ký thành công. Vui lòng đăng nhập." };
      return NextResponse.json(response, { status: 201, headers: { "Cache-Control": "no-store" } });
    }
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);
    const store = getAuthStore();
    const { email, password } = parsed.data;
    const now = Date.now();
    for (const [key, attempt] of store.attempts) if (attempt.lockedUntil <= now && attempt.failures.every((time) => now - time >= 600_000)) store.attempts.delete(key);
    const attempt = store.attempts.get(email) ?? { failures: [], lockedUntil: 0 };
    if (attempt.lockedUntil > now) return locked(attempt.lockedUntil);
    const record = store.accounts.get(email);
    if (!verifyPassword(record, password)) {
      attempt.failures = attempt.failures.filter((time) => now - time < 600_000);
      attempt.failures.push(now);
      if (attempt.failures.length > 5) attempt.lockedUntil = now + 900_000;
      store.attempts.set(email, attempt);
      return attempt.lockedUntil > now ? locked(attempt.lockedUntil) : apiError(401, "INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng.");
    }
    if (record!.user.status !== "active") return locked();
    store.attempts.delete(email);
    // Session fixation: revoke the browser's previous session before a new login.
    const previous = readSession(cookie.access, false, false) ?? readSession(cookie.refresh, true, false);
    if (previous) revokeSession(previous);
    return sessionResponse(request, issueSession(record!.user));
  }

  if (path === "/auth/refresh") {
    const session = readSession(cookie.refresh, true, false);
    if (!session) return expired(request);
    return sessionResponse(request, issueSession(findUser(session)!, session));
  }
  const session = readSession(cookie.access, false, false) ?? (path === "/auth/logout" ? readSession(cookie.refresh, true, false) : undefined);
  if (!session) {
    if (path === "/auth/logout") return expired(request);
    return apiError(401, cookie.refresh ? "SESSION_EXPIRED" : "UNAUTHENTICATED", "Vui lòng đăng nhập để tiếp tục.");
  }
  if (path === "/auth/logout") {
    if (request.headers.get("x-csrf-token") !== session.csrf) return apiError(403, "CSRF_TOKEN_INVALID", "Yêu cầu không hợp lệ. Vui lòng tải lại trang.");
    revokeSession(session);
    return setSessionCookies(new NextResponse(null, { status: 204 }), request);
  }
  // Requests represent activity; no background polling keeps the session alive.
  session.lastActivity = Date.now();
  if (path === "/auth/csrf") return NextResponse.json({ csrfToken: session.csrf } satisfies components["schemas"]["CsrfTokenResponse"], { headers: { "Cache-Control": "no-store" } });
  return NextResponse.json(findUser(session)!, { headers: { "Cache-Control": "no-store" } });
}
