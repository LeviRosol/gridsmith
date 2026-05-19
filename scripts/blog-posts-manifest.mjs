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

/** @typedef {{ slug: string, title: string, date: string, excerpt?: string, heroImage: string, heroImageAlt?: string }} BlogPostManifestEntry */

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

  const title = readString('title');
  const date = readString('date');
  const heroImage = readString('heroImage');
  if (!title || !date || !heroImage) {
    throw new Error(`Incomplete meta in ${filePath} (need title, date, heroImage)`);
  }

  return {
    slug,
    title,
    date,
    excerpt: readString('excerpt'),
    heroImage,
    heroImageAlt: readString('heroImageAlt'),
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
