import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { hasAdminSession } from '@/server/bff/admin-session';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { AdminLoading } from '@/features/admin/components/admin-loading';
import { AdminPaymentDetail } from '@/features/admin/components/admin-payment-detail';
export default function Page({ params }: { params: Promise<{ paymentId: string }> }) { return <Suspense fallback={<AdminLoading />}><Content params={params} /></Suspense>; }
async function Content({ params }: { params: Promise<{ paymentId: string }> }) {
  if (!await hasAdminSession()) redirect('/admin/login');
  const { paymentId } = await params;
  return <AdminShell><AdminPaymentDetail paymentId={paymentId} /></AdminShell>;
}
