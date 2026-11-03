'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Bell, BriefcaseBusiness, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, ContactRound, LayoutDashboard, Menu, MessageCircle, ShoppingBasket, UsersRound } from 'lucide-react';
import { RecruiterHeaderSearch } from '@/features/recruiter/components/recruiter-header-search';
import { Button } from '@/components/ui/button';
import { Modal, ModalContent } from '@/components/ui/modal';
import { recruiterMessages } from '@/features/recruiter/messages';
import { jobFormMessages } from '@/features/jobs';
import { recruiterCandidateMessages, candidateDetailMessages, pipelineMessages } from '@/features/applications';
import { QueryProvider } from '@/providers/query-provider';
import { settingsMessages, useAccount } from '@/features/account';
import { recruiterAnalysisMessages } from '@/features/matching';
import { interviewResultMessages } from '@/features/interviews';
import { interviewManagementMessages } from '@/features/interviews';
import { recruiterStatsMessages } from '@/features/recruiter-stats';
import { recruiterServiceMessages } from '@/features/recruiter-services';
import { recruiterHelpMessages } from '@/features/recruiter-help';
import { inboxMessages } from '@/features/inbox';
import './recruiter.css';
import './recruiter-layout.css';

function RecruiterNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations('Recruiter');
  const pathname = usePathname();
  const accountActive = pathname === '/recruiter/account' || pathname === '/recruiter/company';
  const serviceActive = ['/recruiter/services', '/recruiter/pricing', '/recruiter/promotions'].includes(pathname);
  const helpActive = pathname === '/recruiter/help';
  return <>
        <span className="sidebar-section-label">{t('workspace')}</span><nav aria-label={t('role')}>
          {[{ href: '/recruiter/dashboard', label: 'home' as const, Icon: LayoutDashboard }, { href: '/recruiter/jobs', label: 'jobs' as const, Icon: BriefcaseBusiness }, { href: '/recruiter/candidates', label: 'candidates' as const, Icon: UsersRound }, { href: '/recruiter/interviews', label: 'interviews' as const, Icon: CalendarDays }].map(({ href, label, Icon }) => <Link onClick={onNavigate} aria-label={t(label)} key={href} href={href} className={(pathname === href || pathname.startsWith(`${href}/`)) ? 'sidebar-link active' : 'sidebar-link'} aria-current={(pathname === href || pathname.startsWith(`${href}/`)) ? 'page' : undefined}><span><Icon size={20} aria-hidden="true" /></span>{t(label)}</Link>)}
          <Link onClick={onNavigate} aria-label={t('services')} className={`sidebar-link${serviceActive ? ' active' : ''}`} href="/recruiter/services" aria-current={pathname === '/recruiter/services' ? 'page' : undefined}><span><ShoppingBasket size={20} aria-hidden="true" /></span>{t('services')}</Link>
        </nav>
        <div className="sidebar-bottom">
          <Link onClick={onNavigate} aria-label={t('account')} href="/recruiter/account" className={accountActive ? 'sidebar-link active' : 'sidebar-link'} aria-current={accountActive ? 'page' : undefined}><span><ContactRound size={20} aria-hidden="true" /></span>{t('account')}</Link>
          <Link onClick={onNavigate} aria-label={t('help')} className={`sidebar-link${helpActive ? ' active' : ''}`} href="/recruiter/help" aria-current={helpActive ? 'page' : undefined}><span><CircleHelp size={20} aria-hidden="true" /></span>{t('help')}</Link>
        </div>
      </>;
}

function Shell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('Recruiter');
  const pathname = usePathname();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const account = useAccount();
  const settings = useTranslations('Settings');
  const name = account.data?.fullName ?? t('account');
  const initials = account.data?.fullName.trim().split(/\s+/).slice(-2).map(word => word[0]).join('') ?? '';
  const avatar = account.data?.avatarUrl;
  const helpActive = pathname === '/recruiter/help';
  return <Modal open={mobileOpen} onOpenChange={setMobileOpen}><div className="recruiter-app" data-sidebar={sidebarExpanded ? 'expanded' : 'collapsed'}>
    <header className="recruiter-header">
      <Button className="sidebar-toggle sidebar-toggle-mobile" variant="ghost" size="icon" aria-label={t('openMenu')} aria-expanded={mobileOpen} aria-controls="recruiter-mobile-navigation" onClick={() => setMobileOpen(true)}><Menu aria-hidden="true" /></Button>
      <Link href="/recruiter/dashboard" className="recruiter-brand" aria-label={t('brand')}><Image src="/logo/image%201.png" alt={t('brand')} width={180} height={181} priority /></Link>
      <nav className="recruiter-header-nav" aria-label={t('headerNavigation')}>
        <Link className={pathname === '/recruiter/pricing' ? 'header-nav-active' : undefined} href="/recruiter/pricing" aria-current={pathname === '/recruiter/pricing' ? 'page' : undefined}>{t('pricing')}</Link>
        <Link className={`header-promotion${pathname === '/recruiter/promotions' ? ' header-nav-active' : ''}`} href="/recruiter/promotions" aria-current={pathname === '/recruiter/promotions' ? 'page' : undefined}><span className="hot-badge">{t('hot')}</span>{t('promotion')}</Link>
        <Link className={pathname.startsWith('/recruiter/candidates') ? 'header-nav-active' : undefined} href="/recruiter/candidates">{t('findCandidates')}</Link>
        <Link className={helpActive ? 'header-nav-active' : undefined} href="/recruiter/help" aria-current={helpActive ? 'page' : undefined}>{t('support')}</Link>
      </nav>
      <div className="header-spacer" />
      <RecruiterHeaderSearch />
      <Link className="header-message-icon" href="/recruiter/inbox" aria-label={t('messages')} aria-current={pathname === '/recruiter/inbox' ? 'page' : undefined}><MessageCircle size={15} /></Link>
      <div className="notification-wrap"><Button variant="outline" size="icon" aria-label={t('notifications')} aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(!notificationsOpen)}><Bell size={17} /><span className="notification-dot" /></Button>{notificationsOpen && <div className="notification-popover">{t('noNotifications')}</div>}</div>
      <Link href="/recruiter/account" className="recruiter-user" aria-label={settings('account')}><span className="user-avatar" aria-hidden="true">{avatar && (/^https?:\/\//i.test(avatar) || /^\/(?!\/)/.test(avatar)) ? <Image src={avatar} width={33} height={33} alt="" unoptimized /> : initials}</span><span><strong>{name}</strong><small>{account.data ? settings(`roles.${account.data.role}`) : t('account')}</small></span><ChevronDown size={13} /></Link>
    </header>
    <div className="recruiter-body">
      <aside id="recruiter-desktop-sidebar" className="recruiter-sidebar">
        <Button className="sidebar-toggle sidebar-toggle-desktop" variant="outline" size="icon" aria-label={t(sidebarExpanded ? 'collapseSidebar' : 'expandSidebar')} title={t(sidebarExpanded ? 'collapseSidebar' : 'expandSidebar')} aria-expanded={sidebarExpanded} aria-controls="recruiter-desktop-sidebar" onClick={() => setSidebarExpanded(current => !current)}>{sidebarExpanded ? <ChevronLeft aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}</Button>
        <RecruiterNavigation />
      </aside>
      <main className="recruiter-main">{children}</main>
    </div>
    <footer className="recruiter-footer"><strong>{t('copyright')}</strong><nav aria-label={t('footerNavigation')}>{(['about', 'servicePricing', 'terms', 'warranty', 'privacyRules'] as const).map(key => key === 'servicePricing' ? <Link key={key} href="/recruiter/pricing">{t(key)}</Link> : <span key={key}>{t(key)}</span>)}<Link href="/recruiter/help">{t('support')}</Link></nav></footer>
  </div><ModalContent title={t('navigationMenu')} className="recruiter-mobile-drawer top-0 left-0 h-dvh max-h-dvh w-[min(18rem,calc(100vw-3rem))] max-w-none translate-x-0 translate-y-0 rounded-none p-5" headerClassName="[&>h2]:text-base"><div id="recruiter-mobile-navigation" className="recruiter-app recruiter-mobile-navigation"><RecruiterNavigation onNavigate={() => setMobileOpen(false)} /></div></ModalContent></Modal>;
}

export function RecruiterShell({ children }: { children: React.ReactNode }) {
  return <NextIntlClientProvider locale="vi" messages={{ ...recruiterMessages, ...jobFormMessages, ...recruiterCandidateMessages, ...candidateDetailMessages, ...pipelineMessages, ...settingsMessages, ...recruiterAnalysisMessages, ...interviewResultMessages, ...interviewManagementMessages, ...recruiterStatsMessages, ...recruiterServiceMessages, ...recruiterHelpMessages, ...inboxMessages }} timeZone="Asia/Ho_Chi_Minh"><QueryProvider><Shell>{children}</Shell></QueryProvider></NextIntlClientProvider>;
}
