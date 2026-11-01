import type { components } from '@/lib/api/generated/schema';
import type { StatsQuery } from '@/features/recruiter-stats/schemas';
import { vietnamDay } from '@/features/interviews';
type Application = components['schemas']['RecruiterApplicationDetail'];
type Job = components['schemas']['RecruiterJob'];
export function withinRange(value: string, query: StatsQuery) { const date = vietnamDay(value); return (!query.from || date >= query.from) && (!query.to || date <= query.to); }
export function stageReached(app: Application, rounds: string[] = []) {
  const statusRank: Record<string, number> = { submitted: 0, reviewing: 1, interview: 2, hired: rounds.length ? rounds.length + 2 : 3 };
  let rank = Math.max(0, statusRank[app.status] ?? 0);
  for (const item of app.statusHistory ?? []) rank = Math.max(rank, statusRank[item.status] ?? 0);
  for (const round of [app.currentRound, ...(app.statusHistory ?? []).map(item => item.round)]) {
    const index = round ? rounds.indexOf(round) : -1;
    if (index >= 0) rank = Math.max(rank, index + 2);
  }
  return rank;
}
export function buildFunnel(apps: Application[], job?: Job) {
  const rounds = job?.hiringRounds ?? [];
  const names = ['submitted', 'reviewing', ...(rounds.length ? rounds : ['interview']), 'hired'];
  const counts = names.map((_, index) => apps.filter(app => stageReached(app, rounds) >= index).length);
  return { ...(job ? { jobId: job.id } : {}), stages: names.map((name, index) => ({ name, count: counts[index], ...(index > 0 && counts[index - 1] > 0 ? { conversionRate: counts[index] / counts[index - 1] } : {}) })) };
}
export function bucketDate(value: string, interval: 'day' | 'week' | 'month') {
  const date = vietnamDay(value);
  if (interval === 'month') return date.slice(0, 7) + '-01';
  if (interval === 'day') return date;
  const day = new Date(date + 'T00:00:00Z'); day.setUTCDate(day.getUTCDate() - (day.getUTCDay() + 6) % 7);
  return day.toISOString().slice(0, 10);
}
export function buildSeries(dates: string[], interval: 'day' | 'week' | 'month', query: StatsQuery) {
  const counts = new Map<string, number>();
  for (const value of dates.filter(date => withinRange(date, query))) { const key = bucketDate(value, interval); counts.set(key, (counts.get(key) ?? 0) + 1); }
  if (query.from && query.to) {
    const cursor = new Date(bucketDate(query.from + 'T00:00:00Z', interval) + 'T00:00:00Z');
    while (cursor.toISOString().slice(0, 10) <= query.to) {
      const key = cursor.toISOString().slice(0, 10); if (!counts.has(key)) counts.set(key, 0);
      if (interval === 'month') cursor.setUTCMonth(cursor.getUTCMonth() + 1); else cursor.setUTCDate(cursor.getUTCDate() + (interval === 'week' ? 7 : 1));
    }
  }
  return [...counts].sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value }));
}
