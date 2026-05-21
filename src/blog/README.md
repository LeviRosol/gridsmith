# Build log MDX authoring

Posts live in **`posts/<slug>.mdx`**. Register each new file in **`registry.ts`**.

## Front matter (required)

```ts
export const meta = {
  title: 'Post title',
  date: '2026-05-20',           // YYYY-MM-DD
  excerpt: 'Optional card blurb',
  heroImage: '/image-in-public.png',
  heroImageAlt: 'Describe the hero image',
  draft: true,                  // optional — dev-only until removed
  readingTimeMinutes: 5,        // optional — auto-estimated on build if omitted
};
```

Body content comes **after** the `export const meta = { ... };` block.

## Markdown syntax (supported in MDX)

| Feature | Syntax |
|--------|--------|
| Heading | `## Section` / `### Subsection` |
| Paragraph | Plain text, blank line between paragraphs |
| **Bold** / _italic_ | `**bold**` / `_italic_` |
| Link | `[label](https://example.com)` |
| Bullet list | `- item` |
| Numbered list | `1. item` |
| Image | `![Caption / alt text](/path-from-site-root.png)` |
| Code (inline) | `` `like this` `` |
| Code (block) | Fenced block (see below) |

Image paths are usually **root-absolute** (files under `public/`), e.g. `/gs_hero_final.png`.

## Fenced code blocks

Use triple backticks with an optional language id (for styling / future highlighting):

````md
```openscad
cube([10, 10, 2]);
```

```javascript
const x = 1;
```

```
plain preformatted text
```
````

## React components (optional)

These work in the body when wrapped by our MDX provider (post pages do this automatically):

- `<BlogSocialShare />` — share row (also rendered at the bottom of every post)

See **`posts/test-post-media-demo.mdx`** for a full examples post.

## Production build

Before deploy, **`npm run build`** (or Vercel’s **`npm run build:all`**) runs:

1. **`prebuild`** → `generate:sitemap` (updates `public/sitemap.xml` and `post-stats.generated.json`; **skips `draft: true` posts**)
2. **webpack** production bundle
3. **`postbuild`** → blog prerender for published posts
