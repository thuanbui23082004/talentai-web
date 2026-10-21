import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import type { components } from "@/lib/api/generated/schema";
import { mockAuthAccounts } from "@/mocks/fixtures/auth";

type User = components["schemas"]["User"];
type Account = { user: User; salt: string; hash: Buffer };
export type MockSession = { userId: string; access: string; refresh: string; csrf: string; accessExpiresAt: number; expiresAt: number; lastActivity: number };
type Store = { accounts: Map<string, Account>; sessions: Map<string, MockSession>; attempts: Map<string, { failures: number[]; lockedUntil: number }> };
const globals = globalThis as typeof globalThis & { __talentaiMockAuth?: Store };
export const IDLE_TIMEOUT_SECONDS = 1800;
export const ACCESS_SECONDS = 900;
const SESSION_SECONDS = 8 * 60 * 60;

function account(user: User, password: string): Account {
  const salt = randomBytes(16).toString("hex");
  return { user, salt, hash: scryptSync(password, salt, 64) };
}

export function getAuthStore(): Store {
  if (!globals.__talentaiMockAuth) {
    globals.__talentaiMockAuth = { accounts: new Map(mockAuthAccounts.map(({ user, password }) => [user.email, account({ ...user }, password)])), sessions: new Map(), attempts: new Map() };
  }
  return globals.__talentaiMockAuth;
}

// Test helper only: no HTTP reset endpoint is exposed.
export function resetMockAuth() { delete globals.__talentaiMockAuth; }

export function verifyPassword(record: Account | undefined, password: string) {
  // Perform the same work for unknown email addresses.
  const salt = record?.salt ?? "unknown-account-salt";
  const expected = record?.hash ?? Buffer.alloc(64);
  return timingSafeEqual(scryptSync(password, salt, 64), expected) && !!record;
}

export function addAccount(input: components["schemas"]["RegisterRequest"]): User {
  const user: User = { id: randomUUID(), email: input.email, fullName: input.fullName, phone: input.phone, role: input.role, status: "active", createdAt: new Date().toISOString(), ...(input.role === "recruiter" ? { companyVerificationStatus: "pending" as const } : {}) };
  getAuthStore().accounts.set(user.email, account(user, input.password));
  return user;
}

export function findUser(session: MockSession): User | undefined {
  return [...getAuthStore().accounts.values()].find((record) => record.user.id === session.userId)?.user;
}

export function revokeSession(session: MockSession) { getAuthStore().sessions.delete(session.access); }

export function issueSession(user: User, previous?: MockSession): MockSession {
  if (previous) revokeSession(previous);
  const now = Date.now();
  const session: MockSession = {
    userId: user.id, access: randomBytes(32).toString("hex"), refresh: randomBytes(32).toString("hex"), csrf: randomBytes(32).toString("hex"),
    accessExpiresAt: now + ACCESS_SECONDS * 1000,
    expiresAt: previous?.expiresAt ?? now + SESSION_SECONDS * 1000,
    lastActivity: now,
  };
  getAuthStore().sessions.set(session.access, session);
  return session;
}

export function readSession(token?: string, refresh = false, touch = true): MockSession | undefined {
  if (!token) return undefined;
  const store = getAuthStore();
  const now = Date.now();
  for (const session of store.sessions.values()) {
    if (session.expiresAt <= now || now - session.lastActivity >= IDLE_TIMEOUT_SECONDS * 1000) store.sessions.delete(session.access);
  }
  const session = refresh ? [...store.sessions.values()].find((entry) => entry.refresh === token) : store.sessions.get(token);
  if (!session || (!refresh && session.accessExpiresAt <= now)) return undefined;
  const user = findUser(session);
  if (!user || user.status !== "active") { revokeSession(session); return undefined; }
  if (touch) session.lastActivity = now;
  return session;
}
