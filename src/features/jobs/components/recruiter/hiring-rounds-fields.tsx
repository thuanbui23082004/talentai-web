'use client';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CreateJobValues } from '@/features/jobs/schemas/create-job';
export function HiringRoundsFields() {
  const t = useTranslations('JobForm');
  const { control, register, formState: { errors } } = useFormContext<CreateJobValues>();
  const rounds = useFieldArray({ control, name: 'hiringRounds' });
  return <div className="hiring-rounds-fields">{!rounds.fields.length && <p className="hiring-rounds-empty">{t('noRounds')}</p>}<ol>{rounds.fields.map((field, index) => <li key={field.id}><div className="hiring-round-input"><label htmlFor={`hiring-round-${field.id}`}>{t('roundNumber', { number: index + 1 })}</label><Input id={`hiring-round-${field.id}`} {...register(`hiringRounds.${index}.name`)} placeholder={t('roundPlaceholder')} aria-invalid={!!errors.hiringRounds?.[index]?.name} aria-describedby={errors.hiringRounds?.[index]?.name ? `round-error-${field.id}` : undefined} /></div><div className="hiring-round-controls"><Button type="button" size="icon-sm" variant="outline" disabled={index === 0} aria-label={t('roundUp', { number: index + 1 })} onClick={() => rounds.move(index, index - 1)}><ArrowUp size={14} /></Button><Button type="button" size="icon-sm" variant="outline" disabled={index === rounds.fields.length - 1} aria-label={t('roundDown', { number: index + 1 })} onClick={() => rounds.move(index, index + 1)}><ArrowDown size={14} /></Button><Button type="button" size="icon-sm" variant="outline" aria-label={t('roundRemove', { number: index + 1 })} onClick={() => rounds.remove(index)}><Trash2 size={14} /></Button></div>{errors.hiringRounds?.[index]?.name && <p className="field-error" role="alert" id={`round-error-${field.id}`}>{t(`validation.${errors.hiringRounds[index]?.name?.message}`)}</p>}</li>)}</ol><Button type="button" size="sm" variant="outline" onClick={() => rounds.append({ name: '' })}><Plus size={14} />{t('addRound')}</Button></div>;
}
