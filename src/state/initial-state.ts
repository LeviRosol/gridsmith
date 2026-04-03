// Portions of this file are Copyright 2021 Google LLC, and licensed under GPL2+. See COPYING.

import defaultScad from './default-scad.ts';
import { State } from './app-state.ts';

export const defaultSourcePath = '/baseplate.scad';
export const defaultModelColor = '#f9d72c';

/**
 * Monotonic revision of the bundled `/baseplate.scad` text from `default-scad.ts`.
 * Persisted sessions store SCAD in the URL hash; when this value increases, the app
 * replaces that embedded copy with the current bundle (`refreshBundledBaseplateSourceIfStale`).
 *
 * **Whenever you change `default-scad.ts`, increment this number in the same change** so
 * users and saved links pick up the new geometry. Future agents: treat this as required.
 */
export const BASEPLATE_TEMPLATE_REVISION = 1;

const defaultBlurhash = "|KSPX^%3~qtjMx$lR*x]t7n,R%xuxbM{WBt7ayfk_3bY9FnAt8XOxanjNF%fxbMyIn%3t7NFoLaeoeV[WBo{xar^IoS1xbxcR*S0xbofRjV[j[kCNGofxaWBNHW-xasDR*WTkBxuWBM{s:t7bYahRjfkozWUadofbIW:jZ";

function refreshBundledBaseplateSourceIfStale(s: State) {
  const src0 = s.params.sources?.[0];
  if (!src0 || src0.path !== defaultSourcePath || src0.url) return;
  if (s.params.baseplateTemplateRevision === BASEPLATE_TEMPLATE_REVISION) return;
  src0.content = defaultScad;
  s.params.baseplateTemplateRevision = BASEPLATE_TEMPLATE_REVISION;
}

export function createInitialState(state: State | null, source?: {content?: string, path?: string, url?: string, blurhash?: string}): State {

  type Mode = State['view']['layout']['mode'];

  const mode: Mode = window.matchMedia("(min-width: 768px)").matches
    ? 'multi' : 'single';

  let initialState: State;
  if (state) {
    if (source) throw new Error('Cannot provide source when state is provided');
    initialState = state;
  } else {
    let content, path, url, blurhash;
    if (source) {
      content = source.content;
      path = source.path;
      url = source.url;
      blurhash = source.blurhash;
    } else {
      content = defaultScad;
      path = defaultSourcePath;
      blurhash = defaultBlurhash;
    }
    let activePath = path ?? (url && new URL(url).pathname.split('/').pop()) ?? defaultSourcePath;
    initialState = {
      params: {
        activePath,
        sources: [{path: activePath, content, url}],
        baseplateTemplateRevision:
          activePath === defaultSourcePath && !url ? BASEPLATE_TEMPLATE_REVISION : undefined,
        features: [],
        exportFormat2D: 'svg',
        exportFormat3D: 'stl',
        vars: {
          rows: 2,
          cols: 2,
          cell: 30.4,
          gap: 0.2,
          wall: 1,
          ext_wall_pct: 0.5,
          height: 3,
          underlay_thick: 0.6,
          shelf_height: 1.0,
          shelf_width: 1.0,
          shelf_thick: 1.6,
        },
      },
      view: {
        layout: {
          mode: 'multi',
          editor: false,
          baseplate: true,
          customizer: true,
          showEditor: false,
        } as any,

        color: defaultModelColor,
      },
      preview: blurhash ? {blurhash} : undefined,
    };
  }

  if (initialState.view.layout.mode != mode) {
    if (mode === 'multi' && initialState.view.layout.mode === 'single') {
      initialState.view.layout = {
        mode,
        editor: true,
        baseplate: true,
        customizer: initialState.view.layout.focus == 'customizer'
      }
    } else if (mode === 'single' && initialState.view.layout.mode === 'multi') {
      initialState.view.layout = {
        mode,
        focus: initialState.view.layout.baseplate ? 'baseplate'
          : initialState.view.layout.customizer ? 'customizer'
          : 'editor'
      }
    }
  }

  // fs.writeFile(initialState.params.sourcePath, initialState.params.source);
  // if (initialState.params.sourcePath !== defaultSourcePath) {
  //   fs.writeFile(defaultSourcePath, defaultScad);
  // }

  refreshBundledBaseplateSourceIfStale(initialState);

  const defaultFeatures = ['lazy-union'];
  defaultFeatures.forEach(f => {
    if (initialState.params.features.indexOf(f) < 0)
    initialState.params.features.push(f);
  });

  return initialState;
}

export function getBlankProjectState() {
  return createInitialState(null, {
    path: defaultSourcePath,
    content: defaultScad,
  });
}
