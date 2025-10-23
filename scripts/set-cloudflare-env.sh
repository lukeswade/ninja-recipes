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

# Function to set a single variable
set_var() {
  local key="$1"
  local value="$2"
  echo "Setting $key..."
  
  # Using a here-doc for the JSON payload to avoid quoting madness
  local payload
  payload=$(cat <<EOF
{
  "name": "$key",
  "value": "$value",
  "type": "secret_text"
}
EOF
)

  response=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/variables" \
    -H "Authorization: Bearer ${API_TOKEN}" \
    -H 'Content-Type: application/json' \
    --data-binary "$payload")

  # Basic error checking from the response
  if echo "$response" | grep -q '"success":false'; then
    echo "Error setting variable $key:" >&2
    echo "$response" >&2
  else
    echo "Successfully set $key."
  fi
}

# Helper to prompt for a secret and call set_var
prompt_and_set_secret() {
  local name="$1"
  echo
  echo "Enter value for secret '$name' (input is hidden):"
  read -rs value
  echo
  if [ -z "$value" ]; then
    echo "No value provided for $name; skipping."
    return
  fi
  set_var "$name" "$value"
}

# Prompt for all required secrets
prompt_and_set_secret "FIREBASE_SERVICE_ACCOUNT"
prompt_and_set_secret "VITE_FIREBASE_API_KEY"
prompt_and_set_secret "VITE_FIREBASE_AUTH_DOMAIN"
prompt_and_set_secret "VITE_FIREBASE_PROJECT_ID"
prompt_and_set_secret "VITE_FIREBASE_STORAGE_BUCKET"
prompt_and_set_secret "VITE_FIREBASE_MESSAGING_SENDER_ID"
prompt_and_set_secret "VITE_FIREBASE_APP_ID"

echo
echo "All done. Verify your environment variables in the Cloudflare Pages dashboard."