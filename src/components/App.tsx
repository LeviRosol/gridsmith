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


export function App({initialState, statePersister, fs}: {initialState: State, statePersister: StatePersister, fs: FS}) {
  const [state, setState] = useState(initialState);

  const model = new Model(fs, state, setState, statePersister);
  useEffect(() => model.init());

  const [customizerOpen, setCustomizerOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const accountMenuRef = useRef<Menu | null>(null);

  const accountItems: MenuItem[] = [
    { label: 'Profile', icon: 'pi pi-user', url: '#' },
    { label: 'Logout', icon: 'pi pi-sign-out', url: '#' },
    { separator: true },
    {
      label: darkMode ? 'Light mode' : 'Dark mode',
      icon: darkMode ? 'pi pi-sun' : 'pi pi-moon',
      command: () => setDarkMode((v) => !v),
    },
  ];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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
  }, []);

  useEffect(() => {
    const body = document.body;
    body.classList.remove('dark-mode', 'light-mode');
    body.classList.add(darkMode ? 'dark-mode' : 'light-mode');

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

  return (
    <ModelContext.Provider value={model}>
      <FSContext.Provider value={fs}>
        <div className='flex flex-column' style={{
            flex: 1,
          }}>
          <header className="app-header">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <picture>
                <source srcSet="/logo3_512.png" media="(min-width: 768px)" />
                <source srcSet="/logo3_256.png" media="(max-width: 767px)" />
                <img
                  src="/logo3_256.png"
                  alt="GridSmith logo"
                  style={{ height: 64, width: 'auto', borderRadius: 6, objectFit: 'contain' }}
                />
              </picture>
            </div>
            <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.9rem' }}>
              <a href="#" className="app-header-link">Get Tiles</a>
              <a href="#" className="app-header-link">About</a>
              <div style={{ position: 'relative' }}>
                <Menu
                  model={accountItems}
                  popup
                  ref={accountMenuRef}
                />
                <Button
                  type="button"
                  label="Account"
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
          <ConfirmDialog />
        </div>
      </FSContext.Provider>
    </ModelContext.Provider>
  );
}
