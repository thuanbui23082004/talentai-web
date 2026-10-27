'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Bell, BriefcaseBusiness, CalendarDays, ChevronDown, CircleHelp, ContactRound, LayoutDashboard, MessageCircle, ShoppingBasket, UsersRound } from 'lucide-react';
import { RecruiterHeaderSearch } from '@/features/recruiter/components/recruiter-header-search';
import { Button } from '@/components/ui/button';
import { recruiterMessages } from '@/features/recruiter/messages';
import { jobFormMessages } from '@/features/jobs';
import { recruiterCandidateMessages, candidateDetailMessages, pipelineMessages } from '@/features/applications';
import { QueryProvider } from '@/providers/query-provider';
import { settingsMessages, useAccount } from '@/features/account';
import { recruiterAnalysisMessages } from '@/features/matching/messages';
import { interviewResultMessages } from '@/features/interviews/messages';
import { interviewManagementMessages } from '@/features/interviews/management-messages';
import { recruiterStatsMessages } from '@/features/recruiter-stats/messages';
import { recruiterServiceMessages } from '@/features/recruiter-services/messages';
import { recruiterHelpMessages } from '@/features/recruiter-help/messages';
import { inboxMessages } from '@/features/inbox/messages';
import './recruiter.css';
import './recruiter-layout.css';

function Shell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('Recruiter');
  const pathname = usePathname();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const account = useAccount();
  const settings = useTranslations('Settings');
  const name = account.data?.fullName ?? t('account');
  const initials = account.data?.fullName.trim().split(/\s+/).slice(-2).map(word => word[0]).join('') ?? '';
  const avatar = account.data?.avatarUrl;
  const accountActive = pathname === '/recruiter/account' || pathname === '/recruiter/company';
  const serviceActive = ['/recruiter/services', '/recruiter/pricing', '/recruiter/promotions'].includes(pathname);
  const helpActive = pathname === '/recruiter/help';
  return <div className="recruiter-app">
    <header className="recruiter-header">
      <Link href="/recruiter/dashboard" className="recruiter-brand" aria-label={t('brand')}><Image src="/logo/image%201.png" alt={t('brand')} width={180} height={181} priority /></Link>
      <nav className="recruiter-header-nav" aria-label={t('headerNavigation')}>
        <Link className={pathname === '/recruiter/pricing' ? 'header-nav-active' : undefined} href="/recruiter/pricing" aria-current={pathname === '/recruiter/pricing' ? 'page' : undefined}>{t('pricing')}</Link>
        <Link className={`header-promotion${pathname === '/recruiter/promotions' ? ' header-nav-active' : ''}`} href="/recruiter/promotions" aria-current={pathname === '/recruiter/promotions' ? 'page' : undefined}><span className="hot-badge">{t('hot')}</span>{t('promotion')}</Link>
        <Link className={!serviceActive && !helpActive ? 'header-nav-active' : undefined} href="/recruiter/candidates">{t('findCandidates')}</Link>
        <Link className={helpActive ? 'header-nav-active' : undefined} href="/recruiter/help" aria-current={helpActive ? 'page' : undefined}>{t('support')}</Link>
      </nav>
      <div className="header-spacer" />
      <RecruiterHeaderSearch />
      <Link className="header-message-icon" href="/recruiter/inbox" aria-label={t('messages')} aria-current={pathname === '/recruiter/inbox' ? 'page' : undefined}><MessageCircle size={15} /></Link>
      <div className="notification-wrap"><Button variant="outline" size="icon" aria-label={t('notifications')} aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(!notificationsOpen)}><Bell size={17} /><span className="notification-dot" /></Button>{notificationsOpen && <div className="notification-popover">{t('noNotifications')}</div>}</div>
      <Link href="/recruiter/account" className="recruiter-user" aria-label={settings('account')}><span className="user-avatar" aria-hidden="true">{avatar && (/^https?:\/\//i.test(avatar) || /^\/(?!\/)/.test(avatar)) ? <Image src={avatar} width={33} height={33} alt="" unoptimized /> : initials}</span><span><strong>{name}</strong><small>{account.data ? settings(`roles.${account.data.role}`) : t('account')}</small></span><ChevronDown size={13} /></Link>
    </header>
    <div className="recruiter-body">
      <aside className="recruiter-sidebar">
        <nav aria-label={t('role')}>
          {[{ href: '/recruiter/dashboard', label: 'home' as const, Icon: LayoutDashboard }, { href: '/recruiter/jobs', label: 'jobs' as const, Icon: BriefcaseBusiness }, { href: '/recruiter/candidates', label: 'candidates' as const, Icon: UsersRound }, { href: '/recruiter/interviews', label: 'interviews' as const, Icon: CalendarDays }].map(({ href, label, Icon }) => <Link key={href} href={href} className={(pathname === href || pathname.startsWith(`${href}/`)) ? 'sidebar-link active' : 'sidebar-link'} aria-current={(pathname === href || pathname.startsWith(`${href}/`)) ? 'page' : undefined}><span><Icon size={20} /></span>{t(label)}</Link>)}
          <Link className={`sidebar-link${serviceActive ? ' active' : ''}`} href="/recruiter/services" aria-current={pathname === '/recruiter/services' ? 'page' : undefined}><span><ShoppingBasket size={20} /></span>{t('services')}</Link>
        </nav>
        <div className="sidebar-bottom">
          <Link href="/recruiter/account" className={accountActive ? 'sidebar-link active' : 'sidebar-link'} aria-current={accountActive ? 'page' : undefined}><span><ContactRound size={20} /></span>{t('account')}</Link>
          <Link className={`sidebar-link${helpActive ? ' active' : ''}`} href="/recruiter/help" aria-current={helpActive ? 'page' : undefined}><span><CircleHelp size={20} /></span>{t('help')}</Link>
        </div>
      </aside>
      <main className="recruiter-main">{children}</main>
    </div>
    <footer className="recruiter-footer"><strong>{t('copyright')}</strong><nav aria-label={t('footerNavigation')}>{(['about', 'servicePricing', 'terms', 'warranty', 'privacyRules'] as const).map(key => key === 'servicePricing' ? <Link key={key} href="/recruiter/pricing">{t(key)}</Link> : <span key={key}>{t(key)}</span>)}<Link href="/recruiter/help">{t('support')}</Link></nav></footer>
  </div>;
}

export function RecruiterShell({ children }: { children: React.ReactNode }) {
  return <NextIntlClientProvider locale="vi" messages={{ ...recruiterMessages, ...jobFormMessages, ...recruiterCandidateMessages, ...candidateDetailMessages, ...pipelineMessages, ...settingsMessages, ...recruiterAnalysisMessages, ...interviewResultMessages, ...interviewManagementMessages, ...recruiterStatsMessages, ...recruiterServiceMessages, ...recruiterHelpMessages, ...inboxMessages }} timeZone="Asia/Ho_Chi_Minh"><QueryProvider><Shell>{children}</Shell></QueryProvider></NextIntlClientProvider>;
}
