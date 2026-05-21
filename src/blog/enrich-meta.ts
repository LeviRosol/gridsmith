import type { BlogPostMeta } from './types.ts';
import postStats from './post-stats.generated.json';

type PostStatRow = {
  slug: string;
  draft: boolean;
  readingTimeMinutes: number;
};

const statsBySlug = new Map(
  (postStats as PostStatRow[]).map((row) => [row.slug, row] as const)
);

/** Merge MDX `meta` with build-time stats (reading time, draft flag from file parse). */
export function enrichPostMeta(slug: string, meta: BlogPostMeta): BlogPostMeta {
  const row = statsBySlug.get(slug);
  return {
    ...meta,
    draft: meta.draft === true || row?.draft === true,
    readingTimeMinutes: meta.readingTimeMinutes ?? row?.readingTimeMinutes ?? 1,
  };
}
