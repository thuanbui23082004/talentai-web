'use client';
import { NextIntlClientProvider } from 'next-intl';
import { QueryProvider } from '@/providers/query-provider';
import { adminContentMessages } from '@/features/admin/content-messages';
import { adminPaymentMessages } from '@/features/admin/payment-messages';
import { adminActivityMessages } from '@/features/admin/activity-messages';
import { adminMonitoringMessages } from '@/features/admin/monitoring-messages';
import { adminStatisticsMessages } from '@/features/admin/statistics-messages';
import { adminMessages } from '@/features/admin/messages';
import { adminUserMessages } from '@/features/admin/user-messages';
import { adminCompanyMessages } from '@/features/admin/company-messages';
import { adminJobMessages } from '@/features/admin/job-messages';
export function AdminProvider({ children }: { children: React.ReactNode }) {
  return <NextIntlClientProvider locale="vi" messages={{ ...adminMessages, ...adminUserMessages, ...adminCompanyMessages, ...adminJobMessages, ...adminContentMessages, ...adminPaymentMessages, ...adminActivityMessages, ...adminMonitoringMessages, ...adminStatisticsMessages }} timeZone="Asia/Ho_Chi_Minh"><QueryProvider>{children}</QueryProvider></NextIntlClientProvider>;
}
