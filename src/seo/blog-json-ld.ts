import type { BlogPostMeta } from '../blog/types.ts';
import { absoluteImageUrl, absoluteUrl, SITE_NAME, SITE_ORIGIN } from './site.ts';

export function buildBlogPostingJsonLd(slug: string, meta: BlogPostMeta) {
  const url = absoluteUrl(`/blog/${slug}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: meta.title,
    description: meta.excerpt,
    datePublished: meta.date,
    image: absoluteImageUrl(meta.heroImage),
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_ORIGIN,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_ORIGIN,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    url,
  };
}

export function buildBlogIndexJsonLd(
  posts: readonly { slug: string; meta: BlogPostMeta }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${SITE_NAME} Build Log`,
    url: absoluteUrl('/blog'),
    blogPost: posts.map(({ slug, meta }) => buildBlogPostingJsonLd(slug, meta)),
  };
}
