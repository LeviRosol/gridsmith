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
import CookieBanner from './CookieBanner';

type ConsentContextValue = {
  openCookieSettings: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error('useConsent must be used within ConsentProvider');
  }
  return ctx;
}

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [answered, setAnswered] = useState(
    () => typeof window !== 'undefined' && getStoredConsent() !== undefined,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);

  useLayoutEffect(() => {
    if (getStoredConsent()?.analytics === true) {
      loadGoogleTagManager();
    }
  }, []);

  const openCookieSettings = useCallback(() => {
    setSettingsOpen(true);
  }, []);

  const acceptAnalytics = useCallback(() => {
    setStoredConsent(true);
    setAnswered(true);
    setSettingsOpen(false);
    loadGoogleTagManager();
    trackPageView(`${window.location.pathname}${window.location.search}`);
  }, []);

  const essentialOnly = useCallback(() => {
    const hadAnalytics = getStoredConsent()?.analytics === true;
    setStoredConsent(false);
    setAnswered(true);
    setSettingsOpen(false);
    if (hadAnalytics) {
      window.location.reload();
    }
  }, []);

  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
  }, []);

  const showBanner = !answered || settingsOpen;

  const value = useMemo(() => ({ openCookieSettings }), [openCookieSettings]);

  return (
    <ConsentContext.Provider value={value}>
      {children}
      {showBanner ? (
        <CookieBanner
          showClose={answered}
          onAccept={acceptAnalytics}
          onEssentialOnly={essentialOnly}
          onClose={answered ? closeSettings : undefined}
        />
      ) : null}
    </ConsentContext.Provider>
  );
}
