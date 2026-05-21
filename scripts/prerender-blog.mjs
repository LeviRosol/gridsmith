/**
 * Prerenders /blog and /blog/:slug into dist/ after production build.
 * Prefers Puppeteer (full HTML); falls back to index.html + injected SEO head tags.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import { listPublishedBlogPosts } from './blog-posts-manifest.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.env.PRERENDER_PORT ?? 4173);
const HOST = '127.0.0.1';
const SITE_ORIGIN = 'https://gridsmith.io';
const SITE_NAME = 'GridSmith';

const BLOG_INDEX = {
  title: 'GridSmith — Build Log',
  description:
    'Updates from the GridSmith build log: prints, playtests, and terrain system progress.',
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function absoluteUrl(pathname) {
  return `${SITE_ORIGIN}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}

function absoluteImageUrl(imagePath) {
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  return absoluteUrl(imagePath);
}

function buildBlogPostingJsonLd(slug, meta) {
  const url = absoluteUrl(`/blog/${slug}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: meta.title,
    description: meta.excerpt,
    datePublished: meta.date,
    image: absoluteImageUrl(meta.heroImage),
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE_ORIGIN },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_ORIGIN },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
  };
}

function buildBlogIndexJsonLd(posts) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${SITE_NAME} Build Log`,
    url: absoluteUrl('/blog'),
    blogPost: posts.map((p) => buildBlogPostingJsonLd(p.slug, p)),
  };
}

/** @param {{ title: string, description: string, path: string, ogType?: string, ogImage: string, articlePublishedTime?: string, jsonLd?: object }} meta */
function buildHeadInjection(meta) {
  const canonical = absoluteUrl(meta.path);
  const ogImage = absoluteImageUrl(meta.ogImage);
  const ogType = meta.ogType ?? 'website';
  const lines = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" data-gridsmith-seo="true" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" data-gridsmith-seo="true" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" data-gridsmith-seo="true" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" data-gridsmith-seo="true" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" data-gridsmith-seo="true" />`,
    `<meta property="og:type" content="${escapeHtml(ogType)}" data-gridsmith-seo="true" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" data-gridsmith-seo="true" />`,
    `<meta property="og:image" content="${escapeHtml(ogImage)}" data-gridsmith-seo="true" />`,
    `<meta name="twitter:card" content="summary_large_image" data-gridsmith-seo="true" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" data-gridsmith-seo="true" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" data-gridsmith-seo="true" />`,
    `<meta name="twitter:image" content="${escapeHtml(ogImage)}" data-gridsmith-seo="true" />`,
  ];
  if (ogType === 'article' && meta.articlePublishedTime) {
    lines.push(
      `<meta property="article:published_time" content="${meta.articlePublishedTime}T12:00:00.000Z" data-gridsmith-seo="true" />`
    );
  }
  if (meta.jsonLd) {
    lines.push(
      `<script type="application/ld+json" data-gridsmith-seo="true">${JSON.stringify(meta.jsonLd)}</script>`
    );
  }
  return lines.join('\n    ');
}

function injectHead(templateHtml, headInjection) {
  let html = templateHtml.replace(/<title>[\s\S]*?<\/title>/i, '');
  html = html.replace(/<meta name="description"[^>]*\/?>/i, '');
  return html.replace('</head>', `    ${headInjection}\n  </head>`);
}

function writeStaticHtml(templateHtml, outRelative, headInjection) {
  const html = injectHead(templateHtml, headInjection);
  const outPath = path.join(DIST, outRelative);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, 'utf8');
}

function staticPrerenderAll(templateHtml, posts) {
  writeStaticHtml(
    templateHtml,
    'blog/index.html',
    buildHeadInjection({
      ...BLOG_INDEX,
      path: '/blog',
      ogImage: posts[0]?.heroImage ?? '/logo512.png',
      jsonLd: buildBlogIndexJsonLd(posts),
    })
  );
  console.log('  /blog → blog/index.html (static head)');

  for (const post of posts) {
    const description =
      post.excerpt ??
      `Read "${post.title}" on the GridSmith build log — prints, playtests, and terrain updates.`;
    writeStaticHtml(
      templateHtml,
      `blog/${post.slug}/index.html`,
      buildHeadInjection({
        title: `${post.title} — GridSmith Build Log`,
        description,
        path: `/blog/${post.slug}`,
        ogType: 'article',
        ogImage: post.heroImage,
        articlePublishedTime: post.date,
        jsonLd: buildBlogPostingJsonLd(post.slug, post),
      })
    );
    console.log(`  /blog/${post.slug} → blog/${post.slug}/index.html (static head)`);
  }
}

function waitForServer(url, timeoutMs = 60_000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(url);
        if (res.ok) return resolve();
      } catch {
        // retry
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Server not ready at ${url} after ${timeoutMs}ms`));
        return;
      }
      setTimeout(tick, 250);
    };
    tick();
  });
}

/** Stop serve and any child processes so CI/postbuild does not hang on open stdio handles. */
function stopServe(proc) {
  return new Promise((resolve) => {
    if (proc.exitCode != null) {
      resolve();
      return;
    }
    const forceKill = setTimeout(() => {
      try {
        if (process.platform !== 'win32' && proc.pid) {
          process.kill(-proc.pid, 'SIGKILL');
        } else {
          proc.kill('SIGKILL');
        }
      } catch {
        /* already exited */
      }
      resolve();
    }, 3000);
    proc.once('exit', () => {
      clearTimeout(forceKill);
      resolve();
    });
    try {
      if (process.platform !== 'win32' && proc.pid) {
        process.kill(-proc.pid, 'SIGTERM');
      } else {
        proc.kill('SIGTERM');
      }
    } catch {
      clearTimeout(forceKill);
      resolve();
    }
  });
}

function startServe() {
  return new Promise((resolve, reject) => {
    const proc = spawn('npx', ['--yes', 'serve', '-s', DIST, '-l', String(PORT)], {
      cwd: ROOT,
      stdio: 'ignore',
      detached: process.platform !== 'win32',
      shell: false,
    });
    proc.on('error', reject);
    waitForServer(`http://${HOST}:${PORT}/`)
      .then(() => resolve(proc))
      .catch(async (err) => {
        await stopServe(proc);
        reject(err);
      });
  });
}

async function launchBrowser() {
  return puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  });
}

const PRERENDER_CONSENT = JSON.stringify({ analytics: false, marketingEmails: true });

async function prerenderRoute(browser, urlPath, outRelative) {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument((consentJson) => {
    localStorage.setItem('gridsmith.consent.v1', consentJson);
  }, PRERENDER_CONSENT);
  const url = `http://${HOST}:${PORT}${urlPath}`;
  try {
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 120_000 });
    await page.waitForFunction(
      () => document.title && document.title.includes('GridSmith'),
      { timeout: 30_000 }
    );
    await page.waitForFunction(
      () => !document.querySelector('.cookie-banner'),
      { timeout: 10_000 }
    ).catch(() => {
      /* banner may still show if storage failed — continue */
    });
    const html = await page.content();
    const outPath = path.join(DIST, outRelative);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html, 'utf8');
    console.log(`  ${urlPath} → ${outRelative} (puppeteer)`);
  } finally {
    await page.close();
  }
}

async function puppeteerPrerenderAll(routes) {
  const server = await startServe();
  let browser;
  try {
    browser = await launchBrowser();
    for (const route of routes) {
      await prerenderRoute(browser, route.urlPath, route.outRelative);
    }
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    await stopServe(server);
  }
}

/** Vercel has no system Chrome; bundled Chromium is heavy. Static head injection is enough for SEO. */
function shouldUsePuppeteerPrerender() {
  if (process.env.PRERENDER_STATIC_ONLY === '1') return false;
  if (process.env.PRERENDER_USE_PUPPETEER === '1') return true;
  if (process.env.VERCEL === '1') return false;
  return true;
}

async function main() {
  const indexPath = path.join(DIST, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error('prerender-blog: dist/index.html missing — run npm run build first');
    process.exit(1);
  }

  const posts = listPublishedBlogPosts();
  const routes = [
    { urlPath: '/blog', outRelative: 'blog/index.html' },
    ...posts.map((p) => ({
      urlPath: `/blog/${p.slug}`,
      outRelative: `blog/${p.slug}/index.html`,
    })),
  ];

  console.log(`Prerendering ${routes.length} blog route(s)…`);
  const templateHtml = fs.readFileSync(indexPath, 'utf8');

  if (!shouldUsePuppeteerPrerender()) {
    staticPrerenderAll(templateHtml, posts);
    console.log('Blog prerender complete (static head).');
    return;
  }

  try {
    await puppeteerPrerenderAll(routes);
    console.log('Blog prerender complete (puppeteer).');
  } catch (err) {
    console.warn(`Puppeteer prerender unavailable (${err.message}); using static head injection.`);
    staticPrerenderAll(templateHtml, posts);
    console.log('Blog prerender complete (static head fallback).');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
