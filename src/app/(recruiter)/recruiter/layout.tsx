import { Suspense } from 'react';
import { RecruiterShell } from '@/features/recruiter';
import { requireRole } from '@/lib/auth/require-role';

export default async function RecruiterLayout({ children }: { children: React.ReactNode }) {
  await requireRole('recruiter');
  return <Suspense fallback={<div aria-busy="true" className="recruiter-app recruiter-route-skeleton"><div /><div /><div /></div>}><RecruiterShell>{children}</RecruiterShell></Suspense>;
}
