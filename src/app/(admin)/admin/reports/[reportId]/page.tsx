import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { hasAdminSession } from '@/server/bff/admin-session';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { AdminLoading } from '@/features/admin/components/admin-loading';
import { AdminReportDetail } from '@/features/admin/components/admin-report-detail';
export default function Page({ params }: { params: Promise<{ reportId: string }> }) { return <Suspense fallback={<AdminLoading />}><Content params={params} /></Suspense>; }
async function Content({ params }: { params: Promise<{ reportId: string }> }) {
  if (!await hasAdminSession()) redirect('/admin/login');
  const { reportId } = await params;
  return <AdminShell><AdminReportDetail reportId={reportId} /></AdminShell>;
}
