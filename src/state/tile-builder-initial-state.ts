// Portions of this file are Copyright 2021 Google LLC, and licensed under GPL2+. See COPYING.

import { State } from './app-state.ts';
import tileBuilderScad from './tile-builder-scad.ts';
import { defaultModelColor } from './initial-state.ts';

const TILE_BUILDER_PATH = '/tile_builder.scad';

/** Session-only initial state for /tile-builder (not merged with URL fragment). */
export function createTileBuilderInitialState(): State {
  return {
    params: {
      activePath: TILE_BUILDER_PATH,
      sources: [{ path: TILE_BUILDER_PATH, content: tileBuilderScad }],
      features: ['lazy-union'],
      exportFormat2D: 'svg',
      exportFormat3D: 'stl',
      vars: {},
    },
    view: {
      layout: {
        mode: 'multi',
        editor: true,
        baseplate: true,
        customizer: true,
        showEditor: true,
      } as any,
      color: defaultModelColor,
    },
  };
}
