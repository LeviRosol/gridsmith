/**
 * Reads blog post metadata from src/blog/posts/*.mdx without webpack.
 * Shared by generate-sitemap.mjs and prerender-blog.mjs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
export const POSTS_DIR = path.join(ROOT, 'src', 'blog', 'posts');
const STATS_OUT = path.join(ROOT, 'src', 'blog', 'post-stats.generated.json');

const WORDS_PER_MINUTE = 200;

/**
 * @typedef {{
 *   slug: string,
 *   title: string,
 *   date: string,
 *   excerpt?: string,
 *   heroImage: string,
 *   heroImageAlt?: string,
 *   draft: boolean,
 *   readingTimeMinutes: number,
 * }} BlogPostManifestEntry
 */

function plainTextFromMdxBody(body) {
  return body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_~\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function estimateReadingTimeMinutes(body) {
  const words = plainTextFromMdxBody(body).split(/\s+/).filter(Boolean).length;
  if (words === 0) return 1;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

function mdxBodyAfterMeta(src) {
  return src.replace(/export const meta\s*=\s*\{[\s\S]*?\n\};\s*/m, '').trim();
}

/**
 * @param {string} slug
 * @returns {BlogPostManifestEntry}
 */
export function parseBlogPostMeta(slug) {
  const filePath = path.join(POSTS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing MDX file for slug: ${slug}`);
  }
  const src = fs.readFileSync(filePath, 'utf8');
  const blockMatch = src.match(/export const meta\s*=\s*(\{[\s\S]*?\n\});/);
  if (!blockMatch) {
    throw new Error(`No export const meta in ${filePath}`);
  }
  const block = blockMatch[1];

  const readString = (key) => {
    const sameLine = new RegExp(`${key}:\\s*'([^']*)'`);
    const sameLineDq = new RegExp(`${key}:\\s*"([^"]*)"`);
    const nextLine = new RegExp(`${key}:\\s*\\n\\s*'([^']*)'`);
    const nextLineDq = new RegExp(`${key}:\\s*\\n\\s*"([^"]*)"`);
    return (
      block.match(sameLine)?.[1] ??
      block.match(sameLineDq)?.[1] ??
      block.match(nextLine)?.[1] ??
      block.match(nextLineDq)?.[1]
    );
  };

  const readBoolean = (key) => /\btrue\b/.test(block.match(new RegExp(`${key}:\\s*(true|false)`))?.[0] ?? '');

  const title = readString('title');
  const date = readString('date');
  const heroImage = readString('heroImage');
  if (!title || !date || !heroImage) {
    throw new Error(`Incomplete meta in ${filePath} (need title, date, heroImage)`);
  }

  const body = mdxBodyAfterMeta(src);
  const readingTimeMinutes = estimateReadingTimeMinutes(body);

  return {
    slug,
    title,
    date,
    excerpt: readString('excerpt'),
    heroImage,
    heroImageAlt: readString('heroImageAlt'),
    draft: readBoolean('draft'),
    readingTimeMinutes,
  };
}

/** @returns {BlogPostManifestEntry[]} */
export function listBlogPosts() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  const slugs = fs
    .readdirSync(POSTS_DIR)
    .filter((name) => name.endsWith('.mdx'))
    .map((name) => name.replace(/\.mdx$/, ''))
    .sort();

  return slugs.map(parseBlogPostMeta).sort((a, b) => b.date.localeCompare(a.date));
}

/** Published posts only (excludes drafts from sitemap / prerender). */
export function listPublishedBlogPosts() {
  return listBlogPosts().filter((p) => !p.draft);
}

/** Writes src/blog/post-stats.generated.json for the app bundle. */
export function writePostStatsFile() {
  const rows = listBlogPosts().map(({ slug, draft, readingTimeMinutes }) => ({
    slug,
    draft,
    readingTimeMinutes,
  }));
  fs.writeFileSync(STATS_OUT, `${JSON.stringify(rows, null, 2)}\n`);
  return rows;
}
