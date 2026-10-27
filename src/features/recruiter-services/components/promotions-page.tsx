'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, Copy, Gift, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockRecruiterOffers } from '@/mocks/fixtures/recruiter-services';
import { isOfferActive } from '@/features/recruiter-services/pricing';
import { ServiceFrame } from '@/features/recruiter-services/components/service-frame';
import { vietnamDay } from '@/features/interviews/calendar';
export function PromotionsPage() {
  const t = useTranslations('RecruiterServices'); const [category, setCategory] = useState('all');
  const [notice, setNotice] = useState<{ copied: boolean; code: string } | null>(null);
  const [today] = useState(() => vietnamDay(new Date().toISOString()));
  const offers = mockRecruiterOffers.filter(offer => isOfferActive(offer, today) && (category === 'all' || category === offer.category));
  async function copy(code: string) { try { await navigator.clipboard.writeText(code); setNotice({ copied: true, code }); } catch { setNotice({ copied: false, code }); } }
  return <ServiceFrame active="promotions"><header className="service-page-heading"><span className="service-eyebrow"><Gift size={14} />{t('promotions')}</span><h1>{t('promotionsTitle')}</h1><p>{t('promotionsSubtitle')}</p></header><div className="service-offer-filters" role="group" aria-label={t('filter')}>{(['all', 'new', 'ai', 'annual'] as const).map(value => <Button key={value} variant={category === value ? 'default' : 'outline'} aria-pressed={category === value} onClick={() => { setCategory(value); setNotice(null); }}>{t(value)}</Button>)}</div>{notice && <p className={notice.copied ? 'service-copy-notice' : 'service-copy-error'} role={notice.copied ? 'status' : 'alert'}>{notice.copied ? t('copied', { code: notice.code }) : t('copyFailed')}</p>}
    {offers.length ? <div className="service-offers-grid">{offers.map(offer => <article className="service-offer-card" key={offer.id}><div className="service-offer-art"><Percent size={34} /><strong>{t('discount', { percent: offer.percent })}</strong><span>{t(offer.category)}</span></div><div className="service-offer-content"><h2>{t(`offers.${offer.id}.title`)}</h2><p>{t(`offers.${offer.id}.description`)}</p><time dateTime={offer.endsAt}>{t('expiry', { date: new Intl.DateTimeFormat('vi', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(offer.endsAt + 'T00:00:00Z')) })}</time><div className="service-offer-code"><div><small>{t('code')}</small><strong>{offer.code}</strong></div><Button size="sm" variant="outline" aria-label={`${t('copy')} ${offer.code}`} onClick={() => void copy(offer.code)}><Copy size={14} />{t('copy')}</Button></div><Link className="service-primary-link" href={`/recruiter/pricing?offer=${encodeURIComponent(offer.code)}`}>{t('seePlans')}<ArrowRight size={14} /></Link><details><summary>{t('conditions')}</summary><dl><div><dt>{t('applicablePlans')}</dt><dd>{offer.planIds.map(id => t(`plans.${id}.name`)).join(', ')}</dd></div><div><dt>{t('offerCycle')}</dt><dd>{offer.cycle ? t(offer.cycle) : `${t('month')}, ${t('year')}`}</dd></div></dl><p>{t('offerNote')}</p></details></div></article>)}</div> : <p className="service-empty">{t('empty')}</p>}
  </ServiceFrame>;
}
