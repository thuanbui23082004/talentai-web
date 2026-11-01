'use client';

import { useTranslations } from 'next-intl';
import { MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LocationPicker } from '@/features/jobs';

type RecruiterJobSearchProps = {
  query: string;
  location: string;
  filters: boolean;
  onQueryChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onSearch: () => void;
  onToggleFilters: () => void;
};

export function RecruiterJobSearch({ query, location, filters, onQueryChange, onLocationChange, onSearch, onToggleFilters }: RecruiterJobSearchProps) {
  const t = useTranslations('Recruiter');
  return (
<form className="job-search-main" onSubmit={event => { event.preventDefault(); onSearch(); }}><div className="search-input"><Search size={19} /><Input value={query} onChange={event => onQueryChange(event.target.value)} placeholder={t('searchPlaceholder')} aria-label={t('searchPlaceholder')} /><div className="location-select"><MapPin size={18} /><LocationPicker aria-label={t('locationLabel')} value={location} onValueChange={onLocationChange} allowAll /></div></div><Button type="submit" className="search-submit"><Search size={17} />{t('search')}</Button><Button type="button" className="filter-toggle" variant="outline" aria-expanded={filters} onClick={onToggleFilters}><SlidersHorizontal size={15} />{t('filters')}</Button></form>
  );
}
