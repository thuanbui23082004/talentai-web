import { requireRole } from "@/lib/auth/require-role";
import { CandidateShell } from "@/components/layout/candidate/candidate-shell";

export default async function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireRole("candidate");
  return <CandidateShell user={user}>{children}</CandidateShell>;
}
