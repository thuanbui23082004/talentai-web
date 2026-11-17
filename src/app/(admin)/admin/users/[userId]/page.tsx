import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { hasAdminSession } from '@/server/bff/admin/admin-session';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { AdminLoading } from '@/features/admin/components/admin-loading';
import { AdminUserDetail } from '@/features/admin/components/users/admin-user-detail';
export default function AdminUserPage({ params }: { params: Promise<{ userId: string }> }) { return <Suspense fallback={<AdminLoading />}><Content params={params} /></Suspense>; }
async function Content({ params }: { params: Promise<{ userId: string }> }) {
  if (!await hasAdminSession()) redirect('/admin/login');
  const { userId } = await params;
  return <AdminShell><AdminUserDetail userId={userId} /></AdminShell>;
}
