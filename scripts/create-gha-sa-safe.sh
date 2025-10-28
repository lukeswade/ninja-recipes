#!/usr/bin/env bash
set -euo pipefail

# create-gha-sa-safe.sh
# Idempotent script to create a GitHub Actions service account for CI, grant roles,
# create a JSON key, and optionally upload it to GitHub Actions secrets.
#
# Usage:
#   ./scripts/create-gha-sa-safe.sh --project PROJECT_ID [--sa-name NAME] [--key-file FILE] [--upload]
#
# Example:
#   ./scripts/create-gha-sa-safe.sh --project creamininja --upload

print_help() {
  cat <<'EOF'
Usage: create-gha-sa-safe.sh --project PROJECT_ID [--sa-name NAME] [--key-file PATH] [--upload]

Options:
  --project PROJECT_ID   GCP project id (required)
  --sa-name NAME         Service account short name (default: gha-deployer)
  --key-file PATH        Path to write the JSON key (default: ./gha-deployer-key.json)
  --upload               If present, will attempt to upload the key to GitHub Actions secret FIREBASE_SERVICE_ACCOUNT using gh CLI
  --help                 Show this help
EOF
}

# Defaults
SA_NAME="gha-deployer"
KEY_FILE="./gha-deployer-key.json"
UPLOAD_TO_GH=false
PROJECT_ID=""

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --project)
      PROJECT_ID="$2"; shift 2;;
    --sa-name)
      SA_NAME="$2"; shift 2;;
    --key-file)
      KEY_FILE="$2"; shift 2;;
    --upload)
      UPLOAD_TO_GH=true; shift 1;;
    --help)
      print_help; exit 0;;
    *)
      echo "Unknown arg: $1"; print_help; exit 2;;
  esac
done

if [[ -z "$PROJECT_ID" ]]; then
  echo "ERROR: --project PROJECT_ID is required"
  print_help
  exit 2
fi

SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "Project: $PROJECT_ID"
echo "Service account name: $SA_NAME"
echo "Service account email: $SA_EMAIL"

echo "Checking gcloud auth..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" >/dev/null 2>&1; then
  echo "No active gcloud account found. Run 'gcloud auth login' and ensure you have project/iam permissions." >&2
  exit 1
fi

# Ensure project exists / is set
gcloud config set project "$PROJECT_ID" >/dev/null

# Check if the service account exists
if gcloud iam service-accounts list --project="$PROJECT_ID" --filter="email:$SA_EMAIL" --format="value(email)" | grep -q .; then
  echo "Service account $SA_EMAIL already exists. Skipping creation."
else
  echo "Creating service account $SA_NAME..."
  gcloud iam service-accounts create "$SA_NAME" \
    --project="$PROJECT_ID" \
    --display-name="GitHub Actions Deployer" 
  echo "Created service account."
fi

# Verify SA_EMAIL again
if ! gcloud iam service-accounts list --project="$PROJECT_ID" --filter="email:$SA_EMAIL" --format="value(email)" | grep -q .; then
  echo "ERROR: Could not find service account email $SA_EMAIL after creation. Aborting." >&2
  exit 1
fi

# Helper to add role with a clear message
add_role() {
  local ROLE="$1"
  echo "Granting role $ROLE to $SA_EMAIL..."
  if gcloud projects add-iam-policy-binding "$PROJECT_ID" \
       --member="serviceAccount:$SA_EMAIL" --role="$ROLE"; then
    echo "Granted $ROLE"
  else
    echo "Failed to grant $ROLE. Here's the last gcloud error. You may need Owner/IAM Admin privileges, or the organization enforces conditions on bindings." >&2
    return 1
  fi
}

# Roles required for Cloud Run source builds
ROLES=(
  "roles/run.admin"
  "roles/iam.serviceAccountUser"
  "roles/cloudbuild.builds.builder"
)

# Optionally add artifact registry writer if available
ROLES_OPTIONAL=(
  "roles/artifactregistry.writer"
)

# Grant roles
for r in "${ROLES[@]}"; do
  add_role "$r" || { echo "Role grant failed for $r"; exit 1; }
done

# Try optional ones but don't fail the whole script if they error
for r in "${ROLES_OPTIONAL[@]}"; do
  echo "Attempting optional role $r (non-fatal)..."
  if gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$SA_EMAIL" --role="$r"; then
    echo "Granted optional role $r"
  else
    echo "Optional role $r could not be granted (ignored)."
  fi
done

# Create key
if [[ -f "$KEY_FILE" ]]; then
  echo "Key file $KEY_FILE already exists. Will back it up to ${KEY_FILE}.bak"
  mv "$KEY_FILE" "${KEY_FILE}.bak"
fi

echo "Creating key file at $KEY_FILE..."
gcloud iam service-accounts keys create "$KEY_FILE" --iam-account="$SA_EMAIL" --project="$PROJECT_ID"

# Inspect client_email
if command -v jq >/dev/null 2>&1; then
  CLIENT_EMAIL=$(jq -r .client_email "$KEY_FILE")
else
  CLIENT_EMAIL=$(python - <<PY
import json
print(json.load(open('$KEY_FILE'))['client_email'])
PY
)
fi

if [[ "$CLIENT_EMAIL" != "$SA_EMAIL" ]]; then
  echo "WARNING: client_email in key ($CLIENT_EMAIL) does not match expected SA email ($SA_EMAIL)" >&2
else
  echo "Created key for $CLIENT_EMAIL"
fi

if [[ "$UPLOAD_TO_GH" = true ]]; then
  if ! command -v gh >/dev/null 2>&1; then
    echo "gh CLI not found; cannot upload secret. Install gh or upload via GitHub UI." >&2
    exit 1
  fi

  echo "Uploading key to GitHub Actions secret FIREBASE_SERVICE_ACCOUNT..."
  gh auth status >/dev/null 2>&1 || { echo "Please run 'gh auth login' to authenticate GH CLI." >&2; exit 1; }

  # read key content safely and set secret. This requires repo-level permissions for gh.
  set +e
  gh secret set FIREBASE_SERVICE_ACCOUNT --body "$(cat "$KEY_FILE")"
  GH_EXIT=$?
  set -e
  if [[ $GH_EXIT -ne 0 ]]; then
    echo "gh secret set failed (exit $GH_EXIT). You can upload $KEY_FILE via the GitHub UI at: Settings → Secrets & variables → Actions" >&2
  else
    echo "Uploaded FIREBASE_SERVICE_ACCOUNT secret to GitHub successfully."
  fi
fi

cat <<EOF

Done.
- Service account: $SA_EMAIL
- Key file: $KEY_FILE
IMPORTANT: treat the JSON key as a secret. Remove local copies after upload if you're finished:
  rm -f "$KEY_FILE"

Now re-run the GitHub Actions workflow or trigger a new commit to test deployment.
EOF
