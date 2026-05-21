import type { ComponentType } from 'react';
import type { BlogPostMeta } from '../blog/types.ts';

declare module '*.mdx' {
  export const meta: BlogPostMeta;
  const MDXComponent: ComponentType;
  export default MDXComponent;
}
