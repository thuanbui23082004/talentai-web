import { DashboardWelcome } from "@/features/auth";
import { requireRole } from "@/lib/auth/require-role";

export default async function RecruiterDashboardPage() {
    const { user } = await requireRole("recruiter");
    return <DashboardWelcome user={user} />;
}
