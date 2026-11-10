import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { hasAdminSession } from '@/server/bff/admin-session';
import { AdminShell, AdminLoading, AdminStatistics } from '@/features/admin';
export default function AdminStatisticsPage() { return <Suspense fallback={<AdminLoading />}><Content /></Suspense>; }
async function Content() {
  if (!await hasAdminSession()) redirect('/admin/login');
  return <AdminShell><AdminStatistics /></AdminShell>;
}
