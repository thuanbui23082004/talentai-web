import { RecruiterDashboard } from "@/features/recruiter";
import { requireRole } from "@/lib/auth/require-role";

export default async function RecruiterDashboardPage() {
    await requireRole("recruiter");
    return <RecruiterDashboard />;
}
