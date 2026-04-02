const STORAGE_KEY = 'gridsmith.consent.v1';
const GTM_ID = 'GTM-T2RWQFR4';

export type StoredConsent = {
  analytics: boolean;
  /** Product/marketing email opt-in; legacy payloads without this field default to true. */
  marketingEmails: boolean;
};

export function getStoredConsent(): StoredConsent | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && 'analytics' in parsed) {
      const a = (parsed as { analytics: unknown }).analytics;
      if (typeof a === 'boolean') {
        const m = (parsed as { marketingEmails?: unknown }).marketingEmails;
        const marketingEmails = typeof m === 'boolean' ? m : true;
        return { analytics: a, marketingEmails };
      }
    }
  } catch {
    // ignore invalid storage
  }
  return undefined;
}

export function setStoredConsent(next: Pick<StoredConsent, 'analytics' | 'marketingEmails'>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota / private mode
  }
}

let gtmInjected = false;

/**
 * Injects the GTM bootstrap script. Safe to call multiple times.
 * Does not run until the user has opted in to analytics cookies.
 */
export function loadGoogleTagManager(): void {
  if (typeof document === 'undefined' || gtmInjected) return;
  if (document.querySelector('script[data-gridsmith-gtm="1"]')) {
    gtmInjected = true;
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  script.dataset.gridsmithGtm = '1';
  document.head.appendChild(script);
  gtmInjected = true;
}
