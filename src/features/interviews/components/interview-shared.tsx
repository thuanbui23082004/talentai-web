'use client';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { interviewErrorKey } from '@/features/interviews/errors';
export function InterviewError({ error, retry }: { error: unknown; retry?: () => void }) {
  const t = useTranslations('Interviews');
  return <div className="interview-error" role="alert"><p>{t(`errors.${interviewErrorKey(error)}`)}</p>{retry && <Button size="sm" variant="outline" onClick={retry}>{t('retry')}</Button>}</div>;
}
export function InterviewChoice({ label, value, items, change }: { label: string; value: string; items: { value: string; label: string }[]; change: (value: string) => void }) {
  return <Select value={value} items={items} onValueChange={value => change(value ?? '')}><SelectTrigger aria-label={label}><SelectValue /></SelectTrigger><SelectContent>{items.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>;
}
export function interviewTime(value: string) { return new Intl.DateTimeFormat('vi', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value)); }
