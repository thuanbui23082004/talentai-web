import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { hasAdminSession } from '@/server/bff/admin/admin-session';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { AdminLoading } from '@/features/admin/components/admin-loading';
import { AdminReportDetail } from '@/features/admin/components/content/admin-report-detail';
import { AdminReportDetailReal } from '@/features/reports';
import { getServerEnv } from '@/lib/env';
export default function Page({ params }: { params: Promise<{ reportId: string }> }) { return <Suspense fallback={<AdminLoading />}><Content params={params} /></Suspense>; }
async function Content({ params }: { params: Promise<{ reportId: string }> }) {
  if (!await hasAdminSession()) redirect('/admin/login');
  const { reportId } = await params;
  const env = getServerEnv();
  return <AdminShell>{(env.COMPANY_DATA_MODE ?? env.DATA_MODE) === 'real' ? <AdminReportDetailReal reportId={reportId} /> : <AdminReportDetail reportId={reportId} />}</AdminShell>;
}
