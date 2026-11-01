'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CandidateRequestError } from '@/features/applications/errors';

export function CandidateCvViewer({ blob, loading, error, onClose, onRetry }: { blob?: Blob; loading: boolean; error: unknown; onClose: () => void; onRetry: () => void }) {
  const t = useTranslations('Candidates');
  const [url, setUrl] = useState('');
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    panel.current?.focus();
    panel.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (!blob) return;
    const objectUrl = URL.createObjectURL(blob);
    // The URL is a browser resource, released when the viewer closes or changes file.
    const frame = requestAnimationFrame(() => setUrl(objectUrl));
    return () => { cancelAnimationFrame(frame); URL.revokeObjectURL(objectUrl); };
  }, [blob]);
  return <section ref={panel} tabIndex={-1} className="candidate-cv-viewer" aria-label={t('cvTitle')}><div className="candidate-cv-heading"><h2>{t('cvTitle')}</h2><Button variant="ghost" size="sm" onClick={onClose}><X size={14} />{t('close')}</Button></div>{loading ? <p role="status">{t('cvLoading')}</p> : error ? <div role="alert"><p>{t(`errors.${error instanceof CandidateRequestError ? error.messageKey : 'requestFailed'}`)}</p><Button variant="outline" onClick={onRetry}>{t('retry')}</Button></div> : url && blob ? <><p>{t('cvFallback')}</p><a className="candidate-download" href={url} download={blob.type.startsWith('application/pdf') ? 'candidate-cv.pdf' : 'candidate-cv.docx'}><Download size={13} />{t('download')}</a>{blob.type.startsWith('application/pdf') && <iframe src={url} title={t('cvTitle')} className="candidate-cv-frame" />}</> : null}</section>;
}
