import { RecruiterDashboard } from "@/features/recruiter";
import { DashboardWelcome } from "@/features/auth";
import { requireRole } from "@/lib/auth/require-role";

export default async function RecruiterDashboardPage() {
    const { user } = await requireRole("recruiter");
    if (!user.companyId) return <DashboardWelcome user={user} embedded />;
    return <RecruiterDashboard />;
}
