import React, { createContext, useContext } from 'react';

export type BlogPostContextValue = {
  slug: string;
  title: string;
};

const BlogPostContext = createContext<BlogPostContextValue | null>(null);

export function BlogPostProvider({
  value,
  children,
}: {
  value: BlogPostContextValue;
  children: React.ReactNode;
}) {
  return <BlogPostContext.Provider value={value}>{children}</BlogPostContext.Provider>;
}

export function useBlogPostContext(): BlogPostContextValue {
  const ctx = useContext(BlogPostContext);
  if (!ctx) {
    throw new Error('useBlogPostContext must be used within BlogPostProvider');
  }
  return ctx;
}
