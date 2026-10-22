import { CandidateDashboard } from "@/features/matching";
import { requireRole } from "@/lib/auth/require-role";

export default async function CandidateDashboardPage() {
    const { user } = await requireRole("candidate");
    return <CandidateDashboard user={user} />;
}
