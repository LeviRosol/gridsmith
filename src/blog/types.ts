import type { ComponentType } from 'react';

/** Front matter exported from each `src/blog/posts/*.mdx` file. */
export type BlogPostMeta = {
  title: string;
  /** ISO date string (`YYYY-MM-DD`) for sorting and display. */
  date: string;
  excerpt?: string;
  /** Hero image URL (one per post), shown on index and post layout. */
  heroImage: string;
  heroImageAlt?: string;
};

export type BlogPost = {
  slug: string;
  meta: BlogPostMeta;
  Component: ComponentType;
};
