import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { hasAdminSession } from '@/server/bff/admin-session';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { AdminLoading } from '@/features/admin/components/admin-loading';
import { AdminJobDetail } from '@/features/admin/components/admin-job-detail';
export default function AdminJobPage({ params }: { params: Promise<{ jobId: string }> }) { return <Suspense fallback={<AdminLoading />}><Content params={params} /></Suspense>; }
async function Content({ params }: { params: Promise<{ jobId: string }> }) {
  if (!await hasAdminSession()) redirect('/admin/login');
  const { jobId } = await params;
  return <AdminShell><AdminJobDetail jobId={jobId} /></AdminShell>;
}
