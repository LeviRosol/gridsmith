import React from 'react';
import { MDXProvider } from '@mdx-js/react';
import { blogMdxComponents } from './mdx-components.tsx';

export function BlogMdxProvider({ children }: { children: React.ReactNode }) {
  return <MDXProvider components={blogMdxComponents}>{children}</MDXProvider>;
}
