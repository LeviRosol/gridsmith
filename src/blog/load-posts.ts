import type { BlogPost, BlogPostMeta } from './types.ts';
import { getAllPosts, getPostBySlug } from './registry.ts';

export type BlogPostListItem = BlogPostMeta & { slug: string };

export function getAllPostsMeta(): BlogPostListItem[] {
  return getAllPosts().map(({ slug, meta }) => ({ slug, ...meta }));
}

export { getAllPosts, getPostBySlug };
