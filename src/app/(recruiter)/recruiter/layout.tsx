import { RecruiterShell } from '@/features/recruiter';
import { Suspense } from 'react';

export default function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div aria-busy="true" className="recruiter-app recruiter-route-skeleton"><div /><div /><div /></div>}>
      <RecruiterShell>{children}</RecruiterShell>
    </Suspense>
  );
}
