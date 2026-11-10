'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { LayoutDashboard, UsersRound, Layers3, Wallet, Settings2, LogOut, Menu, X, ShieldCheck, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logoutAdmin } from '@/features/admin/services';

const groups = [
  { key: 'dashboard', Icon: LayoutDashboard, tabs: [] },
  { key: 'accountsGroup', Icon: UsersRound, tabs: ['users', 'companies'] },
  { key: 'contentGroup', Icon: Layers3, tabs: ['jobs', 'catalog', 'reports'] },
  { key: 'financeGroup', Icon: Wallet, tabs: ['payments'] },
  { key: 'systemGroup', Icon: Settings2, tabs: ['logs', 'monitoring', 'statistics'] },
] as const;
type GroupKey = typeof groups[number]['key'];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('Admin'); const router = useRouter(); const cache = useQueryClient();
  const pathname = usePathname();
  const accountRoute = pathname.startsWith('/admin/users') || pathname.startsWith('/admin/companies');
  const contentTab = ['jobs', 'catalog', 'reports'].find(key => pathname.startsWith(`/admin/${key}`));
  const jobsRoute = Boolean(contentTab);
  const paymentRoute = pathname.startsWith('/admin/payments');
  const logsRoute = pathname === '/admin/activity-logs';
  const monitoringRoute = pathname === '/admin/monitoring';
  const statisticsRoute = pathname === '/admin/statistics';
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(false);
  const [group, setGroup] = useState<GroupKey>(accountRoute ? 'accountsGroup' : jobsRoute ? 'contentGroup' : paymentRoute ? 'financeGroup' : (logsRoute || monitoringRoute || statisticsRoute) ? 'systemGroup' : 'dashboard'); const [localTab, setTab] = useState(contentTab ?? (paymentRoute ? 'payments' : logsRoute ? 'logs' : monitoringRoute ? 'monitoring' : statisticsRoute ? 'statistics' : 'users'));
  const tab = group === 'accountsGroup' ? pathname.startsWith('/admin/companies') ? 'companies' : 'users' : group === 'contentGroup' ? contentTab ?? localTab : localTab;
  const selected = groups.find(item => item.key === group) ?? groups[0];
  const realContent = group === 'accountsGroup' || group === 'contentGroup' || group === 'financeGroup' || group === 'systemGroup';
  function selectGroup(item: typeof groups[number]) {
    setOpen(false);
    if (item.key === 'accountsGroup' && !accountRoute) { router.push('/admin/users'); return; }
    if (item.key === 'contentGroup' && !jobsRoute) { router.push('/admin/jobs'); return; }
    if (item.key === 'financeGroup' && !paymentRoute) { router.push('/admin/payments'); return; }
    if (item.key === 'systemGroup' && !logsRoute && !monitoringRoute && !statisticsRoute) { router.push('/admin/activity-logs'); return; }
    if (item.key === 'dashboard' && pathname !== '/admin/dashboard') { router.push('/admin/dashboard'); return; }
    setGroup(item.key); setTab(item.key === 'systemGroup' && statisticsRoute ? 'statistics' : item.key === 'systemGroup' && monitoringRoute ? 'monitoring' : item.tabs[0] ?? '');
  }
  function selectTab(key: string) {
    if (group === 'accountsGroup') { router.push(key === 'companies' ? '/admin/companies' : '/admin/users'); return; }
    if (group === 'financeGroup') { router.push('/admin/payments'); return; }
    if (group === 'contentGroup') { router.push(`/admin/${key}`); return; }
    if (group === 'systemGroup' && key === 'logs' && !logsRoute) { router.push('/admin/activity-logs'); return; }
    if (group === 'systemGroup' && key === 'monitoring' && !monitoringRoute) { router.push('/admin/monitoring'); return; }
    if (group === 'systemGroup' && key === 'statistics' && !statisticsRoute) { router.push('/admin/statistics'); return; }
    setTab(key);
  }
  async function logout() { setBusy(true); setError(false); try { await logoutAdmin(); cache.clear(); router.replace('/admin/login'); router.refresh(); } catch { setError(true); } finally { setBusy(false); } }
  return <div className="admin-workspace">
    <header className="admin-header">
      <Link href="/admin/dashboard" className="admin-logo" aria-label={t('brand')} onClick={() => selectGroup(groups[0])}><Image src="/logo/image%201.png" width={180} height={181} alt={t('brand')} priority /></Link>
      <span className="admin-header-label">{t('workspace')}</span>
      <div className="admin-header-account"><span className="admin-avatar"><ShieldCheck size={19} /></span><span><strong>{t('role')}</strong><small>{t('brand')}</small></span></div>
      <Button variant="ghost" size="icon" className="admin-menu-button" aria-label={t(open ? 'close' : 'menu')} aria-expanded={open} aria-controls="admin-sidebar" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</Button>
    </header>
    <div className="admin-body">
      <aside id="admin-sidebar" className={`admin-sidebar${open ? ' is-open' : ''}`}>
        <nav aria-label={t('navigation')}>{groups.map(item => <Button variant="ghost" key={item.key} className={`admin-nav${group === item.key ? ' active' : ''}`} aria-current={group === item.key ? 'page' : undefined} onClick={() => selectGroup(item)}><span className="admin-nav-icon"><item.Icon size={20} /></span><span>{t(item.key)}</span></Button>)}</nav>
        <div className="admin-sidebar-bottom"><Button variant="ghost" className="admin-nav" onClick={logout} disabled={busy}><span className="admin-nav-icon"><LogOut size={20} /></span><span>{t('logout')}</span></Button>{error && <p role="alert" className="admin-error">{t('errors.generic')}</p>}</div>
      </aside>
      <main className="admin-main">
        {group === 'dashboard' && children}
        {group !== 'dashboard' && <section className="admin-group-page">{!realContent && <div className="admin-heading"><h1>{t(group)}</h1></div>}
          <div className="admin-panel"><div className="admin-section-tabs" role="tablist" aria-label={t('sections')}>
            {selected.tabs.map((key, index) => <Button variant="ghost" key={key} id={`admin-tab-${key}`} role="tab" aria-selected={tab === key} aria-controls="admin-group-panel" tabIndex={tab === key ? 0 : -1} className={tab === key ? 'selected' : ''} onClick={() => selectTab(key)} onKeyDown={event => {
              if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
              event.preventDefault(); const tabs: readonly string[] = selected.tabs;
              const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
              if (group !== 'accountsGroup' && group !== 'contentGroup' && group !== 'systemGroup') setTab(tabs[next]); event.currentTarget.closest('[role=tablist]')?.querySelector<HTMLButtonElement>(`#admin-tab-${tabs[next]}`)?.focus();
            }}>{t(key)}</Button>)}
          </div><div id="admin-group-panel" role="tabpanel" aria-labelledby={`admin-tab-${tab}`} tabIndex={0} className={realContent ? 'admin-users-content' : 'admin-group-content'}>{realContent ? children : <><span className="admin-empty-icon"><FolderOpen size={28} /></span><h2>{t(tab)}</h2><p>{t('comingDescription')}</p></>}</div></div>
        </section>}
      </main>
    </div><footer className="admin-footer">{t('copyright')}</footer>
  </div>;
}
