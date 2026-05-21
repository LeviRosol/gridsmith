import React, { CSSProperties, useContext, useEffect, useRef, useState } from 'react';
import { ModelContext } from './contexts.ts';
import { useTileCart } from '../cart/TileCartContext';
import { isTileBuilderProTierResolution } from '../utils.ts';
import { fetchTilePackContent } from '../data/tilePackContent';
import { loadTilePackCatalog } from '../data/tilePackCatalog';
import type { TileSetCatalogItem } from '../data/placeholderTileSets';
import { tileSetVarForCatalogSlug } from '../tileBuilder/tileBuilderProAccess';
import { Fieldset } from 'primereact/fieldset';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { SelectButton } from 'primereact/selectbutton';
import { Dialog } from 'primereact/dialog';

type TileSetDropdownOption = { label: string; value: string };

/** True when tile builder has floor or at least one wall segment to preview. */
function tileBuilderCanAutoPreview(vars: { [k: string]: unknown } | undefined): boolean {
  const v = vars ?? {};
  const wallsAllowed = v.wall_profile != null && v.wall_profile !== 'none';
  const anyWall =
    wallsAllowed &&
    (v.use_north_wall === true ||
      v.use_east_wall === true ||
      v.use_south_wall === true ||
      v.use_west_wall === true);
  return v.use_floor === true || anyWall;
}

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
  curved_wall_mirror: boolean;
} = {
  tile_set: 'tavern',
  resolution: 64,
  use_floor: true,
  floor_type: 'floor',
  wall_profile: 'flat',
  use_north_wall: true,
  north_wall_type: 'wall',
  use_east_wall: false,
  east_wall_type: 'wall',
  use_south_wall: false,
  south_wall_type: 'wall',
  use_west_wall: false,
  west_wall_type: 'wall',
  curved_wall_mirror: false,
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
  const tileCart = useTileCart();
  const [activeTabIndex, setActiveTabIndex] = useState<number[]>([0]);
  const [proTierResolutionDialogVisible, setProTierResolutionDialogVisible] = useState(false);
  /** Tile sets offered in the builder: catalog slug → SCAD `tile_set`, gated by `builderEnabled` in `public/tile-packs/<slug>.json`. */
  const [tileSetDropdownOptions, setTileSetDropdownOptions] = useState<TileSetDropdownOption[]>([
    { label: 'Tavern', value: 'tavern' },
  ]);
  const [tileSetDropdownLoaded, setTileSetDropdownLoaded] = useState(false);
  /** Tracks entitlement-ready so we can run one auto-preview after Stripe/catalog resolve (Med/High no longer blocked). */
  const lastEntitlementReadyRef = useRef<boolean | null>(null);
  /** Per SCAD `tile_set`: auto-bump resolution 64 → 256 once when user becomes entitled for that set. */
  const defaultHighAppliedRef = useRef<Record<string, boolean>>({});

  const state = model.state;
  const vars = state.params.vars ?? {};
  const tileSetKey = getVar(vars, 'tile_set');
  const wallProfile = getVar(vars, 'wall_profile');
  const useNorthWallEnabled = getVar(vars, 'use_north_wall') === true;
  const useEastWallEnabled = getVar(vars, 'use_east_wall') === true;
  const useSouthWallEnabled = getVar(vars, 'use_south_wall') === true;
  const useWestWallEnabled = getVar(vars, 'use_west_wall') === true;
  const wallsProfileActive = wallProfile !== 'none';
  const anyWallEnabled =
    useNorthWallEnabled || useEastWallEnabled || useSouthWallEnabled || useWestWallEnabled;
  const nothingToPreview =
    getVar(vars, 'use_floor') !== true && (!wallsProfileActive || !anyWallEnabled);

  const setVar = (key: TileVarKey, value: unknown) => {
    model.setVar(key, value);
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const catalog = await loadTilePackCatalog();
      if (cancelled) return;
      const mapped = catalog
        .map((item: TileSetCatalogItem) => {
          const tileVar = tileSetVarForCatalogSlug(item.slug);
          return tileVar ? { item, tileVar } : null;
        })
        .filter((x): x is { item: TileSetCatalogItem; tileVar: string } => x != null);

      const resolved = await Promise.all(
        mapped.map(async ({ item, tileVar }) => {
          const content = await fetchTilePackContent(item.slug);
          if (content?.builderEnabled !== true) return null;
          const displayName = content.builderTileSetName?.trim();
          const label = displayName && displayName.length > 0 ? displayName : item.name;
          return { label, value: tileVar, order: item.order };
        }),
      );
      const next = resolved
        .filter((x): x is { label: string; value: string; order: number } => x != null)
        .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
        .map(({ label, value }) => ({ label, value }));
      if (cancelled) return;
      setTileSetDropdownOptions(next.length > 0 ? next : [{ label: 'Tavern', value: 'tavern' }]);
      setTileSetDropdownLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!tileSetDropdownLoaded) return;
    const cur = getVar(vars, 'tile_set');
    if (tileSetDropdownOptions.some((o) => o.value === cur)) return;
    if (tileSetDropdownOptions.length > 0) {
      model.setVar('tile_set', tileSetDropdownOptions[0]!.value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tileSetDropdownLoaded, tileSetDropdownOptions, vars.tile_set, model]);

  // Floor is always on in the builder (Show Floor control removed).
  useEffect(() => {
    if (getVar(vars, 'use_floor') !== true) {
      model.setVar('use_floor', true);
    }
  }, [model, vars.use_floor]);

  useEffect(() => {
    if (wallProfile !== 'curved') return;
    const mirror = getVar(vars, 'curved_wall_mirror') === true;
    if (mirror) {
      if (useNorthWallEnabled) setVar('use_north_wall', false);
      if (!useEastWallEnabled) setVar('use_east_wall', true);
    } else {
      if (useEastWallEnabled) setVar('use_east_wall', false);
      if (!useNorthWallEnabled) setVar('use_north_wall', true);
    }
  }, [wallProfile, useNorthWallEnabled, useEastWallEnabled, vars.curved_wall_mirror]);

  // Default purchasers to High (256) once per tile set while resolution is still Low (64).
  useEffect(() => {
    if (!tileCart.tileBuilderProEntitlementReady) return;
    if (!tileCart.tileBuilderProEntitledForTileSet(tileSetKey)) return;
    if (getVar(vars, 'resolution') !== 64) return;
    if (defaultHighAppliedRef.current[tileSetKey]) return;
    defaultHighAppliedRef.current[tileSetKey] = true;
    model.setVar('resolution', 256);
    if (tileBuilderCanAutoPreview(model.state.params.vars)) {
      void model.render({ isPreview: true, now: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tileCart.tileBuilderProEntitlementReady,
    tileCart.tileBuilderProEntitledForTileSet,
    tileSetKey,
    vars.resolution,
    model,
  ]);

  // After Stripe/catalog finish, entitlement flips false → true; re-run preview so Med/High + default High are not stuck blank.
  useEffect(() => {
    const ready = tileCart.tileBuilderProEntitlementReady;
    if (!ready) {
      lastEntitlementReadyRef.current = false;
      return;
    }
    const prev = lastEntitlementReadyRef.current;
    lastEntitlementReadyRef.current = true;
    if (prev !== false) return;
    const v = model.state.params.vars ?? {};
    if (!tileBuilderCanAutoPreview(v)) return;
    void model.render({ isPreview: true, now: true });
  }, [
    model,
    tileCart.tileBuilderProEntitlementReady,
    tileCart.tileBuilderProEntitledForTileSet,
  ]);

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
          multiple
          activeIndex={activeTabIndex}
          onTabChange={(e) => {
            const idx = e.index;
            setActiveTabIndex(Array.isArray(idx) ? idx : idx == null ? [] : [idx]);
          }}
        >
          <AccordionTab header="Core">
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
                  options={tileSetDropdownOptions}
                  loading={!tileSetDropdownLoaded}
                  onChange={(e) => setVar('tile_set', e.value)}
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
                <label style={{ fontWeight: 600, flexShrink: 0 }}>Resolution</label>
                <Dropdown
                  value={getVar(vars, 'resolution')}
                  options={RESOLUTION_OPTIONS}
                  onChange={(e) => {
                    const next = e.value as number;
                    setVar('resolution', next);
                    if (
                      next !== 64 &&
                      tileCart.tileBuilderProEntitlementReady &&
                      !tileCart.tileBuilderProEntitledForTileSet(tileSetKey)
                    ) {
                      setProTierResolutionDialogVisible(true);
                    }
                  }}
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
                <label style={{ fontWeight: 600, flexShrink: 0 }}>Floor type</label>
                <Dropdown
                  value={getVar(vars, 'floor_type')}
                  options={FLOOR_TYPE_OPTIONS}
                  onChange={(e) => setVar('floor_type', e.value)}
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
                      setVar('use_south_wall', false);
                      setVar('use_west_wall', false);
                      const mirror = getVar(vars, 'curved_wall_mirror') === true;
                      if (mirror) {
                        setVar('use_north_wall', false);
                        setVar('use_east_wall', true);
                      } else {
                        setVar('use_east_wall', false);
                        setVar('use_north_wall', true);
                      }
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
                        onChange={(e) => {
                          const val = e.value;
                          setVar('north_wall_type', val);
                          if (getVar(vars, 'curved_wall_mirror') === true) {
                            setVar('east_wall_type', val);
                          }
                        }}
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
                      <label htmlFor="tile-curved-mirror" style={{ fontWeight: 600 }}>
                        Mirror
                      </label>
                      <Checkbox
                        inputId="tile-curved-mirror"
                        checked={getVar(vars, 'curved_wall_mirror')}
                        onChange={(e) => {
                          const checked = e.checked ?? false;
                          setVar('curved_wall_mirror', checked);
                          if (checked) {
                            setVar('use_north_wall', false);
                            setVar('use_east_wall', true);
                            setVar('east_wall_type', getVar(vars, 'north_wall_type'));
                          } else {
                            setVar('use_east_wall', false);
                            setVar('use_north_wall', true);
                          }
                        }}
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

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            width: '100%',
            marginTop: '0.75rem',
          }}
        >
          <Button
            type="button"
            label={state.previewing ? 'Previewing…' : 'Preview'}
            icon="pi pi-eye"
            className="p-button-sm"
            onClick={() => {
              void model.render({ isPreview: true, now: true });
            }}
            disabled={state.previewing || state.rendering || nothingToPreview}
          />
        </div>
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
              label="Browse tile packs"
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
          Medium and High resolution models, you will need to purchase that Tile Set, and then return to this page.
        </p>
      </Dialog>
    </div>
  );
}
