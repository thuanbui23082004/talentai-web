import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { hasAdminSession } from '@/server/bff/admin/admin-session';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { AdminLoading } from '@/features/admin/components/admin-loading';
import { AdminJobs } from '@/features/admin/components/jobs/admin-jobs';
export default function AdminJobsPage() { return <Suspense fallback={<AdminLoading />}><Content /></Suspense>; }
async function Content() {
  if (!await hasAdminSession()) redirect('/admin/login');
  return <AdminShell><AdminJobs /></AdminShell>;
}
