import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { hasAdminSession } from '@/server/bff/admin/admin-session';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { AdminLoading } from '@/features/admin/components/admin-loading';
import { AdminUsers } from '@/features/admin/components/users/admin-users';
export default function AdminUsersPage() { return <Suspense fallback={<AdminLoading />}><Content /></Suspense>; }
async function Content() {
  if (!await hasAdminSession()) redirect('/admin/login');
  return <AdminShell><AdminUsers /></AdminShell>;
}
