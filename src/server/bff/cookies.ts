import { NextResponse } from "next/server";
import { ACCESS_SECONDS, type MockSession } from "./mock-auth-store";

export function getAuthCookieName() { return "access_token"; }

export function readAuthCookies(header: string | null) {
  const entries = new Map((header ?? "").split(";").map((part) => {
    const split = part.indexOf("=");
    return split < 0 ? [part.trim(), ""] : [part.slice(0, split).trim(), part.slice(split + 1)];
  }));
  return { access: entries.get("access_token"), refresh: entries.get("refresh_token") };
}

export function setSessionCookies(response: NextResponse, request: Request, session?: MockSession) {
  const secure = new URL(request.url).protocol === "https:" || process.env.NODE_ENV === "production";
  for (const [name, value, maxAge] of [
    ["access_token", session?.access ?? "", session ? ACCESS_SECONDS : 0],
    ["refresh_token", session?.refresh ?? "", session ? Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000)) : 0],
  ] as const) response.cookies.set(name, value, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
