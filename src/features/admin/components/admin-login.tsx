'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { useTranslations } from 'next-intl';
import { ArrowRight, Eye, EyeOff, ShieldCheck, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { loginSchema } from '@/features/admin/schemas';
import { loginAdmin } from '@/features/admin/services';
import { adminErrorKey } from '@/features/admin/errors';

export function AdminLogin() {
  const t = useTranslations('Admin'); const router = useRouter();
  const [visible, setVisible] = useState(false); const [error, setError] = useState<string>();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema), mode: 'onBlur' });
  const submit = handleSubmit(async input => { setError(undefined); try { await loginAdmin(input); router.replace('/admin/dashboard'); router.refresh(); } catch (e) { setError(t(`errors.${adminErrorKey(e)}`)); } });
  return <main className="admin-login"><header className="admin-login-header"><span className="admin-logo"><Image src="/logo/image%201.png" width={180} height={181} alt={t('brand')} priority /></span><span className="admin-login-header-label"><ShieldCheck size={16} />{t('workspace')}</span></header>
    <section className="admin-login-form"><div className="admin-login-box"><span className="admin-login-icon"><ShieldCheck size={28} /></span><h1>{t('loginTitle')}</h1><p>{t('loginSubtitle')}</p><form onSubmit={submit} noValidate>
      <div className="admin-field"><label htmlFor="admin-email">{t('email')}</label><Input id="admin-email" type="email" autoComplete="username" placeholder={t('emailPlaceholder')} {...register('email')} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'admin-email-error' : undefined} />{errors.email && <p id="admin-email-error" className="admin-error" role="alert">{t('errors.email')}</p>}</div>
      <div className="admin-field"><label htmlFor="admin-password">{t('password')}</label><div className="admin-password"><Input id="admin-password" type={visible ? 'text' : 'password'} autoComplete="current-password" placeholder={t('passwordPlaceholder')} {...register('password')} aria-invalid={!!errors.password} aria-describedby={errors.password ? 'admin-password-error' : undefined} /><Button type="button" variant="ghost" size="icon" aria-label={t(visible ? 'hidePassword' : 'showPassword')} aria-pressed={visible} onClick={() => setVisible(value => !value)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</Button></div>{errors.password && <p id="admin-password-error" className="admin-error" role="alert">{t('errors.required')}</p>}</div>
      {error && <p className="admin-error admin-error-box" role="alert">{error}</p>}<Button type="submit" className="admin-login-submit" disabled={isSubmitting}>{isSubmitting ? <LoaderCircle className="animate-spin" /> : null}{t(isSubmitting ? 'loggingIn' : 'login')}<ArrowRight size={18} /></Button>
    </form><p className="admin-login-restricted"><ShieldCheck size={16} />{t('restricted')}</p></div></section><footer className="admin-login-footer">{t('copyright')}</footer></main>;
}


