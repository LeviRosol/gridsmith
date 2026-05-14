# GridSmith API Infra Contract

This directory contains infrastructure-as-code and deploy logic for API Gateway + Lambda commerce endpoints.

## Deployment contract

Repository workflows and npm scripts call:

- `scripts/deploy-api.sh --stage <dev|staging|prod>`

That wrapper delegates to:

- `infra/api/deploy.sh <stage>`

`infra/api/deploy.sh` is implemented with AWS SAM and deploys:

- `GET /api/catalog/tile-packs` (Stripe catalog; Product metadata drives storefront fields — see catalog Lambda for `slug`, **`tile_builder_features`** and/or **`pack_download_s3_key`** for Tile Builder Med/High unlock, `pack_download_s3_key` for downloads, etc.)
- `POST /api/billing/checkout-session` (Cognito ID JWT + Stripe Checkout). JSON body: either `priceId` (single one-time Stripe price) or `lineItems` (array of `{ priceId, quantity?: 1 }`, deduped, max 20 lines, quantity must be 1). Optional `successPath` / `cancelPath` (same-origin paths; Stripe appends `session_id` or `checkout=cancel`).
- `GET /api/capabilities/me` (Cognito ID JWT + owned Stripe price/product IDs and optional `ownedPurchases` with `purchasedAt`)
- `POST /api/downloads/tile-pack` (Cognito ID JWT + JSON `{ "priceId": "price_…" }`). Verifies the user owns that price via paid Checkout Sessions, reads Stripe Product metadata **`pack_download_s3_key`** (S3 object key, no leading slash), returns a short-lived **presigned S3 GET URL**. Pack files live in the stack’s private **`TilePackDownloadsBucket`** (see CloudFormation output `TilePackDownloadsBucketName`); upload zips/STLs there and set metadata per product.

## Required behavior

- Accept one argument: `dev`, `staging`, or `prod`.
- Deploy API Gateway + Lambda for that stage only.
- Read Stripe/AWS config from stage-specific environment variables or secret manager references.
- Exit non-zero on real deployment failures.

## Local deployment prerequisites

- AWS credentials configured for the target account/role.
- AWS CLI installed.
- AWS SAM CLI installed.

Then run:

```bash
npm run deploy:api:dev
```

## Suggested environment variables (per stage)

- `AWS_REGION`
- `STRIPE_SECRET_ARN` (Secrets Manager ARN for the Stripe API key; **required** for `infra/api/deploy.sh`. Secret value: plain `sk_...` string, or JSON with `STRIPE_SECRET_KEY` / `secret` / `sk_test` / `sk_live`. Use `sk_test_` in dev/staging and `sk_live_` only in prod.)
- `COGNITO_USER_POOL_ID` (same as in Cognito console, e.g. `us-east-1_xxxx`)
- `COGNITO_CLIENT_ID` (same as the SPA webpack env — Cognito app client id)
- `PUBLIC_APP_ORIGIN` (no trailing slash: local dev `http://localhost:4000`, production your public site URL — used for Stripe Checkout success/cancel redirects)
- **Tile Builder (Med / High):** Catalog sets `tileBuilderFeatures` when Stripe **`tile_builder_features`** is truthy (`true` / `1` / `yes` / `med_high` / `all`), or when **`pack_download_s3_key`** is set (same packs as file download)—unless **`tile_builder_features`** is explicitly `false` / `0` / `no`. The SPA intersects owned price/product ids from **`GET /api/capabilities/me`** with those catalog rows.
- `STRIPE_WEBHOOK_SECRET` (when webhooks are introduced)
- `API_BASE_URL` (frontend consumption; emitted/output by infra)

Tile pack **download** storage: each API **stage** (`dev`, `staging`, `prod`) is a **separate CloudFormation stack** with its **own private S3 bucket** (`gridsmith-tilepack-dl-<stage>-<account-id>`). Dev and prod never share bucket objects—no `dev/` / `prod/` prefixes in one bucket. The download Lambda gets `DOWNLOADS_BUCKET_NAME` from that stack automatically.

## GitHub secrets/variables expected by workflow

- Variables:
  - `AWS_REGION`
- Secrets:
  - `AWS_ROLE_TO_ASSUME_DEV` / `AWS_ROLE_TO_ASSUME_STAGING` / `AWS_ROLE_TO_ASSUME_PROD`
  - `STRIPE_SECRET_ARN` (per environment, matching the Secrets Manager ARN for that stage’s Stripe key)
  - `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, `PUBLIC_APP_ORIGIN` (checkout, capabilities, and download Lambdas)

Each environment (`dev`, `staging`, `prod`) can add approval rules in GitHub settings, especially for `prod`.
