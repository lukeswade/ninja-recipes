CI / Deployment notes

- FIREBASE_SERVICE_ACCOUNT: already added as a repository secret in `ninja-recipes`.
- CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID: add these as repo secrets if you want automatic Pages deploys.

Quick local commands:

```bash
# install root deps
npm ci
# build client
npm run build
# run server locally (dev)
npm run dev
```
