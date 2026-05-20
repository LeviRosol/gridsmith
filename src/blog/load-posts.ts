import type { BlogPost, BlogPostMeta } from './types.ts';
import { getAllPosts, getPostBySlug, getPostBySlugIncludingDraft } from './registry.ts';

export type BlogPostListItem = BlogPostMeta & { slug: string };

export function getAllPostsMeta(): BlogPostListItem[] {
  return getAllPosts().map(({ slug, meta }) => ({ slug, ...meta }));
}

/** Up to `limit` published posts excluding `excludeSlug`, newest first. */
export function getRecentPosts(excludeSlug?: string, limit = 3): BlogPostListItem[] {
  return getAllPostsMeta()
    .filter((p) => p.slug !== excludeSlug)
    .slice(0, limit);
}

export { getAllPosts, getPostBySlug, getPostBySlugIncludingDraft };
