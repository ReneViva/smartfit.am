# Smartfit.am Deployment Checklist

Use this checklist for staging and production deployments.

## 1. Runtime and Infrastructure

- Use Node.js 20.9 or newer.
- Provision a PostgreSQL database with backups enabled.
- Serve the application only over HTTPS.
- Keep `.env`, database credentials, `AUTH_SECRET`, seed passwords, and Cloudinary credentials outside source control.
- Confirm the deployment platform persists no generated export files. Exports are generated in memory by the application.

## 2. Environment

Set these required production values:

```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="a-long-random-production-secret"
```

Set seed credentials only when an intentional production seed is required:

```env
SEED_ADMIN_USERNAME="..."
SEED_ADMIN_EMAIL="..."
SEED_ADMIN_PASSWORD="..."
SEED_REGISTRATION_USERNAME="..."
SEED_REGISTRATION_EMAIL="..."
SEED_REGISTRATION_PASSWORD="..."
```

Set these values to enable file uploads:

```env
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
CLOUDINARY_UPLOAD_FOLDER="smartfit-am"
```

Checklist:

- `AUTH_SECRET` is long, random, production-specific, and stored as a secret.
- Seed passwords are strong, unique, and production-specific.
- Cloudinary API secret is never exposed to browser code.
- `.env` and `.env.local` are not committed.
- `.env.example` contains placeholders only.

Changing `AUTH_SECRET` invalidates existing staff sessions. Staff will need to sign in again.

## 3. Install and Build

```bash
npm ci
npm run db:generate
npm run typecheck
npm run db:validate
npm run build
```

The project currently has no configured lint or automated test command. Do not treat their absence as a passing automated check; complete the smoke tests below.

## 4. Database Migration

Back up the database before applying migrations.

For production, apply committed migrations without creating a new migration:

```bash
npx prisma migrate deploy
```

Do not run `npm run db:migrate` in production. That script uses `prisma migrate dev` and is intended for development.

After migration, verify:

```bash
npm run db:validate
```

## 5. Seed

Run the seed only when intentionally provisioning or updating the configured staff accounts:

```bash
npm run db:seed
```

The seed upserts the configured ADMIN and REGISTRATION users and creates missing singleton settings/occupancy records. Verify all `SEED_*` values before running it in production. Never use placeholder or development passwords.

## 6. Start

```bash
npm run start
```

The hosting platform should run the built Next.js application behind HTTPS and restart it on process failure.

## 7. Security and Privacy Smoke Tests

- Signed-out visitors can open `/`, `/about`, `/coaches`, `/packages`, `/gallery`, `/contact`, `/our-app`, and `/login`.
- Signed-out visitors are redirected from `/admin`, `/admin/*`, and `/registration`.
- ADMIN can open all admin routes and `/registration`.
- REGISTRATION can open `/registration` and is redirected away from every `/admin/*` route.
- Logout removes the session and blocks subsequent private-route access.
- A forged or stale `smartfit_session` cookie does not grant access.
- `/api/admin/export` returns `401` signed out and `403` for REGISTRATION.
- Internal notes APIs return `401` signed out.
- Public pages expose no customer records, notes, visits, audit logs, exports, analytics, staff credentials, or secrets.

## 8. Core Workflow Smoke Test

Use clearly marked temporary data and delete it after verification:

1. Sign in as ADMIN.
2. Create a temporary coach, package, customer, and customer-package assignment.
3. Sign in as REGISTRATION and find the customer by name and member code.
4. Verify manual session correction saves and is logged.
5. Check in with a selected package and confirm one session is deducted.
6. Confirm a duplicate check-in is blocked.
7. Check out and confirm occupancy returns to its prior value.
8. Create, edit, and delete a customer note.
9. Sign in as ADMIN and verify logs, all export categories, and analytics.
10. Delete temporary records and restore occupancy.

## 9. Cloudinary Verification

- Verify URL-based images still work without Cloudinary.
- With Cloudinary configured, upload a small supported image from an ADMIN form.
- Confirm the browser receives only the resulting image URL, never the API secret.
- Confirm an invalid or oversized file returns a clear form error.

## 10. Backups, Monitoring, and Recovery

- Enable scheduled PostgreSQL backups and test a restore procedure.
- Take a backup before migrations and significant data changes.
- Monitor application errors, database availability, disk/memory use, and failed deployments.
- Keep the previous deploy artifact available for rollback.
- If a deployment must be rolled back after a migration, restore a compatible database backup or follow a reviewed forward-fix migration plan.

## 11. Known Release Considerations

- Analytics uses application-server local time for daily boundaries and peak-hour grouping. Configure the production server timezone intentionally.
- No automated lint or test command is configured yet; manual smoke testing is required.
- Review `npm audit --omit=dev` results before release and track unresolved framework/transitive advisories.
