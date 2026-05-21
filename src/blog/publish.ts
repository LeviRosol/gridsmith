import type { BlogPostMeta } from './types.ts';

/** True for production webpack builds (`npm run build`). */
export function isProductionBuild(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isDraftPost(meta: BlogPostMeta): boolean {
  return meta.draft === true;
}

/** Drafts are hidden on the index, by slug, sitemap, and prerender in production. */
export function isPostVisible(meta: BlogPostMeta): boolean {
  if (!isDraftPost(meta)) return true;
  return !isProductionBuild();
}
