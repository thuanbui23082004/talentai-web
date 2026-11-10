import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { hasAdminSession } from '@/server/bff/admin-session';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { AdminLoading } from '@/features/admin/components/admin-loading';
import { AdminCompanyDetail } from '@/features/admin/components/admin-company-detail';
export default function AdminCompanyPage({ params }: { params: Promise<{ companyId: string }> }) { return <Suspense fallback={<AdminLoading />}><Content params={params} /></Suspense>; }
async function Content({ params }: { params: Promise<{ companyId: string }> }) {
  if (!await hasAdminSession()) redirect('/admin/login');
  const { companyId } = await params;
  return <AdminShell><AdminCompanyDetail companyId={companyId} /></AdminShell>;
}
