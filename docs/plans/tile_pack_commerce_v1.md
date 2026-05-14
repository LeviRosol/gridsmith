---
name: Tile pack commerce v1
overview: >-
  Stripe one-time tile packs; Stripe is the commercial source of truth (no order mirror DB).
  **Shipped:** SAM/API Gateway Lambdas (`GET /api/catalog/tile-packs`, `POST /api/billing/checkout-session`, `GET /api/capabilities/me` with `ownedPurchases[]` / `purchasedAt`, `POST /api/downloads/tile-pack` with JWT + Stripe ownership check + presigned S3 GET), SPA live catalog, cart → Checkout, Profile owned packs + pack downloads when deployed. Cognito↔Stripe via **Customer `metadata.cognito_sub`** + Customer Search (no Cognito `custom:stripe_customer_id` for v1).
  **Deploy:** Local `npm run deploy:api:*` anytime. **CI:** `.github/workflows/api-deploy.yml` — **prod** API on **path-filtered push to `main`** (`infra/api/**`, `scripts/deploy-api.sh`, or that workflow file); **`workflow_dispatch`** for manual **dev** / staging / prod. Requires GitHub Environment secrets + OIDC per stage (`api-deploy-pipeline` todo until verified).
  **Still open:** Tile Builder gates from capabilities; `/admin`; telemetry + Dynamo only when that feature ships.
todos:
  - id: storefront-ui-placeholder
    content: "/tiles + /tile-details/:slug with local catalog (incl. optional whatYouGet), two-column detail w/ independent scroll on lg, coming-soon modal, prod deploy—no Stripe yet"
    status: completed
  - id: lambda-stripe-apis
    content: "SAM + API Gateway in-repo: catalog, checkout-session (JWT; multi-line lineItems), capabilities/me. Local/manual: npm run deploy:api:dev|staging|prod. CI: path-filtered push to main → prod API (see .github/workflows/api-deploy.yml); finish GitHub prod env secrets + OIDC (api-deploy-pipeline todo)."
    status: completed
  - id: api-deploy-pipeline
    content: "GitHub Actions: prod API on main push (path-filtered infra/api); manual workflow_dispatch for dev/staging/prod. Wire GitHub prod environment secrets + OIDC; optional branch protection."
    status: pending
  - id: catalog-wire-live
    content: Replace placeholder catalog with GET /api/catalog/tile-packs; keep the same UI components and routing
    status: completed
  - id: capabilities-api
    content: "GET /api/capabilities/me (JWT) + POST /api/billing/checkout-session shipped; Stripe Customer keyed by metadata cognito_sub (search), not Cognito custom attribute"
    status: completed
  - id: tile-pack-download-api
    content: "POST /api/downloads/tile-pack (JWT); Stripe purchase verification; presigned S3 GET from Product metadata pack_download_s3_key; Profile download buttons"
    status: completed
  - id: builder-gating-downloads
    content: Tile Builder Med/High render and STL export gated on capabilities / owned packs (not UI-only upsell)
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

- **Implemented (v1):** put **`cognito_sub`** on **Stripe Customer `metadata`** and use **Stripe Customer Search** in Lambdas (`checkout-session`, `capabilities`) to resolve `sub` → customer.
- **Optional later:** store **`stripe_customer_id`** in a **Cognito custom attribute** (e.g. `custom:stripe_customer_id`) to avoid search on hot paths—only if latency or Stripe search limits become an issue.

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
- **GitHub Actions (`/.github/workflows/api-deploy.yml`)**
  - **Push to `main`** touching `infra/api/**`, `scripts/deploy-api.sh`, or the workflow file → deploy API to **prod** (uses GitHub **prod** environment secrets: `AWS_ROLE_TO_ASSUME_PROD`, Stripe/Cognito/origin, etc.). Does **not** run when only SPA/src changes land on `main`.
  - **Manual** `workflow_dispatch` → pick **dev**, **staging**, or **prod** (use for dev API deploys; staging optional).
- **Prod API deploy control**
  - Automated on the path-filtered `main` pushes above once secrets and OIDC trust are configured. Re-run or hotfix still available via `workflow_dispatch` to **prod**.
- **Stage-specific config/secrets**
  - CI injects stage-specific env vars/secrets (Stripe key, API URLs, S3 bucket, Cognito IDs). Non-prod stages use Stripe test keys only; prod uses live keys only.
- **Local fallback**
  - Keep `npm run deploy:api:*` for dev/prod when you want to deploy outside CI. **Prod:** after merge to `main`, GitHub Actions deploys the API automatically **only when** `infra/api/**`, `scripts/deploy-api.sh`, or the API workflow file changed (same path filter as the workflow); if prerequisites are missing, the job skips and logs why.
- **Infra as code only**
  - API Gateway routes, Lambda config, IAM roles, and stage outputs live in CDK/SAM/Terraform (or equivalent) committed to git; no one-off console-only changes.

## Routes and UI (frontend)

- **Phase 1 (UI — done in repo):**
  - **`/tiles`:** PrimeReact grid (`Card`, `Tag`, etc.) backed by [`src/data/placeholderTileSets.ts`](../../src/data/placeholderTileSets.ts): sort `order`, optional `disabled`, optional `priceLabel`, **`addToCartDisabled`**, optional **`whatYouGet`** (set-specific “What you get” block on detail). Card description excerpts preserve **line breaks** where the copy uses newlines.
  - **`/tile-details/:slug`:** Breadcrumb; **two columns at `lg+`** with **separate scroll** per column (`max-height` / `overflow-y`); **left:** hero image, thumb strip, static **Designed for the Table** (+ follow-on prose); **right:** tag, title, price, multi-paragraph description, **Add to cart** / Continue shopping, static **Included Files**, optional **What you get** from `whatYouGet` (multiline intro/closing/bullets), duplicate **Add to cart** at bottom. Stacked layout below `lg`. Listing **`disabled`** vs **`addToCartDisabled`** unchanged; **Add to cart** → coming-soon **Dialog** when `addToCartDisabled`; checkout not wired otherwise.
  - **Nested routes:** Webpack `publicPath: '/'`, root-absolute `public/index.html` asset tags, and resolved `url()` for PrimeIcons so WASM/fonts/scripts do not 404 under `/tile-details/...`.
  - **Footer:** **`SiteFooter`** stays global under `<main>` only (not duplicated inside the scroll column); users finish the in-column scroll, then scroll the document to reach the footer.
  - **Prod:** Storefront deployed so visitors see `/tiles` and `/tile-details`; commerce APIs remain future work.
- **Phase 2:** Swap the data source to `GET /api/catalog/tile-packs` without redesigning the layout — **done** when `GRIDSMITH_API_BASE_URL` is configured (`src/data/tilePackCatalog.ts`); placeholder enrichment remains for select slugs.
- **Phase 2b (checkout + ownership):** Client cart (`TileCartContext` + `/cart`), Stripe Checkout via `POST /api/billing/checkout-session`, Profile **Owned Packs** from `GET /api/capabilities/me` including optional **Purchased** date from `ownedPurchases` (requires deployed capabilities Lambda).
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
2. **API deploy pipeline:** GitHub workflow exists (**prod** API on **`main`** push when `infra/api/**` or related paths change; **`workflow_dispatch`** for **dev** / staging / prod). Finish wiring **GitHub Environment `prod`** (OIDC `AWS_ROLE_TO_ASSUME_PROD`, Stripe secret ARN, Cognito ids, `PUBLIC_APP_ORIGIN`). Until prod secrets work, use local `npm run deploy:api:prod` after merges that touch the API.
3. ~~**Lambda + API Gateway:** Stripe-backed **catalog**; **checkout-session**; **capabilities/me** (Customer Search on `metadata.cognito_sub`).~~ **Done in repo**; must **deploy** for each environment.
4. ~~**Wire catalog:** `GET /api/catalog/tile-packs` in the existing components.~~ **Done.**
5. ~~**Cart → checkout** in the UI (`POST /api/billing/checkout-session`, multi-line supported).~~ **Done.**
6. ~~**Download API** + S3 presign + Stripe purchase verification.~~ **Done in repo** (`POST /api/downloads/tile-pack`, private per-stage bucket, `pack_download_s3_key`); **deploy** with the rest of the API.
7. Tile Builder wired to capabilities.
8. **Admin** read paths (Stripe + Cognito).
9. **Telemetry**: add **DynamoDB** (or chosen store) **when** implementing `POST /api/telemetry/render`—not before.

## Handoff for a new agent

- **Storefront, live catalog fetch, cart/checkout, capabilities-backed Profile (owned packs + purchase dates + pack file downloads via presigned S3)** are in place; **deploy the API** after changing `infra/api/`.
- **Next concrete work:** **`api-deploy-pipeline`** (CI), then **Tile Builder ↔ `capabilities/me`** for real Med/High gating, unless product priority is **admin** first.
- Point the agent at this file: **`docs/plans/tile_pack_commerce_v1.md`**.
