export function matchesLocationName(name: string, query: string) {
  const normalize = (value: string) => value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[.,]/g, ' ').trim().replace(/\s+/g, ' ');
  const text = normalize(name);
  const term = normalize(query);
  return text.startsWith(term) || text.includes(` ${term}`);
}
