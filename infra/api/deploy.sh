#!/usr/bin/env bash

set -euo pipefail

stage="${1:-}"
if [[ -z "$stage" ]]; then
  echo "Usage: infra/api/deploy.sh <dev|staging|prod>"
  exit 1
fi

case "$stage" in
  dev|staging|prod) ;;
  *)
    echo "Invalid stage '$stage'. Expected one of: dev, staging, prod."
    exit 1
    ;;
esac

if ! command -v sam >/dev/null 2>&1; then
  echo "AWS SAM CLI is required but not installed."
  echo "Install SAM CLI locally, or deploy via GitHub Actions (which installs SAM automatically)."
  exit 1
fi

stack_name="gridsmith-api-${stage}"
region="${AWS_REGION:-us-east-1}"
template_path="infra/api/template.yaml"

# Load repo-root .env (gitignored) for deploy parameters.
_repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
if [[ -f "${_repo_root}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${_repo_root}/.env"
  set +a
fi

stripe_secret_arn="${STRIPE_SECRET_ARN:-}"
if [[ -z "${stripe_secret_arn}" ]]; then
  echo "ERROR: STRIPE_SECRET_ARN must be set to the Secrets Manager ARN for your Stripe secret (e.g. arn:aws:secretsmanager:REGION:ACCOUNT:secret:stripe_test-XXXXXX)."
  echo "Export it in the shell, or add STRIPE_SECRET_ARN=... to the repo-root .env file."
  exit 1
fi

cognito_pool="${COGNITO_USER_POOL_ID:-}"
cognito_client="${COGNITO_CLIENT_ID:-}"
public_origin="${PUBLIC_APP_ORIGIN:-}"
if [[ -z "${cognito_pool}" || -z "${cognito_client}" ]]; then
  echo "ERROR: Set COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID (same names/values as the SPA webpack env)."
  exit 1
fi
if [[ -z "${public_origin}" ]]; then
  echo "ERROR: Set PUBLIC_APP_ORIGIN to your live site origin with no trailing slash (e.g. http://localhost:4000 for local dev, or https://your-domain.com for prod)."
  exit 1
fi

echo "Building SAM template for stage '${stage}'..."
sam build --template-file "${template_path}" --cached

echo "Deploying stack '${stack_name}' to region '${region}'..."
sam deploy \
  --stack-name "${stack_name}" \
  --region "${region}" \
  --resolve-s3 \
  --capabilities CAPABILITY_IAM \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset \
  --parameter-overrides \
    "Stage=${stage}" \
    "StripeSecretArn=${stripe_secret_arn}" \
    "CognitoUserPoolId=${cognito_pool}" \
    "CognitoAppClientId=${cognito_client}" \
    "PublicAppOrigin=${public_origin}"

echo "Reading deployed API base URL..."
api_base_url="$(
  aws cloudformation describe-stacks \
    --region "${region}" \
    --stack-name "${stack_name}" \
    --query "Stacks[0].Outputs[?OutputKey=='ApiBaseUrl'].OutputValue" \
    --output text
)"

if [[ -n "${api_base_url}" && "${api_base_url}" != "None" ]]; then
  echo "API_BASE_URL=${api_base_url}"
else
  echo "Deploy succeeded, but ApiBaseUrl output was not found."
fi

downloads_bucket="$(
  aws cloudformation describe-stacks \
    --region "${region}" \
    --stack-name "${stack_name}" \
    --query "Stacks[0].Outputs[?OutputKey=='TilePackDownloadsBucketName'].OutputValue" \
    --output text 2>/dev/null || true
)"
if [[ -n "${downloads_bucket}" && "${downloads_bucket}" != "None" ]]; then
  echo "TILE_PACK_DOWNLOADS_BUCKET=${downloads_bucket}"
fi
