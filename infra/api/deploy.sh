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
  --parameter-overrides "Stage=${stage}"

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
