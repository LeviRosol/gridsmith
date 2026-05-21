/** Canonical production origin (see docs/gridsmith-context.md). */
export const SITE_ORIGIN = 'https://gridsmith.io';

export const SITE_NAME = 'GridSmith';

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_ORIGIN}${normalized}`;
}

export function absoluteImageUrl(imagePath: string): string {
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return absoluteUrl(imagePath);
}
