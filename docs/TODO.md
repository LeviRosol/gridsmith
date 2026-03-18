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
- [x] **Remove Raw SCAD Editor:**
  - [x] Hide or de-emphasize the code editor panel.
  - [x] Make the parameter form the primary interface.
- [x] **Build Parameter Form (Left Panel):**
  - [x] **Basic Settings:**
    - [x] Rows (Integer)
    - [x] Columns (Integer)
    - [x] Cell Size (mm)
    - [x] Fit Tolerance / Gap (mm)
  - [ ] **Advanced Settings (Accordion/Collapsible):**
    - [ ] Interior Wall Thickness (mm)
    - [ ] Exterior Wall Scale (Factor)
    - [ ] Base Height (mm)
    - [ ] Underlay Thickness (mm)
    - [ ] Shelf Height (mm)
    - [ ] Shelf Width (mm)
    - [ ] Shelf Thickness (mm)
  - [x] **Presets:**
    - [x] Add support for presets (e.g., 2x2, 3x3, Hallway).
- [ ] **3D Preview (Right Panel):**
  - [ ] Implement OrbitControls.
  - [ ] ensure responsive render area.
  - [ ] Display dimensions (optional but recommended).

## 3. Engineering & Architecture (WASM & Export)
- [ ] **SCAD Generation:**
  - [ ] Implement a function to generate SCAD string dynamically from UI state values.
- [x] **WASM Integration:**
  - [x] Ensure OpenSCAD WASM runs entirely client-side.
  - [x] Hook parameter-driven variables into the existing runner pipeline.
- [x] **Export:**
  - [x] Implement browser-based STL export button.
  - [x] Verify STL output validity (and include baseplate parameters in the filename).

## 4. Branding & Polish
- [ ] **App Shell:**
  - [ ] Update header/title to "GridSmith".
  - [ ] Update tagline: "Build Your World. One Tile at a Time."
- [ ] **Cleanup:**
  - [ ] Remove unused "Playground" features (e.g., extensive examples menu, custom fonts if not needed).

## 5. Navigation & Pages
- [x] Implement pathname-based routing for `/`, `/viewer`, `/about`, `/tiles`, `/profile`, `/tos`.
- [x] Create stub pages for Home, About, Get Tiles, Profile, and Terms of Service.
- [x] Add a global site header and footer that appear on all routes.
- [x] Add footer navigation links for all routes.
- [x] Add a prominent "Build" button in the header that routes to `/viewer`.

## 6. Theming, Layout, and Presets
- [x] Implement dark/light mode toggle in the Account menu.
- [x] Dynamically load PrimeReact Lara Amber themes (dark/light) via `<link>` tag.
- [x] Implement a left slide-out customizer panel with a persistent hamburger/tab toggle.
- [x] Default axes visibility and expose a toggle in the config menu.
- [x] Add GridSmith baseplate presets (2x2, 4x4, 6x6, Hallway 2x6).

## 7. Future Work / Nice-to-Haves
- [ ] Make the code editor accessible only to admin/advanced roles (hide for normal users).
- [ ] Re-enable and design the "Advanced settings" section in the parameter panel.
- [ ] Flesh out About page copy and visuals.
- [ ] Flesh out Get Tiles page content and CTAs for future tile packs/tools.
- [ ] Replace the placeholder Terms of Service with actual legal content.
- [ ] Add additional GridSmith-specific presets and refine parameter ranges and labels.
