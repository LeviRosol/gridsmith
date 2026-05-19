import type { BlogPost } from './types.ts';
import TestPost1, { meta as testPost1Meta } from './posts/test-post-1.mdx';
import TestPost2, { meta as testPost2Meta } from './posts/test-post-2.mdx';

/** All published posts — add new `.mdx` files here. */
const POST_ENTRIES: BlogPost[] = [
  { slug: 'test-post-1', meta: testPost1Meta, Component: TestPost1 },
  { slug: 'test-post-2', meta: testPost2Meta, Component: TestPost2 },
];

export function getAllPosts(): BlogPost[] {
  return [...POST_ENTRIES].sort((a, b) => b.meta.date.localeCompare(a.meta.date));
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return POST_ENTRIES.find((p) => p.slug === slug);
}
