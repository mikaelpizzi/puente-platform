# Secrets Management Policy

This document defines how the "Plataforma-Puente" team stores, rotates and audits secrets across every provider in the Franken-stack (Fly.io, Render, Aiven, MongoDB Atlas and payment gateways). It enforces the engineering standards described in `ARCHITECTURE.md` §4.5–4.7: reproducible local setups, CI/CD discipline and zero leaked credentials.

## Core principles
1. **No secret ever lives in the git history.** Local values live only in untracked `.env` files or OS keychains.
2. **Least privilege & scoped tokens.** Every provider key is tied to a dedicated CI/service account with read/write scopes that match the microservicio.
3. **Encryption everywhere.** Use TLS URLs (`postgresqls://`, `rediss://`) and provider-side encryption at rest.
4. **Rotation on a schedule or incident.** 90-day max lifetime for all API tokens; immediate rotation after personnel changes or suspected compromise.
5. **Single source of truth.** `.env.example` + this policy are the contract; CI obtains secrets from GitHub Environments, not from developers' machines.

## Secret inventory and storage map

| Domain | Variables (prefix) | Provider | Storage location |
| --- | --- | --- | --- |
| Auth service | `AUTH_*`, `FLY_AUTH_*` | Fly.io + Aiven PostgreSQL | Local `.env`, GitHub Environment `auth-service`, Fly.io secrets vault |
| Products service | `PRODUCTS_*`, `MONGO_*` | MongoDB Atlas | Local `.env`, GitHub `products-service`, Atlas project API key |
| Finance service | `FINANCE_*`, `MERCADO_PAGO_*`, `BINANCE_*` | Aiven PostgreSQL + payment processors | Local `.env`, GitHub `finance-service`, secure password manager for finance team |
| Logistics service | `LOGISTICS_*`, `VALKEY_*` | Aiven Valkey | Local `.env`, GitHub `logistics-service`, Aiven console |
| Frontend PWA | `VITE_*`, `RENDER_*` | Render static hosting | Local `.env`, GitHub `frontend`, Render dashboard |
| CI/CD deployers | `FLY_API_TOKEN`, `RENDER_API_KEY`, `AIVEN_API_TOKEN` | GitHub Actions | GitHub `org-level secrets` scoped to workflows |

> **Actionable step:** After cloning the repo, copy `.env.example` to `.env` (per service) and fill placeholders locally. Confirm `git status` is clean before committing.

## Provider-specific policies

### Fly.io (Docker microservices)
- Secrets injected via `fly secrets set VAR=value` per app (auth, products, finance, logistics).
- CI uses `FLY_API_TOKEN` stored in the `deploy` GitHub Environment with required reviewers enabled.
- Rotate tokens quarterly; revoke tokens immediately after running `fly auth logout` on temporary machines.

### Render (static PWA hosting)
- Use Render dashboard environment variables for build/runtime (e.g., `VITE_API_GATEWAY_URL`).
- Never bake Render API keys into the frontend bundle; keep them server-side for deploy hooks only.
- If Render deploy hooks are enabled, store `RENDER_API_KEY` in the GitHub `frontend` environment and disable after each incident response test.

### Aiven (PostgreSQL & Valkey)
- Generate separate service users per microservicio (`auth_rw`, `finance_rw`, `logistics_cache`).
- Enforce SSL mode `require`; URLs should start with `postgresqls://` / `rediss://`.
- Store admin tokens in the company password manager. Only CI tokens live in GitHub secrets.

### MongoDB Atlas
- Create a dedicated project for `products-service`. Usernames follow `svc-<env>-products`.
- Restrict network access lists to Fly.io and developer IP ranges.
- Keep public/private keys (`MONGO_ATLAS_PUBLIC_KEY`, `MONGO_ATLAS_PRIVATE_KEY`) only in GitHub Environments and Vault; rotate keys every 60 days.

### Payment providers (Mercado Pago, Binance P2P, future PSPs)
- Treat all API keys, webhook secrets and merchant IDs as finance-grade secrets.
- For Mercado Pago, separate production vs. sandbox credentials; store sandbox keys in the `finance-service` GitHub Environment, production keys in the organization vault with manual approval for access.
- For Binance P2P (USDT), enforce IP whitelisting and HMAC verification; never log request signatures.
- Document every payment provider credential in the finance runbook with owner + expiration date.

## Local developer workflow
1. Duplicate `.env.example` → `.env` (root or package-specific) and fill placeholders.
2. Keep `.env` files untracked (already listed in `.gitignore`). Verify before every commit:
   ```powershell
   git status --short -- .env
   ```
   This command must return nothing; otherwise remove the file from staging with `git restore --staged .env`.
3. Use a secrets manager (1Password, Bitwarden, OS keychain) to store real values. Never paste secrets into pull request descriptions or issue comments.

## GitHub Actions & CI
- Workflows must reference secrets from **environments** (`env: deploy`, `env: staging`) instead of repo-level secrets when a manual approval is required.
- Use `permissions: contents: read` by default; elevate only per job when interacting with registries.
- Mask secrets in logs via `::add-mask::` if a command may echo sensitive output.

## Incident response & rotation playbook
1. **Detection:** Any suspicion (unexpected login, leaked log) triggers immediate revocation of the affected token.
2. **Containment:** Disable compromised tokens/keys in the provider console.
3. **Eradication:** Rotate credentials and update the `.env` placeholders if formats change.
4. **Recovery:** Re-deploy services using the new secrets, confirm health checks.
5. **Post-mortem:** Document the event in `docs/security/incidents/<date>.md` (create folder when first needed) and update this policy if gaps were found.

## Secret handling checklist (attach to each PR)
- [ ] `.env` / secrets files are ignored locally (`git status` shows a clean tree).
- [ ] Added/updated variables documented in `.env.example` and this policy.
- [ ] GitHub Actions workflows reference secrets via environments, not inline literals.
- [ ] Screenshots/logs in the PR redact tokens or IDs.
- [ ] (Optional) Fly.io / Render dashboards reviewed after rotation.

**Signature (type name + date when submitting PR):** `________________________`
