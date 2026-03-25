import React, { CSSProperties, useContext } from 'react';
import { ModelContext } from './contexts.ts';
import { Fieldset } from 'primereact/fieldset';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';

const RESOLUTION_OPTIONS = [
  { label: '64', value: 64 },
  { label: '128', value: 128 },
  { label: '256', value: 256 },
];

const FLOOR_TYPE_OPTIONS = [
  { label: 'Floor', value: 'floor' },
  { label: 'Trapdoor', value: 'trapdoor' },
];

const NORTH_WALL_TYPE_OPTIONS = [
  { label: 'Wall', value: 'wall' },
  { label: 'Curved wall', value: 'curved_wall' },
];

const DEFAULTS = {
  resolution: 256,
  use_floor: true,
  floor_type: 'floor',
  use_north_wall: true,
  north_wall_type: 'curved_wall',
} as const;

type TileVarKey = keyof typeof DEFAULTS;

function getVar<K extends TileVarKey>(vars: { [k: string]: any } | undefined, key: K): (typeof DEFAULTS)[K] {
  const v = vars?.[key];
  if (v === undefined || v === null) return DEFAULTS[key];
  return v as (typeof DEFAULTS)[K];
}

export default function TileBuilderPanel({ className, style }: { className?: string; style?: CSSProperties }) {
  const model = useContext(ModelContext);
  if (!model) throw new Error('No model');

  const vars = model.state.params.vars ?? {};

  const setVar = (key: TileVarKey, value: unknown) => {
    model.setVar(key, value);
  };

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '80vh',
        overflow: 'scroll',
        ...style,
        bottom: 'unset',
      }}
    >
      <Fieldset
        legend="Tile builder"
        toggleable={false}
        style={{ margin: '5px 10px 5px 10px', backgroundColor: 'rgba(255,255,255,0.4)' }}
      >
        <div className="flex flex-column gap-3">
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}
          >
            <label style={{ fontWeight: 600, flexShrink: 0 }}>Resolution</label>
            <Dropdown
              value={getVar(vars, 'resolution')}
              options={RESOLUTION_OPTIONS}
              onChange={(e) => setVar('resolution', e.value)}
              style={{ width: '60%' }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}
          >
            <label htmlFor="tile-use-floor" style={{ fontWeight: 600 }}>
              Use floor
            </label>
            <Checkbox
              inputId="tile-use-floor"
              checked={getVar(vars, 'use_floor')}
              onChange={(e) => setVar('use_floor', e.checked ?? false)}
            />
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}
          >
            <label style={{ fontWeight: 600, flexShrink: 0 }}>Floor type</label>
            <Dropdown
              value={getVar(vars, 'floor_type')}
              options={FLOOR_TYPE_OPTIONS}
              onChange={(e) => setVar('floor_type', e.value)}
              style={{ width: '60%' }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}
          >
            <label htmlFor="tile-use-north-wall" style={{ fontWeight: 600 }}>
              Use north wall
            </label>
            <Checkbox
              inputId="tile-use-north-wall"
              checked={getVar(vars, 'use_north_wall')}
              onChange={(e) => setVar('use_north_wall', e.checked ?? false)}
            />
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}
          >
            <label style={{ fontWeight: 600, flexShrink: 0 }}>North wall type</label>
            <Dropdown
              value={getVar(vars, 'north_wall_type')}
              options={NORTH_WALL_TYPE_OPTIONS}
              onChange={(e) => setVar('north_wall_type', e.value)}
              style={{ width: '60%' }}
            />
          </div>
        </div>
      </Fieldset>
    </div>
  );
}
