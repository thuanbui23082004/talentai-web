import { JobPreferencesPage } from "@/features/profile";
import { requireRole } from "@/lib/auth/require-role";

export const metadata = { title: "Tiêu chí tìm việc | TalentAI" };

export default async function CandidateJobPreferencesPage() {
    await requireRole("candidate");
    return <JobPreferencesPage />;
}
