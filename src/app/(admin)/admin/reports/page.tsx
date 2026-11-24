import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { hasAdminSession } from '@/server/bff/admin/admin-session';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { AdminLoading } from '@/features/admin/components/admin-loading';
import { AdminReports } from '@/features/admin/components/content/admin-reports';
import { AdminReportList } from '@/features/reports';
import { getServerEnv } from '@/lib/env';
export default function AdminReportsPage() { return <Suspense fallback={<AdminLoading />}><Content /></Suspense>; }
async function Content() {
  if (!await hasAdminSession()) redirect('/admin/login');
  const env = getServerEnv();
  return <AdminShell>{(env.COMPANY_DATA_MODE ?? env.DATA_MODE) === 'real' ? <AdminReportList /> : <AdminReports />}</AdminShell>;
}
