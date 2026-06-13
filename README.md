# Smartfit.am

Smartfit.am is a gym website and gym management system. The repository currently contains the runnable project baseline, visual/layout foundation, Prisma database foundation, and internal staff authentication.

## Local Setup

Requirements:

- Node.js 20.9 or newer
- npm

Install dependencies and start the development server:

```bash
npm install
npm run db:generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the placeholder homepage.

## Verification

```bash
npm run typecheck
npm run build
npm run db:validate
```

## Database Setup

Copy `.env.example` to `.env`, replace the placeholder PostgreSQL connection string, and set `AUTH_SECRET` to a long random value. `.env` is ignored by Git and must not be committed.

```bash
npm run db:migrate
npm run db:seed
```

The seed creates development-only admin and registration staff records, one Smartfit.am settings record, and an occupancy state with a count of `0`.

## Local Development Login

Staff credentials come from the `SEED_*` variables in `.env`. When those variables are missing, the seed uses these safe local defaults:

| Role | Username | Email | Password |
|---|---|---|---|
| Admin | `admin` | `admin@smartfit.local` | `Admin123!` |
| Registration | `registration` | `registration@smartfit.local` | `Registration123!` |

Run `npm run db:seed` after changing any seed credential. Use `/login` with either the username or email. `/admin` is limited to admin staff, and `/registration` is limited to registration staff.

These credentials are development-only. Do not commit `.env`, and replace all credentials and secrets before production use.

Project documentation is stored in [`docs/`](docs/).
