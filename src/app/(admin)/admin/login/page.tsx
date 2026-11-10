import { redirect } from 'next/navigation';
import { hasAdminSession } from '@/server/bff/admin-session';
import { AdminLogin } from '@/features/admin/components/admin-login';
import { Suspense } from 'react';
import { AdminLoading } from '@/features/admin/components/admin-loading';
export default function AdminLoginPage() { return <Suspense fallback={<AdminLoading />}><LoginContent /></Suspense>; }
async function LoginContent() {
  if (await hasAdminSession()) redirect('/admin/dashboard');
  return <AdminLogin />;
}
