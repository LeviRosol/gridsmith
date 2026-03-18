# GridSmith Project TODOs

Based on `docs/gridsmith-context.md`.

## 1. OpenSCAD Script Refactoring (Immediate)
- [ ] **Refactor `axes.scad` / Base Script:**
  - [ ] Separate public parameters from derived values.
  - [ ] Rename variables for clarity (e.g., `ext_wall_pct` -> `ext_wall_scale`, `height` -> `plate_height`).
  - [ ] Create a template structure:
    1. Public Config
    2. Derived Dimensions
    3. Geometry Modules
    4. Final Call
  - [ ] Ensure geometry behavior remains unchanged during refactor.

## 2. UI/UX Transformation (React)
- [ ] **Remove Raw SCAD Editor:**
  - [ ] Hide or de-emphasize the code editor panel.
  - [ ] Make the parameter form the primary interface.
- [ ] **Build Parameter Form (Left Panel):**
  - [ ] **Basic Settings:**
    - [ ] Rows (Integer)
    - [ ] Columns (Integer)
    - [ ] Cell Size (mm)
    - [ ] Fit Tolerance / Gap (mm)
  - [ ] **Advanced Settings (Accordion/Collapsible):**
    - [ ] Interior Wall Thickness (mm)
    - [ ] Exterior Wall Scale (Factor)
    - [ ] Base Height (mm)
    - [ ] Underlay Thickness (mm)
    - [ ] Shelf Height (mm)
    - [ ] Shelf Width (mm)
    - [ ] Shelf Thickness (mm)
  - [ ] **Presets:**
    - [ ] Add support for presets (e.g., 2x2, 3x3, Hallway).
- [ ] **3D Preview (Right Panel):**
  - [ ] Implement OrbitControls.
  - [ ] ensure responsive render area.
  - [ ] Display dimensions (optional but recommended).

## 3. Engineering & Architecture (WASM & Export)
- [ ] **SCAD Generation:**
  - [ ] Implement a function to generate SCAD string dynamically from UI state values.
- [ ] **WASM Integration:**
  - [ ] Ensure OpenSCAD WASM runs entirely client-side.
  - [ ] Hook generated SCAD string into the existing runner pipeline.
- [ ] **Export:**
  - [ ] Implement browser-based STL export button.
  - [ ] Verify STL output validity.

## 4. Branding & Polish
- [ ] **App Shell:**
  - [ ] Update header/title to "GridSmith".
  - [ ] Update tagline: "Build Your World. One Tile at a Time."
- [ ] **Cleanup:**
  - [ ] Remove unused "Playground" features (e.g., extensive examples menu, custom fonts if not needed).
