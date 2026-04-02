import React, {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { getStoredConsent, loadGoogleTagManager, setStoredConsent } from '../consent';
import { trackPageView } from '../analytics';
import { useAuth } from './AuthContext';
import CookieBanner from './CookieBanner';

type ConsentContextValue = {
  openCookieSettings: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error('useConsent must be used within a ConsentProvider');
  }
  return ctx;
}

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  const [answered, setAnswered] = useState(
    () => typeof window !== 'undefined' && getStoredConsent() !== undefined,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(true);

  const showBanner = !answered || settingsOpen;

  useLayoutEffect(() => {
    if (getStoredConsent()?.analytics === true) {
      loadGoogleTagManager();
    }
  }, []);

  useLayoutEffect(() => {
    if (showBanner) {
      setMarketingEmails(getStoredConsent()?.marketingEmails ?? true);
    }
  }, [showBanner]);

  const syncMarketingToAccount = useCallback(
    async (optIn: boolean) => {
      if (!auth.isSignedIn || auth.loading) return;
      try {
        await auth.setMarketingOptIn(optIn);
      } catch (e) {
        console.warn('Could not sync marketing preference to your account:', e);
      }
    },
    [auth],
  );

  const acceptAnalytics = useCallback(() => {
    setStoredConsent({ analytics: true, marketingEmails });
    setAnswered(true);
    setSettingsOpen(false);
    loadGoogleTagManager();
    trackPageView(`${window.location.pathname}${window.location.search}`);
    void syncMarketingToAccount(marketingEmails);
  }, [marketingEmails, syncMarketingToAccount]);

  const essentialOnly = useCallback(() => {
    const hadAnalytics = getStoredConsent()?.analytics === true;
    setStoredConsent({ analytics: false, marketingEmails });
    setAnswered(true);
    setSettingsOpen(false);
    void (async () => {
      if (auth.isSignedIn && !auth.loading) {
        try {
          await auth.setMarketingOptIn(marketingEmails);
        } catch (e) {
          console.warn('Could not sync marketing preference to your account:', e);
        }
      }
      if (hadAnalytics) {
        window.location.reload();
      }
    })();
  }, [marketingEmails, auth]);

  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
  }, []);

  const openCookieSettings = useCallback(() => {
    setSettingsOpen(true);
  }, []);

  const value = useMemo(() => ({ openCookieSettings }), [openCookieSettings]);

  return (
    <ConsentContext.Provider value={value}>
      {children}
      {showBanner ? (
        <CookieBanner
          showClose={answered}
          marketingEmails={marketingEmails}
          onMarketingEmailsChange={setMarketingEmails}
          onAccept={acceptAnalytics}
          onEssentialOnly={essentialOnly}
          onClose={answered ? closeSettings : undefined}
        />
      ) : null}
    </ConsentContext.Provider>
  );
}
