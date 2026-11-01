'use client';
import { ChevronDown } from 'lucide-react';
export function JobFormSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return <details open className="create-job-section" id={id}><summary><h2>{title}</h2><ChevronDown size={15} /></summary><div className="create-job-section-body">{children}</div></details>;
}
