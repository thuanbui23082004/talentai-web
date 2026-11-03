import { getAuthApiUrl } from "@/lib/env";
import { callAuth, mapUser, profileSchema } from "./backend";
import { csrfTokenFor, readAuthCookies } from "./cookies";

// Java is the authority. Never decode a browser-supplied JWT to trust its role.
// Server Components can read cookies but must not rotate/write them.
export async function readServerSession(cookieHeader: string | null) {
  const { access } = readAuthCookies(cookieHeader);
  if (!access) return null;
  const upstream = await callAuth(getAuthApiUrl(), "me", undefined, access);
  if ([401, 403].includes(upstream.status)) return null;
  if (!upstream.ok) throw new Error("Auth service unavailable");
  const result = profileSchema.parse(await upstream.json());
  const user = mapUser(result.data.profile);
  return user?.status === "active" ? user : null;
}

// Request context for the remaining business mocks. No cached auth identity.
export async function readRequestIdentity(request: Request) {
  const cookieHeader = request.headers.get("cookie");
  const user = await readServerSession(cookieHeader);
  if (!user) return null;
  const cookies = readAuthCookies(cookieHeader);
  return { user, userId: user.id, access: cookies.access!, csrf: csrfTokenFor(cookies) };
}
