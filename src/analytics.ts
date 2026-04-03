import { getStoredConsent } from './consent';

type AnalyticsValue = string | number | boolean;
declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

const DEFAULT_ROWS = 2;
const DEFAULT_COLUMNS = 2;
const DEFAULT_CELL_SIZE = 30.2;

const TILE_TYPE_BY_CELL: Record<number, string> = {
  30.2: 'GridSmith',
  30.4: 'GridSmith',
  30.5: 'GridSmith', // legacy bookmarks
  50: 'OpenForge',
  50.4: 'OpenForge',
};

let initialized = false;

function analyticsConsentGranted(): boolean {
  return getStoredConsent()?.analytics === true;
}

function ensureDataLayer(): void {
  if (initialized || typeof window === 'undefined') {
    return;
  }

  if (!window.dataLayer) {
    window.dataLayer = [];
  }
  initialized = true;
}

function sanitizeEventParams(
  params: Record<string, AnalyticsValue | undefined>,
): Record<string, AnalyticsValue> {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined),
  ) as Record<string, AnalyticsValue>;
}

function pushDataLayerEvent(eventName: string, params: Record<string, AnalyticsValue>): void {
  if (typeof window === 'undefined') return;
  if (!analyticsConsentGranted()) return;
  ensureDataLayer();
  window.dataLayer?.push({
    event: eventName,
    ...params,
  });
}

export function trackEvent(eventName: string, params: Record<string, AnalyticsValue | undefined> = {}): void {
  pushDataLayerEvent(eventName, sanitizeEventParams(params));
}

export function trackPageView(path: string): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  pushDataLayerEvent('page_view', {
    page_path: path,
    page_title: document.title,
    page_location: window.location.href,
  });
}

export function getGridAnalyticsParams(vars: { [name: string]: any } | undefined): {
  rows: number;
  columns: number;
  tile_type: string;
} {
  const rows = typeof vars?.rows === 'number' ? vars.rows : DEFAULT_ROWS;
  const columns = typeof vars?.cols === 'number' ? vars.cols : DEFAULT_COLUMNS;
  const cellSize = typeof vars?.cell === 'number' ? vars.cell : DEFAULT_CELL_SIZE;
  const tileType = TILE_TYPE_BY_CELL[cellSize] ?? 'Custom';

  return {
    rows,
    columns,
    tile_type: tileType,
  };
}

