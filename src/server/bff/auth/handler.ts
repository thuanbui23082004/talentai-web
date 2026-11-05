import { NextResponse } from "next/server";
import { z } from "zod";
import type { components } from "@/lib/api/generated/schema";
import { getAuthApiUrl } from "@/lib/env";
import { apiError } from "../responses";
import {
    authSchema,
    callAuth,
    mapUser,
    messageSchema,
    passwordResetSchema,
    profileSchema,
    refreshSchema,
} from "./backend";
import {
    csrfTokenFor,
    hasValidCsrf,
    isTrustedOrigin,
    readAuthCookies,
    setAuthCookies,
} from "./cookies";

/* ------------------------------------------------------------------ */
/* 1. Hằng số & cấu hình                                               */
/* ------------------------------------------------------------------ */

/** Các route được hỗ trợ và phương thức HTTP tương ứng. */
const ROUTES: Record<string, string> = {
    "/auth/login": "POST",
    "/auth/social-login": "POST",
    "/auth/register": "POST",
    "/auth/refresh": "POST",
    "/auth/logout": "POST",
    "/auth/csrf": "GET",
    "/me": "GET",
    "/auth/change-password": "POST",
    "/auth/reset-password": "POST",
    "/auth/forgot-password": "POST",
};

/** Các route thay đổi trạng thái phiên, bắt buộc phải có CSRF token hợp lệ. */
const ROUTES_REQUIRING_CSRF = ["/auth/logout", "/auth/change-password"];

/** Giới hạn kích thước body JSON (ký tự). */
const MAX_BODY_LENGTH = 16_384;

const NO_STORE = { "Cache-Control": "no-store" };

type AuthCookies = ReturnType<typeof readAuthCookies>;

/* ------------------------------------------------------------------ */
/* 2. Schema kiểm tra dữ liệu đầu vào                                  */
/* ------------------------------------------------------------------ */

// Chỉ kiểm tra "hình dạng" dữ liệu. Quy tắc mật khẩu, khóa tài khoản
// và token đều do backend Java quyết định.
const loginInput = z.object({
    email: z.string().min(1),
    password: z.string().min(1),
    role: z.enum(["candidate", "recruiter", "admin"]).optional(),
});

const registerInput = loginInput.extend({
    fullName: z.string(),
    role: z.enum(["candidate", "recruiter"]),
});

const changePasswordInput = z.object({
    currentPassword: z.string(),
    newPassword: z.string(),
    confirmPassword: z.string(),
});

const resetPasswordInput = z.object({
    token: z.string(),
    newPassword: z.string(),
    confirmPassword: z.string(),
});

/** Route nào dùng schema nào để kiểm tra body. */
const bodySchemas = {
    "/auth/login": loginInput,
    "/auth/social-login": z.object({
        provider: z.enum(["GOOGLE", "FACEBOOK"]),
        token: z.string().min(1),
        role: z.enum(["candidate", "recruiter"]),
    }),
    "/auth/register": registerInput,
    "/auth/change-password": changePasswordInput,
    "/auth/reset-password": resetPasswordInput,
    "/auth/forgot-password": z.object({ email: z.string().min(1) }),
} as const;

/* ------------------------------------------------------------------ */
/* 3. Các phản hồi lỗi dùng chung                                      */
/* ------------------------------------------------------------------ */

const unavailable = () =>
    apiError(503, "SERVICE_UNAVAILABLE", "Dịch vụ xác thực chưa sẵn sàng.");

/** Chưa đăng nhập. Nếu còn refresh token thì báo "hết phiên" để client thử làm mới. */
const missingSession = (refreshToken?: string) =>
    apiError(
        401,
        refreshToken ? "SESSION_EXPIRED" : "UNAUTHENTICATED",
        "Vui lòng đăng nhập hoặc làm mới xác thực.",
    );

const emailAlreadyExists = () =>
    NextResponse.json(
        {
            error: {
                code: "EMAIL_ALREADY_EXISTS",
                message: "Email đã được sử dụng.",
                fieldErrors: [
                    {
                        field: "email",
                        code: "EMAIL_ALREADY_EXISTS",
                        message: "Email đã được sử dụng.",
                    },
                ],
            },
        },
        { status: 409, headers: NO_STORE },
    );

/* ------------------------------------------------------------------ */
/* 4. Chuyển lỗi từ backend Java sang lỗi của BFF                      */
/* ------------------------------------------------------------------ */

/** Đọc mã lỗi (`error.code`) trong body lỗi của backend; không có thì trả chuỗi rỗng. */
async function readUpstreamErrorCode(upstream: Response): Promise<string> {
    const parsed = z
        .object({ error: z.object({ code: z.string() }) })
        .safeParse(await upstream.json().catch(() => null));
    return parsed.success ? parsed.data.error.code : "";
}

async function upstreamError(upstream: Response, path: string) {
    const code = await readUpstreamErrorCode(upstream);
    const status = upstream.status;

    if (code === "ACCOUNT_DISABLED" || status === 423)
        return apiError(423, "ACCOUNT_LOCKED", "Tài khoản đang bị khóa.");

    if (status === 401)
        return apiError(
            401,
            path === "/auth/login" || path === "/auth/social-login" ? "INVALID_CREDENTIALS" : "SESSION_EXPIRED",
            "Thông tin xác thực không hợp lệ.",
        );

    if (status === 409) return emailAlreadyExists();

    if (status === 403)
        return apiError(
            403,
            "FORBIDDEN",
            "Bạn không có quyền thực hiện thao tác này.",
        );

    if (status === 429)
        return apiError(429, "RATE_LIMITED", "Bạn thao tác quá nhanh.");

    if (code === "INVALID_PASSWORD" && path === "/auth/change-password")
        return apiError(
            400,
            "CURRENT_PASSWORD_INCORRECT",
            "Mật khẩu hiện tại không đúng.",
        );

    if (code === "PASSWORD_RESET_TOKEN_INVALID" && path === "/auth/reset-password")
        return apiError(400, "INVALID_RESET_TOKEN", "Liên kết không hợp lệ hoặc đã hết hạn.");

    if (status === 400 || status === 422)
        return apiError(
            422,
            "VALIDATION_FAILED",
            "Vui lòng kiểm tra thông tin đã nhập.",
        );

    // Mọi trường hợp còn lại coi như backend không sẵn sàng.
    return unavailable();
}

/* ------------------------------------------------------------------ */
/* 5. Gộp các yêu cầu refresh trùng nhau                               */
/* ------------------------------------------------------------------ */

// Chỉ dùng để gộp các request đang chạy dở (in-flight), KHÔNG phải nơi lưu phiên.
// Xong request là xóa ngay. Việc xoay vòng/thu hồi token do backend Java quyết định.
const inFlightRefreshes = new Map<
    string,
    Promise<z.infer<typeof refreshSchema>>
>();

async function refreshTokens(backend: string, refreshToken: string) {
    const key = csrfTokenFor({ refresh: refreshToken });

    const existing = inFlightRefreshes.get(key);
    if (existing) return existing;

    const pending = (async () => {
        const upstream = await callAuth(backend, "refresh", { refreshToken });
        // Ném Response ra ngoài để khối catch ở handleAuthRequest xử lý.
        if (!upstream.ok) throw await upstreamError(upstream, "/auth/refresh");
        return refreshSchema.parse(await upstream.json());
    })().finally(() => inFlightRefreshes.delete(key));

    inFlightRefreshes.set(key, pending);
    return pending;
}

/* ------------------------------------------------------------------ */
/* 6. Hàm xử lý cho từng route                                         */
/* ------------------------------------------------------------------ */

/** GET /auth/csrf: cấp CSRF token cho trình duyệt (không chứng minh danh tính). */
function handleCsrf(cookies: AuthCookies) {
    const csrfToken = csrfTokenFor(cookies);
    return csrfToken
        ? NextResponse.json({ csrfToken }, { headers: NO_STORE })
        : missingSession();
}

/** GET /me: lấy thông tin người dùng hiện tại bằng access token. */
async function handleMe(backend: string, cookies: AuthCookies) {
    if (!cookies.access) return missingSession(cookies.refresh);

    const upstream = await callAuth(backend, "me", undefined, cookies.access);
    if (!upstream.ok) return upstreamError(upstream, "/me");

    const user = mapUser(
        profileSchema.parse(await upstream.json()).data.profile,
    );
    if (!user) return unavailable();

    return NextResponse.json(user, { headers: NO_STORE });
}

/** POST /auth/refresh: đổi refresh token lấy cặp token mới và set lại cookie. */
async function handleRefresh(
    request: Request,
    backend: string,
    cookies: AuthCookies,
) {
    if (!cookies.refresh) return missingSession();

    const { tokens } = (await refreshTokens(backend, cookies.refresh)).data;
    const body: components["schemas"]["AuthRefreshResponse"] = {
        csrfToken: csrfTokenFor({ refresh: tokens.refreshToken }),
        expiresInSeconds: tokens.expiresInSeconds,
    };
    return setAuthCookies(NextResponse.json(body), request, tokens);
}

/** POST /auth/logout: thu hồi refresh token và xóa cookie của trình duyệt này. */
async function handleLogout(
    request: Request,
    backend: string,
    cookies: AuthCookies,
) {
    if (!cookies.refresh) return missingSession();

    const upstream = await callAuth(backend, "logout", {
        refreshToken: cookies.refresh,
    });

    if (!upstream.ok) {
        const error = await upstreamError(upstream, "/auth/logout");
        // Token đã hết hạn (401) thì vẫn xóa cookie để trình duyệt thoát phiên.
        if (upstream.status === 401) {
            return setAuthCookies(
                NextResponse.json(await error.json(), { status: error.status }),
                request,
            );
        }
        return error;
    }

    messageSchema.parse(await upstream.json());
    return setAuthCookies(new NextResponse(null, { status: 204 }), request);
}

/** Đọc và kiểm tra body JSON. Trả về `{ data }` nếu hợp lệ, `{ error }` nếu không. */
async function readJsonBody<S extends z.ZodTypeAny>(
    request: Request,
    schema: S,
): Promise<{ data: z.infer<S> } | { error: Response }> {
    const invalid = (message: string) => ({
        error: apiError(422, "VALIDATION_FAILED", message),
    });

    if (!request.headers.get("content-type")?.includes("application/json"))
        return invalid("Vui lòng gửi dữ liệu JSON.");

    const text = await request.text();
    if (text.length > MAX_BODY_LENGTH)
        return invalid("Dữ liệu gửi lên quá dài.");

    let json: unknown;
    try {
        json = JSON.parse(text);
    } catch {
        return invalid("JSON không hợp lệ.");
    }

    const parsed = schema.safeParse(json);
    if (!parsed.success) return invalid("Dữ liệu gửi lên không hợp lệ.");

    return { data: parsed.data };
}

/** Đổi dữ liệu đăng ký của frontend sang định dạng backend Java mong đợi. */
function toRegisterPayload(input: z.infer<typeof registerInput>) {
    return {
        email: input.email,
        password: input.password,
        displayName: input.fullName,
        role: input.role.toUpperCase(),
    };
}

function toLoginPayload({ email, password }: z.infer<typeof loginInput>) {
    return { email, password };
}

/**
 * Xử lý các route nhận body JSON:
 * login, register, change-password, reset-password.
 */
async function handleJsonRoute(
    request: Request,
    backend: string,
    cookies: AuthCookies,
    path: keyof typeof bodySchemas,
) {
    // Đổi mật khẩu cần access token.
    if (path === "/auth/change-password" && !cookies.access)
        return missingSession(cookies.refresh);

    const body = await readJsonBody(request, bodySchemas[path]);
    if ("error" in body) return body.error;

    const payload =
        path === "/auth/register"
            ? toRegisterPayload(body.data as z.infer<typeof registerInput>)
            : path === "/auth/social-login"
              ? { ...body.data, role: (body.data as z.infer<typeof bodySchemas["/auth/social-login"]>).role.toUpperCase() }
              : path === "/auth/login"
                ? toLoginPayload(body.data as z.infer<typeof loginInput>)
                : body.data;

    const upstream = await callAuth(
        backend,
        path.slice("/auth/".length), // "/auth/login" -> "login"
        payload,
        path === "/auth/change-password" ? cookies.access : undefined,
    );
    if (!upstream.ok) return upstreamError(upstream, path);

    if (path === "/auth/login" || path === "/auth/register" || path === "/auth/social-login")
        return handleLoginOrRegisterSuccess(request, upstream, path, backend, "role" in body.data ? body.data.role : undefined);

    if (path === "/auth/forgot-password") {
        const result = passwordResetSchema.parse(await upstream.json());
        const response: components["schemas"]["ForgotPasswordResponse"] = {
            message: "Yêu cầu khôi phục mật khẩu đã được tiếp nhận.",
            // Java currently returns a test token instead of sending email.
            // Only expose that development flow when running `next dev`.
            ...(process.env.NODE_ENV === "development" && result.resetToken
                ? { resetToken: result.resetToken }
                : {}),
        };
        return NextResponse.json(response, { headers: NO_STORE });
    }

    // change-password / reset-password: backend chỉ trả về một thông điệp.
    messageSchema.parse(await upstream.json());
    const response = NextResponse.json(
        {
            message:
                path === "/auth/change-password"
                    ? "Đổi mật khẩu thành công. Vui lòng đăng nhập lại."
                    : "Đặt lại mật khẩu thành công.",
        },
        { headers: NO_STORE },
    );

    // Chỉ xóa cookie của trình duyệt này. Việc thu hồi ở các trình duyệt khác do backend lo.
    return path === "/auth/change-password"
        ? setAuthCookies(response, request)
        : response;
}

/** Phản hồi thành công của login / register. */
async function handleLoginOrRegisterSuccess(
    request: Request,
    upstream: Response,
    path: "/auth/login" | "/auth/register" | "/auth/social-login",
    backend: string,
    expectedRole?: components["schemas"]["User"]["role"],
) {
    const result = authSchema.parse(await upstream.json());
    const user = mapUser(result.data.user);
    if (!user) return unavailable();

    const tokens = result.data.tokens;
    if (expectedRole && user.role !== expectedRole) {
        // Revoke only the newly issued session; never replace the browser's existing cookies.
        await callAuth(backend, "logout", { refreshToken: tokens.refreshToken }).catch(() => undefined);
        return apiError(403, "AUTH_ROLE_MISMATCH", "Tài khoản không thuộc loại tài khoản đang chọn. Vui lòng chọn đúng loại tài khoản để đăng nhập.");
    }
    const session: components["schemas"]["AuthSessionResponse"] = {
        user,
        expiresInSeconds: tokens.expiresInSeconds,
        csrfToken: csrfTokenFor({ refresh: tokens.refreshToken }),
        redirectTo: path === "/auth/register" ? "/" : `/${user.role}/dashboard`,
    };
    return setAuthCookies(NextResponse.json(session, { status: path === "/auth/register" ? 201 : 200 }), request, tokens);
}

/* ------------------------------------------------------------------ */
/* 7. Điểm vào chính                                                   */
/* ------------------------------------------------------------------ */

/** Lấy đường dẫn nội bộ, bỏ tiền tố "/api/bff". */
function getBffPath(request: Request) {
    return new URL(request.url).pathname.replace("/api/bff", "");
}

/** Request này có thuộc nhóm xác thực không? (/auth/* hoặc GET /me) */
export function isAuthRequest(request: Request) {
    const path = getBffPath(request);
    return (
        path.startsWith("/auth/") ||
        (path === "/me" && request.method === "GET")
    );
}

export async function handleAuthRequest(
    request: Request,
    backendOverride?: string,
): Promise<Response> {
    const path = getBffPath(request);

    // --- Kiểm tra sơ bộ ---
    if (!Object.hasOwn(ROUTES, path)) return unavailable();

    if (request.method !== ROUTES[path])
        return apiError(405, "BAD_REQUEST", "Phương thức không được hỗ trợ.");

    if (request.method !== "GET" && !isTrustedOrigin(request))
        return apiError(403, "CSRF_TOKEN_INVALID", "Yêu cầu không hợp lệ.");

    const cookies = readAuthCookies(request.headers.get("cookie"));
    const backend = backendOverride ?? getAuthApiUrl();

    try {
        // --- Chặn CSRF cho các thao tác thay đổi phiên ---
        if (ROUTES_REQUIRING_CSRF.includes(path) && !hasValidCsrf(request))
            return apiError(
                403,
                "CSRF_TOKEN_INVALID",
                "Phiên thao tác không hợp lệ.",
            );

        // --- Điều hướng đến hàm xử lý phù hợp ---
        switch (path) {
            case "/auth/csrf":
                return handleCsrf(cookies);
            case "/me":
                return await handleMe(backend, cookies);
            case "/auth/refresh":
                return await handleRefresh(request, backend, cookies);
            case "/auth/logout":
                return await handleLogout(request, backend, cookies);
            default:
                // login, register, change-password, reset-password
                return await handleJsonRoute(
                    request,
                    backend,
                    cookies,
                    path as keyof typeof bodySchemas,
                );
        }
    } catch (error) {
        // Nhiều request refresh đồng thời dùng chung một Promise,
        // nên mỗi bên phải nhận một bản clone độc lập của Response lỗi.
        return error instanceof Response ? error.clone() : unavailable();
    }
}
