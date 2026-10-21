import { requireRole } from "@/lib/auth/require-role";

export default async function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("candidate");
  return <div>{children}</div>;
}
