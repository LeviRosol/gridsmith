import React, { CSSProperties, useContext, useEffect, useState } from 'react';
import { ModelContext } from './contexts.ts';
import { Fieldset } from 'primereact/fieldset';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { SelectButton } from 'primereact/selectbutton';
import { Dialog } from 'primereact/dialog';

const TILE_SET_OPTIONS = [{ label: 'Tavern', value: 'tavern' }];

const RESOLUTION_OPTIONS = [
  { label: 'Low', value: 64 },
  { label: 'Med', value: 128 },
  { label: 'High', value: 256 },
];

const FLOOR_TYPE_OPTIONS = [
  { label: 'Floor', value: 'floor' },
  { label: 'Trapdoor', value: 'trapdoor' },
];

const FLAT_WALL_TYPE_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Wall', value: 'wall' },
  { label: 'Door', value: 'door' },
];

const FLAT_WALL_SIDEBAR_ROWS = [
  { sideLabel: 'North Wall', useKey: 'use_north_wall' as const, typeKey: 'north_wall_type' as const },
  { sideLabel: 'East Wall', useKey: 'use_east_wall' as const, typeKey: 'east_wall_type' as const },
  { sideLabel: 'South Wall', useKey: 'use_south_wall' as const, typeKey: 'south_wall_type' as const },
  { sideLabel: 'West Wall', useKey: 'use_west_wall' as const, typeKey: 'west_wall_type' as const },
];

function flatWallSegmentDropdownValue(useWall: boolean, wallType: string): 'none' | 'wall' | 'door' {
  if (!useWall) return 'none';
  return wallType === 'door' ? 'door' : 'wall';
}

const CURVED_WALL_TYPE_OPTIONS = [
  { label: 'Wall', value: 'curved_wall' },
  { label: 'Door', value: 'curved_door' },
];

const SIDE_WALL_TYPE_KEYS = [
  'north_wall_type',
  'east_wall_type',
  'south_wall_type',
  'west_wall_type',
] as const;

/** Map any prior value to curved dropdown values (no flat `wall` / `door` left). */
function tileWallTypeToCurved(t: unknown): string {
  if (t === 'door' || t === 'curved_door') return 'curved_door';
  return 'curved_wall';
}

/** Map any prior value to flat dropdown values (no `curved_*` left). */
function tileWallTypeToFlat(t: unknown): string {
  if (t === 'curved_door' || t === 'door') return 'door';
  return 'wall';
}

const WALL_PROFILE_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Flat', value: 'flat' },
  { label: 'Curved', value: 'curved' },
];

type WallProfile = 'none' | 'flat' | 'curved';

const DEFAULTS: {
  tile_set: string;
  resolution: number;
  use_floor: boolean;
  floor_type: string;
  wall_profile: WallProfile;
  use_north_wall: boolean;
  north_wall_type: string;
  use_east_wall: boolean;
  east_wall_type: string;
  use_south_wall: boolean;
  south_wall_type: string;
  use_west_wall: boolean;
  west_wall_type: string;
} = {
  tile_set: 'tavern',
  resolution: 64,
  use_floor: true,
  floor_type: 'floor',
  wall_profile: 'none',
  use_north_wall: false,
  north_wall_type: 'wall',
  use_east_wall: false,
  east_wall_type: 'wall',
  use_south_wall: false,
  south_wall_type: 'wall',
  use_west_wall: false,
  west_wall_type: 'wall',
};

type TileVarKey = keyof typeof DEFAULTS;

function getVar<K extends TileVarKey>(vars: { [k: string]: any } | undefined, key: K): (typeof DEFAULTS)[K] {
  const v = vars?.[key];
  if (v === undefined || v === null) return DEFAULTS[key];
  return v as (typeof DEFAULTS)[K];
}

export default function TileBuilderPanel({ className, style }: { className?: string; style?: CSSProperties }) {
  const model = useContext(ModelContext);
  if (!model) throw new Error('No model');
  const [activeTabIndex, setActiveTabIndex] = useState<number | number[]>(0);
  const [proTierResolutionDialogVisible, setProTierResolutionDialogVisible] = useState(false);

  const state = model.state;
  const vars = state.params.vars ?? {};
  const wallProfile = getVar(vars, 'wall_profile');
  const useFloorEnabled = getVar(vars, 'use_floor') === true;
  const useNorthWallEnabled = getVar(vars, 'use_north_wall') === true;
  const useEastWallEnabled = getVar(vars, 'use_east_wall') === true;
  const useSouthWallEnabled = getVar(vars, 'use_south_wall') === true;
  const useWestWallEnabled = getVar(vars, 'use_west_wall') === true;
  const wallsProfileActive = wallProfile !== 'none';
  const anyWallEnabled =
    useNorthWallEnabled || useEastWallEnabled || useSouthWallEnabled || useWestWallEnabled;
  const nothingToPreview = !useFloorEnabled && (!wallsProfileActive || !anyWallEnabled);

  const setVar = (key: TileVarKey, value: unknown) => {
    model.setVar(key, value);
  };

  useEffect(() => {
    if (wallProfile === 'curved' && !useNorthWallEnabled) {
      setVar('use_north_wall', true);
    }
  }, [wallProfile, useNorthWallEnabled]);

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
        legend="Tile builder"
        toggleable={false}
        style={{ margin: '5px 10px 5px 10px', backgroundColor: 'rgba(255,255,255,0.4)' }}
      >
        <Accordion
          activeIndex={activeTabIndex}
          onTabChange={(e) => setActiveTabIndex(e.index)}
        >
          <AccordionTab header="Core">
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
                  onChange={(e) => {
                    const next = e.value as number;
                    setVar('resolution', next);
                    if (next !== 64) {
                      setProTierResolutionDialogVisible(true);
                    }
                  }}
                  style={{ width: '60%' }}
                />
            </div>

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
                <label style={{ fontWeight: 600, flexShrink: 0 }}>Tile Set</label>
                <Dropdown
                  value={getVar(vars, 'tile_set')}
                  options={TILE_SET_OPTIONS}
                  onChange={(e) => setVar('tile_set', e.value)}
                  style={{ width: '60%' }}
                />
              </div>
            </div>
          </AccordionTab>

          <AccordionTab header="Floor">
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
                <label htmlFor="tile-use-floor" style={{ fontWeight: 600 }}>
                  Show Floor
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
                  disabled={!useFloorEnabled}
                  style={{ width: '60%' }}
                />
              </div>
            </div>
          </AccordionTab>

          <AccordionTab header="Walls">
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
                <label style={{ fontWeight: 600, flexShrink: 0 }}>Wall style</label>
                <SelectButton
                  value={getVar(vars, 'wall_profile')}
                  options={WALL_PROFILE_OPTIONS}
                  onChange={(e) => {
                    const v = e.value as WallProfile;
                    setVar('wall_profile', v);
                    if (v === 'curved') {
                      for (const k of SIDE_WALL_TYPE_KEYS) {
                        setVar(k, tileWallTypeToCurved(vars[k]));
                      }
                      setVar('use_east_wall', false);
                      setVar('use_south_wall', false);
                      setVar('use_west_wall', false);
                      setVar('use_north_wall', true);
                    } else if (v === 'flat') {
                      for (const k of SIDE_WALL_TYPE_KEYS) {
                        setVar(k, tileWallTypeToFlat(vars[k]));
                      }
                    }
                  }}
                  allowEmpty={false}
                />
              </div>

              {wallProfile === 'curved' && (
                <div
                  style={{
                    border: '1px solid rgba(128,128,128,0.35)',
                    borderRadius: '8px',
                    padding: '0.65rem',
                  }}
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
                      <label style={{ fontWeight: 600, flexShrink: 0 }}>Type</label>
                      <Dropdown
                        value={getVar(vars, 'north_wall_type')}
                        options={CURVED_WALL_TYPE_OPTIONS}
                        onChange={(e) => setVar('north_wall_type', e.value)}
                        style={{ width: '60%' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {wallProfile === 'flat' && (
                <div
                  style={{
                    border: '1px solid rgba(128,128,128,0.35)',
                    borderRadius: '8px',
                    padding: '0.65rem',
                  }}
                >
                  <div className="flex flex-column gap-3">
                    {FLAT_WALL_SIDEBAR_ROWS.map(({ sideLabel, useKey, typeKey }) => (
                      <div
                        key={useKey}
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                        }}
                      >
                        <label style={{ fontWeight: 600, flexShrink: 0 }}>{sideLabel}</label>
                        <Dropdown
                          value={flatWallSegmentDropdownValue(
                            getVar(vars, useKey) === true,
                            String(getVar(vars, typeKey)),
                          )}
                          options={FLAT_WALL_TYPE_OPTIONS}
                          onChange={(e) => {
                            const val = e.value as 'none' | 'wall' | 'door';
                            if (val === 'none') {
                              setVar(useKey, false);
                            } else {
                              setVar(useKey, true);
                              setVar(typeKey, val);
                            }
                          }}
                          style={{ width: '60%' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </AccordionTab>
        </Accordion>

        <Button
          type="button"
          label={state.previewing ? 'Previewing…' : 'Preview'}
          icon="pi pi-eye"
          className="p-button-sm"
          onClick={() => model.render({ isPreview: true, now: true })}
          disabled={state.previewing || state.rendering || nothingToPreview}
          style={{ alignSelf: 'stretch', marginTop: '0.75rem' }}
        />
      </Fieldset>

      <Dialog
        header="Medium & High resolution"
        visible={proTierResolutionDialogVisible}
        modal
        dismissableMask
        closable
        onHide={() => {
          setProTierResolutionDialogVisible(false);
        }}
        style={{ width: 'min(96vw, 440px)' }}
        footer={
          <div className="flex flex-row gap-2 justify-content-end flex-wrap">
            <Button
              type="button"
              label="Not Now"
              className="p-button-outlined"
              onClick={() => {
                setProTierResolutionDialogVisible(false);
              }}
            />
            <Button
              type="button"
              label="Sign Me Up!"
              icon="pi pi-arrow-right"
              iconPos="right"
              severity="success"
              onClick={() => {
                setProTierResolutionDialogVisible(false);
                window.location.pathname = '/tiles';
              }}
            />
          </div>
        }
      >
        <p style={{ margin: 0, lineHeight: 1.55 }}>
          As a free tool, you are able to generate as many low resolution tiles as your heart desires. To gain access to
          Medium and High resolution models, you will need to be a Pro Member.
        </p>
      </Dialog>
    </div>
  );
}
