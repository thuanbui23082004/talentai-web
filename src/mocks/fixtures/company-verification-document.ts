// Deterministic, synthetic verification sheet; contains no real business records.
export function syntheticCompanyDocument() {
  const lines = ['DEMO BUSINESS VERIFICATION', 'SYNTHETIC DOCUMENT - NO LEGAL VALUE', 'Business: Example Test Company', 'Tax identifier: 0000000000', 'For interface testing only.'];
  const stream = 'BT /F1 14 Tf 50 780 Td ' + lines.map((line, index) => `${index ? '0 -32 Td ' : ''}(${line}) Tj`).join('\n') + ' ET';
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];
  let content = '%PDF-1.4\n'; const offsets: number[] = [];
  objects.forEach((object, i) => { offsets.push(content.length); content += `${i + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = content.length;
  content += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` + offsets.map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('') + `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(content);
}
