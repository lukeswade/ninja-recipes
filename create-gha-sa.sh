#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="creamininja"
SA_NAME="gha-deployer"
SA_DISPLAY_NAME="GitHub Actions Deployer"
KEY_FILE="./gha-deployer-key.json"

echo "Creating service account..."
gcloud iam service-accounts create "$SA_NAME" \
  --project="$PROJECT_ID" \
  --display-name="$SA_DISPLAY_NAME"

SA_EMAIL="$(gcloud iam service-accounts list \
  --filter="displayName:$SA_DISPLAY_NAME" \
  --format='value(email)' \
  --project="$PROJECT_ID")"

echo "Granting IAM roles to $SA_EMAIL..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" --role="roles/run.admin"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" --role="roles/cloudbuild.builds.builder"

# Optional: artifact registry writer (ignore failure if not needed)
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" --role="roles/artifactregistry.writer" || true

echo "Creating service account key at $KEY_FILE..."
gcloud iam service-accounts keys create "$KEY_FILE" \
  --iam-account="$SA_EMAIL" --project="$PROJECT_ID"

echo "Key created. Inspecting client_email:"
jq -r .client_email "$KEY_FILE" || python -c "import json,sys; print(json.load(open('$KEY_FILE'))['client_email'])"

echo "Now upload $KEY_FILE to GitHub as FIREBASE_SERVICE_ACCOUNT secret (gh CLI or GitHub UI)."
echo "After upload, you can remove the key with: rm -f $KEY_FILE"
