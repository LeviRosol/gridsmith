import React, { useEffect } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import {
  MarketingPhoto,
  MarketingSection,
  MarketingSectionHeader,
  navigateMarketing,
} from '../home/marketing-blocks.tsx';
import { getAllPosts, getAllPostsMeta } from '../../blog/load-posts.ts';
import { buildBlogIndexJsonLd } from '../../seo/blog-json-ld.ts';
import { applyPageMeta } from '../../seo/page-meta.ts';

const TITLE = 'GridSmith — Build Log';
const DESCRIPTION = 'Updates from the GridSmith build log: prints, playtests, and terrain system progress.';

function formatPostDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

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

        {featured ? (
          <Card
            className="blog-emphasized-post blog-emphasized-post--clickable shadow-3 border-round-xl overflow-hidden mb-5 cursor-pointer"
            onClick={() => navigateMarketing(`/blog/${featured.slug}`)}
          >
            <div className="grid grid-nogutter">
              <div className="col-12 lg:col-7">
                <MarketingPhoto
                  src={featured.heroImage}
                  alt={featured.heroImageAlt ?? featured.title}
                  imageClassName="w-full blog-emphasized-post-image"
                />
              </div>
              <div className="col-12 lg:col-5 flex flex-column justify-content-center p-4 md:p-5">
                <Tag value="Latest" severity="warning" className="align-self-start mb-3" />
                <h2 className="text-3xl font-bold text-color line-height-2 m-0 mb-2">{featured.title}</h2>
                <p className="text-sm text-color-secondary m-0 mb-3">{formatPostDate(featured.date)}</p>
                {featured.excerpt ? (
                  <p className="text-color-secondary line-height-3 m-0 mb-4 flex-grow-1">{featured.excerpt}</p>
                ) : null}
                <Button
                  label="Read article"
                  icon="pi pi-arrow-right"
                  iconPos="right"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateMarketing(`/blog/${featured.slug}`);
                  }}
                />
              </div>
            </div>
          </Card>
        ) : null}

        {rest.length > 0 ? (
          <div className="blog-post-list grid">
            {rest.map((post) => (
              <div key={post.slug} className="col-12 md:col-6">
                <Card
                  className="blog-post-list-card h-full shadow-2 border-round-xl overflow-hidden cursor-pointer"
                  onClick={() => navigateMarketing(`/blog/${post.slug}`)}
                >
                  <MarketingPhoto
                    src={post.heroImage}
                    alt={post.heroImageAlt ?? post.title}
                    imageClassName="w-full blog-post-list-image"
                  />
                  <div className="p-4">
                    <p className="text-sm text-color-secondary m-0 mb-2">{formatPostDate(post.date)}</p>
                    <h3 className="text-xl font-semibold text-color m-0 mb-2">{post.title}</h3>
                    {post.excerpt ? (
                      <p className="text-color-secondary line-height-3 m-0 mb-3">{post.excerpt}</p>
                    ) : null}
                    <span className="text-primary font-medium">Read article →</span>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        ) : null}
      </MarketingSection>
    </main>
  );
}
