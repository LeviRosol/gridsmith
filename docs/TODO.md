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
- [x] **Marketing landing (home & about):** Shared PrimeReact blocks in [`src/components/home/marketing-blocks.tsx`](../src/components/home/marketing-blocks.tsx); alternating light/dark/black bands (`.home-landing-*` in [`src/index.css`](../src/index.css)). Home: v1 “Your First Terrain System” hero, features, splits, footer CTA (`/tiles`, Etsy). About: hero + copy sections + footer CTA (`/tiles`, `/tile-builder`). Default meta in `public/index.html`.
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
- [x] **Marketing email opt-in (Cognito):** optional custom attribute `custom:marketing_opt_in` (`"true"` / `"false"`); default opt-in when unset; first-session sync + **Profile** toggle via browser **`UpdateUserAttributes`**; token refresh after updates uses **`InitiateAuth` (REFRESH_TOKEN_AUTH)** on `cognito-idp` (avoids Hosted UI token URL CORS); authorize scope includes **`aws.cognito.signin.user.admin`**; OAuth code exchange hardened (strip `code` before async to avoid double exchange / `invalid_grant`; redirect URI resolution aligned with callback URL).
- [ ] Add a short deployment runbook (Cognito callback/sign-out URL matching, Vercel env vars, DNS notes).

## 8. Future Work / Nice-to-Haves
- [ ] Make the code editor accessible only to admin/advanced roles (hide for normal users).
- [ ] Re-enable and design the "Advanced settings" section in the parameter panel.
- [x] Flesh out About page copy and visuals (landing layout via shared `marketing-blocks` with home).
- [x] Flesh out Get Tiles page content and CTAs for future tile packs/tools.
- [ ] Add additional GridSmith-specific presets and refine parameter ranges and labels.
- [ ] Consider PWA cache-busting/versioning strategy to reduce stale title/icon/install prompt artifacts after deploy.
- [ ] Add optional in-app typography presets/font toggle only if needed for design iteration.

## 9. Analytics & Observability
- [x] GA4/GTM reference:
  - [x] GA4 Measurement ID: `G-07J44WE7N0`
  - [x] GTM Container ID: `GTM-T2RWQFR4`
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
- [x] **Free tier / Med/High:** Users can **preview** at Low / Med / High (64 / 128 / 256). Dialog when choosing Med/High without owning the matching pack (copy is user-tunable). **Full render**, **Download** (export), **F6**, and **F7** open the upsell modal instead of producing downloadable output at 128/256 unless `capabilities/me` + catalog show an owned pack with **`tile_builder_features`** for the active `tile_set` (`Model` enforces on non-preview render and `export()`).
- [x] **Stripe-backed gating:** `TileCartContext` + `computeTileBuilderProEntitledForTileSet` (not UI-only); default **High** when entitled and resolution still Low.
- [ ] **Optional:** tile-builder-specific analytics (`stl_previewed` / `stl_downloaded` with `resolution`, `wall_profile`, etc.) and download filename parity (north vs east when mirrored).

## 12. Tile pack commerce & backend (digital packs)

High-level roadmap; full design, sequence, and YAML todos live in **[`docs/plans/tile_pack_commerce_v1.md`](plans/tile_pack_commerce_v1.md)**.

**Principles:** Stripe is source of truth for products and paid orders (no local mirror DB). Add persistence (e.g. DynamoDB) only when a feature needs it (e.g. render telemetry). Signed-in checkout. S3 for STL files; downloads via JWT + server-side Stripe entitlement check + short-lived presigned URL. Separate dev/prod API URLs and Stripe test vs live keys.

- [x] **Stripe Dashboard:** Account set up; **custom checkout domain** `checkout.gridsmith.io` for Stripe Hosted Checkout (align success/cancel URLs when Checkout Session API ships).

- [ ] **Phase 2a — API deployment pipeline:** Workflow **`.github/workflows/api-deploy.yml`**: push to **`main`** (paths: `infra/api/**`, `scripts/deploy-api.sh`, workflow file) → **prod** API deploy; **`workflow_dispatch`** → dev / staging / prod for manual runs (use for **dev**). Requires GitHub **Environment** secrets + OIDC trust per stage (`AWS_ROLE_TO_ASSUME_PROD` on **prod**, etc.). Until wired, jobs skip with a log line; use local `npm run deploy:api:*` or manual dispatch when ready.
- [x] **Phase 1 — Storefront UI (placeholders):** Done in repo.
  - [x] `/tiles` grid (PrimeReact cards), catalog [`src/data/placeholderTileSets.ts`](../src/data/placeholderTileSets.ts): `order`, `disabled`, `addToCartDisabled`, `priceLabel`, optional per-set **`whatYouGet`** (heading, intro, bullets, closing); real **Tavern Set** description copy. Card blurbs honor **line breaks** (`excerpt` + `pre-line` CSS).
  - [x] `/tile-details/:slug`: breadcrumb; **two columns from `lg` up** with **independent scroll** (`max-height` + `overflow-y` on each column); left = gallery + thumbs + **Designed for the Table**; right = title, price, multi-paragraph description, **Add to cart** / Continue shopping, **Included Files**, optional **What You Get** from data, second **Add to cart**. Below `lg`, columns stack and use normal page scroll.
  - [x] **Add to cart:** always enabled; if `addToCartDisabled`, PrimeReact **Dialog** (coming-soon + check back / account; **Ok** closes). Otherwise adds to client cart / checkout when API is configured.
  - [x] Nested-route fixes: webpack `publicPath: '/'`, root-absolute `public/index.html` assets, PrimeIcons `url()` handling so fonts/scripts/WASM load under `/tile-details/...`.
  - [x] **Footer:** global **`SiteFooter`** only (below `<main>`). Inner-column footer was tried and reverted; long right-column content still scrolls inside the column, then the user scrolls the page to reach the footer.
  - [x] Deploy storefront UI to prod so live visitors see the shop shell.
- [x] **Phase 2b — AWS API (SAM + Lambdas):** In-repo API Gateway + Lambda: `GET /api/catalog/tile-packs`, `POST /api/billing/checkout-session` (JWT; single `priceId` or `lineItems` for multi-pack cart), `GET /api/capabilities/me` (`ownedPriceIds`, `ownedProductIds`, `ownedPurchases[]` with per-price `purchasedAt` from paid Checkout Sessions). Cognito → Stripe via **Stripe Customer `metadata.cognito_sub`** + Customer Search (no Cognito `custom:stripe_customer_id` required for v1).
- [x] **Phase 3 — Wire catalog:** Live catalog when `GRIDSMITH_API_BASE_URL` is set (`src/data/tilePackCatalog.ts`); same `/tiles` and `/tile-details` components; placeholder merge for select slugs until fully Stripe-metadata-driven.
- [x] **Phase 4 — Cart & checkout:** Client cart (`TileCartContext`, drawer + `/cart`), Stripe Hosted Checkout; success/cancel handling on cart page.
- [x] **Phase 5 — Downloads:** Private S3 per API stage; `POST /api/downloads/tile-pack` validates JWT, confirms purchase in Stripe, returns presigned URL; Product metadata `pack_download_s3_key`; Profile owned-pack download buttons (`gridSmithBilling`, `ProfilePage`).
- [x] **Phase 6 — Tile Builder:** Med/High (128/256) entitlement from **SCAD `tile_set`** vs owned catalog slugs (`computeTileBuilderProEntitledForTileSet`); **preview** always allowed at Med/High; **full render + export** blocked in `Model` when not entitled; default **High** when entitled and resolution still Low; catalog Lambda `tile_builder_features` / `pack_download_s3_key`. Builder shell **awaits `Model.init()`** (which awaits syntax check) before first auto-preview so footer progress matches work completion.
- [ ] **Phase 7 — Telemetry:** When built: chosen store (likely Dynamo) + `POST /api/telemetry/render` with non-PII `analytics_subject_id`—**do not create tables before this**.
- [x] **Marketing opt-in:** Shipped in app—`custom:marketing_opt_in` on the user pool, Profile UI, in-browser attribute updates (no Lambda required for the boolean). Optional later: Post confirmation Lambda for server-side default, or ESP sync for campaigns (see **`docs/plans/tile_pack_commerce_v1.md`**).
- [x] **Profile owned packs:** When signed in and API configured, Profile lists owned catalog rows from capabilities; shows **Purchased** date when deployed capabilities returns `ownedPurchases` (`src/data/ownedPacksMatch.ts`, `ProfilePage`).
- [ ] **Ops reminder:** Local `.env` should target the intended API stage and Stripe mode (see commerce plan); never mix prod keys with dev Lambdas.

## 13. Testing & release gates (commerce readiness)

As Stripe and real-user flows land, CI should catch regressions before production.

- [ ] **Keep existing OpenSCAD playground smoke tests healthy:** `tests/e2e.test.js` + GitHub Actions **`Test Build`** (`npm run build:all`, puppeteer e2e in dev + prod modes). Fix harness drift when UI routing or preview pipeline changes. **Local two-terminal loop:** Terminal A runs the app (`npm start` → `http://localhost:4000/baseplate`); Terminal B runs `npm run test:e2e:watch` (`jest --watchAll` + `PUPPETEER_SKIP_SERVER=1` so Jest does not spawn or tear down a dev server, and edits outside the test file still trigger reruns). For prod-bundle e2e against `serve dist`, use Terminal A `npm run start:production:e2e` (embeds `GRIDSMITH_TEST_HOOK` for `window.__GRIDSMITH_TEST__`; `:3000`) + Terminal B `npm run test:e2e:watch:prod`.
- [ ] **Block releases on red CI:** Configure **`main`** branch protection (or equivalent) so merges/deploys require a green **`Test Build`** (and any future required workflows). Goal: a failing test fails the workflow and **does not ship** the static app to prod.

## 14. Build log / blog (`feature-blog`)

MDX file-based posts; plan in [`docs/plans/blog_build_log_v1.md`](plans/blog_build_log_v1.md).

- [x] **Infrastructure:** `@mdx-js/loader` + `@mdx-js/react`, `src/blog/posts/*.mdx`, `registry.ts`, `load-posts.ts`.
- [x] **Routes:** `/blog` index, `/blog/:slug` post (`BlogPage`, `BlogPostPage` in `App.tsx`).
- [x] **Layouts (PrimeBlocks [content](https://primeblocks.org/marketing/content)):** index = Emphasized Post; post = Two Columns with Image.
- [x] **Seed content:** `test-post-1`, `test-post-2` (Lorem ipsum; hero + inline images).
- [x] **Home CTA:** “Read the Build Log” → `/blog`.
- [x] **Nav:** header + mobile menu + footer link to Build Log (`/blog`).
- [x] **SEO/discovery:** `applyPageMeta` (canonical, OG, Twitter), JSON-LD (`Blog` / `BlogPosting`), `public/robots.txt`, `npm run generate:sitemap` → `public/sitemap.xml`, `npm run prerender:blog` (postbuild) for `/blog` and posts.
- [x] **Theme:** blog bands use `tone="theme"` (follows app dark/light toggle via `home-landing-band--theme`).
- [x] **Marketing routes:** skip BrowserFS / `Model` on non-builder paths (`src/routes.ts`); dev server avoids serving stale `dist/blog` prerender over SPA.
- [ ] **Real posts:** replace dummy MDX with production build-log copy and images.
- [ ] **GTM:** blog-specific analytics events (`blog_post_view`, optional outbound clicks). Generic `page_view` on route change already runs from `App.tsx`.
- [ ] **E2e:** smoke for `/blog` and `/blog/:slug`.

## 15. Marketing landing follow-ups

Home and About use the shared landing system (see §4). Remaining polish:

- [ ] Replace placeholder hero/split images with final marketing art (e.g. dedicated `/home/*` paths).
- [ ] Optional e2e smoke for home/about hero copy and primary CTAs when routing changes.
- [ ] **API automated tests (no extra UI e2e for now):** Add a focused test suite for Lambda handlers / billing logic—request validation, JWT behavior (happy + invalid token), Stripe client usage (mocked; **never** hit live Stripe in unit tests), and entitlement decisions. Run these tests in CI on every push/PR (separate job or folded into `Test Build` once the API code lives in-repo).
- [ ] **Stripe test-mode fixtures:** Standardize on **`sk_test_` / restricted keys** for CI and local; prod secrets only in prod deploy environments.
