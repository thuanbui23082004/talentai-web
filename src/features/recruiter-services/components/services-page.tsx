'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, BarChart3, BriefcaseBusiness, CalendarDays, Check, Layers3, Sparkles, UsersRound } from 'lucide-react';
import { ServiceFrame } from '@/features/recruiter-services/components/service-frame';
export function ServicesPage() {
  const t = useTranslations('RecruiterServices');
  const services = [
    { id: 'posting', icon: BriefcaseBusiness, href: '/recruiter/jobs/new' }, { id: 'ai', icon: Sparkles, href: '/recruiter/jobs' },
    { id: 'candidates', icon: UsersRound, href: '/recruiter/candidates' }, { id: 'pipeline', icon: Layers3, href: '/recruiter/candidates/pipeline' },
    { id: 'interviews', icon: CalendarDays, href: '/recruiter/interviews' }, { id: 'statistics', icon: BarChart3, href: '/recruiter/dashboard' },
  ] as const;
  return <ServiceFrame active="services"><section className="service-hero"><div><span className="service-eyebrow">{t('heroTag')}</span><h1>{t('title')}</h1><p>{t('subtitle')}</p><div className="service-hero-actions"><Link href="/recruiter/pricing">{t('explorePlans')}<ArrowRight size={16} /></Link><Link href="/recruiter/jobs/new">{t('start')}</Link></div></div><div className="service-hero-visual" aria-hidden="true"><Sparkles size={40} /><div><BriefcaseBusiness size={25} /><UsersRound size={25} /><CalendarDays size={25} /></div></div></section><header className="service-section-heading"><h2>{t('servicesHeading')}</h2><p>{t('servicesSubtitle')}</p></header><div className="service-tools-grid">{services.map(({ id, icon: Icon, href }) => <article className="service-tool-card" key={id}><span className="service-icon"><Icon size={23} /></span><h3>{t(`serviceItems.${id}.title`)}</h3><p>{t(`serviceItems.${id}.description`)}</p><Link href={href}>{t(`serviceItems.${id}.action`)}<ArrowRight size={14} /></Link></article>)}</div><section className="service-steps"><h2>{t('stepsHeading')}</h2><ol>{(['first', 'second', 'third'] as const).map((key, index) => <li key={key}><span><Check size={15} /></span><strong>{index + 1}. {t(`steps.${key}`)}</strong></li>)}</ol><Link href="/recruiter/company">{t('company')}<ArrowRight size={14} /></Link></section><section className="service-faq"><h2>{t('faqTitle')}</h2>{(['first', 'second', 'third'] as const).map(key => <details key={key}><summary>{t(`faq.${key}.question`)}</summary><p>{t(`faq.${key}.answer`)}</p></details>)}</section></ServiceFrame>;
}
