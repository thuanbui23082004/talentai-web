import { redirect } from "next/navigation";
import { getSession } from "./session";
import type { UserRole } from "./roles";

export async function requireRole(role: UserRole) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== role) redirect(`/${session.role}/dashboard`);
  return session;
}
