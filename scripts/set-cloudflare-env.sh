#!/usr/bin/env zsh
# Set Cloudflare Pages environment variables for a project using the Cloudflare API.
# Requires CLOUDFLARE_API_TOKEN with appropriate scope and the account id and project name.

set -euo pipefail

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required" >&2
  exit 1
fi

read -r "ACCOUNT_ID?Cloudflare Account ID: "
read -r "PROJECT_NAME?Cloudflare Pages project name: "

if [ -z "$ACCOUNT_ID" ] || [ -z "$PROJECT_NAME" ]; then
  echo "Account ID and project name are required" >&2
  exit 1
fi

echo "Enter your Cloudflare API token (input hidden):"
read -rs API_TOKEN
echo

set_var() {
  key="$1"; value="$2"
  echo "Setting $key..."
  curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/variables" \
    -H "Authorization: Bearer ${API_TOKEN}" \
    -H 'Content-Type: application/json' \
    --data-binary '{"name":"'