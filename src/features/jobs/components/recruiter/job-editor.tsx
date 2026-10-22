'use client';
import { useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Bold, Italic, List, Heading, Undo2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { CreateJobValues } from '@/features/jobs/schemas/create-job';

export function JobEditor({ name }: { name: 'description' | 'requirements' | 'benefits' }) {
  const t = useTranslations('JobForm');
  const { register, control, setValue, getValues, formState: { errors } } = useFormContext<CreateJobValues>();
  const value = useWatch({ control, name });
  const area = useRef<HTMLTextAreaElement | null>(null);
  const history = useRef<string[]>([]);
  const binding = register(name);
  function format(before: string, after = '') {
    const current = getValues(name);
    history.current.push(current);
    const start = area.current?.selectionStart ?? current.length;
    const end = area.current?.selectionEnd ?? current.length;
    setValue(name, current.slice(0, start) + before + current.slice(start, end) + after + current.slice(end), { shouldValidate: true, shouldDirty: true });
    area.current?.focus();
  }
  const error = errors[name];
  return <div className="create-job-field create-job-editor"><label htmlFor={name}>{t(name)}{name !== 'benefits' && <span aria-hidden="true"> *</span>}</label><div className="editor-toolbar">
    {([{ key: 'bold', Icon: Bold, before: '**', after: '**' }, { key: 'italic', Icon: Italic, before: '*', after: '*' }, { key: 'bullet', Icon: List, before: '\n- ', after: '' }, { key: 'headingFormat', Icon: Heading, before: '\n### ', after: '' }] as const).map(item => <Button type="button" size="icon-xs" variant="ghost" key={item.key} aria-label={t(item.key)} onClick={() => format(item.before, item.after)}><item.Icon size={12} /></Button>)}
    <Button type="button" size="icon-xs" variant="ghost" aria-label={t('undo')} onClick={() => { const previous = history.current.pop(); if (previous !== undefined) setValue(name, previous, { shouldDirty: true, shouldValidate: true }); }}><Undo2 size={12} /></Button><small>{t('characters', { count: value.length })}</small></div>
    <Textarea id={name} {...binding} ref={element => { binding.ref(element); area.current = element; }} placeholder={t(`${name}Placeholder`)} rows={5} maxLength={name === 'benefits' ? 10000 : 20000} aria-invalid={!!error} aria-describedby={error ? `${name}-error` : undefined} />
    {error && <p id={`${name}-error`} role="alert" className="field-error">{t(`validation.${error.message}`)}</p>}
  </div>;
}
