# Secrets and environment variables

This document explains the secrets required to run and deploy the project.

Server-side (required):
- `FIREBASE_SERVICE_ACCOUNT` (GitHub Actions secret)
  - Value: full JSON contents of a Google service account key (downloaded from GCP). This is used by `firebase-admin` and to generate GCS signed URLs.
  - How to create: Google Cloud Console -> IAM & Admin -> Service Accounts -> Create Service Account -> Grant `Storage Admin` role -> Create Key (JSON) -> copy the JSON into the GitHub secret.

Build / Client (public values but required at build time):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Set these as GitHub Secrets with the exact names above (or in Cloudflare Pages environment variables). The workflow will inject them into the `build-client` job so the client is built with the correct Firebase config.

Optional:
- `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` (for Cloudflare Pages deploy)
- `GCLOUD_STORAGE_BUCKET` (if you want to explicitly set the bucket name at runtime)
