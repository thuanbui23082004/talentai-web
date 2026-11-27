import localFont from 'next/font/local';
import { Suspense } from 'react';
import { AdminProvider } from '@/features/admin/components/admin-provider';
import { AdminLoading } from '@/features/admin/components/admin-loading';
import '@/features/admin/components/admin.css';
const inter = localFont({
  src: '../../../assets/fonts/inter-variable.ttf',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
  variable: '--font-admin-inter',
  fallback: ['system-ui', 'sans-serif'],
});
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div lang="vi" className={`${inter.variable} admin-app`}><AdminProvider><Suspense fallback={<AdminLoading />}>{children}</Suspense></AdminProvider></div>;
}
