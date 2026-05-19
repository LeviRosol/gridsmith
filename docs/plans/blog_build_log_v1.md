---
name: GridSmith Blog / Build Log
overview: >-
  File-based MDX build log at `/blog` and `/blog/:slug` inside the SPA.
  PrimeReact layouts modeled on PrimeBlocks marketing content blocks.
  Shipped on feature-blog: SEO, prerender, theme-aware styling, nav/footer/CTA wiring.
todos:
  - id: mdx-infra
    content: MDX webpack loader, types, src/blog registry and posts
    status: completed
  - id: blog-routes-ui
    content: BlogPage (Emphasized Post), BlogPostPage (Two Columns with Image), App routing
    status: completed
  - id: seed-posts
    content: test-post-1 and test-post-2 dummy MDX with hero + inline images
    status: completed
  - id: seo-discovery
    content: applyPageMeta, robots.txt, generate:sitemap, prerender:blog, footer/header nav, JSON-LD
    status: completed
  - id: theme-and-marketing-shell
    content: tone=theme bands follow app dark/light; skip BrowserFS/Model on marketing routes
    status: completed
  - id: real-posts
    content: Replace dummy MDX with production build-log posts
    status: pending
  - id: gtm-blog
    content: blog-specific GTM events (blog_post_view, optional outbound clicks)
    status: pending
  - id: e2e-blog
    content: e2e smoke for /blog routes
    status: pending
isProject: false
---

# GridSmith Blog / Build Log

Repo copy of the GridSmith **Build log / blog** plan. Treat **this file as source of truth in git**.

## Content model

Each post is a file under **`src/blog/posts/<slug>.mdx`**:

```ts
export const meta = {
  title: string;
  date: string;       // YYYY-MM-DD
  excerpt?: string;
  heroImage: string;  // one hero per post (public URL)
  heroImageAlt?: string;
};
```

Register new posts in **`src/blog/registry.ts`**. Slug = filename without `.mdx`.

Body: MDX (headings, paragraphs, markdown images). Inline images use the shared `img` → `MarketingPhoto` mapping in **`src/components/blog/mdx-components.tsx`**.

## Layouts (PrimeBlocks [marketing/content](https://primeblocks.org/marketing/content))

| Route | Component | Block |
|--------|-----------|--------|
| `/blog` | `BlogPage.tsx` | **Emphasized Post** — latest post large (clickable card + Read article); older posts in a 2-column list |
| `/blog/:slug` | `BlogPostPage.tsx` | **Two Columns with Image** — hero image column + title/date/MDX body |

Blog sections use **`MarketingSection tone="theme"`** so backgrounds and cards follow the account menu dark/light toggle (`.home-landing-band--theme` in [`src/index.css`](../../src/index.css)).

## SEO & prerender

- **Runtime:** [`src/seo/page-meta.ts`](../../src/seo/page-meta.ts) — title, description, canonical, Open Graph, Twitter, JSON-LD.
- **`public/robots.txt`:** allows crawlers; points to sitemap.
- **Sitemap:** **`npm run generate:sitemap`** (runs before **`npm run build`**). [`scripts/generate-sitemap.mjs`](../../scripts/generate-sitemap.mjs) reads `src/blog/posts/*.mdx` via [`scripts/blog-posts-manifest.mjs`](../../scripts/blog-posts-manifest.mjs).
- **Prerender:** **`npm run postbuild`** / **`npm run prerender:blog`** — Puppeteer (or static head fallback) writes `dist/blog/index.html` and `dist/blog/<slug>/index.html`. Prerender seeds consent in `localStorage` so the cookie banner is not baked into HTML.

## App integration

- **Routes:** [`src/components/App.tsx`](../../src/components/App.tsx) — `/blog`, `/blog/:slug`.
- **CTAs:** Home “Read the Build Log” → `/blog`; header + mobile menu + [`SiteFooter`](../../src/components/SiteFooter.tsx).
- **Performance:** [`src/routes.ts`](../../src/routes.ts) + [`src/index.tsx`](../../src/index.tsx) — BrowserFS and OpenSCAD FS init only on `/baseplate` and `/tile-builder`; `Model` is not constructed on marketing routes.
- **Dev:** webpack devServer middleware serves SPA `index.html` for `/blog` when prerendered `dist/blog/**` exists locally.

## Build scripts

| Script | Purpose |
|--------|---------|
| `npm run generate:sitemap` | Regenerate `public/sitemap.xml` (static routes + all `*.mdx` in `src/blog/posts/`) |
| `npm run build` | sitemap → webpack → `postbuild` prerender |
| `npm run prerender:blog` | Prerender blog routes only (requires existing `dist/`) |

## Adding a post

1. Create `src/blog/posts/my-slug.mdx` with `export const meta` and body.
2. Import in `src/blog/registry.ts` and append to `POST_ENTRIES`.
3. Run `npm run build` (updates sitemap + prerendered HTML).

## Still open

- Replace dummy posts with real build-log content.
- GTM: `blog_post_view`, optional `blog_outbound_click`.
- E2e smoke for `/blog` and `/blog/:slug`.
