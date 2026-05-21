import { formatReadTime } from './reading-time.ts';

export function formatPostDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

/** Date line for cards, e.g. "May 19, 2026 · 4 min read". */
export function formatPostMetaLine(date: string, readingTimeMinutes: number): string {
  return `${formatPostDate(date)} · ${formatReadTime(readingTimeMinutes)}`;
}
