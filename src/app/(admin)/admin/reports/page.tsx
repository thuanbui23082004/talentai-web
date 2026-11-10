import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { hasAdminSession } from '@/server/bff/admin-session';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { AdminLoading } from '@/features/admin/components/admin-loading';
import { AdminReports } from '@/features/admin/components/admin-reports';
export default function AdminReportsPage() { return <Suspense fallback={<AdminLoading />}><Content /></Suspense>; }
async function Content() {
  if (!await hasAdminSession()) redirect('/admin/login');
  return <AdminShell><AdminReports /></AdminShell>;
}
