'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import './services.css';
export function ServiceFrame({ active, children }: { active: 'services' | 'pricing' | 'promotions'; children: ReactNode }) {
  const t = useTranslations('RecruiterServices');
  return <div className="service-portal"><nav className="service-page-nav" aria-label={t('navigation')}>{(['services', 'pricing', 'promotions'] as const).map(page => <Link key={page} href={`/recruiter/${page}`} className={active === page ? 'is-active' : ''} aria-current={active === page ? 'page' : undefined}>{t(page)}</Link>)}</nav>{children}</div>;
}
