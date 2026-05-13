# GridSmith API Infra Contract

This directory contains infrastructure-as-code and deploy logic for API Gateway + Lambda commerce endpoints.

## Deployment contract

Repository workflows and npm scripts call:

- `scripts/deploy-api.sh --stage <dev|staging|prod>`

That wrapper delegates to:

- `infra/api/deploy.sh <stage>`

`infra/api/deploy.sh` is implemented with AWS SAM and deploys:

- `GET /api/catalog/tile-packs` (Stripe catalog)
- `POST /api/billing/checkout-session` (Cognito ID JWT + Stripe Checkout). JSON body: either `priceId` (single one-time Stripe price) or `lineItems` (array of `{ priceId, quantity?: 1 }`, deduped, max 20 lines, quantity must be 1). Optional `successPath` / `cancelPath` (same-origin paths; Stripe appends `session_id` or `checkout=cancel`).
- `GET /api/capabilities/me` (Cognito ID JWT + owned Stripe price IDs)

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
- `STRIPE_WEBHOOK_SECRET` (when webhooks are introduced)
- `DOWNLOADS_BUCKET_NAME`
- `API_BASE_URL` (frontend consumption; emitted/output by infra)

## GitHub secrets/variables expected by workflow

- Variables:
  - `AWS_REGION`
- Secrets:
  - `AWS_ROLE_TO_ASSUME_DEV` / `AWS_ROLE_TO_ASSUME_STAGING` / `AWS_ROLE_TO_ASSUME_PROD`
  - `STRIPE_SECRET_ARN` (per environment, matching the Secrets Manager ARN for that stage’s Stripe key)
  - `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, `PUBLIC_APP_ORIGIN` (checkout + capabilities Lambdas)

Each environment (`dev`, `staging`, `prod`) can add approval rules in GitHub settings, especially for `prod`.
