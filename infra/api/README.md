# GridSmith API Infra Contract

This directory contains infrastructure-as-code and deploy logic for API Gateway + Lambda commerce endpoints.

## Deployment contract

Repository workflows and npm scripts call:

- `scripts/deploy-api.sh --stage <dev|staging|prod>`

That wrapper delegates to:

- `infra/api/deploy.sh <stage>`

`infra/api/deploy.sh` is implemented with AWS SAM and deploys:

- `GET /api/catalog/tile-packs`
- `POST /api/billing/checkout-session` (placeholder stub)
- `GET /api/capabilities/me` (placeholder stub)

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
- `STRIPE_SECRET_KEY` (`sk_test_` for dev/staging, `sk_live_` for prod)
- `STRIPE_WEBHOOK_SECRET` (when webhooks are introduced)
- `COGNITO_USER_POOL_ID`
- `COGNITO_APP_CLIENT_ID`
- `DOWNLOADS_BUCKET_NAME`
- `API_BASE_URL` (frontend consumption; emitted/output by infra)

## GitHub secrets/variables expected by workflow

- Variables:
  - `AWS_REGION`
- Secrets:
  - `AWS_ROLE_TO_ASSUME_DEV`
  - `AWS_ROLE_TO_ASSUME_STAGING`
  - `AWS_ROLE_TO_ASSUME_PROD`

Each environment (`dev`, `staging`, `prod`) can add approval rules in GitHub settings, especially for `prod`.
