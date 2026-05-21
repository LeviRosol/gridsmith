/**
 * Long-form tile pack copy lives in `public/tile-packs/<slug>.json` (lazy-loaded per slug on shop + detail).
 * Keep in sync with `SLUG_ENRICH_FROM_PLACEHOLDER` in `tilePackCatalog.ts` for fallback slugs
 * (e.g. `tavern-core-set.json` missing → try `tavern-set.json`).
 */

import type { TileSetWhatYouGet } from './placeholderTileSets';

const PATH_SEGMENT_RE = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/;

export function isSafeTilePackGalleryFolder(name: string): boolean {
  return PATH_SEGMENT_RE.test(name) && name.length <= 64;
}

/** Same keys as `SLUG_ENRICH_FROM_PLACEHOLDER` in tilePackCatalog — secondary JSON slug to try. */
const TILE_PACK_JSON_FALLBACK_SLUG: Record<string, string> = {
  'tavern-core-set': 'tavern-set',
  'cave-core-set': 'cave-set',
};

function isSafeGalleryFilename(name: string): boolean {
  if (!name || name.length > 200) return false;
  if (name.includes('/') || name.includes('\\')) return false;
  if (name === '.' || name === '..') return false;
  if (name.startsWith('.')) return false;
  return true;
}

export type TilePackIncludedFiles = {
  /** Defaults to "Included Files" in the UI. */
  heading?: string;
  bullets: string[];
};

/**
 * `public/tile-packs/<slug>.json` shape (all fields optional except you should set what you need).
 *
 * - `intro` — shop card teaser on `/tiles` (excerpted); preferred over catalog `description` when present.
 * - `description` — multi-paragraph; use `\n\n` between paragraphs.
 * - `gallery` + `galleryFolder` — filenames under `/tile-pack-gallery/<galleryFolder>/`.
 *   If `galleryFolder` is omitted, the catalog item’s `imagePath` (Stripe `image_path`) is used when present.
 * - `builderEnabled` — when true, this pack’s mapped `tile_set` appears in the Tile Builder dropdown (see `tileSetVarForCatalogSlug`).
 * - `builderTileSetName` — display label for that row in the Tile Builder tile set dropdown (falls back to catalog name).
 */
export type TilePackContent = {
  intro?: string;
  description?: string;
  whatYouGet?: TileSetWhatYouGet;
  includedFiles?: TilePackIncludedFiles;
  gallery?: string[];
  galleryFolder?: string;
  /** When true, this catalog slug’s SCAD `tile_set` is offered in the Tile Builder (requires slug → var mapping). */
  builderEnabled?: boolean;
  /** Short label for the Tile Builder tile set dropdown (e.g. "Tavern"). */
  builderTileSetName?: string;
};

function isWhatYouGet(v: unknown): v is TileSetWhatYouGet {
  return (
    typeof v === 'object' &&
    v != null &&
    typeof (v as TileSetWhatYouGet).heading === 'string' &&
    Array.isArray((v as TileSetWhatYouGet).bullets)
  );
}

function isIncludedFiles(v: unknown): v is TilePackIncludedFiles {
  if (typeof v !== 'object' || v == null) return false;
  const o = v as { heading?: unknown; bullets?: unknown };
  if (!Array.isArray(o.bullets)) return false;
  return o.bullets.every((x) => typeof x === 'string');
}

function parseTilePackContent(raw: unknown): TilePackContent | null {
  if (typeof raw !== 'object' || raw == null) return null;
  const o = raw as Record<string, unknown>;
  const out: TilePackContent = {};
  if (typeof o.intro === 'string' && o.intro.trim()) {
    out.intro = o.intro.trim();
  }
  if (typeof o.description === 'string' && o.description.trim()) {
    out.description = o.description.trim();
  }
  if (isWhatYouGet(o.whatYouGet)) {
    out.whatYouGet = o.whatYouGet;
  }
  if (isIncludedFiles(o.includedFiles)) {
    const inc = o.includedFiles;
    out.includedFiles = {
      heading: typeof inc.heading === 'string' ? inc.heading.trim() : undefined,
      bullets: inc.bullets.map(String),
    };
  }
  if (Array.isArray(o.gallery)) {
    const g = o.gallery.filter((x): x is string => typeof x === 'string').map((s) => s.trim()).filter(Boolean);
    if (g.length) out.gallery = g;
  }
  if (typeof o.galleryFolder === 'string' && o.galleryFolder.trim()) {
    out.galleryFolder = o.galleryFolder.trim();
  }
  if (typeof o.builderEnabled === 'boolean') {
    out.builderEnabled = o.builderEnabled;
  }
  if (typeof o.builderTileSetName === 'string' && o.builderTileSetName.trim()) {
    out.builderTileSetName = o.builderTileSetName.trim();
  }
  if (
    !out.intro &&
    !out.description &&
    !out.whatYouGet &&
    !out.includedFiles &&
    !out.gallery?.length &&
    typeof out.builderEnabled !== 'boolean' &&
    typeof out.builderTileSetName !== 'string'
  ) {
    return null;
  }
  return out;
}

/** Public URLs for supporting gallery images (not the Stripe hero). */
export function buildGalleryFileUrls(folder: string, filenames: string[]): string[] {
  const f = folder.trim();
  if (!isSafeTilePackGalleryFolder(f)) return [];
  const base = `/tile-pack-gallery/${encodeURIComponent(f)}`;
  return filenames.filter(isSafeGalleryFilename).map((n) => `${base}/${encodeURIComponent(n)}`);
}

async function tryFetchOne(slug: string): Promise<TilePackContent | null> {
  const safe = slug.trim();
  if (!safe || !/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(safe)) return null;
  const url = `/tile-packs/${encodeURIComponent(safe)}.json`;
  let res: Response;
  try {
    res = await fetch(url, { cache: 'no-store' });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return null;
  }
  return parseTilePackContent(data);
}

/**
 * Load optional pack copy for the detail page. Tries `/tile-packs/<slug>.json`, then the
 * mapped fallback slug when defined (see TILE_PACK_JSON_FALLBACK_SLUG).
 */
export async function fetchTilePackContent(routeSlug: string): Promise<TilePackContent | null> {
  const primary = await tryFetchOne(routeSlug);
  if (primary) return primary;
  const alt = TILE_PACK_JSON_FALLBACK_SLUG[routeSlug];
  if (alt && alt !== routeSlug) {
    return tryFetchOne(alt);
  }
  return null;
}

/** Default bullets when JSON has no `includedFiles` (matches prior hardcoded detail page). */
export const DEFAULT_TILE_PACK_INCLUDED_FILES_BULLETS: string[] = [
  'High resolution STLs (128 and 256 variants)',
  'Ready for FDM printing (0.4 nozzle friendly)',
  'Clean geometry optimized for slicing',
];
