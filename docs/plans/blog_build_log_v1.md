---
name: GridSmith Blog / Build Log
overview: >-
  File-based MDX build log at `/blog` and `/blog/:slug` inside the SPA.
  PrimeReact layouts modeled on PrimeBlocks marketing content blocks.
  v1 engineering complete on feature-blog: SEO, prerender, theme-aware styling,
  nav/footer/CTA wiring. Safe to release with zero published posts (draft-only or empty index).
todos:
  - id: mdx-infra
    content: MDX webpack loader, types, src/blog registry and posts
    status: completed
  - id: blog-routes-ui
    content: BlogPage (Emphasized Post), BlogPostPage (full-bleed hero + overlay), App routing
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
  draft?: boolean;    // true = dev-only; hidden in production, sitemap, prerender
  readingTimeMinutes?: number;  // optional override (auto-estimated on build)
};
```

Register new posts in **`src/blog/registry.ts`**. Slug = filename without `.mdx`.

Body: MDX (headings, paragraphs, markdown images). Inline images use the shared `img` → `MarketingPhoto` mapping in **`src/components/blog/mdx-components.tsx`**.

## Layouts (PrimeBlocks [marketing/content](https://primeblocks.org/marketing/content))

| Route | Component | Block |
|--------|-----------|--------|
| `/blog` | `BlogPage.tsx` | **Emphasized Post** — latest post large (clickable card + Read article); older posts in a 2-column list |
| `/blog/:slug` | `BlogPostPage.tsx` | **Single column** — full-width hero with title/date/read time overlay; MDX body |

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

## Build scripts & production deploy

| Step | What runs |
|------|-----------|
| `npm run prebuild` | `generate:sitemap` — `public/sitemap.xml` + `src/blog/post-stats.generated.json` (published posts only) |
| `npm run build` | Production webpack (`prebuild` runs automatically first) |
| `npm run postbuild` | `prerender:blog` — static HTML under `dist/blog/` |

**Vercel** (`vercel.json`): `buildCommand` is **`npm run build:all`** → `build:libs` then **`npm run build`**, so **`prebuild` always regenerates the sitemap** before the app bundle. Same path as CI **`Test Build`** (`npm run build:all`).

| Script | Purpose |
|--------|---------|
| `npm run generate:sitemap` | Regenerate sitemap + post stats only (no webpack) |
| `npm run build` | prebuild + webpack + postbuild prerender |
| `npm run build:all` | WASM/libs + `build` (full production artifact) |
| `npm run prerender:blog` | Prerender blog routes only (requires existing `dist/`) |

Authoring reference: [`src/blog/README.md`](../../src/blog/README.md) and demo post `test-post-media-demo.mdx`.

## Adding a post

1. Create `src/blog/posts/my-slug.mdx` with `export const meta` and body.
2. Import in `src/blog/registry.ts` and append to `POST_ENTRIES`.
3. Run `npm run generate:sitemap` (or `npm run build`) to refresh `post-stats.generated.json`, sitemap, and read times.
4. Set `draft: true` while composing; remove or set `draft: false` before release.

Post pages include **Share** links, **Recent posts** (3 cards), and read time on index cards (`May 19, 2026 · 4 min read`).

## v1 status

**Engineering complete.** The routes, build pipeline, SEO/prerender, and UI are ready to ship. Publishing real articles is **ongoing content work** (see **Adding a post** and [`src/blog/README.md`](../../src/blog/README.md)) — not a plan blocker. You can release with no public posts (all `draft: true`, or an empty published set).

**Analytics:** Existing SPA **`page_view`** on route change (`App.tsx`) is sufficient. Blog-specific GTM events (`blog_post_view`, outbound clicks) would require **new tags/triggers in the GTM container** — out of scope for v1.

**Tests:** Dedicated `/blog` e2e smoke is **tabled**; covered under the broader test-suite effort elsewhere in the repo.
