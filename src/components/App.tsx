// Portions of this file are Copyright 2021 Google LLC, and licensed under GPL2+. See COPYING.

import React, { CSSProperties, useEffect, useState, useRef } from 'react';
import {MultiLayoutComponentId, State, StatePersister} from '../state/app-state'
import { Model } from '../state/model';
import EditorPanel from './EditorPanel';
import ViewerPanel from './ViewerPanel';
import Footer from './Footer';
import { ModelContext, FSContext } from './contexts';
import { ConfirmDialog } from 'primereact/confirmdialog';
import CustomizerPanel from './CustomizerPanel';
import GridSmithPanel from './GridSmithPanel';
import { Button } from 'primereact/button';
import { Menu } from 'primereact/menu';
import type { MenuItem } from 'primereact/menuitem';
import HomePage from './HomePage';
import AboutPage from './AboutPage';
import TilesPage from './TilesPage';
import ProfilePage from './ProfilePage';
import TosPage from './TosPage';
import PrivacyPage from './PrivacyPage';
import SiteFooter from './SiteFooter';
import { AuthProvider, useAuth } from './AuthContext';

const THEME_MODE_STORAGE_KEY = 'gridsmith.theme.darkMode';

export function App({initialState, statePersister, fs}: {initialState: State, statePersister: StatePersister, fs: FS}) {
  return (
    <AuthProvider>
      <AppImpl initialState={initialState} statePersister={statePersister} fs={fs} />
    </AuthProvider>
  );
}

function AppImpl({initialState, statePersister, fs}: {initialState: State, statePersister: StatePersister, fs: FS}) {
  const [state, setState] = useState(initialState);

  const model = new Model(fs, state, setState, statePersister);

  const [customizerOpen, setCustomizerOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const persisted = localStorage.getItem(THEME_MODE_STORAGE_KEY);
      if (persisted == null) return true;
      return persisted === 'true';
    } catch {
      return true;
    }
  });
  const accountMenuRef = useRef<Menu | null>(null);
  const auth = useAuth();

  // Simple pathname-based routing
  const rawPath = window.location.pathname;
  const normalizedPath = rawPath.replace(/\/+$/, '') || '/';
  const pathname = normalizedPath === '' ? '/' : normalizedPath;

  const accountItems: MenuItem[] = [
    ...(auth.isSignedIn
      ? [
          {
            label: 'Profile',
            icon: 'pi pi-user',
            command: () => {
              window.location.pathname = '/profile';
            },
          },
          {
            label: 'Sign out',
            icon: 'pi pi-sign-out',
            command: () => auth.logout(),
          },
        ]
      : [
          {
            label: 'Sign in',
            icon: 'pi pi-sign-in',
            command: () => auth.login(),
          },
        ]),
    { separator: true },
    {
      label: darkMode ? 'Light mode' : 'Dark mode',
      icon: darkMode ? 'pi pi-sun' : 'pi pi-moon',
      command: () => setDarkMode((v) => !v),
    },
  ];

  useEffect(() => {
    if (pathname !== '/viewer') return;
    if (auth.loading) return;
    if (!auth.isSignedIn) return;
    model.init();
    // We intentionally don't include `model` in deps: we only want initialization on route+auth changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, auth.loading, auth.isSignedIn]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (pathname !== '/viewer') return;
      if (auth.loading || !auth.isSignedIn) return;
      if (event.key === 'F5') {
        event.preventDefault();
        model.render({isPreview: true, now: true})
      } else if (event.key === 'F6') {
        event.preventDefault();
        model.render({isPreview: false, now: true})
      } else if (event.key === 'F7') {
        event.preventDefault();
        model.export();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [pathname, model, auth.loading, auth.isSignedIn]);

  useEffect(() => {
    const body = document.body;
    body.classList.remove('dark-mode', 'light-mode');
    body.classList.add(darkMode ? 'dark-mode' : 'light-mode');
    try {
      localStorage.setItem(THEME_MODE_STORAGE_KEY, String(darkMode));
    } catch {
      // Ignore storage failures; theme still applies for current session.
    }

    const themeId = 'primereact-theme';
    const existing = document.getElementById(themeId) as HTMLLinkElement | null;
    const href = darkMode
      ? 'https://unpkg.com/primereact/resources/themes/lara-dark-amber/theme.css'
      : 'https://unpkg.com/primereact/resources/themes/lara-light-amber/theme.css';

    if (existing) {
      if (existing.href !== href) {
        existing.href = href;
      }
    } else {
      const link = document.createElement('link');
      link.id = themeId;
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
  }, [darkMode]);

  useEffect(() => {
    if (state.view.layout.mode === 'multi') {
      setCustomizerOpen(true);
      return;
    }
    // `focus` only exists in single-panel mode; cast to avoid TS narrowing issues.
    setCustomizerOpen((state.view.layout as any).focus === 'customizer');
  }, [state.view.layout.mode]);

  const zIndexOfPanelsDependingOnFocus = {
    editor: {
      editor: 3,
      viewer: 1,
      customizer: 0,
    },
    viewer: {
      editor: 2,
      viewer: 3,
      customizer: 1,
    },
    customizer: {
      editor: 0,
      viewer: 1,
      customizer: 3,
    }
  }

  const layout = state.view.layout
  const mode = state.view.layout.mode;
  function getPanelStyle(id: MultiLayoutComponentId): CSSProperties {
    if (id === 'editor' && !(state.view as any).layout.showEditor) {
      return {
        display: 'none',
      };
    }
    return {
      flex: 1,
      zIndex: Number((zIndexOfPanelsDependingOnFocus as any)[id][(layout as any).focus]),
    }
  }

  const header = (
    <header className="app-header">
      <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
        <picture>
          <source srcSet="/logo3_512.png" media="(min-width: 768px)" />
          <source srcSet="/logo3_256.png" media="(max-width: 767px)" />
          <img
            src="/logo3_256.png"
            alt="GridSmith logo"
            style={{ height: 64, width: 'auto', borderRadius: 6, objectFit: 'contain' }}
          />
        </picture>
      </a>
      <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.9rem' }}>
        <a href="/tiles" className="app-header-link">Get Tiles</a>
        <a href="/about" className="app-header-link">About</a>
        <Button
          type="button"
          label="Build"
          icon="pi pi-bolt"
          onClick={() => window.location.pathname = '/viewer'}
          className="app-header-link-button app-header-build-button"
          style={{ paddingInline: '0.75rem' }}
        />
        <div style={{ position: 'relative' }}>
          <Menu
            model={accountItems}
            popup
            ref={accountMenuRef}
          />
          <Button
            type="button"
            label={auth.isSignedIn && auth.user?.name ? auth.user.name : 'Account'}
            icon="pi pi-user"
            iconPos="left"
            text
            onClick={(e) => accountMenuRef.current && accountMenuRef.current.toggle(e)}
            className="app-header-link-button"
            style={{ paddingInline: '0.25rem' }}
          />
        </div>
      </nav>
    </header>
  );

  if (pathname === '/viewer') {
    if (auth.loading) {
      return (
        <div className="flex flex-column" style={{ flex: 1 }}>
          {header}
          <main
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem 1rem',
              textAlign: 'center',
            }}
          >
            <p style={{ opacity: 0.85 }}>Loading authentication...</p>
          </main>
          <SiteFooter />
        </div>
      );
    }

    if (!auth.isSignedIn) {
      return (
        <div className="flex flex-column" style={{ flex: 1 }}>
          {header}
          <main
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem 1rem',
              textAlign: 'center',
            }}
          >
            <h1 style={{ marginBottom: '0.75rem' }}>Sign in required</h1>
            <p style={{ maxWidth: 640, opacity: 0.85, marginBottom: '1rem' }}>
              Please sign in to access the GridSmith viewer and export tools.
            </p>
            <Button
              type="button"
              label="Sign in with Google"
              icon="pi pi-google"
              onClick={() => auth.login()}
            />
          </main>
          <SiteFooter />
          <ConfirmDialog />
        </div>
      );
    }
  }

  // Non-viewer routes render lightweight pages without mounting the heavy viewer/editor shell.
  if (pathname !== '/viewer') {
    let page: JSX.Element;
    if (pathname === '/') {
      page = <HomePage />;
    } else if (pathname === '/about') {
      page = <AboutPage />;
    } else if (pathname === '/tiles') {
      page = <TilesPage />;
    } else if (pathname === '/profile') {
      page = <ProfilePage />;
    } else if (pathname === '/tos') {
      page = <TosPage />;
    } else if (pathname === '/privacy') {
      page = <PrivacyPage />;
    } else {
      page = <HomePage />;
    }

    return (
      <div className="flex flex-column" style={{ flex: 1 }}>
        {header}
        {page}
        <SiteFooter />
      </div>
    );
  }

  return (
    <ModelContext.Provider value={model}>
      <FSContext.Provider value={fs}>
        <div className='flex flex-column' style={{
            flex: 1,
          }}>
          {header}
          <div className={mode === 'multi' ? 'flex flex-row' : 'flex flex-column'}
              style={mode === 'multi' ? {
                flex: 1,
                position: 'relative',
                overflow: 'hidden',
              } : {
                flex: 1,
                position: 'relative'
              }}>
            {mode === 'multi' ? (
              <>
                {(layout as any).customizer ? (
                  <div style={{ display: 'flex', flex: 1, position: 'relative', height: '100%' }}>
                    <div
                      style={{
                        width: customizerOpen ? '30%' : '0px',
                        maxWidth: customizerOpen ? '420px' : '0px',
                        minWidth: customizerOpen ? '280px' : '0px',
                        transition: 'width 0.25s ease-in-out, max-width 0.25s ease-in-out, min-width 0.25s ease-in-out',
                        overflow: 'visible',
                        position: 'relative',
                        background: 'transparent',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          maxHeight: 'unset',
                          overflow: 'hidden',
                          pointerEvents: customizerOpen ? 'auto' : 'none',
                        }}
                      >
                        <GridSmithPanel
                          className="opacity-animated"
                          style={{ height: '100%', maxHeight: 'unset', overflow: 'auto' }}
                        />
                      </div>

                      <div
                        style={{
                          position: 'absolute',
                          top: 25,
                          right: -37,
                          zIndex: 6,
                          pointerEvents: 'auto',
                        }}
                      >
                        <Button
                          icon="pi pi-bars"
                          style={{
                            borderRadius: '0 4px 4px 0',
                            padding: '0.35rem 0.55rem',
                            background: 'transparent',
                            border: '1px solid #dddddd',
                            borderLeft: 'none',
                            color: '#cccccc',
                          }}
                          onClick={() => setCustomizerOpen((v) => !v)}
                        />
                      </div>
                    </div>

                    <ViewerPanel style={{ flex: 1 }} />
                  </div>
                ) : (
                  <ViewerPanel style={{ flex: 1 }} />
                )}
              </>
            ) : (
              <>
                {layout.mode === 'single' && (layout as any).focus === 'customizer' && (
                  <GridSmithPanel className="absolute-fill" style={getPanelStyle('customizer')} />
                )}
                {layout.mode === 'single' && (layout as any).focus === 'viewer' && (
                  <ViewerPanel className="absolute-fill" style={getPanelStyle('viewer')} />
                )}
                {layout.mode === 'single' && (layout as any).focus === 'editor' && (
                  <EditorPanel className="absolute-fill" style={getPanelStyle('editor')} />
                )}
              </>
            )}
          </div>

          <Footer />
          <SiteFooter />
          <ConfirmDialog />
        </div>
      </FSContext.Provider>
    </ModelContext.Provider>
  );
}
