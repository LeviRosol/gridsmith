type AnalyticsValue = string | number | boolean;
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: any[]) => void;
  }
}

const GA_MEASUREMENT_ID = (process.env.GA_MEASUREMENT_ID as string | undefined)?.trim() ?? '';
const DEFAULT_ROWS = 2;
const DEFAULT_COLUMNS = 2;
const DEFAULT_CELL_SIZE = 30.5;

const TITLE_TYPE_BY_CELL: Record<number, string> = {
  30.5: 'GridSmith',
  50: 'OpenForge',
};

let initialized = false;
let scriptLoaded = false;
let activationCheckScheduled = false;
let runtimeWarningEmitted = false;

function isAnalyticsEnabled(): boolean {
  return GA_MEASUREMENT_ID.length > 0;
}

function getWindowGtag(): ((...args: any[]) => void) | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.gtag;
}

function warnAnalyticsRuntime(message: string): void {
  if (runtimeWarningEmitted) return;
  runtimeWarningEmitted = true;
  // Keep this warning in all environments: silent GA failures are hard to diagnose in production.
  console.warn(`[analytics] ${message}`);
}

function scheduleRuntimeActivationCheck(): void {
  if (activationCheckScheduled || typeof window === 'undefined') return;
  activationCheckScheduled = true;

  window.setTimeout(() => {
    const dataLayer = window.dataLayer;
    const pushPatched = !!dataLayer && dataLayer.push !== Array.prototype.push;
    if (!scriptLoaded && !pushPatched) {
      warnAnalyticsRuntime('Google Analytics script loaded state is unknown and runtime is still inactive.');
      return;
    }
    if (!pushPatched) {
      warnAnalyticsRuntime('Google Analytics runtime is inactive: events are queued but not being transported.');
    }
  }, 3000);
}

export function initAnalytics(): void {
  if (!isAnalyticsEnabled() || initialized || typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  if (!window.dataLayer) {
    window.dataLayer = [];
  }

  if (!window.gtag) {
    window.gtag = function gtag(...args: any[]) {
      window.dataLayer?.push(args);
    };
  }

  const scriptSelector = `script[src*="googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"]`;
  let script = document.querySelector(scriptSelector) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
    document.head.appendChild(script);
  }
  if (!script.dataset.gridsmithGaBound) {
    script.dataset.gridsmithGaBound = '1';
    script.addEventListener('load', () => {
      scriptLoaded = true;
    });
    script.addEventListener('error', () => {
      warnAnalyticsRuntime('Google Analytics script failed to load.');
    });
  }
  // Existing script may have already loaded before we attached listeners.
  if (window.dataLayer && window.dataLayer.push !== Array.prototype.push) {
    scriptLoaded = true;
  }

  window.gtag('js', new Date());
  // Disable automatic page_view so route tracking is explicit and predictable.
  window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });
  scheduleRuntimeActivationCheck();
  initialized = true;
}

function sanitizeEventParams(
  params: Record<string, AnalyticsValue | undefined>,
): Record<string, AnalyticsValue> {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined),
  ) as Record<string, AnalyticsValue>;
}

export function trackEvent(eventName: string, params: Record<string, AnalyticsValue | undefined> = {}): void {
  if (!isAnalyticsEnabled()) return;
  initAnalytics();
  const gtag = getWindowGtag();
  if (!gtag) return;
  gtag('event', eventName, sanitizeEventParams(params));
}

export function trackPageView(path: string): void {
  if (!isAnalyticsEnabled()) return;
  initAnalytics();
  const gtag = getWindowGtag();
  if (!gtag) return;
  gtag('event', 'page_view', {
    page_path: path,
    page_title: document.title,
    page_location: window.location.href,
  });
}

export function getGridAnalyticsParams(vars: { [name: string]: any } | undefined): {
  rows: number;
  columns: number;
  title_type: string;
} {
  const rows = typeof vars?.rows === 'number' ? vars.rows : DEFAULT_ROWS;
  const columns = typeof vars?.cols === 'number' ? vars.cols : DEFAULT_COLUMNS;
  const cellSize = typeof vars?.cell === 'number' ? vars.cell : DEFAULT_CELL_SIZE;
  const titleType = TITLE_TYPE_BY_CELL[cellSize] ?? 'Custom';

  return {
    rows,
    columns,
    title_type: titleType,
  };
}

