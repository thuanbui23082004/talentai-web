import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export function readAuthCookies(header: string | null) {
    const entries = new Map(
        (header ?? "").split(";").map((part) => {
            const split = part.indexOf("=");
            return split < 0
                ? [part.trim(), ""]
                : [part.slice(0, split).trim(), part.slice(split + 1)];
        }),
    );
    return {
        access: entries.get("access_token"),
        refresh: entries.get("refresh_token"),
    };
}

export function setAuthCookies(
    response: NextResponse,
    request: Request,
    tokens?: {
        accessToken: string;
        refreshToken: string;
        expiresInSeconds: number;
    },
) {
    const options = {
        httpOnly: true,
        secure:
            new URL(request.url).protocol === "https:" ||
            process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
    };
    response.cookies.set("access_token", tokens?.accessToken ?? "", {
        ...options,
        maxAge: tokens?.expiresInSeconds ?? 0,
    });
    // Java does not return refresh expiry. Use a browser-session cookie rather
    // than inventing a second token lifetime; Java checks refresh validity.
    response.cookies.set("refresh_token", tokens?.refreshToken ?? "", {
        ...options,
        ...(tokens ? {} : { maxAge: 0 }),
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
}

export function getAuthCookieName() {
    return "access_token";
}

// Browser-CSRF protection only. This is not an identity or a session identifier.
// The secret stays in HttpOnly cookies; no per-user server state is required.
export function csrfTokenFor(cookies: { access?: string; refresh?: string }) {
    const secret = cookies.refresh || cookies.access;
    return secret
        ? createHmac("sha256", secret)
              .update("talentai-browser-csrf-v1")
              .digest("hex")
        : "";
}
export function isTrustedOrigin(request: Request) {
    if (request.headers.get("sec-fetch-site") === "cross-site") return false;
    const origin = request.headers.get("origin");
    if (!origin) return true;
    try {
        const source = new URL(origin),
            target = new URL(request.url);
        return (
            source.host === (request.headers.get("host") ?? target.host) &&
            source.protocol === target.protocol
        );
    } catch {
        return false;
    }
}
export function hasValidCsrf(request: Request) {
    const expected = csrfTokenFor(
        readAuthCookies(request.headers.get("cookie")),
    );
    const supplied = request.headers.get("x-csrf-token") ?? "";
    const a = Buffer.from(expected),
        b = Buffer.from(supplied);
    return !!expected && a.length === b.length && timingSafeEqual(a, b);
}
