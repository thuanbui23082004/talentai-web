'use client';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { FileText, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminKeys } from '@/features/admin/query-keys';
import { getCompanyDocument } from '@/features/admin/services/companies';
import type { ManagedCompany } from '@/features/admin/schemas/companies';
type Document = NonNullable<ManagedCompany['verificationDocuments']>[number];
function DocumentContent({ blob, file }: { blob: Blob; file: Document }) {
  const t = useTranslations('AdminCompanies'); const frame = useRef<HTMLIFrameElement>(null); const link = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(blob);
    if (frame.current) frame.current.src = url;
    if (link.current) link.current.href = url;
    return () => URL.revokeObjectURL(url);
  }, [blob]);
  return <><a className="admin-company-download" ref={link} download={file.fileName}><Download size={17} />{t('download')}</a><iframe ref={frame} title={t('documentPreview')} referrerPolicy="no-referrer" className="admin-company-document-frame" /></>;
}
function DocumentPreview({ companyId, file, close }: { companyId: string; file: Document; close: () => void }) {
  const t = useTranslations('AdminCompanies');
  const query = useQuery({ queryKey: adminKeys.companyDocument(companyId, file.id ?? ''), queryFn: ({ signal }) => getCompanyDocument(companyId, file.id ?? '', signal), enabled: !!file.id, retry: false, gcTime: 0 });
  return <section className="admin-company-preview"><div className="admin-section-heading"><h3>{file.fileName}</h3><Button variant="ghost" size="icon" aria-label={t('closeDocument')} onClick={close}><X size={18} /></Button></div>{query.isPending && <div className="admin-skeleton" aria-busy="true" aria-label={t('loading')}><span /><span /></div>}{query.error && <div className="admin-state" role="alert"><p>{t('documentFailed')}</p><Button variant="outline" onClick={() => void query.refetch()}>{t('retry')}</Button></div>}{!query.error && query.data && <DocumentContent blob={query.data} file={file} />}</section>;
}
export function CompanyDocuments({ company }: { company: ManagedCompany }) {
  const t = useTranslations('AdminCompanies'); const [selected, setSelected] = useState<Document | null>(null);
  return <section className="admin-user-info"><h2>{t('documents')}</h2>{company.verificationDocuments?.length ? <ul className="admin-company-document-list">{company.verificationDocuments.map((file, i) => <li key={file.id ?? i}><FileText size={20} /><span>{file.fileName}{!file.id && <small>{t('noDocumentId')}</small>}</span><Button variant="outline" disabled={!file.id} aria-label={`${t('viewDocument')} ${file.fileName}`} onClick={() => setSelected(file)}>{t('viewDocument')}</Button></li>)}</ul> : <p className="admin-muted">{t('noDocuments')}</p>}{selected && <DocumentPreview key={selected.id} companyId={company.id} file={selected} close={() => setSelected(null)} />}</section>;
}
