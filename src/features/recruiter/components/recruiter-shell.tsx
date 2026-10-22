'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Bell, BriefcaseBusiness, ChevronDown, CircleHelp, ContactRound, LayoutDashboard, MessageCircle, Search, ShoppingBasket, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { recruiterMessages } from '@/features/recruiter/messages';
import { jobFormMessages } from '@/features/jobs';
import { recruiterCandidateMessages, candidateDetailMessages, pipelineMessages } from '@/features/applications';
import { QueryProvider } from '@/providers/query-provider';
import './recruiter.css';

function Shell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('Recruiter');
  const pathname = usePathname();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  return <div className="recruiter-app">
    <header className="recruiter-header">
      <Link href="/recruiter/dashboard" className="recruiter-brand" aria-label={t('brand')}><Image src="/logo/image%201.png" alt={t('brand')} width={180} height={181} priority /></Link>
      <nav className="recruiter-header-nav" aria-label={t('headerNavigation')}>
        <span>{t('pricing')}</span>
        <span className="header-promotion"><span className="hot-badge">{t('hot')}</span>{t('promotion')}</span>
        <Link className="header-nav-active" href="/recruiter/candidates">{t('findCandidates')}</Link>
        <span>{t('support')}</span>
      </nav>
      <div className="header-spacer" />
      <span className="header-search"><Search size={15} />{t('searchHeader')}</span>
      <span className="header-message-icon" aria-label={t('messages')}><MessageCircle size={15} /></span>
      <div className="notification-wrap"><Button variant="outline" size="icon" aria-label={t('notifications')} aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(!notificationsOpen)}><Bell size={17} /><span className="notification-dot" /></Button>{notificationsOpen && <div className="notification-popover">{t('noNotifications')}</div>}</div>
      <div className="recruiter-user"><span className="user-avatar" aria-hidden="true">AS</span><span><strong>{t('user')}</strong><small>{t('role')}</small></span><ChevronDown size={13} /></div>
    </header>
    <div className="recruiter-body">
      <aside className="recruiter-sidebar">
        <nav aria-label={t('role')}>
          {[{ href: '/recruiter/dashboard', label: 'home' as const, Icon: LayoutDashboard }, { href: '/recruiter/jobs', label: 'jobs' as const, Icon: BriefcaseBusiness }, { href: '/recruiter/candidates', label: 'candidates' as const, Icon: UsersRound }].map(({ href, label, Icon }) => <Link key={href} href={href} className={(pathname === href || pathname.startsWith(`${href}/`)) ? 'sidebar-link active' : 'sidebar-link'} aria-current={(pathname === href || pathname.startsWith(`${href}/`)) ? 'page' : undefined}><span><Icon size={20} /></span>{t(label)}</Link>)}
          <span className="sidebar-link" aria-disabled="true"><span><ShoppingBasket size={20} /></span>{t('services')}</span>
        </nav>
        <div className="sidebar-bottom">
          <span className="sidebar-link" aria-disabled="true"><span><ContactRound size={20} /></span>{t('account')}</span>
          <span className="sidebar-link" aria-disabled="true"><span><CircleHelp size={20} /></span>{t('help')}</span>
        </div>
      </aside>
      <main className="recruiter-main">{children}</main>
    </div>
    <footer className="recruiter-footer"><strong>{t('copyright')}</strong><nav aria-label={t('footerNavigation')}>{(['about', 'servicePricing', 'terms', 'warranty', 'privacyRules'] as const).map(key => <span key={key}>{t(key)}</span>)}</nav></footer>
  </div>;
}

export function RecruiterShell({ children }: { children: React.ReactNode }) {
  return <NextIntlClientProvider locale="vi" messages={{ ...recruiterMessages, ...jobFormMessages, ...recruiterCandidateMessages, ...candidateDetailMessages, ...pipelineMessages }} timeZone="Asia/Ho_Chi_Minh"><QueryProvider><Shell>{children}</Shell></QueryProvider></NextIntlClientProvider>;
}
