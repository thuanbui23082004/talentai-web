import { requireRole } from "@/lib/auth/require-role";

export default async function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("recruiter");
  return <div>{children}</div>;
}
