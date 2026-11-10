export function statisticsShare(value: number, total: number) {
  return total > 0 ? Math.min(100, Math.max(0, value / total * 100)) : 0;
}
