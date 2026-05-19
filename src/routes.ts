/** Normalize pathname (strip trailing slashes; map legacy `/viewer` → `/baseplate`). */
export function normalizePathname(pathname: string): string {
  let p = pathname.replace(/\/+$/, '') || '/';
  if (p === '/viewer') p = '/baseplate';
  return p === '' ? '/' : p;
}

export function isBuilderRoute(pathname: string): boolean {
  const p = normalizePathname(pathname);
  return p === '/baseplate' || p === '/tile-builder';
}
