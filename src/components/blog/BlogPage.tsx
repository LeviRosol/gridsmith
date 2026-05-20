import React, { useEffect } from 'react';
import {
  MarketingSection,
  MarketingSectionHeader,
} from '../home/marketing-blocks.tsx';
import { getAllPosts, getAllPostsMeta } from '../../blog/load-posts.ts';
import { buildBlogIndexJsonLd } from '../../seo/blog-json-ld.ts';
import { applyPageMeta } from '../../seo/page-meta.ts';
import { isProductionBuild } from '../../blog/publish.ts';
import BlogPostCard from './BlogPostCard.tsx';

const TITLE = 'GridSmith — Build Log';
const DESCRIPTION = 'Updates from the GridSmith build log: prints, playtests, and terrain system progress.';

/** PrimeBlocks “Emphasized Post” — featured latest post + supporting list. */
export default function BlogPage() {
  const posts = getAllPostsMeta();
  const [featured, ...rest] = posts;

  useEffect(() => {
    const allPosts = getAllPosts();
    return applyPageMeta({
      title: TITLE,
      description: DESCRIPTION,
      path: '/blog',
      ogImage: allPosts[0]?.meta.heroImage ?? '/logo512.png',
      jsonLd: buildBlogIndexJsonLd(allPosts),
    });
  }, []);

  return (
    <main className="home-page home-landing">
      <MarketingSection id="build-log" tone="theme" className="blog-index-section">
        <MarketingSectionHeader
          title="Build Log"
          subtitle="Prints, playtests, and open development notes from the GridSmith workshop."
          align="center"
        />

        {!isProductionBuild() && getAllPosts(true).some((p) => p.meta.draft) ? (
          <p className="text-sm text-color-secondary text-center mb-4 m-0">
            Draft posts are visible in development only and are excluded from production, the sitemap, and
            prerender.
          </p>
        ) : null}

        {featured ? (
          <BlogPostCard post={featured} variant="featured" className="mb-5" />
        ) : null}

        {rest.length > 0 ? (
          <div className="blog-post-list grid">
            {rest.map((post) => (
              <div key={post.slug} className="col-12 md:col-6">
                <BlogPostCard post={post} variant="compact" className="h-full" />
              </div>
            ))}
          </div>
        ) : null}
      </MarketingSection>
    </main>
  );
}
