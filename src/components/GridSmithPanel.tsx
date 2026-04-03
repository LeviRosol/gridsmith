import React, { CSSProperties, useContext } from 'react';
import { ModelContext } from './contexts.ts';
import { GRIDSMITH_CELL_MM, OPENFORGE_CELL_MM } from '../state/initial-state.ts';
import { Fieldset } from 'primereact/fieldset';
import { InputNumber } from 'primereact/inputnumber';
import { Slider } from 'primereact/slider';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';

const BASE_DEFAULTS = {
  rows: 2,
  cols: 2,
  cell: GRIDSMITH_CELL_MM,
  gap: 0.2,
  wall: 1,
  ext_wall_pct: 0.5,
  height: 3.2,
  underlay_thick: 0.6,
  shelf_height: 1.0,
  shelf_width: 1.0,
  shelf_thick: 1.6,
};

const TILE_TYPE_OPTIONS = [
  { label: 'GridSmith', value: GRIDSMITH_CELL_MM },
  { label: 'OpenForge', value: OPENFORGE_CELL_MM },
];

type BaseDefaultsKey = keyof typeof BASE_DEFAULTS;

function getVarValue(vars: { [k: string]: any } | undefined, key: BaseDefaultsKey) {
  const raw = vars?.[key];
  return typeof raw === 'number' ? raw : BASE_DEFAULTS[key];
}

function computePlateSize(vars: { [k: string]: any } | undefined) {
  const rows = getVarValue(vars, 'rows');
  const cols = getVarValue(vars, 'cols');
  const cell = getVarValue(vars, 'cell');
  const wall = getVarValue(vars, 'wall');
  const ext_wall_pct = getVarValue(vars, 'ext_wall_pct');

  const plate_w = cols * cell + (cols + 1) * wall - wall * ext_wall_pct;
  const plate_d = rows * cell + (rows + 1) * wall - wall * ext_wall_pct;

  return {
    width: Number(plate_w.toFixed(1)),
    depth: Number(plate_d.toFixed(1)),
  };
}

/** Small plate: both edges under 200 mm. Large: any edge over 340 mm. Mid: between. */
function plateSizeMessageSeverity(
  width: number,
  depth: number,
): 'success' | 'warn' | 'error' {
  if (width > 340 || depth > 340) return 'error';
  if (width < 200 && depth < 200) return 'success';
  return 'warn';
}

export default function GridSmithPanel({ className, style }: { className?: string; style?: CSSProperties }) {
  const model = useContext(ModelContext);
  if (!model) throw new Error('No model');

  const state = model.state;
  const vars = state.params.vars ?? {};

  const TILE_BUILDER_SCAD_PATH = '/tile_builder.scad';

  const handleChange = (key: BaseDefaultsKey, value: number | null | undefined) => {
    if (value == null || Number.isNaN(value)) {
      model.setVar(key, BASE_DEFAULTS[key]);
    } else {
      model.setVar(key, value);
    }
  };

  const handleTileTypeChange = (cell: number) => {
    const rib_enabled = cell === GRIDSMITH_CELL_MM;
    model.mutate((s) => {
      s.params.vars = {
        ...(s.params.vars ?? {}),
        cell,
        rib_enabled,
      };
    });
    if (model.state.params.activePath === TILE_BUILDER_SCAD_PATH) return;
    void model.render({ isPreview: true, now: false });
  };

  const applyPreset = (values: Partial<typeof BASE_DEFAULTS>) => {
    (Object.keys(values) as BaseDefaultsKey[]).forEach((k) => {
      const v = values[k];
      if (typeof v === 'number') {
        model.setVar(k, v);
      }
    });
  };

  const currentSize = computePlateSize(vars);
  const plateSizeSeverity = plateSizeMessageSeverity(currentSize.width, currentSize.depth);

  const basicInputs = (
    <div className="flex flex-column gap-3">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        <label style={{ fontWeight: 600 }}>Presets</label>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <Button
            label="2×2"
            size="small"
            onClick={() => applyPreset({ rows: 2, cols: 2 })}
          />
          <Button
            label="4×4"
            size="small"
            onClick={() => applyPreset({ rows: 4, cols: 4 })}
          />
          <Button
            label="6×6"
            size="small"
            onClick={() => applyPreset({ rows: 6, cols: 6 })}
          />
          <Button
            label="Hallway"
            size="small"
            onClick={() => applyPreset({ rows: 2, cols: 6 })}
          />
        </div>
      </div>

      <LabeledNumber
        label="Rows"
        value={getVarValue(vars, 'rows')}
        min={1}
        max={15}
        step={1}
        onChange={(v) => handleChange('rows', v)}
      />
      <LabeledNumber
        label="Columns"
        value={getVarValue(vars, 'cols')}
        min={1}
        max={15}
        step={1}
        onChange={(v) => handleChange('cols', v)}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
        }}
      >
        <label style={{ fontWeight: 600, flexShrink: 0 }}>Tile Type</label>
        <Dropdown
          value={getVarValue(vars, 'cell')}
          options={TILE_TYPE_OPTIONS}
          onChange={(e) => {
            const v = e.value;
            if (typeof v !== 'number' || Number.isNaN(v)) return;
            handleTileTypeChange(v);
          }}
          style={{ width: '60%' }}
        />
      </div>

      <Message
        severity={plateSizeSeverity}
        className="w-full mt-2"
        pt={{
          icon: { className: 'hidden', 'aria-hidden': true },
          text: {
            style: { fontSize: '0.75rem', lineHeight: 1.35 },
          },
        }}
        text={
          <>
            <span className="font-semibold block mb-1">Approximate plate size</span>
            <span className="block">
              Width: {currentSize.width} mm · Depth: {currentSize.depth} mm
            </span>
          </>
        }
      />
    </div>
  );

  const advancedInputs = (
    <div className="flex flex-column gap-3">
      <LabeledNumber
        label="Fit Tolerance / Gap (mm)"
        value={getVarValue(vars, 'gap')}
        min={0}
        max={1}
        step={0.05}
        onChange={(v) => handleChange('gap', v)}
      />
      <LabeledNumber
        label="Interior Wall Thickness (mm)"
        value={getVarValue(vars, 'wall')}
        min={0.4}
        max={3}
        step={0.1}
        onChange={(v) => handleChange('wall', v)}
      />
      <LabeledNumber
        label="Exterior Wall Scale"
        value={getVarValue(vars, 'ext_wall_pct')}
        min={0.25}
        max={1}
        step={0.05}
        onChange={(v) => handleChange('ext_wall_pct', v)}
      />
      <LabeledNumber
        label="Base Height (mm)"
        value={getVarValue(vars, 'height')}
        min={1}
        max={5}
        step={0.25}
        onChange={(v) => handleChange('height', v)}
      />
      <LabeledNumber
        label="Underlay Thickness (mm)"
        value={getVarValue(vars, 'underlay_thick')}
        min={0.2}
        max={1.2}
        step={0.1}
        onChange={(v) => handleChange('underlay_thick', v)}
      />
      <LabeledNumber
        label="Shelf Height (mm below top)"
        value={getVarValue(vars, 'shelf_height')}
        min={0.5}
        max={3}
        step={0.1}
        onChange={(v) => handleChange('shelf_height', v)}
      />
      <LabeledNumber
        label="Shelf Width (mm)"
        value={getVarValue(vars, 'shelf_width')}
        min={0.5}
        max={3}
        step={0.1}
        onChange={(v) => handleChange('shelf_width', v)}
      />
      <LabeledNumber
        label="Shelf Thickness (mm)"
        value={getVarValue(vars, 'shelf_thick')}
        min={0.8}
        max={3}
        step={0.1}
        onChange={(v) => handleChange('shelf_thick', v)}
      />
    </div>
  );

  return (
    <div
      className={`params-slider params-slider-compact ${className ?? ''}`}
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
        legend="Baseplate"
        toggleable={false}
        style={{ margin: '5px 10px 5px 10px', backgroundColor: 'rgba(255,255,255,0.4)' }}
      >
        {basicInputs}
      </Fieldset>
      {/* Advanced settings temporarily hidden; keep code for future use */}
    </div>
  );
}

function LabeledNumber({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number | null | undefined) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <label
          style={{
            flex: 1,
            fontWeight: 600,
          }}
        >
          {label}
        </label>
        <InputNumber
          value={value}
          min={min}
          max={max}
          step={step}
          showButtons
          size={5}
          onValueChange={(e) => onChange(e.value)}
        />
      </div>
      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.value as number)}
        style={{
          margin: '0 0.5rem',
        }}
      />
    </div>
  );
}

