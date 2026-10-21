import { DashboardWelcome } from "@/features/auth";
import { requireRole } from "@/lib/auth/require-role";

export default async function AdminDashboardPage() {
  const { user } = await requireRole("admin");
  return <DashboardWelcome user={user} />;
}
