// Portions of this file are Copyright 2021 Google LLC, and licensed under GPL2+. See COPYING.

import React, { CSSProperties, useEffect, useState, useRef } from 'react';
import {MultiLayoutComponentId, State, StatePersister} from '../state/app-state'
import { Model } from '../state/model';
import EditorPanel from './EditorPanel';
import BaseplatePanel from './BaseplatePanel';
import Footer from './Footer';
import { ModelContext, FSContext } from './contexts';
import { ConfirmDialog } from 'primereact/confirmdialog';
import CustomizerPanel from './CustomizerPanel';
import GridSmithPanel from './GridSmithPanel';
import TileBuilderPanel from './TileBuilderPanel';
import { Button } from 'primereact/button';
import { SplitButton } from 'primereact/splitbutton';
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
import { ConsentProvider } from './ConsentProvider';
import { trackPageView } from '../analytics';
import { installTileStls } from '../tile-builder/install-tile-stls.ts';
import { isTileBuilderProTierResolution } from '../utils.ts';

const THEME_MODE_STORAGE_KEY = 'gridsmith.theme.darkMode';

export function App({initialState, statePersister, fs}: {initialState: State, statePersister: StatePersister, fs: FS}) {
  return (
    <ConsentProvider>
      <AuthProvider>
        <AppImpl initialState={initialState} statePersister={statePersister} fs={fs} />
      </AuthProvider>
    </ConsentProvider>
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
  const mobileMenuRef = useRef<Menu | null>(null);
  const auth = useAuth();

  // Simple pathname-based routing
  let rawPath = window.location.pathname;
  let normalizedPath = rawPath.replace(/\/+$/, '') || '/';
  if (normalizedPath === '/viewer') {
    const next = '/baseplate' + window.location.search + window.location.hash;
    window.history.replaceState(window.history.state ?? {}, '', next);
    rawPath = '/baseplate';
    normalizedPath = '/baseplate';
  }
  const pathname = normalizedPath === '' ? '/' : normalizedPath;
  const isBuilderShell = pathname === '/baseplate' || pathname === '/tile-builder';
  const ParamsSidebar = pathname === '/tile-builder' ? TileBuilderPanel : GridSmithPanel;

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

  const mobileMenuItems: MenuItem[] = [
    {
      label: 'Baseplate',
      icon: 'pi pi-bolt',
      command: () => {
        window.location.pathname = '/baseplate';
      },
    },
    {
      label: 'Tile builder',
      icon: 'pi pi-th-large',
      command: () => {
        window.location.pathname = '/tile-builder';
      },
    },
    { label: 'Get Tiles', command: () => (window.location.pathname = '/tiles') },
    { label: 'About', command: () => (window.location.pathname = '/about') },
    { separator: true },
    ...accountItems,
  ];

  useEffect(() => {
    document.documentElement.classList.remove('use-system-font');
    try {
      localStorage.removeItem('gridsmith.font.systemStack');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!isBuilderShell) return;
    if (auth.loading) return;
    if (!auth.isSignedIn) return;
    let cancelled = false;
    void (async () => {
      if (pathname === '/tile-builder') {
        await installTileStls(fs);
      }
      if (cancelled) return;
      model.init();
      if (cancelled) return;
      if (pathname === '/tile-builder') {
        const v = model.state.params.vars ?? {};
        const wallsAllowed = v.wall_profile != null && v.wall_profile !== 'none';
        const anyWall =
          wallsAllowed &&
          (v.use_north_wall === true ||
            v.use_east_wall === true ||
            v.use_south_wall === true ||
            v.use_west_wall === true);
        const canPreview = v.use_floor === true || anyWall;
        if (canPreview) {
          void model.render({ isPreview: true, now: true });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // We intentionally don't include `model` in deps: we only want initialization on route+auth changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, auth.loading, auth.isSignedIn, isBuilderShell]);

  useEffect(() => {
    if (pathname !== '/baseplate') return;
    if (state.view.layout.mode !== 'single') return;
    if (!window.matchMedia('(max-width: 767px)').matches) return;

    // On initial mobile loads, force the baseplate shell into the sidebar-capable layout
    // so params remain discoverable with the same slide-tab behavior as resized desktop.
    setState((prev) => ({
      ...prev,
      view: {
        ...prev.view,
        layout: {
          mode: 'multi',
          editor: false,
          baseplate: true,
          customizer: true,
          showEditor: false,
        } as any,
      },
    }));
    setCustomizerOpen(true);
  }, [pathname, state.view.layout.mode]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isBuilderShell) return;
      if (auth.loading || !auth.isSignedIn) return;
      if (event.key === 'F5') {
        event.preventDefault();
        model.render({isPreview: true, now: true})
      } else if (event.key === 'F6') {
        event.preventDefault();
        if (
          pathname === '/tile-builder' &&
          isTileBuilderProTierResolution(model.state.params.vars?.resolution)
        ) {
          return;
        }
        model.render({isPreview: false, now: true})
      } else if (event.key === 'F7') {
        event.preventDefault();
        if (
          pathname === '/tile-builder' &&
          isTileBuilderProTierResolution(model.state.params.vars?.resolution)
        ) {
          return;
        }
        model.export();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [pathname, model, auth.loading, auth.isSignedIn, isBuilderShell]);

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
    trackPageView(`${window.location.pathname}${window.location.search}`);
  }, [pathname]);

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
      baseplate: 1,
      customizer: 0,
    },
    baseplate: {
      editor: 2,
      baseplate: 3,
      customizer: 1,
    },
    customizer: {
      editor: 0,
      baseplate: 1,
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
      <nav className="app-header-nav">
        <div className="app-header-nav-desktop">
          <a href="/tiles" className="app-header-link">Get Tiles</a>
          <a href="/about" className="app-header-link">About</a>
          <SplitButton
            label="Baseplate"
            icon="pi pi-bolt"
            onClick={() => {
              window.location.pathname = '/baseplate';
            }}
            model={[
              {
                label: 'Tile builder',
                icon: 'pi pi-th-large',
                command: () => {
                  window.location.pathname = '/tile-builder';
                },
              },
            ]}
            className="app-header-link-button app-header-build-button"
            style={{ paddingInline: '0.75rem' }}
          />
          <div style={{ position: 'relative' }}>
            <Menu model={accountItems} popup ref={accountMenuRef} />
            <Button
              type="button"
              label={auth.isSignedIn ? (auth.user?.givenName ? auth.user.givenName : '') : ''}
              icon="pi pi-user"
              onClick={(e) => accountMenuRef.current && accountMenuRef.current.toggle(e)}
              className="app-header-link-button"
              iconPos="left"
              text={!auth.isSignedIn || !!auth.user?.givenName}
              aria-label={auth.isSignedIn ? 'Account' : 'Account'}
              style={{ paddingInline: '0.25rem' }}
            />
          </div>
        </div>

        <div className="app-header-nav-mobile">
          <Menu model={mobileMenuItems} popup ref={mobileMenuRef} />
          <Button
            type="button"
            icon="pi pi-bars"
            aria-label="Menu"
            onClick={(e) => mobileMenuRef.current && mobileMenuRef.current.toggle(e)}
            className="app-header-link-button"
            style={{ paddingInline: '0.25rem' }}
          />
        </div>
      </nav>
    </header>
  );

  if (isBuilderShell) {
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
      const signInBlurb =
        pathname === '/tile-builder'
          ? 'Please sign in to access the GridSmith tile builder and export tools.'
          : 'Please sign in to access the GridSmith baseplate builder and export tools.';
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
              {signInBlurb}
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

  // Non-builder routes render lightweight pages without mounting the heavy editor shell.
  if (!isBuilderShell) {
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
                        <ParamsSidebar
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

                    <BaseplatePanel style={{ flex: 1 }} />
                  </div>
                ) : (
                  <BaseplatePanel style={{ flex: 1 }} />
                )}
              </>
            ) : (
              <>
                {layout.mode === 'single' && (layout as any).focus === 'customizer' && (
                  <ParamsSidebar className="absolute-fill" style={getPanelStyle('customizer')} />
                )}
                {layout.mode === 'single' && (layout as any).focus === 'baseplate' && (
                  <BaseplatePanel className="absolute-fill" style={getPanelStyle('baseplate')} />
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
