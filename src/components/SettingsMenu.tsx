// Portions of this file are Copyright 2021 Google LLC, and licensed under GPL2+. See COPYING.

import { CSSProperties, useContext, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';
import { MenuItem } from 'primereact/menuitem';
import { Menu } from 'primereact/menu';
import { ModelContext } from './contexts.ts';
import { isInStandaloneMode } from '../utils.ts';
import { confirmDialog } from 'primereact/confirmdialog';
import { useAuth } from './AuthContext';

export default function SettingsMenu({className, style}: {className?: string, style?: CSSProperties}) {
  const model = useContext(ModelContext);
  if (!model) throw new Error('No model');
  const state = model.state;
  const auth = useAuth();

  const settingsMenu = useRef<Menu>(null);

  useEffect(() => {
    if (auth.loading) return;
    if (auth.isAdmin) return;

    const layout: any = state.view.layout;
    const editorVisible =
      (layout.mode === 'single' && layout.focus === 'editor') ||
      (layout.mode === 'multi' && (layout.editor === true || layout.showEditor === true));

    if (!editorVisible) return;

    model.mutate((s) => {
      s.view.layout = {
        mode: 'multi',
        editor: false,
        baseplate: true,
        customizer: true,
        showEditor: false,
      } as any;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.loading, auth.isAdmin]);

  return (
    <>
      <Menu model={[
        ...(auth.isAdmin ? [{
          label: (state.view as any).layout.showEditor ? 'Hide code editor' : 'Show code editor',
          icon: 'pi pi-code',
          command: () => model.mutate(s => {
            const currentlyShown = (s.view as any).layout.showEditor;
            if (!currentlyShown) {
              // When turning the editor on, switch to single-panel mode focused on the editor.
              s.view.layout = {
                mode: 'single',
                showEditor: true,
                focus: 'editor',
              } as any;
            } else {
              // When hiding the editor, return to the default multi-panel layout.
              s.view.layout = {
                mode: 'multi',
                editor: false,
                baseplate: true,
                customizer: true,
                showEditor: false,
              } as any;
            }
          }),
        }] : []),
        {
          separator: true
        },
        ...(isInStandaloneMode() ? [
          {
            separator: true
          },  
          {
            label: 'Clear local storage',
            icon: 'pi pi-list',
            // disabled: true,
            command: () => {
              confirmDialog({
                message: "This will clear all the edits you've made and files you've created in this playground " +
                  "and will reset it to factory defaults. " +
                  "Are you sure you wish to proceed? (you might lose your models!)",
                header: 'Clear local storage',
                icon: 'pi pi-exclamation-triangle',
                accept: () => {
                  localStorage.clear();
                  location.reload();
                },
                acceptLabel: `Clear all files!`,
                rejectLabel: 'Cancel'
              });
            },
          },
        ] : []),
      ] as MenuItem[]} popup ref={settingsMenu} />
    
      <Button title="Settings menu"
          style={style}
          className={className}
          rounded
          text
          icon="pi pi-cog"
          onClick={(e) => settingsMenu.current && settingsMenu.current.toggle(e)} />
    </>
  );
}