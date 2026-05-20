import React from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import type { BlogPostListItem } from '../../blog/load-posts.ts';
import { formatPostMetaLine } from '../../blog/format.ts';
import { isDraftPost } from '../../blog/publish.ts';
import { MarketingPhoto, navigateMarketing } from '../home/marketing-blocks.tsx';

export type BlogPostCardProps = {
  post: BlogPostListItem;
  /** Emphasized featured layout (blog index hero card). */
  variant?: 'featured' | 'compact';
  className?: string;
};

export default function BlogPostCard({ post, variant = 'compact', className = '' }: BlogPostCardProps) {
  const isFeatured = variant === 'featured';
  const isDraft = isDraftPost(post);
  const readMinutes = post.readingTimeMinutes ?? 1;

  const goToPost = () => navigateMarketing(`/blog/${post.slug}`);

  if (isFeatured) {
    return (
      <Card
        className={`blog-emphasized-post blog-emphasized-post--clickable shadow-3 border-round-xl overflow-hidden cursor-pointer ${className}`.trim()}
        onClick={goToPost}
      >
        <div className="grid grid-nogutter">
          <div className="col-12 lg:col-7">
            <MarketingPhoto
              src={post.heroImage}
              alt={post.heroImageAlt ?? post.title}
              imageClassName="w-full blog-emphasized-post-image"
            />
          </div>
          <div className="col-12 lg:col-5 flex flex-column justify-content-center p-4 md:p-5">
            <div className="flex flex-wrap gap-2 mb-3">
              <Tag value="Latest" severity="warning" />
              {isDraft ? <Tag value="Draft" severity="secondary" /> : null}
            </div>
            <h2 className="text-3xl font-bold text-color line-height-2 m-0 mb-2">{post.title}</h2>
            <p className="text-sm text-color-secondary m-0 mb-3">
              {formatPostMetaLine(post.date, readMinutes)}
            </p>
            {post.excerpt ? (
              <p className="text-color-secondary line-height-3 m-0 mb-4 flex-grow-1">{post.excerpt}</p>
            ) : null}
            <Button
              label="Read article"
              icon="pi pi-arrow-right"
              iconPos="right"
              onClick={(e) => {
                e.stopPropagation();
                goToPost();
              }}
            />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`blog-post-list-card h-full shadow-2 border-round-xl overflow-hidden cursor-pointer ${className}`.trim()}
      onClick={goToPost}
    >
      <MarketingPhoto
        src={post.heroImage}
        alt={post.heroImageAlt ?? post.title}
        imageClassName="w-full blog-post-list-image"
      />
      <div className="p-4">
        <div className="flex flex-wrap align-items-center gap-2 mb-2">
          <p className="text-sm text-color-secondary m-0">
            {formatPostMetaLine(post.date, readMinutes)}
          </p>
          {isDraft ? <Tag value="Draft" severity="secondary" className="text-xs" /> : null}
        </div>
        <h3 className="text-xl font-semibold text-color m-0 mb-2">{post.title}</h3>
        {post.excerpt ? (
          <p className="text-color-secondary line-height-3 m-0 mb-3">{post.excerpt}</p>
        ) : null}
        <span className="text-primary font-medium">Read article →</span>
      </div>
    </Card>
  );
}
