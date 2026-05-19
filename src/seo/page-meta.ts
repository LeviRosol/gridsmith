import { absoluteImageUrl, absoluteUrl, SITE_NAME } from './site.ts';

const MANAGED = 'data-gridsmith-seo';

export type PageMetaInput = {
  title: string;
  description: string;
  /** Pathname only, e.g. `/blog/test-post-1`. */
  path: string;
  ogType?: 'website' | 'article';
  ogImage?: string;
  /** ISO date (`YYYY-MM-DD`) for article pages. */
  articlePublishedTime?: string;
  jsonLd?: Record<string, unknown> | readonly Record<string, unknown>[];
};

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attr}="${key}"][${MANAGED}]`;
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    el.setAttribute(MANAGED, 'true');
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertLink(rel: string, href: string) {
  const selector = `link[rel="${rel}"][${MANAGED}]`;
  let el = document.querySelector(selector) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    el.setAttribute(MANAGED, 'true');
    document.head.appendChild(el);
  }
  el.href = href;
}

function setJsonLd(jsonLd: PageMetaInput['jsonLd']) {
  const id = 'gridsmith-json-ld';
  document.getElementById(id)?.remove();
  if (!jsonLd) return;
  const script = document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  script.setAttribute(MANAGED, 'true');
  script.textContent = JSON.stringify(jsonLd);
  document.head.appendChild(script);
}

/**
 * Applies title, description, canonical, Open Graph, Twitter, and optional JSON-LD.
 * Returns cleanup to remove managed tags (for SPA route changes).
 */
export function applyPageMeta(input: PageMetaInput): () => void {
  const canonical = absoluteUrl(input.path);
  const ogImage = input.ogImage ? absoluteImageUrl(input.ogImage) : absoluteUrl('/logo512.png');

  document.title = input.title;

  upsertMeta('name', 'description', input.description);
  upsertLink('canonical', canonical);

  upsertMeta('property', 'og:title', input.title);
  upsertMeta('property', 'og:description', input.description);
  upsertMeta('property', 'og:url', canonical);
  upsertMeta('property', 'og:type', input.ogType ?? 'website');
  upsertMeta('property', 'og:site_name', SITE_NAME);
  upsertMeta('property', 'og:image', ogImage);

  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', input.title);
  upsertMeta('name', 'twitter:description', input.description);
  upsertMeta('name', 'twitter:image', ogImage);

  if (input.ogType === 'article' && input.articlePublishedTime) {
    upsertMeta('property', 'article:published_time', `${input.articlePublishedTime}T12:00:00.000Z`);
  }

  setJsonLd(input.jsonLd);

  return () => {
    document.querySelectorAll(`[${MANAGED}]`).forEach((el) => el.remove());
  };
}
