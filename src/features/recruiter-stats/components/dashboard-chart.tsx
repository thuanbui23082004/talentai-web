'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
export function DashboardChart({ points, label }: { points: { date: string; value: number }[]; label: string }) {
  const t = useTranslations('RecruiterStats'); const id = useId().replaceAll(':', '');
  const chart = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ width: 760, height: 205 });
  useEffect(() => {
    const element = chart.current; if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ width, height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const baseline = size.height - 35;
  const labelCapacity = Math.min(7, Math.max(2, Math.floor((size.width - 80) / 80) + 1));
  const labelStep = Math.max(1, Math.ceil((points.length - 1) / (labelCapacity - 1)));
  const maximum = Math.max(4, Math.ceil(Math.max(...points.map(point => point.value), 0) / 4) * 4);
  const positions = points.map((point, index) => ({ ...point, x: points.length === 1 ? size.width / 2 : 40 + index * (size.width - 80) / (points.length - 1), y: baseline - point.value / maximum * (baseline - 30) }));
  const line = positions.map((point, index) => {
    if (!index) return `M${point.x},${point.y}`;
    const previous = positions[index - 1]; const middle = (previous.x + point.x) / 2;
    return `C${middle},${previous.y} ${middle},${point.y} ${point.x},${point.y}`;
  }).join(' ');
  const area = positions.length ? `${line} L${positions.at(-1)!.x},${baseline} L${positions[0].x},${baseline} Z` : '';
  return <svg ref={chart} className="dashboard-line-chart" viewBox={`0 0 ${size.width} ${size.height}`} role="img" aria-label={label}><title>{label}</title><defs><linearGradient id={`dashboard-fill-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--recruiter-accent)" stopOpacity=".2" /><stop offset="100%" stopColor="var(--recruiter-accent)" stopOpacity=".02" /></linearGradient></defs>{[0, 1, 2, 3, 4].map(step => <g key={step}><line x1={40} x2={size.width - 40} y1={30 + step * (baseline - 30) / 4} y2={30 + step * (baseline - 30) / 4} stroke="var(--recruiter-border)" /><text x={5} y={34 + step * (baseline - 30) / 4}>{maximum * (4 - step) / 4}</text></g>)}<path d={area} fill={`url(#dashboard-fill-${id})`} /><path d={line} fill="none" stroke="var(--recruiter-accent)" strokeWidth={3} strokeLinecap="round" />{positions.map((point, index) => <g key={point.date}><circle cx={point.x} cy={point.y} r={3.5} fill="var(--recruiter-accent)" stroke="var(--recruiter-surface)"><title>{point.date}: {point.value}</title></circle>{(index % labelStep === 0 || index === positions.length - 1) && <text x={point.x} y={size.height - 10} textAnchor="middle">{new Intl.DateTimeFormat('vi', { month: 'short', day: positions.length > 9 ? 'numeric' : undefined, timeZone: 'UTC' }).format(new Date(point.date + 'T00:00:00Z'))}</text>}</g>)}{!positions.length && <text x={size.width / 2} y={size.height / 2} textAnchor="middle">{t('empty')}</text>}</svg>;
}
