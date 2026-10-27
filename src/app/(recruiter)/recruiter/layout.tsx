import { RecruiterShell } from '@/features/recruiter';
import { Suspense } from 'react';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-recruiter-inter',
  fallback: ['system-ui', 'sans-serif'],
});

export default function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={inter.variable}><Suspense fallback={<div aria-busy="true" className="recruiter-app recruiter-route-skeleton"><div /><div /><div /></div>}>
      <RecruiterShell>{children}</RecruiterShell>
    </Suspense></div>
  );
}
