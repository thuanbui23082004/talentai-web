import { CandidateProfilePage } from "@/features/profile";
import { requireRole } from "@/lib/auth/require-role";

export const metadata = { title: "Hồ sơ của tôi | TalentAI" };

export default async function CandidateProfileRoute() {
    const { user } = await requireRole("candidate");
    return <CandidateProfilePage user={user} />;
}
