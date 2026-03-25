// Portions of this file are Copyright 2021 Google LLC, and licensed under GPL2+. See COPYING.

import { Source } from '../state/app-state.ts';

const TILE_BUILDER_PATH = '/tile_builder.scad';

let manifestCache: string[] | null = null;

function tileStlPublicUrl(fileName: string): string {
  const path = `/tile_stls/${encodeURIComponent(fileName)}`;
  if (typeof window === 'undefined' || !window.location?.origin) {
    return path;
  }
  return new URL(path, window.location.origin).href;
}

/** Fetches manifest once; used to attach STL binaries to worker invocations. */
export async function fetchTileStlManifest(): Promise<string[]> {
  if (manifestCache) return manifestCache;
  try {
    const res = await fetch(new URL('/tile_stls/manifest.json', window.location.origin).href);
    if (!res.ok) {
      manifestCache = [];
      return manifestCache;
    }
    const data = await res.json();
    manifestCache = Array.isArray(data)
      ? data.filter((x): x is string => typeof x === 'string' && x.endsWith('.stl'))
      : [];
  } catch {
    manifestCache = [];
  }
  return manifestCache;
}

/**
 * The OpenSCAD worker has a separate FS from the main thread. STLs must be passed as sources
 * with `url` so the worker's fetchSource() can load them into the worker FS at `/tile_stls/...`.
 */
export async function sourcesWithTileStls(sources: Source[]): Promise<Source[]> {
  const hasTileBuilder = sources.some((s) => s.path === TILE_BUILDER_PATH);
  if (!hasTileBuilder) return sources;

  const names = await fetchTileStlManifest();
  const byPath = new Map(sources.map((s) => [s.path, s] as const));

  for (const name of names) {
    const path = `/tile_stls/${name}`;
    if (!byPath.has(path)) {
      byPath.set(path, { path, url: tileStlPublicUrl(name) });
    }
  }

  return Array.from(byPath.values());
}
