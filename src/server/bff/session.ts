import { getServerEnv } from "@/lib/env";
import { readAuthCookies } from "./cookies";
import { findUser, readSession } from "./mock-auth-store";

export function readServerSession(cookieHeader: string | null) {
  // Real auth proxying remains closed until the backend session contract is integrated.
  if (getServerEnv().DATA_MODE !== "mock") return null;
  const cookie = readAuthCookies(cookieHeader);
  // A page read cannot rotate cookies. A valid refresh session may render the
  // page; the client renews access via POST /auth/refresh before API requests.
  const session = readSession(cookie.access, false, false) ?? readSession(cookie.refresh, true, false);
  return session ? findUser(session) ?? null : null;
}
