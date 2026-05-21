import React, { useEffect } from 'react';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import {
  getPostBySlug,
  getPostBySlugIncludingDraft,
} from '../../blog/load-posts.ts';
import { buildBlogPostingJsonLd } from '../../seo/blog-json-ld.ts';
import { applyPageMeta } from '../../seo/page-meta.ts';
import { isDraftPost, isProductionBuild } from '../../blog/publish.ts';
import { formatPostMetaLine } from '../../blog/format.ts';
import { BlogMdxProvider } from './BlogMdxProvider.tsx';
import { BlogPostProvider } from './BlogPostContext.tsx';
import BlogSocialShare from './BlogSocialShare.tsx';
import BlogRecentPosts from './BlogRecentPosts.tsx';
import {
  MarketingContainer,
  MarketingPhoto,
  MarketingSection,
  navigateMarketing,
} from '../home/marketing-blocks.tsx';

/** Single-column article: title/meta, full-width hero, then body. */
export default function BlogPostPage({ slug }: { slug: string }) {
  const post = isProductionBuild()
    ? getPostBySlug(slug)
    : getPostBySlugIncludingDraft(slug) ?? getPostBySlug(slug);

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
          <p className="text-color-secondary m-0 mb-4">
            That build log entry does not exist, is still a draft, or was removed.
          </p>
          <Button label="Back to Build Log" icon="pi pi-arrow-left" onClick={() => navigateMarketing('/blog')} />
        </MarketingSection>
      </main>
    );
  }

  const { meta, Component } = post;
  const readMinutes = meta.readingTimeMinutes ?? 1;
  const isDraft = isDraftPost(meta);

  return (
    <main className="home-page home-landing">
      <section className="blog-post-hero-section" aria-label="Post hero">
        <div className="blog-post-hero overflow-hidden">
          <MarketingPhoto
            src={meta.heroImage}
            alt={meta.heroImageAlt ?? meta.title}
            className="blog-post-hero-media m-0 shadow-none"
            imageClassName="w-full blog-post-hero-image"
          />
          <header className="blog-post-hero-overlay" aria-label="Post details">
            <MarketingContainer>
              <h1 className="blog-post-hero-title text-3xl md:text-4xl lg:text-5xl font-bold line-height-2 m-0 mb-3">
                {meta.title}
              </h1>
              <div className="flex flex-wrap align-items-center gap-2">
                <p className="blog-post-hero-meta text-sm m-0">
                  {formatPostMetaLine(meta.date, readMinutes)}
                </p>
                {isDraft ? <Tag value="Draft" severity="secondary" /> : null}
              </div>
            </MarketingContainer>
          </header>
        </div>
      </section>

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

        {isDraft && !isProductionBuild() ? (
          <Message
            severity="warn"
            className="w-full mb-4"
            text="Draft — visible in development only. Set draft: false (or remove the flag) before publishing."
          />
        ) : null}

        <BlogPostProvider value={{ slug, title: meta.title }}>
          <article className="blog-post-single">
            <div className="blog-post-body">
              <div className="blog-post-body-content">
                <BlogMdxProvider>
                  <Component />
                </BlogMdxProvider>
              </div>
            </div>

            <BlogSocialShare />
          </article>

          <BlogRecentPosts excludeSlug={slug} limit={3} />
        </BlogPostProvider>
      </MarketingSection>
    </main>
  );
}
