---
name: Tile pack commerce v1
overview: Stripe one-time Tile Pack purchases (catalog + order history from Stripe API only), S3 STL delivery via logged-in download API, shop at /tiles and /tile-details, in-app Cognito-gated admin, and persistence only when a feature needs it. **Storefront UI** (grid, rich product detail, catalog module with optional `whatYouGet`) is in-repo and **shipped to prod**; next is Lambda/Stripe behind the same components.
todos:
  - id: storefront-ui-placeholder
    content: "/tiles + /tile-details/:slug with local catalog (incl. optional whatYouGet), two-column detail w/ independent scroll on lg, coming-soon modal, prod deploy—no Stripe yet"
    status: completed
  - id: lambda-stripe-apis
    content: "Add API Gateway + Lambda: catalog from Stripe, checkout-session (JWT), capabilities/me via Stripe Customer + purchase history (no order mirror DB)"
    status: pending
  - id: api-deploy-pipeline
    content: "Add CI deployment pipeline for API Gateway/Lambda (auto dev deploys on branch push, manual/approved prod deploys, stage-specific secrets)"
    status: pending
  - id: catalog-wire-live
    content: Replace placeholder catalog with GET /api/catalog/tile-packs; keep the same UI components and routing
    status: pending
  - id: capabilities-api
    content: Implement GET /api/capabilities/me (JWT) and POST /api/billing/checkout-session; persist Stripe customer id on Cognito user (custom attribute) at first checkout if needed
    status: pending
  - id: builder-gating-downloads
    content: Tile Builder gates from capabilities API; POST /api/downloads/... validates JWT + live Stripe entitlement then returns short-lived S3 presigned URL
    status: pending
  - id: telemetry-persistence
    content: "When implementing render telemetry: add chosen store (likely DynamoDB in same region as Lambda) and POST /api/telemetry/render—do not create tables before this"
    status: pending
  - id: admin-in-app
    content: /admin lookup UI; backend uses admin JWT + Stripe API (Dashboard parity for read paths) without mirroring orders locally
    status: pending
  - id: marketing-opt-in-cognito
    content: "Cognito custom:marketing_opt_in; Profile page; UpdateUserAttributes + InitiateAuth refresh; OAuth PKCE/redirect fixes; aws.cognito.signin.user.admin scope"
    status: completed
  - id: stripe-account-checkout-domain
    content: "Stripe account active; custom Hosted Checkout domain checkout.gridsmith.io configured in Dashboard"
    status: completed
isProject: false
---

Repo copy of the GridSmith **Tile pack commerce v1** plan (version-controlled). A Cursor-managed copy may also exist at `~/.cursor/plans/tile_pack_commerce_v1_266f98a3.plan.md`—treat **this file as source of truth in git** when they differ.

# Tile pack commerce and data layer (v1)

## Decisions locked in

- **Admin**: same app, `/admin/*` routes gated by a **Cognito group** (e.g. `admins`), with the same enforcement in Lambda.
- **Checkout**: **signed-in only**; link purchases to users via **Cognito `sub`** and **Stripe Customer** (see below).
- **Products and orders**: **Stripe is the system of record**—no local mirror tables for catalog, orders, line items, or entitlements. **Capabilities and admin views** resolve ownership by calling the **Stripe API** at request time (with sensible caching later if needed).
- **Persistence**: **Do not create database tables until a feature actually needs them** (e.g. telemetry ingestion). No stub schemas for future saves/Room Builder until those features are implemented.
- **Stripe (Dashboard):** Account provisioned; **custom Hosted Checkout domain** **`checkout.gridsmith.io`**. When wiring `POST /api/billing/checkout-session`, align success/cancel URLs and customer-facing checkout links with this domain.

## Relationship to the old “Stripe subscriptions” plan

Keep: **API Gateway + Lambda**, **`GET /api/capabilities/me`**, **non-PII `analytics_subject_id`** for telemetry when that ships ([`src/analytics.ts`](../../src/analytics.ts) or sibling). **Drop**: subscription portal, local `purchases` / `entitlements` tables, and webhook-driven mirroring of Stripe objects—unless a future feature requires a webhook **and** durable idempotency (then add the smallest store only for that).

## Product catalog and orders (Stripe only)

- **Catalog**: Stripe **Products + Prices** (one-time `price`); merchandising in **Product `metadata`** (slug, image URL, description excerpt, sort hint, mapping to builder unlock flags / S3 prefix key).
- **Storefront**: `GET /api/catalog/tile-packs` — Lambda lists active products/prices via Stripe; secret key stays server-side.
- **“Does this user own pack X?”**: Lambda uses **Stripe Customer** linked to the user (see next section), then **Stripe APIs** to inspect paid Checkout Sessions / PaymentIntents / Charges as appropriate for your integration shape—**no app DB for order rows**.

### Linking Cognito `sub` to Stripe Customer (no “secrets” DB)

You typically need **one stable association**, not a full order database:

- **Recommended**: store **`stripe_customer_id`** in a **Cognito custom attribute** (e.g. `custom:stripe_customer_id`), set on first checkout/session creation. This is an **opaque identifier**, not a user-held secret and not a password.
- **Alternative**: put `cognito_sub` on **Stripe Customer `metadata`** and use **Stripe Customer Search** to resolve `sub` → customer when the custom attribute is empty (slightly more API work on cold start).

**What you do *not* need to store per user for v1:**

- No per-user API keys or download passwords in your database.
- No long-lived “download keys” in Dynamo/RDS if you use **short-lived presigned S3 URLs** issued after each authorized request.

Stripe **secret key**, **webhook signing secret**, and **S3 credentials** live in **Lambda/env/secrets manager**—they are **server** secrets, not end-user data.

## Commerce flow (Stripe-centric, no entitlement DB)

```mermaid
sequenceDiagram
  participant User
  participant SPA
  participant Api as Lambda_API
  participant Stripe
  participant S3

  User->>SPA: Browse /tiles and /tile-details
  SPA->>Api: GET catalog
  Api->>Stripe: List Products_Prices
  Stripe-->>Api: Catalog
  Api-->>SPA: Tile pack DTOs
  User->>SPA: Checkout (signed in)
  SPA->>Api: POST checkout-session (Bearer JWT)
  Api->>Stripe: Create Checkout Session (metadata cognito_sub, customer)
  Stripe-->>User: Hosted Checkout
  SPA->>Api: GET capabilities/me (JWT)
  Api->>Stripe: Resolve customer and purchases
  Stripe-->>Api: Paid products
  Api-->>SPA: Unlocked packs and flags
  User->>Api: POST download (JWT + pack id)
  Api->>Stripe: Confirm purchase for pack
  Api->>S3: Presign GET
  Api-->>SPA: Short-lived URL
```

**Webhooks:** Optional for v1 if everything is read from Stripe on demand. Add a webhook later if you need async side effects (e.g. email, cache warm); if the handler must not run twice, introduce **minimal** idempotent storage **at that time**—not ahead of need.

## Download security (aligned with your note)

- **Requirement**: user **must be logged in** (valid **Cognito JWT** on the download request).
- **Pattern**: `POST /api/downloads/tile-pack` (or equivalent) with **Authorization: Bearer**; Lambda:
  1. Validates JWT and reads `sub`.
  2. Resolves Stripe Customer and **confirms** the user has paid for the **Stripe Product / Price** that maps to that STL bundle (via Stripe API).
  3. Returns a **short-lived S3 presigned URL** (e.g. 5–15 minutes).

The “secure key” is effectively the **HMAC-signed presigned URL** (capability URL), not a separate secret you store per user. Avoid putting long-lived download tokens in the database unless a product requirement explicitly needs them.

**S3**: Private bucket; object keys per pack/version; mapping from Stripe `product_id` (or metadata) → S3 prefix can live in **Stripe Product metadata** so it stays single-source.

## Where would a database live, and Dynamo vs RDS?

- **Hosting**: With Lambda in **AWS**, the natural default is **DynamoDB in the same region**—no servers, IAM integration, pay-per-use, fits append-only **telemetry** and later **saved design blobs** (metadata + S3 pointer or compressed attributes if small).
- **RDS / MariaDB**: Better if you want **SQL**, ad-hoc joins, or a team workflow centered on relational reporting. Less aligned with “Stripe owns commercial truth” unless you later mirror analytics or run complex ops dashboards off your own warehouse.

**Recommendation for this plan:** stay **tabless until telemetry**; when telemetry lands, add **DynamoDB** first. Revisit **RDS** only if you outgrow Dynamo for saved layouts, migrations, or reporting—or if the team standardizes on SQL.

## Local development vs production (avoid hitting prod)

Goal: **local webpack / Vite never “accidentally” calls prod API Gateway or prod Lambdas**, and **dev Lambdas never use live Stripe or prod S3.**

- **Separate API base URL per environment**
  - Frontend reads something like `API_BASE_URL` from env at build time (already the pattern for Cognito in webpack). **Local `.env`** should point at a **dev** API Gateway URL (or `http://localhost:3001` if you run APIs locally). **Production builds** (CI / Vercel) inject the **prod** URL only in the prod pipeline. Never use the prod URL as the default in committed example env files.
- **Separate AWS deployments (stages or stacks)**
  - One CDK/SAM/Terraform **stack** or **stage** per environment (`dev`, `staging`, `prod`) so dev has its **own** API Gateway ID, Lambda ARNs, and (when added) Dynamo tables and S3 buckets. Local dev targets **dev** only.
- **Stripe: test mode in non-prod**
  - Dev Lambdas and local tools use **`sk_test_` / restricted test keys**. Prod Lambdas use **`sk_live_`** only via prod secrets. Optional safety: Lambda asserts `STRIPE_KEY` prefix matches expected mode for `STAGE` (fail fast if `sk_live_` on `dev`).
- **Cognito**
  - Prefer a **dev User Pool** (or dev app client) for local and dev APIs so tokens and `custom:stripe_customer_id` never mix with real users. If you must share a pool, treat it as higher risk and rely even more on Stripe test mode.
- **S3**
  - **Dev bucket** for dev/staging presigns; **prod bucket** only in prod Lambda env.
- **Running Lambdas locally**
  - **SAM local / `serverless offline` / similar** still use **dev** credentials and **test** Stripe keys from a local profile or `.env`, not production secrets.
- **Operational guardrails**
  - Restrict who can deploy to prod; use **IAM** so dev laptops cannot invoke **prod** Lambdas by default. API keys in docs are **dev** only.

## API deployment process (AWS)

Goal: deployments are repeatable and auditable (no copy/paste console setup), with API release flow decoupled from static web deploys.

- **Separate pipelines**
  - Keep **web deploy** and **API deploy** as separate workflows/jobs. Pushes to `main` can continue deploying the web app, while API deploys run from a dedicated workflow.
- **GitHub-triggered API deploys**
  - Preferred default: branch push (e.g. `feature-*`, `bug-*`, or `develop`) deploys the API to **dev** stage automatically via CI.
- **Prod API deploy control**
  - Use **manual trigger** (`workflow_dispatch`) and/or protected environment approvals for **prod** API deploys. Avoid automatic prod API deploys on every web release unless explicitly desired later.
- **Stage-specific config/secrets**
  - CI injects stage-specific env vars/secrets (Stripe key, API URLs, S3 bucket, Cognito IDs). Non-prod stages use Stripe test keys only; prod uses live keys only.
- **Local fallback (optional)**
  - Keep scriptable local commands (e.g. `deploy:api:dev`) for emergency/manual deploys, but CI remains the source of truth for normal releases.
- **Infra as code only**
  - API Gateway routes, Lambda config, IAM roles, and stage outputs live in CDK/SAM/Terraform (or equivalent) committed to git; no one-off console-only changes.

## Routes and UI (frontend)

- **Phase 1 (UI — done in repo):**
  - **`/tiles`:** PrimeReact grid (`Card`, `Tag`, etc.) backed by [`src/data/placeholderTileSets.ts`](../../src/data/placeholderTileSets.ts): sort `order`, optional `disabled`, optional `priceLabel`, **`addToCartDisabled`**, optional **`whatYouGet`** (set-specific “What you get” block on detail). Card description excerpts preserve **line breaks** where the copy uses newlines.
  - **`/tile-details/:slug`:** Breadcrumb; **two columns at `lg+`** with **separate scroll** per column (`max-height` / `overflow-y`); **left:** hero image, thumb strip, static **Designed for the Table** (+ follow-on prose); **right:** tag, title, price, multi-paragraph description, **Add to cart** / Continue shopping, static **Included Files**, optional **What you get** from `whatYouGet` (multiline intro/closing/bullets), duplicate **Add to cart** at bottom. Stacked layout below `lg`. Listing **`disabled`** vs **`addToCartDisabled`** unchanged; **Add to cart** → coming-soon **Dialog** when `addToCartDisabled`; checkout not wired otherwise.
  - **Nested routes:** Webpack `publicPath: '/'`, root-absolute `public/index.html` asset tags, and resolved `url()` for PrimeIcons so WASM/fonts/scripts do not 404 under `/tile-details/...`.
  - **Footer:** **`SiteFooter`** stays global under `<main>` only (not duplicated inside the scroll column); users finish the in-column scroll, then scroll the document to reach the footer.
  - **Prod:** Storefront deployed so visitors see `/tiles` and `/tile-details`; commerce APIs remain future work.
- **Phase 2:** Swap the data source to `GET /api/catalog/tile-packs` without redesigning the layout.
- [`App.tsx`](../../src/components/App.tsx): routing for both phases; stable id in the detail URL (slug or future `product_id`).
- **Cart**: client-only line items → one Checkout Session (after backend exists).
- [`AuthContext.tsx`](../../src/components/AuthContext.tsx): require sign-in for checkout and download.
- [`TileBuilderPanel.tsx`](../../src/components/TileBuilderPanel.tsx) / [`App.tsx`](../../src/components/App.tsx): gates driven by **`/api/capabilities/me`** (backed by Stripe, not a local entitlements table).

## Admin (in-app)

- `/admin/users` (or similar): **Cognito group** on JWT; Lambda calls **Stripe** (and Cognito Admin API if needed) to show customer + payment history—still **no local order mirror** unless you add it later for a concrete reason.

## Marketing newsletter opt-in (store in Cognito)

**Shipped in the SPA** (no separate “emails DB” for the boolean). Pool custom attribute **`custom:marketing_opt_in`** (`"true"` / `"false"`); **default opt-in** when the claim is missing (UI + one-time first-session write when possible).

- **Pool / client (console):** User pool **Sign-up** → custom attribute `marketing_opt_in`; app client **read + write** + optional **ID token** claim; authorize scope **`aws.cognito.signin.user.admin`** so the user’s **access token** can call **`UpdateUserAttributes`** (not `AdminUpdateUserAttributes`).
- **App:** [`AuthContext.tsx`](../../src/components/AuthContext.tsx) parses the ID token, syncs default `true` when the attribute is absent, refreshes tokens via **`InitiateAuth` (REFRESH_TOKEN_AUTH)** on **`cognito-idp`** after updates (same host as `UpdateUserAttributes`; avoids Hosted UI **`oauth2/token`** browser CORS pitfalls). OAuth **PKCE** callback: strip **`code`** from the URL **before** the async exchange to avoid **`invalid_grant`** (e.g. React Strict Mode double mount); **redirect_uri** resolution: session → env → current callback URL.
- **Profile:** [`ProfilePage.tsx`](../../src/components/ProfilePage.tsx) toggle + save.
- **Hosted UI sign-up:** Google / classic Hosted UI **do not** expose a marketing checkbox; consent is **Profile** (and optional future banner). Optional **Post confirmation** Lambda can still set the attribute server-side for auditing.
- **Alternative (not required here):** Lambda + **`AdminUpdateUserAttributes`** if you prefer not to grant **`aws.cognito.signin.user.admin`** on the public client.
- **Export / campaigns:** **`ListUsers`** / CSV export for ops; sync to an **ESP** later for sends—Cognito holds consent; ESP often holds campaign/unsubscribe links.

**Caveat:** For strict compliance, some teams duplicate **consent timestamp + version** in Cognito and the ESP, or treat the ESP as unsubscribe source of truth after first sync.

## Open choices during implementation

- **URL shape**: `/tile-details/:slug` vs `:productId`.
- **Cart UX**: drawer vs `/cart`.
- **Caching**: optional short TTL cache for `capabilities/me` to reduce Stripe calls (Redis/ElastiCache or Lambda in-memory only within one instance—Dynamo optional **only if** you add caching with a reason).

## Suggested implementation order

1. ~~**Storefront UI (placeholders):** `/tiles` grid + `/tile-details` + placeholder content + prod deploy of the shell~~ **Done (see Phase 1 above).**
2. **API deploy pipeline first:** establish CI workflow for Lambda/API Gateway deploys (auto dev + manual/approved prod) with stage-specific secrets.
3. **Lambda + API Gateway:** Stripe-backed **catalog** endpoint first; then **checkout-session** and **capabilities/me** (Cognito `custom:stripe_customer_id` when needed).
4. **Wire catalog:** replace placeholder module with `GET /api/catalog/tile-packs` in the existing components.
5. **Cart → checkout** in the UI once `POST /api/billing/checkout-session` exists.
6. **Download API** + S3 presign + Stripe purchase verification.
7. Tile Builder wired to capabilities.
8. **Admin** read paths (Stripe + Cognito).
9. **Telemetry**: add **DynamoDB** (or chosen store) **when** implementing `POST /api/telemetry/render`—not before.

## Handoff for a new agent

- **Storefront UI placeholder** is complete; start with todo **`lambda-stripe-apis`** (or **`catalog-wire-live`** after APIs exist).
- Point the agent at this file: **`docs/plans/tile_pack_commerce_v1.md`**.
