import { CandidateMatchingPageContent } from "@/features/matching";
import { requireRole } from "@/lib/auth/require-role";

export default async function CandidateMatchingPage() {
  const session = await requireRole("candidate");
  return <CandidateMatchingPageContent userId={session.userId} />;
}
