#!/usr/bin/env zsh
# Secure helper to set GitHub repository secrets using the gh CLI.
# Usage: ./scripts/set-github-secrets.sh

set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found. Install it: https://cli.github.com/" >&2
  exit 1
fi

echo "This script will set the following repository secrets using the gh CLI:"
echo "  FIREBASE_SERVICE_ACCOUNT"
echo "  VITE_FIREBASE_API_KEY"
echo "  VITE_FIREBASE_AUTH_DOMAIN"
echo "  VITE_FIREBASE_PROJECT_ID"
echo "  VITE_FIREBASE_STORAGE_BUCKET"
echo "  VITE_FIREBASE_MESSAGING_SENDER_ID"
echo "  VITE_FIREBASE_APP_ID"
echo
read -r "REPO?Enter the target repository (owner/repo), e.g. lukeswade/ninja-recipes: "

echo "Verifying gh authentication..."
if ! gh auth status --hostname github.com >/dev/null 2>&1; then
  echo "gh is not authenticated. Run 'gh auth login' first." >&2
  exit 1
fi

set_secret() {
  local name="$1"
  echo
  echo "Enter value for secret '$name' (input is hidden):"
  read -rs value
  echo
  if [ -z "$value" ]; then
    echo "No value provided for $name; skipping."
    return
  fi
  echo "Setting secret $name for $REPO..."
  gh secret set "$name" --repo "$REPO" --body "$value"
  echo "Set $name"
}

set_secret "FIREBASE_SERVICE_ACCOUNT"
set_secret "VITE_FIREBASE_API_KEY"
set_secret "VITE_FIREBASE_AUTH_DOMAIN"
set_secret "VITE_FIREBASE_PROJECT_ID"
set_secret "VITE_FIREBASE_STORAGE_BUCKET"
set_secret "VITE_FIREBASE_MESSAGING_SENDER_ID"
set_secret "VITE_FIREBASE_APP_ID"

echo "All done. Verify your secrets at: https://github.com/$REPO/settings/secrets/actions"
