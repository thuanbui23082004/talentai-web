import { DashboardWelcome } from "@/features/auth";
import { requireRole } from "@/lib/auth/require-role";

export default async function CandidateDashboardPage() {
    const { user } = await requireRole("candidate");
    return <DashboardWelcome user={user} embedded />;
}
