'use client';

import { useRef, useState, type ComponentProps, type Ref } from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getRecruiterLocations } from '@/features/jobs/services/recruiter-jobs';
import { recruiterJobKeys } from '@/features/jobs/query-keys';
import { matchesLocationName } from '@/features/jobs/location-search';
import './location-picker.css';

type Props = Pick<ComponentProps<typeof Input>, 'id' | 'aria-label' | 'aria-labelledby' | 'aria-required' | 'aria-invalid' | 'aria-describedby' | 'disabled'> & {
  value: string; onValueChange: (value: string) => void; onBlur?: () => void;
  inputRef?: Ref<HTMLInputElement>; items?: { name: string; isActive: boolean }[]; allowAll?: boolean;
};

export function LocationPicker({ value, onValueChange, onBlur, inputRef, items, allowAll = false, ...inputProps }: Props) {
  const t = useTranslations('JobForm');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const portalContainer = useRef<HTMLElement | null>(null);
  const query = useQuery({ queryKey: recruiterJobKeys.locations(), queryFn: getRecruiterLocations, enabled: items === undefined, retry: false });
  const choices = [...new Set((items ?? query.data ?? []).filter(item => item.isActive).map(item => item.name))].sort((a, b) => a.localeCompare(b, 'vi'));
  // Preserve a saved value while backend catalog changes are rolled out.
  if (value && !choices.includes(value)) choices.unshift(value);
  if (allowAll) choices.unshift('');
  const loading = items === undefined && query.isPending;
  const error = items === undefined && query.isError;
  return <Combobox.Root<string> items={choices} value={value || null} onValueChange={next => onValueChange(next ?? '')} open={open} onOpenChange={(next, details) => { setOpen(next); if (next && details.reason !== 'input-change') setSearch(''); if (!next) onBlur?.(); }} inputValue={open ? search : value} onInputValueChange={(next, details) => { if (details.reason === 'input-change' || details.reason === 'input-clear') setSearch(next); }} openOnInputClick autoHighlight filter={(item, text) => item === '' ? !text.trim() : matchesLocationName(item, text)} itemToStringLabel={item => item || t('allLocations')}>
    <Combobox.InputGroup className="location-picker" ref={node => { portalContainer.current = node?.closest<HTMLElement>('.recruiter-app') ?? null; }}>
      <Combobox.Input render={<Input />} ref={inputRef} {...inputProps} placeholder={t(allowAll ? 'allLocations' : 'locationPlaceholder')} autoComplete="off" />
      <Combobox.Trigger render={<Button type="button" variant="ghost" size="icon-sm" />} disabled={inputProps.disabled} aria-label={t('openLocations')}><ChevronDown size={15} /></Combobox.Trigger>
    </Combobox.InputGroup>
    <Combobox.Portal container={portalContainer}><Combobox.Positioner className="location-picker-positioner" sideOffset={6} align="start"><Combobox.Popup className="location-picker-popup">
      {loading ? <div className="location-picker-state" role="status" aria-busy="true">{t('locationsLoading')}</div> : error ? <div className="location-picker-state" role="alert"><p>{t('locationsError')}</p><Button type="button" variant="outline" size="sm" onClick={() => void query.refetch()}>{t('locationsRetry')}</Button></div> : <><Combobox.Empty className="location-picker-empty">{t('locationsEmpty')}</Combobox.Empty><Combobox.List className="location-picker-list">{(item: string) => <Combobox.Item key={item || 'all-locations'} value={item} className="location-picker-option"><span>{item || t('allLocations')}</span><Combobox.ItemIndicator><Check size={15} /></Combobox.ItemIndicator></Combobox.Item>}</Combobox.List></>}
    </Combobox.Popup></Combobox.Positioner></Combobox.Portal>
  </Combobox.Root>;
}
