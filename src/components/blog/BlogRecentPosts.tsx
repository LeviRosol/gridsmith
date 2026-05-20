import React from 'react';
import { getRecentPosts } from '../../blog/load-posts.ts';
import BlogPostCard from './BlogPostCard.tsx';

export default function BlogRecentPosts({
  excludeSlug,
  limit = 3,
}: {
  excludeSlug: string;
  limit?: number;
}) {
  const posts = getRecentPosts(excludeSlug, limit);
  if (posts.length === 0) return null;

  return (
    <section className="blog-recent-posts mt-6 pt-5 border-top-1 surface-border" aria-labelledby="blog-recent-heading">
      <h2 id="blog-recent-heading" className="text-2xl font-bold text-color m-0 mb-4">
        Recent posts
      </h2>
      <div className="blog-recent-posts-row">
        {posts.map((post) => (
          <BlogPostCard key={post.slug} post={post} variant="compact" className="h-full blog-recent-posts-card" />
        ))}
      </div>
    </section>
  );
}
