import { randomUUID } from "node:crypto";
import { vi } from "vitest";
import type { components } from "@/lib/api/generated/schema";
import { mockAuthAccounts } from "./auth-accounts";
import { mockRecruiterAccount } from "@/mocks/fixtures/recruiter-account";
import { recruiterCompany } from "@/mocks/fixtures/recruiter-company";
import { getRecruiterMockStore, type RecruiterContext } from "@/server/bff/recruiter/mock-store";
import { csrfTokenFor } from "@/server/bff/auth/cookies";

type User = components["schemas"]["User"];
export type MockSession = { user: User; userId: string; access: string; refresh: string; csrf: string };
let accounts = new Map(mockAuthAccounts.map(({ user }) => [user.email, { user: structuredClone(user) }]));
const identities = new Map<string, User>();
export function getAuthStore() { return { accounts }; }
export function resetMockAuth() {
  identities.clear();
  accounts = new Map(mockAuthAccounts.map(({ user }) => [user.email, { user: structuredClone(user) }]));
}
// Only the HTTP boundary is faked for business unit tests. Production code
// still goes through Java /me and never gains an auth store/test bypass.
export function issueSession(user: User): MockSession {
  const access = "test-java-access-" + randomUUID();
  identities.set(access, user);
  vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
    const token = new Headers(init?.headers).get("Authorization")?.replace("Bearer ", "");
    const profile = token ? identities.get(token) : undefined;
    if (!profile || profile.status !== "active") return new Response(null, { status: 401 });
    return Response.json({ success: true, data: { profile: {
      id: profile.id, email: profile.email, displayName: profile.fullName,
      status: "ACTIVE", roles: [profile.role.toUpperCase()], createdAt: profile.createdAt,
      avatarUrl: profile.avatarUrl ?? null,
    } } });
  });
  return { user, userId: user.id, access, refresh: "test-java-refresh-" + randomUUID(), csrf: csrfTokenFor({ access }) };
}
export function createMockRecruiterSession() {
  const user = structuredClone(getAuthStore().accounts.get(mockRecruiterAccount.email)!.user);
  const auth = issueSession(user);
  const session: RecruiterContext = {
    get role() { return user.role; }, set role(role) { user.role = role; },
    get userId() { return user.id; }, set userId(id) { if (id) user.id = id; },
    csrf: auth.csrf, companyId: recruiterCompany.id,
  };
  getRecruiterMockStore().workspaces.set(user.id, session);
  return { id: auth.access, session };
}
