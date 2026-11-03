// Small PDF generator for synthetic fixtures only. Never logs or persists CV content.
export function createSyntheticCvPdf(fullName: string, headline: string, skills: string[]) {
  const ascii = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^\x20-\x7e]/g, '').replace(/[\\()]/g, '\\$&');
  const lines = ['CURRICULUM VITAE', ascii(fullName), ascii(headline), 'Skills: ' + ascii(skills.join(', ')), 'Experience: Software and product delivery.', 'Education: University graduate.'];
  const stream = 'BT /F1 16 Tf 50 780 Td ' + lines.map((line, index) => `${index ? '0 -35 Td ' : ''}(${line}) Tj`).join('\n') + ' ET';
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];
  let document = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (let i = 0; i < objects.length; i++) { offsets.push(document.length); document += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`; }
  const xref = document.length;
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` + offsets.map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('') + `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(document);
}
