# Smartfit.am

Smartfit.am is a gym website and internal gym-management MVP. It combines a public website and live occupancy page with protected admin and registration workspaces.

## MVP Features

- Public pages for the gym, coaches, packages, gallery, contact details, and live occupancy
- ADMIN-only settings, public content, coach, package, customer, logs, exports, and analytics pages
- Shared ADMIN and REGISTRATION customer lookup, package review, check-in/check-out, occupancy correction, session correction, and customer notes
- Audit logging for operational changes
- Private Excel exports generated in memory
- Optional Cloudinary image uploads for admin-managed public content

## Requirements

- Node.js 20.9 or newer
- npm
- PostgreSQL

## Local Setup

1. Copy `.env.example` to `.env`.
2. Replace every placeholder in `.env` with local values. Never commit `.env`.
3. Install dependencies and prepare the database:

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
```

4. Start the application:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | Long random secret used to sign staff sessions |
| `NEXT_PUBLIC_SITE_URL` | Yes for deployment | Public site origin used for canonical, sitemap, and social metadata URLs |
| `SEED_ADMIN_USERNAME` | For intentional seed runs | Initial admin username |
| `SEED_ADMIN_EMAIL` | For intentional seed runs | Initial admin email |
| `SEED_ADMIN_PASSWORD` | For intentional seed runs | Initial admin password |
| `SEED_REGISTRATION_USERNAME` | For intentional seed runs | Initial registration username |
| `SEED_REGISTRATION_EMAIL` | For intentional seed runs | Initial registration email |
| `SEED_REGISTRATION_PASSWORD` | For intentional seed runs | Initial registration password |
| `CLOUDINARY_CLOUD_NAME` | For file uploads | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | For file uploads | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | For file uploads | Cloudinary API secret; server-only |
| `CLOUDINARY_UPLOAD_FOLDER` | No | Cloudinary folder, defaults to `smartfit-am` |
| `CUSTOMER_DOCUMENT_STORAGE_PROVIDER` | For customer documents | Private customer document provider, currently `cloudinary` |
| `CUSTOMER_DOCUMENT_MAX_FILE_SIZE_MB` | No | Customer document upload limit, capped at 10 MB |
| `CUSTOMER_DOCUMENT_ALLOWED_MIME_TYPES` | No | Customer document MIME allowlist; safe values are PDF, JPEG, and PNG |
| `CUSTOMER_DOCUMENT_CLOUDINARY_FOLDER` | No | Cloudinary folder for private customer documents |
| `CUSTOMER_DOCUMENT_CLOUDINARY_DELIVERY_TYPE` | No | Cloudinary delivery type for customer documents; use `authenticated` or `private` |

## Routes and Access

Public routes:

- `/`
- `/about`
- `/coaches`
- `/packages`
- `/gallery`
- `/contact`
- `/our-app`
- `/login`

Protected routes:

- `/admin/*` requires an active ADMIN account.
- `/registration` requires an active ADMIN or REGISTRATION account.
- `/api/admin/export` requires an active ADMIN account.
- Internal customer-notes APIs require an active staff account.

## Seed Behavior

`npm run db:seed` upserts the configured ADMIN and REGISTRATION accounts, creates the singleton gym settings record when missing, and creates an occupancy state when missing. Seed credentials come from the real `.env`; `.env.example` contains placeholders only.

Run the seed intentionally. Before any production seed run, set strong unique passwords and a strong `AUTH_SECRET`.

### Local Demo Data

The separate demo seed prepares the official package list, demo coaches, and demo customers for local workflow testing. New demo customers start outside the gym. The seed is idempotent and does not create visits, check-ins, session changes, audit logs, or occupancy changes; repeat runs preserve existing customer presence workflow state.

The script refuses to run without an explicit one-command safety flag and also blocks database hosts or names that look production-like. Run it only after confirming the connected database is local or disposable development data.

macOS/Linux:

```bash
ALLOW_DEMO_SEED=true npm run db:seed:demo
```

PowerShell:

```powershell
$env:ALLOW_DEMO_SEED="true"; npm run db:seed:demo
```

Do not add `ALLOW_DEMO_SEED` permanently to a production environment.

## Image Uploads

Admin image fields accept a public `http` or `https` URL. With Cloudinary configured, they also accept a local image file and store only the resulting public URL.

`CLOUDINARY_API_SECRET` is used only by server-side upload actions. Pasted image URLs continue to work when Cloudinary is not configured.

## Customer Document Storage

Customer documents use a separate private storage foundation from public image uploads. The current provider is Cloudinary with authenticated/private delivery; the database stores provider metadata and private object keys, not public `secure_url` values or file bytes.

Document access must go through Admin-only server logic that validates the staff role before creating a short-lived private download URL. Archive keeps metadata and the provider object for retention; physical deletion is limited to internal cleanup for failed metadata writes until deletion policy is confirmed.

Cloudflare/R2 can be added later by implementing a new customer-document storage adapter and switching `CUSTOMER_DOCUMENT_STORAGE_PROVIDER`; it is not a one-URL swap.

## Verification

```bash
npm run typecheck
npm run db:validate
npm run build
```

There is currently no configured lint or automated test command. Complete the manual route, role, and core workflow checks in [DEPLOYMENT.md](DEPLOYMENT.md) before release.

For a focused Registration Panel demo and regression pass, use the
[Registration client review checklist](docs/07-registration-client-review-checklist.md).

For a complete public, customer, package, guest, service, and access review,
use the [post-MVP client review checklist](docs/08-post-mvp-client-review-checklist.md).

## Production Deployment

Set `NEXT_PUBLIC_SITE_URL` to the deployed HTTPS origin, such as
`https://smartfit.am`, before building the production application.

See [DEPLOYMENT.md](DEPLOYMENT.md) for environment, migration, seed, HTTPS, backup, security, and smoke-test steps.

Additional project reference material is stored in [`docs/`](docs/).
