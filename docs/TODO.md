# GridSmith Project TODOs

Based on `docs/gridsmith-context.md`.

## 1. OpenSCAD Script & Parameters
- [ ] **Refactor baseplate script naming/structure:**
  - [ ] Separate public parameters from derived values.
  - [ ] Rename variables for clarity (e.g., `ext_wall_pct` -> `ext_wall_scale`, `height` -> `plate_height`).
  - [ ] Keep script/template structure explicit:
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
- [x] **3D Preview (Right Panel):**
  - [x] Orbit controls are available in the model viewer.
  - [x] Responsive render area and mobile behavior improved.
  - [ ] Display dimensions in-viewer (optional enhancement).

## 3. Engineering & Architecture (WASM & Export)
- [x] **SCAD Generation:**
  - [x] Parameter-driven values are wired into generation pipeline.
- [x] **WASM Integration:**
  - [x] Ensure OpenSCAD WASM runs entirely client-side.
  - [x] Hook parameter-driven variables into the existing runner pipeline.
- [x] **Export:**
  - [x] Implement browser-based STL export button.
  - [x] Verify STL output validity (and include baseplate parameters in the filename).

## 4. Branding & Polish
- [x] **App Shell / PWA naming:**
  - [x] Update page/app title to "GridSmith".
  - [x] Update PWA install name/short name in `manifest.json`.
  - [ ] Update tagline placement/copy across pages: "Build Your World. One Tile at a Time."
- [ ] **Cleanup:**
  - [x] Remove unused axes feature (toggle, overlay, and assets).
  - [ ] Remove remaining "Playground" legacy content where it no longer serves GridSmith.

## 5. Navigation & Pages
- [x] Implement pathname-based routing for `/`, `/viewer`, `/about`, `/tiles`, `/profile`, `/tos`, `/privacy`.
- [x] Create stub pages for Home, About, Get Tiles, Profile, Terms of Service, and Privacy Policy.
- [x] Add a global site header and footer that appear on all routes.
- [x] Add footer navigation links for all routes.
- [x] Add a prominent "Build" button in the header that routes to `/viewer`.

## 6. Theming, Layout, and Presets
- [x] Implement dark/light mode toggle in the Account menu.
- [x] Dynamically load PrimeReact Lara Amber themes (dark/light) via `<link>` tag.
- [x] Implement a left slide-out customizer panel with a persistent hamburger/tab toggle.
- [x] Fix initial mobile `/viewer` load so params panel/tab is discoverable immediately.
- [x] Add responsive mobile hamburger navigation for header links/actions.
- [x] Add GridSmith baseplate presets (2x2, 4x4, 6x6, Hallway 2x6).

## 7. Auth & Production Readiness
- [x] Cognito + Google sign-in working in production.
- [x] Hide account name fallback unless `given_name` exists.
- [ ] Replace placeholder legal text with finalized Terms of Service and Privacy Policy.
- [ ] Add a short deployment runbook (Cognito callback/sign-out URL matching, Vercel env vars, DNS notes).

## 8. Future Work / Nice-to-Haves
- [ ] Make the code editor accessible only to admin/advanced roles (hide for normal users).
- [ ] Re-enable and design the "Advanced settings" section in the parameter panel.
- [ ] Flesh out About page copy and visuals.
- [ ] Flesh out Get Tiles page content and CTAs for future tile packs/tools.
- [ ] Add additional GridSmith-specific presets and refine parameter ranges and labels.
- [ ] Consider PWA cache-busting/versioning strategy to reduce stale title/icon/install prompt artifacts after deploy.

## 9. Analytics & Observability
- [x] Add Google Analytics across the full site:
  - [x] Track page views on all routes.
  - [x] Track custom events:
    - [x] `stl_rendered` with params `rows`, `columns`, and `title_type`.
    - [x] `stl_downloaded` with params `rows`, `columns`, and `title_type`.
  - [x] Use a human-readable enum for `title_type` (e.g., `GridSmith`, `OpenForge`) instead of numeric values.
