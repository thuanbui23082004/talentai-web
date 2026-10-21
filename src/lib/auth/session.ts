import type { components } from "@/lib/api/generated/schema";
import { cookies } from "next/headers";
import { cache } from "react";
import { readServerSession } from "@/server/bff/session";

export type Session = {
  userId: string;
  role: components["schemas"]["Role"];
  user: components["schemas"]["User"];
};

export const getSession = cache(async (): Promise<Session | null> => {
  const cookieStore = await cookies();
  const header = ["access_token", "refresh_token"].map((name) => `${name}=${cookieStore.get(name)?.value ?? ""}`).join("; ");
  const user = readServerSession(header);
  return user ? { userId: user.id, role: user.role, user } : null;
});
