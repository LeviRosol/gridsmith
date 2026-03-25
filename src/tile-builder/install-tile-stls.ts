// Portions of this file are Copyright 2021 Google LLC, and licensed under GPL2+. See COPYING.

declare var BrowserFS: BrowserFSInterface;

/**
 * Fetches flat STL assets from /tile_stls/ (see public/tile_stls/manifest.json) and writes them
 * into the BrowserFS overlay at /tile_stls/<name> for use in import() from OpenSCAD.
 */
export async function installTileStls(fs: FS): Promise<void> {
  const Buffer = BrowserFS.BFSRequire('buffer').Buffer;
  const fsSync = fs as FS & { mkdirSync: (path: string) => void; writeFileSync: (path: string, data: Buffer) => void };

  let manifest: unknown;
  try {
    const res = await fetch('./tile_stls/manifest.json');
    if (!res.ok) return;
    manifest = await res.json();
  } catch {
    return;
  }

  if (!Array.isArray(manifest) || manifest.length === 0) return;

  const ensureDir = (path: string) => {
    const segments = path.split('/').filter(Boolean);
    let acc = '';
    for (const seg of segments) {
      acc += '/' + seg;
      try {
        fsSync.mkdirSync(acc);
      } catch {
        // already exists
      }
    }
  };

  ensureDir('/tile_stls');

  for (const entry of manifest) {
    if (typeof entry !== 'string' || !entry.endsWith('.stl')) continue;
    const safeName = entry.replace(/^.*[\\/]/, '');
    if (safeName !== entry) continue;

    try {
      const res = await fetch(`./tile_stls/${encodeURIComponent(safeName)}`);
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      fsSync.writeFileSync(`/tile_stls/${safeName}`, buf);
    } catch (e) {
      console.warn(`installTileStls: skipped ${safeName}`, e);
    }
  }
}
