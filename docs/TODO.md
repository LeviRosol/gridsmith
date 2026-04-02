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
  - [x] Update tagline placement/copy across pages: "Build Your World. One Tile at a Time."
- [ ] **Cleanup:**
  - [x] Remove unused axes feature (toggle, overlay, and assets).
  - [ ] Remove remaining "Playground" legacy content where it no longer serves GridSmith.

## 5. Navigation & Pages
- [x] Implement pathname-based routing for `/`, `/baseplate`, `/about`, `/tiles`, `/profile`, `/tos`, `/privacy`.
- [x] Create stub pages for Home, About, Get Tiles, Profile, Terms of Service, and Privacy Policy.
- [x] Add a global site header and footer that appear on all routes.
- [x] Add footer navigation links for all routes.
- [x] Add a prominent **Build** button in the header (all routes) that opens a chooser modal: **Baseplate Builder** → `/baseplate`, **Tile Builder** → `/tile-builder`; mobile hamburger uses the same **Build** entry.

## 6. Theming, Layout, and Presets
- [x] Implement dark/light mode toggle in the Account menu.
- [x] Dynamically load PrimeReact Lara Amber themes (dark/light) via `<link>` tag.
- [x] Implement a left slide-out customizer panel with a persistent hamburger/tab toggle.
- [x] Fix initial mobile `/baseplate` load so params panel/tab is discoverable immediately.
- [x] Add responsive mobile hamburger navigation for header links/actions.
- [x] Add GridSmith baseplate presets (2x2, 4x4, 6x6, Hallway 2x6).

## 7. Auth & Production Readiness
- [x] Cognito + Google sign-in working in production.
- [x] Hide account name fallback unless `given_name` exists.
- [x] Replace placeholder legal text with finalized Terms of Service and Privacy Policy.
- [x] Add refresh-token based auth session renewal:
  - [x] Request `offline_access` in Cognito authorize flow.
  - [x] Persist refresh token and renew id/access tokens at app init when needed.
  - [x] Proactively refresh before token expiry for long-lived open tabs.
- [ ] Add a short deployment runbook (Cognito callback/sign-out URL matching, Vercel env vars, DNS notes).

## 8. Future Work / Nice-to-Haves
- [ ] Make the code editor accessible only to admin/advanced roles (hide for normal users).
- [ ] Re-enable and design the "Advanced settings" section in the parameter panel.
- [x] Flesh out About page copy and visuals.
- [x] Flesh out Get Tiles page content and CTAs for future tile packs/tools.
- [ ] Add additional GridSmith-specific presets and refine parameter ranges and labels.
- [ ] Consider PWA cache-busting/versioning strategy to reduce stale title/icon/install prompt artifacts after deploy.
- [ ] Add optional in-app typography presets/font toggle only if needed for design iteration.

## 9. Analytics & Observability
- [x] Add Google Analytics across the full site:
  - [x] Track page views on all routes.
  - [x] Track custom events:
    - [x] `stl_rendered` with params `rows`, `columns`, and `tile_type`.
    - [x] `stl_downloaded` with params `rows`, `columns`, and `tile_type`.
  - [x] Use a human-readable enum for `tile_type` (e.g., `GridSmith`, `OpenForge`) instead of numeric values.
- [x] Add consent-gated analytics loading:
  - [x] Show GDPR/CCPA cookie banner with accept/essential-only actions.
  - [x] Defer GTM script load until analytics consent is granted.
  - [x] Add footer "Cookie settings" entry point to reopen consent controls.

## 10. Hosted UI & External Styling Assets
- [x] Add Cognito Hosted UI CSS template (`public/cognito_css_template.css`) for external upload/storage.
- [x] Validate final Cognito Hosted UI CSS after upload in all auth screens (sign-in, sign-up, forgot password).

## 11. Tile builder (`/tile-builder`)
- [x] **Route & shell:** `/tile-builder` behind auth; Cognito default redirect when login starts on tile-builder path.
- [x] **Assets & pipeline:** `public/tile_stls/manifest.json` + STL assets; main thread install + `sourcesWithTileStls` so worker FS receives tile meshes; `ensureParentDirs` in worker for nested writes.
- [x] **SCAD:** `tile_builder.scad` assembler with `wall_profile` (`none` / `flat` / `curved`), `curved_wall_mirror`, per-side `use_*_wall` and `*_wall_type`, flat STL names `wall`/`door` vs curved `curved_wall`/`curved_door`, resolution-driven `tile_file()`.
- [x] **UI (`TileBuilderPanel`):** accordion Core (default open) / Floor / Walls; resolution labels Low / Med / High (64 / 128 / 256); flat walls: per-side dropdown (None / Wall / Door) drives toggles; curved: **Type** (north) + **Mirror** checkbox (`curved_wall_mirror`): mirrored uses `use_east_wall` + `east_wall_type` instead of north; profile switch normalizes flat ↔ curved types and clears side toggles when entering curved.
- [x] **Free tier (Med/High):** first dialog when selecting Med/High explains Pro (selection stays for preview); **Render** / **Download** / F6 / F7 open `TileBuilderUpsellContext` upsell modal instead of final render/export at 128/256 (preview still allowed).
- [ ] **Pro gating (future):** replace UI-only upsell intercept with real membership check (Cognito group, entitlement API, or similar) before allowing final render + STL export at Med/High. (Aligned with **section 12 (Tile pack commerce)**—capabilities from Stripe-backed API.)
- [ ] **Optional:** tile-builder-specific analytics (`stl_previewed` / `stl_downloaded` with `resolution`, `wall_profile`, etc.) and download filename parity (north vs east when mirrored).

## 12. Tile pack commerce & backend (digital packs)

High-level roadmap; full design, sequence, and YAML todos live in **[`docs/plans/tile_pack_commerce_v1.md`](plans/tile_pack_commerce_v1.md)**.

**Principles:** Stripe is source of truth for products and paid orders (no local mirror DB). Add persistence (e.g. DynamoDB) only when a feature needs it (e.g. render telemetry). Signed-in checkout. S3 for STL files; downloads via JWT + server-side Stripe entitlement check + short-lived presigned URL. Separate dev/prod API URLs and Stripe test vs live keys.

- [x] **Phase 1 — Storefront UI (placeholders):** Done in repo.
  - [x] `/tiles` grid (PrimeReact cards), placeholder catalog [`src/data/placeholderTileSets.ts`](../src/data/placeholderTileSets.ts) with `order`, `disabled`, `addToCartDisabled`, `priceLabel`, etc.
  - [x] `/tile-details/:slug` product page (breadcrumb, gallery, description, CTAs).
  - [x] **Add to cart:** always enabled; if `addToCartDisabled`, PrimeReact **Dialog** (coming-soon copy + check back / account line, **Ok** closes). If not disabled, button is still a no-op until checkout exists.
  - [x] Nested-route fixes: webpack `publicPath: '/'`, root-absolute `public/index.html` assets, PrimeIcons `url()` handling so fonts/scripts/WASM load under `/tile-details/...`.
  - [x] Deploy storefront UI to prod so live visitors see the shop shell.
- [ ] **Phase 2 — AWS API:** API Gateway + Lambda: `GET /api/catalog/tile-packs` (Stripe list), then `POST /api/billing/checkout-session` and `GET /api/capabilities/me` (Stripe customer + purchase history; optional `custom:stripe_customer_id` on Cognito).
- [ ] **Phase 3 — Wire catalog:** Replace placeholders with live catalog API; keep same components/routes.
- [ ] **Phase 4 — Cart & checkout:** Client cart → Checkout Session (signed-in only).
- [ ] **Phase 5 — Downloads:** Private S3; `POST` download endpoint validates JWT, confirms purchase in Stripe, returns presigned URL.
- [ ] **Phase 6 — Tile Builder:** Wire Med/High render/download gates to **`/api/capabilities/me`** (real entitlements, not UI-only).
- [ ] **Phase 7 — Admin:** In-app `/admin/*` (Cognito `admin` group); user lookup + Stripe read paths (no local order table).
- [ ] **Phase 8 — Telemetry:** When built: chosen store (likely Dynamo) + `POST /api/telemetry/render` with non-PII `analytics_subject_id`—**do not create tables before this**.
- [ ] **Later / optional:** Marketing newsletter opt-in via Cognito custom attributes + small authenticated API to set them; local dev never targets prod API Lambdas or live Stripe (see plan).
