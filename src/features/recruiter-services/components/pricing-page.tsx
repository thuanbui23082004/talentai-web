'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockRecruiterPlans, mockRecruiterOffers } from '@/mocks/fixtures/recruiter-services';
import { quotePlan, isOfferActive } from '@/features/recruiter-services/pricing';
import type { BillingCycle, ServicePlan } from '@/features/recruiter-services/schemas';
import { ServiceFrame } from '@/features/recruiter-services/components/service-frame';
import { vietnamDay } from '@/features/interviews/calendar';

export function PricingPage({ initialOffer, invalidOffer = false }: { initialOffer?: string; invalidOffer?: boolean }) {
  const t = useTranslations('RecruiterServices');
  const router = useRouter();
  const [today] = useState(() => vietnamDay(new Date().toISOString()));
  const [offerCode, setOfferCode] = useState(initialOffer); const [queryInvalid, setQueryInvalid] = useState(invalidOffer);
  const offer = mockRecruiterOffers.find(item => item.code === offerCode && isOfferActive(item, today));
  const [cycle, setCycle] = useState<BillingCycle>(() => mockRecruiterOffers.find(item => item.code === initialOffer)?.cycle ?? 'month');
  const [selected, setSelected] = useState<ServicePlan['id'] | null>(null);
  const selectedPlan = mockRecruiterPlans.find(item => item.id === selected);
  const money = (value: number) => new Intl.NumberFormat('vi', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
  useEffect(() => { if (!selected) return; const frame = requestAnimationFrame(() => document.getElementById('plan-benefits')?.scrollIntoView({ behavior: 'smooth', block: 'start' })); return () => cancelAnimationFrame(frame); }, [selected]);
  const quote = selectedPlan ? quotePlan(selectedPlan, cycle, offer, today) : null;
  const benefitKeys = ['benefitPipeline', 'benefitInterviews', 'benefitStatistics'] as const;
  return <ServiceFrame active="pricing"><header className="service-page-heading"><span className="service-eyebrow">{t('heroTag')}</span><h1>{t('pricingTitle')}</h1><p>{t('pricingSubtitle')}</p></header><div className="service-cycle" role="group" aria-label={t('cycle')}>{(['month', 'year'] as const).map(value => <Button key={value} variant={cycle === value ? 'default' : 'outline'} aria-pressed={cycle === value} onClick={() => setCycle(value)}>{t(value)}</Button>)}<span>{t('yearSave')}</span></div>
    {(offerCode || queryInvalid) && <section className="service-offer-banner" aria-label={t('promotions')}><p role={offer ? 'status' : 'alert'}>{offer ? t('viewingOffer', { code: offer.code }) : t('offerUnavailable')}</p><Button variant="ghost" size="sm" onClick={() => { setOfferCode(undefined); setQueryInvalid(false); router.replace('/recruiter/pricing', { scroll: false }); }}>{t('removeOffer')}</Button></section>}
    <div className="service-plans-grid">{mockRecruiterPlans.map(plan => { const price = quotePlan(plan, cycle, offer, today); return <article className={`service-plan-card${plan.featured ? ' is-featured' : ''}`} key={plan.id}>{plan.featured && <span className="service-plan-recommended"><Sparkles size={13} />{t('recommended')}</span>}<h2>{t(`plans.${plan.id}.name`)}</h2><p className="service-plan-description">{t(`plans.${plan.id}.description`)}</p><div className="service-plan-price">{price.cycleSaving + price.offerSaving > 0 && <del>{money(price.listPrice)}</del>}<strong>{price.total === 0 ? t('free') : money(price.total)}</strong>{price.total > 0 && <span>{t(cycle === 'month' ? 'perMonth' : 'perYear')}</span>}</div><ul><li><Check size={15} />{t('jobs', { count: plan.jobs })}</li><li><Check size={15} />{t('analyses', { count: plan.analyses })}</li>{benefitKeys.map(key => <li key={key}><Check size={15} />{t(key)}</li>)}</ul><Button variant={plan.featured ? 'default' : 'outline'} onClick={() => setSelected(plan.id)} aria-expanded={selected === plan.id}>{t('viewBenefits')}</Button>{plan.id === 'starter' && <Link className="service-start-free" href="/recruiter/jobs/new">{t('start')}</Link>}{offer && !price.eligible && plan.monthlyPrice > 0 && <p className="service-eligibility">{t('notEligible')}</p>}</article>; })}</div>
    {selectedPlan && quote && <section className="service-benefit-panel" id="plan-benefits" aria-label={t('selectedTitle', { name: t(`plans.${selectedPlan.id}.name`) })}><header><h2>{t('selectedTitle', { name: t(`plans.${selectedPlan.id}.name`) })}</h2><Button size="sm" variant="ghost" aria-label={t('close')} onClick={() => setSelected(null)}><X size={15} /></Button></header><div className="service-benefit-grid"><ul><li>{t('jobs', { count: selectedPlan.jobs })}</li><li>{t('analyses', { count: selectedPlan.analyses })}</li>{benefitKeys.map(key => <li key={key}>{t(key)}</li>)}</ul><dl><div><dt>{t('listPrice')}</dt><dd>{money(quote.listPrice)}</dd></div>{quote.cycleSaving > 0 && <div><dt>{t('cycleSaving')}</dt><dd>−{money(quote.cycleSaving)}</dd></div>}{quote.offerSaving > 0 && <div><dt>{t('offerSaving')}</dt><dd>−{money(quote.offerSaving)}</dd></div>}<div className="service-total"><dt>{t('total')}</dt><dd>{quote.total === 0 ? t('free') : money(quote.total)}</dd></div></dl></div><Link className="service-primary-link" href="/recruiter/services">{t('useTools')}</Link></section>}
    <section className="service-comparison"><h2>{t('compare')}</h2><div className="service-table-scroll"><table><thead><tr><th>{t('feature')}</th>{mockRecruiterPlans.map(plan => <th key={plan.id}>{t(`plans.${plan.id}.name`)}</th>)}</tr></thead><tbody><tr><th>{t('jobsLabel')}</th>{mockRecruiterPlans.map(plan => <td key={plan.id}>{plan.jobs}</td>)}</tr><tr><th>{t('analysesLabel')}</th>{mockRecruiterPlans.map(plan => <td key={plan.id}>{plan.analyses}</td>)}</tr>{(['pipelineLabel', 'interviewLabel', 'statisticsLabel'] as const).map(key => <tr key={key}><th>{t(key)}</th>{mockRecruiterPlans.map(plan => <td key={plan.id}><Check size={15} aria-label={t('included')} /></td>)}</tr>)}</tbody></table></div></section>
  </ServiceFrame>;
}
