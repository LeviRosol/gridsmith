import React, { useEffect } from 'react';
import {
  MarketingSection,
  MarketingSectionHeader,
} from '../home/marketing-blocks.tsx';
import { getAllPosts, getBlogIndexPosts } from '../../blog/load-posts.ts';
import { buildBlogIndexJsonLd } from '../../seo/blog-json-ld.ts';
import { applyPageMeta } from '../../seo/page-meta.ts';
import { isDraftPost } from '../../blog/publish.ts';
import BlogPostCard from './BlogPostCard.tsx';

const TITLE = 'GridSmith Build Log';
const DESCRIPTION = 'Updates from the GridSmith build log: prints, playtests, and terrain system progress.';

/** PrimeBlocks “Emphasized Post” — featured latest post + supporting list. */
export default function BlogPage() {
  const { featured, rest } = getBlogIndexPosts();

  useEffect(() => {
    const allPosts = getAllPosts();
    const featuredPost = allPosts.find((p) => !isDraftPost(p.meta)) ?? allPosts[0];
    return applyPageMeta({
      title: TITLE,
      description: DESCRIPTION,
      path: '/blog',
      ogImage: featuredPost?.meta.heroImage ?? '/logo512.png',
      jsonLd: buildBlogIndexJsonLd(allPosts),
    });
  }, []);

  return (
    <main className="home-page home-landing">
      <MarketingSection id="build-log" tone="theme" className="blog-index-section">
        <MarketingSectionHeader
          title="GridSmith Build Log"
          subtitle="Prints, playtests, and open development notes from the GridSmith workshop."
          align="center"
        />

        {featured ? (
          <BlogPostCard post={featured} variant="featured" className="mb-5" />
        ) : null}

        {rest.length > 0 ? (
          <div className="blog-index-posts-row">
            {rest.map((post) => (
              <BlogPostCard key={post.slug} post={post} variant="compact" className="h-full blog-index-posts-card" />
            ))}
          </div>
        ) : null}
      </MarketingSection>
    </main>
  );
}
