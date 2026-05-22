import type { BlogPost } from './types.ts';
import { enrichPostMeta } from './enrich-meta.ts';
import { isPostVisible } from './publish.ts';
import WhyIStartedGridsmith, { meta as whyIStartedGridsmithMeta } from './posts/why-i-started-gridsmith.mdx';
import TestPost2, { meta as testPost2Meta } from './posts/test-post-2.mdx';
import TestPost3Draft, { meta as testPost3DraftMeta } from './posts/test-post-3-draft.mdx';
import TestPostMediaDemo, { meta as testPostMediaDemoMeta } from './posts/test-post-media-demo.mdx';

/** All posts registered here — add new `.mdx` imports. */
const POST_ENTRIES: BlogPost[] = [
  {
    slug: 'why-i-started-gridsmith',
    meta: enrichPostMeta('why-i-started-gridsmith', whyIStartedGridsmithMeta),
    Component: WhyIStartedGridsmith,
  },
  {
    slug: 'test-post-2',
    meta: enrichPostMeta('test-post-2', testPost2Meta),
    Component: TestPost2,
  },
  {
    slug: 'test-post-3-draft',
    meta: enrichPostMeta('test-post-3-draft', testPost3DraftMeta),
    Component: TestPost3Draft,
  },
  {
    slug: 'test-post-media-demo',
    meta: enrichPostMeta('test-post-media-demo', testPostMediaDemoMeta),
    Component: TestPostMediaDemo,
  },
];

export function getAllPosts(includeHidden = false): BlogPost[] {
  const posts = includeHidden ? POST_ENTRIES : POST_ENTRIES.filter((p) => isPostVisible(p.meta));
  return [...posts].sort((a, b) => b.meta.date.localeCompare(a.meta.date));
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  const post = POST_ENTRIES.find((p) => p.slug === slug);
  if (!post) return undefined;
  if (!isPostVisible(post.meta)) return undefined;
  return post;
}

/** Resolve a draft by slug in development (for preview). */
export function getPostBySlugIncludingDraft(slug: string): BlogPost | undefined {
  return POST_ENTRIES.find((p) => p.slug === slug);
}
