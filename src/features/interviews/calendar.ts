export function vietnamDay(value: string) { return new Date(new Date(value).getTime() + 7 * 3600000).toISOString().slice(0, 10); }
export function monthRange(month: string) {
  const [year, number] = month.split('-').map(Number);
  return { from: `${month}-01`, to: `${month}-${new Date(Date.UTC(year, number, 0)).getUTCDate()}` };
}
export function shiftMonth(month: string, delta: number) {
  const [year, number] = month.split('-').map(Number);
  return new Date(Date.UTC(year, number - 1 + delta, 1)).toISOString().slice(0, 7);
}
export function calendarDays(month: string) {
  const { from, to } = monthRange(month);
  const offset = (new Date(from + 'T00:00:00Z').getUTCDay() + 6) % 7;
  return [...Array(offset).fill(null), ...Array.from({ length: Number(to.slice(-2)) }, (_, index) => `${month}-${String(index + 1).padStart(2, '0')}`)] as (string | null)[];
}
