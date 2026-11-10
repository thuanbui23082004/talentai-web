'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations, useFormatter } from 'next-intl';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminKeys } from '@/features/admin/query-keys';
import { getManagedCompany } from '@/features/admin/services/companies';
import { companyActions, type CompanyAction } from '@/features/admin/schemas/companies';
import { canModerateCompany } from '@/features/admin/company-rules';
import { CompanyState, CompanyBadge } from '@/features/admin/components/companies-shared';
import { CompanyDocuments } from '@/features/admin/components/company-documents';
import { CompanyModerationForm } from '@/features/admin/components/company-moderation-form';
export function AdminCompanyDetail({ companyId }: { companyId: string }) {
  const t = useTranslations('AdminCompanies'); const f = useFormatter();
  const query = useQuery({ queryKey: adminKeys.company(companyId), queryFn: ({ signal }) => getManagedCompany(companyId, signal), retry: false });
  const [action, setAction] = useState<CompanyAction | null>(null); const [success, setSuccess] = useState(false); const company = query.data;
  const date = (value?: string) => value ? f.dateTime(new Date(value), { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : t('noValue');
  return <div className="admin-users-page"><Link className="admin-user-back" href="/admin/companies"><ArrowLeft size={17} />{t('back')}</Link><CompanyState pending={query.isPending} error={query.error} retry={query.refetch} />
    {company && !query.error && <><div className="admin-users-heading"><div><h1>{t('detail')}</h1><p>{company.name}</p></div><CompanyBadge status={company.verificationStatus} /></div>{success && <p className="admin-user-notice" role="status"><ShieldCheck size={18} />{t('success')}</p>}
      <section className="admin-user-info"><h2>{t('information')}</h2><dl className="admin-user-fields">{[{ key: 'name', value: company.name }, { key: 'taxCode', value: company.taxCode }, { key: 'city', value: company.city }, { key: 'address', value: company.address }, { key: 'email', value: company.contactEmail }, { key: 'phone', value: company.contactPhone }, { key: 'size', value: company.size }, { key: 'website', value: company.website }, { key: 'industries', value: company.industries?.map(item => item.name).join(', ') }, { key: 'created', value: date(company.createdAt) }, { key: 'verifiedAt', value: date(company.verifiedAt) }, { key: 'jobCount', value: company.jobCount === undefined ? undefined : f.number(company.jobCount) }].map(({ key, value }) => <div key={key}><dt>{t(key)}</dt><dd>{value || t('noValue')}</dd></div>)}</dl>{company.rejectionReason && <div className="admin-company-rejection"><strong>{t('rejectionReason')}</strong><p>{company.rejectionReason}</p></div>}</section>
      {company.description && <section className="admin-user-info"><h2>{t('description')}</h2><p className="admin-company-description">{company.description}</p></section>}
      <section className="admin-user-info"><h2>{t('owner')}</h2><dl className="admin-user-fields"><div><dt>{t('ownerName')}</dt><dd>{company.owner?.fullName || t('noValue')}</dd></div><div><dt>{t('ownerEmail')}</dt><dd>{company.owner?.email || t('noValue')}</dd></div></dl></section>
      <CompanyDocuments key={company.id} company={company} />
      {!action && <div className="admin-access-buttons">{companyActions.filter(value => canModerateCompany(company.verificationStatus, value)).map(value => <Button key={value} variant={value === 'reject' || value === 'suspend' ? 'destructive' : 'default'} disabled={value === 'verify' && !company.verificationDocuments?.length} onClick={() => { setSuccess(false); setAction(value); }}>{t(value)}</Button>)}</div>}
      {action && <CompanyModerationForm key={`${company.id}-${action}`} company={company} action={action} close={() => setAction(null)} saved={() => setSuccess(true)} />}
      <section className="admin-user-info"><h2>{t('history')}</h2>{company.history?.length ? <ol className="admin-user-history">{company.history.map((entry, i) => <li key={`${entry.at}-${i}`}><ShieldCheck size={18} /><div><strong>{t(companyActions.includes(entry.action as CompanyAction) ? entry.action : 'otherAction')}</strong><p>{t('actor')}: {entry.actorName || t('noValue')}</p>{entry.reason && <p className="admin-history-reason">{t('note')}: {entry.reason}</p>}<time dateTime={entry.at}>{date(entry.at)}</time></div></li>)}</ol> : <p className="admin-user-history-empty">{t('noHistory')}</p>}</section>
    </>}
  </div>;
}
