import React, { useEffect } from 'react';
import { Button } from 'primereact/button';
import { getPostBySlug } from '../../blog/load-posts.ts';
import { buildBlogPostingJsonLd } from '../../seo/blog-json-ld.ts';
import { applyPageMeta } from '../../seo/page-meta.ts';
import { BlogMdxProvider } from './BlogMdxProvider.tsx';
import {
  MarketingPhoto,
  MarketingSection,
  navigateMarketing,
} from '../home/marketing-blocks.tsx';

function formatPostDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

/** PrimeBlocks “Two Columns with Image” — hero image column + article body. */
export default function BlogPostPage({ slug }: { slug: string }) {
  const post = getPostBySlug(slug);

  useEffect(() => {
    if (!post) {
      return applyPageMeta({
        title: 'Post not found — GridSmith',
        description: 'This build log entry could not be found.',
        path: slug ? `/blog/${slug}` : '/blog',
      });
    }
    const { meta } = post;
    const description =
      meta.excerpt ?? `Read "${meta.title}" on the GridSmith build log — prints, playtests, and terrain updates.`;
    return applyPageMeta({
      title: `${meta.title} — GridSmith Build Log`,
      description,
      path: `/blog/${slug}`,
      ogType: 'article',
      ogImage: meta.heroImage,
      articlePublishedTime: meta.date,
      jsonLd: buildBlogPostingJsonLd(slug, meta),
    });
  }, [post, slug]);

  if (!post) {
    return (
      <main className="home-page home-landing">
        <MarketingSection tone="theme">
          <h1 className="text-3xl font-bold text-color m-0 mb-3">Post not found</h1>
          <p className="text-color-secondary m-0 mb-4">That build log entry does not exist or was removed.</p>
          <Button label="Back to Build Log" icon="pi pi-arrow-left" onClick={() => navigateMarketing('/blog')} />
        </MarketingSection>
      </main>
    );
  }

  const { meta, Component } = post;

  return (
    <main className="home-page home-landing">
      <MarketingSection tone="theme" className="blog-post-section">
        <p className="m-0 mb-4">
          <Button
            label="Build Log"
            icon="pi pi-arrow-left"
            text
            className="p-0"
            onClick={() => navigateMarketing('/blog')}
          />
        </p>

        <article className="blog-post-two-col">
          <div className="grid">
            <div className="col-12 lg:col-5 py-3 lg:py-0">
              <MarketingPhoto
                src={meta.heroImage}
                alt={meta.heroImageAlt ?? meta.title}
                imageClassName="w-full border-round blog-post-hero-image"
              />
            </div>
            <div className="col-12 lg:col-7 py-3 lg:py-0">
              <header className="mb-4">
                <p className="text-sm text-color-secondary m-0 mb-2">{formatPostDate(meta.date)}</p>
                <h1 className="text-3xl md:text-4xl font-bold text-color line-height-2 m-0">{meta.title}</h1>
              </header>
              <div className="blog-post-body">
                <BlogMdxProvider>
                  <Component />
                </BlogMdxProvider>
              </div>
            </div>
          </div>
        </article>
      </MarketingSection>
    </main>
  );
}
