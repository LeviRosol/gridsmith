const WORDS_PER_MINUTE = 200;

/** Strip MDX/MD to plain text for a rough word count. */
export function plainTextFromMdxBody(body: string): string {
  return body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_~\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function estimateReadingTimeMinutes(body: string): number {
  const words = plainTextFromMdxBody(body).split(/\s+/).filter(Boolean).length;
  if (words === 0) return 1;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export function formatReadTime(minutes: number): string {
  return `${minutes} min read`;
}
