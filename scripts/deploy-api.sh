#!/usr/bin/env bash

set -euo pipefail

stage=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --stage)
      stage="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

if [[ -z "$stage" ]]; then
  echo "Missing required --stage argument (dev|staging|prod)."
  exit 1
fi

case "$stage" in
  dev|staging|prod) ;;
  *)
    echo "Invalid stage '$stage'. Expected one of: dev, staging, prod."
    exit 1
    ;;
esac

echo "Starting API deploy for stage: $stage"

# Contract: this repository-level wrapper stays stable while IaC implementation
# can evolve behind infra/api/deploy.sh (SAM/CDK/Terraform/serverless).
if [[ ! -f "infra/api/deploy.sh" ]]; then
  echo "No infra deploy implementation found at infra/api/deploy.sh."
  echo "Scaffold is in place; add infra/api/deploy.sh to perform real deploys."
  exit 0
fi

bash "infra/api/deploy.sh" "$stage"
