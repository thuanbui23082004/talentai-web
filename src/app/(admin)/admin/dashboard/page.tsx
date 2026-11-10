import { redirect } from 'next/navigation';
import { hasAdminSession } from '@/server/bff/admin-session';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { AdminDashboard } from '@/features/admin/components/admin-dashboard';
import { Suspense } from 'react';
import { AdminLoading } from '@/features/admin/components/admin-loading';
export default function AdminDashboardPage() { return <Suspense fallback={<AdminLoading />}><DashboardContent /></Suspense>; }
async function DashboardContent() {
  if (!await hasAdminSession()) redirect('/admin/login');
  return <AdminShell><AdminDashboard /></AdminShell>;
}
