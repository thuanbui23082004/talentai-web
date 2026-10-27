'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import './help.css';

const guides = [
  { id: 'create', category: 'jobs', href: '/recruiter/jobs/new' },
  { id: 'status', category: 'jobs', href: '/recruiter/jobs' },
  { id: 'cv', category: 'candidates', href: '/recruiter/candidates' },
  { id: 'ai', category: 'candidates', href: '/recruiter/jobs' },
  { id: 'pipeline', category: 'interviews', href: '/recruiter/candidates/pipeline' },
  { id: 'interview', category: 'interviews', href: '/recruiter/interviews' },
  { id: 'statistics', category: 'interviews', href: '/recruiter/dashboard' },
  { id: 'account', category: 'account', href: '/recruiter/account' },
  { id: 'company', category: 'account', href: '/recruiter/company' },
  { id: 'services', category: 'account', href: '/recruiter/services' },
] as const;
const categories = ['all', 'jobs', 'candidates', 'interviews', 'account'] as const;

export function HelpPage() {
  const t = useTranslations('RecruiterHelp');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<typeof categories[number]>('all');
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLocaleLowerCase('vi').trim();
  const visible = guides.filter(guide => (category === 'all' || guide.category === category) && normalize(`${t(`guides.${guide.id}.title`)} ${t(`guides.${guide.id}.question`)} ${t(`guides.${guide.id}.answer`)}`).includes(normalize(search)));
  return <div className="recruiter-help"><header className="help-heading"><h1>{t('title')}</h1><p>{t('subtitle')}</p><div className="help-search"><Search size={18} aria-hidden="true" /><Input aria-label={t('search')} placeholder={t('placeholder')} value={search} onChange={event => setSearch(event.target.value)} type="search" /></div></header><nav className="help-categories" aria-label={t('title')}>{categories.map(key => <Button key={key} variant={category === key ? 'default' : 'outline'} aria-pressed={category === key} onClick={() => setCategory(key)}>{key === 'all' ? t('all') : t(`categories.${key}`)}</Button>)}</nav><div className="help-guides">{visible.map(guide => <article key={guide.id}><span className="help-category">{t(`categories.${guide.category}`)}</span><h2>{t(`guides.${guide.id}.title`)}</h2><details><summary>{t(`guides.${guide.id}.question`)}</summary><p>{t(`guides.${guide.id}.answer`)}</p></details><Link href={guide.href}>{t('open')}<ArrowRight size={15} aria-hidden="true" /></Link></article>)}</div>{visible.length === 0 && <div className="help-empty" role="status"><p>{t('empty')}</p><Button variant="outline" onClick={() => { setSearch(''); setCategory('all'); }}>{t('reset')}</Button></div>}</div>;
}
