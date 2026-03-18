// Portions of this file are Copyright 2021 Google LLC, and licensed under GPL2+. See COPYING.

import React, { CSSProperties, useEffect, useState } from 'react';
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


export function App({initialState, statePersister, fs}: {initialState: State, statePersister: StatePersister, fs: FS}) {
  const [state, setState] = useState(initialState);

  const model = new Model(fs, state, setState, statePersister);
  useEffect(() => model.init());

  const [customizerOpen, setCustomizerOpen] = useState(true);

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
                <GridSmithPanel className={`
                  opacity-animated
                  ${layout.mode === 'single' && layout.focus !== 'customizer' ? 'opacity-0' : ''}
                  ${layout.mode === 'single' ? `absolute-fill` : ''}
                `} style={getPanelStyle('customizer')} />
                <ViewerPanel className={layout.mode === 'single' ? `absolute-fill` : ''} style={getPanelStyle('viewer')} />
                <EditorPanel className={`
                  opacity-animated
                  ${layout.mode === 'single' && layout.focus !== 'editor' ? 'opacity-0' : ''}
                  ${layout.mode === 'single' ? 'absolute-fill' : ''}
                `} style={getPanelStyle('editor')} />
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
