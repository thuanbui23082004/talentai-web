'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, ContactRound, LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { NavigationDetails } from '@/components/shared/navigation-details';
import { useAccount } from '@/features/account';

export function RecruiterAccountMenu() {
  const t = useTranslations('Recruiter');
  const settings = useTranslations('Settings');
  const account = useAccount();
  const name = account.data?.fullName ?? t('account');
  const initials = account.data?.fullName.trim().split(/\s+/).slice(-2).map(word => word[0]).join('') ?? '';
  const avatar = account.data?.avatarUrl;

  return <NavigationDetails className="recruiter-account-menu group relative">
    <summary role="button" className="recruiter-user min-h-11 cursor-pointer list-none rounded-lg [&::-webkit-details-marker]:hidden" aria-label={t('accountMenu')}>
      <span className="user-avatar" aria-hidden="true">{avatar && (/^https?:\/\//i.test(avatar) || /^\/(?!\/)/.test(avatar)) ? <Image src={avatar} width={33} height={33} alt="" unoptimized /> : initials}</span>
      <span><strong>{name}</strong><small>{account.data ? settings(`roles.${account.data.role}`) : t('account')}</small></span>
      <ChevronDown size={13} aria-hidden="true" className="group-open:rotate-180" />
    </summary>
    <nav aria-label={t('accountMenu')} className="absolute top-full right-0 z-50 mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card p-2 text-foreground shadow-float">
      <Link href="/recruiter/account" className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm hover:bg-secondary hover:text-primary focus-visible:bg-secondary"><ContactRound size={16} aria-hidden="true" />{t('account')}</Link>
      <Link href="/logout" className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm hover:bg-secondary hover:text-primary focus-visible:bg-secondary"><LogOut size={16} aria-hidden="true" />{t('logout')}</Link>
    </nav>
  </NavigationDetails>;
}
