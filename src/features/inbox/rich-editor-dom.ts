import { mailColors, mailFonts, mailSizes, richNodeStyle } from '@/features/inbox/components/mail-rich-body';
import { richNodeSchema, richTags, safeMailLink, type RichNode } from '@/features/inbox/mail-schema';

// Only this small document vocabulary is retained. HTML from paste is never saved or rendered directly.
export function readMailEditor(root: HTMLElement): RichNode[] {
  let count = 0;
  function read(node: Node, depth = 0): RichNode[] {
    if (++count > 1000 || depth > 20) return [];
    if (node.nodeType === Node.TEXT_NODE) return [{ text: (node.textContent ?? '').slice(0, 10000) }];
    if (!(node instanceof HTMLElement) || ['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'SVG'].includes(node.tagName)) return [];
    const children = Array.from(node.childNodes).flatMap(child => read(child, depth + 1));
    const tag = richTags.find(value => value === node.tagName.toLowerCase());
    if (!tag) return children;
    const style: NonNullable<RichNode['style']> = {};
    if (node.style.fontWeight === 'bold' || Number(node.style.fontWeight) >= 600) style.bold = true;
    if (node.style.fontStyle === 'italic') style.italic = true;
    if (node.style.textDecoration.includes('underline')) style.underline = true;
    if (['left', 'center', 'right'].includes(node.style.textAlign)) style.align = node.style.textAlign as 'left' | 'center' | 'right';
    const font = node.getAttribute('face') ?? node.style.fontFamily;
    if (/georgia|serif/i.test(font) && !/sans/i.test(font)) style.font = 'serif';
    else if (/mono|courier/i.test(font)) style.font = 'mono';
    else if (font) style.font = 'sans';
    const size = node.getAttribute('size');
    if (size || node.style.fontSize) style.size = size === '2' || node.style.fontSize === '12px' ? 'small' : size === '5' || node.style.fontSize === '18px' ? 'large' : 'normal';
    const color = node.getAttribute('color') ?? node.style.color;
    for (const key of Object.keys(mailColors) as (keyof typeof mailColors)[]) {
      const token = getComputedStyle(root).getPropertyValue(mailColors[key]).trim();
      const probe = document.createElement('span'); probe.style.color = token;
      const candidate = document.createElement('span'); candidate.style.color = color;
      if (color && (color === `var(${mailColors[key]})` || candidate.style.color === probe.style.color)) style.color = key;
    }
    return [{ tag, children, style, ...(tag === 'a' && safeMailLink(node.getAttribute('href') ?? '') ? { href: safeMailLink(node.getAttribute('href') ?? '') } : {}) }];
  }
  const parsed = richNodeSchema.array().safeParse(Array.from(root.childNodes).flatMap(node => read(node)));
  return parsed.success ? parsed.data : [];
}
export function mountMailEditor(root: HTMLElement, nodes: RichNode[], fallback: string) {
  function element(node: RichNode): Node {
    if (node.text !== undefined) return document.createTextNode(node.text);
    const tag = node.tag === 'font' ? 'span' : node.tag ?? 'span';
    const result = document.createElement(tag);
    const style = richNodeStyle(node);
    Object.assign(result.style, Object.fromEntries(Object.entries(style).filter(([, value]) => value !== undefined)));
    if (node.tag === 'a' && node.href && safeMailLink(node.href)) result.setAttribute('href', safeMailLink(node.href)!);
    if (node.style?.font) result.style.fontFamily = mailFonts[node.style.font];
    if (node.style?.size) result.style.fontSize = mailSizes[node.style.size];
    result.append(...(node.children ?? []).map(element));
    return result;
  }
  if (nodes.length) root.replaceChildren(...nodes.map(element));
  else root.textContent = fallback;
}
