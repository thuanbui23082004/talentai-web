import type { CSSProperties } from 'react';
import { safeMailLink, type RichNode } from '@/features/inbox/mail-schema';

export const mailFonts = { sans: 'Arial, sans-serif', serif: 'Georgia, serif', mono: 'monospace' };
export const mailSizes = { small: '12px', normal: '14px', large: '18px' };
export const mailColors = { text: '--recruiter-text', primary: '--recruiter-primary', danger: '--recruiter-danger', muted: '--recruiter-muted' };
export function richNodeStyle(node: RichNode): CSSProperties {
  const style = node.style;
  return { fontWeight: style?.bold ? 'bold' : undefined, fontStyle: style?.italic ? 'italic' : undefined,
    textDecoration: style?.underline ? 'underline' : undefined, textAlign: style?.align,
    fontFamily: style?.font ? mailFonts[style.font] : undefined, fontSize: style?.size ? mailSizes[style.size] : undefined,
    color: style?.color ? `var(${mailColors[style.color]})` : undefined };
}
export function MailRichBody({ nodes }: { nodes: RichNode[] }) {
  return nodes.map((node, index) => {
    if (node.text !== undefined) return node.text;
    const children = <MailRichBody nodes={node.children ?? []} />;
    const style = richNodeStyle(node);
    if (node.tag === 'br') return <br key={index} />;
    if (node.tag === 'a') return <a key={index} href={node.href ? safeMailLink(node.href) : undefined} target="_blank" rel="noopener noreferrer" style={style}>{children}</a>;
    const Tag = node.tag === 'font' ? 'span' : node.tag ?? 'span';
    return <Tag key={index} style={style}>{children}</Tag>;
  });
}
