# Smartfit.am — Development Phases

**Document path:** `docs/05-development-phases.md`  
**Project:** Smartfit.am  
**Document type:** Controlled development phase plan  
**Purpose:** Official controlled implementation order for the completed Smartfit.am MVP and the manually approved post-MVP Registration Panel improvement phases.

---

## 1. Source Documents Used

This phase plan was created from the uploaded Smartfit.am project files only:

1. **`smartfit_am_website_specification_polished.docx`**  
   Main source for the confirmed Smartfit.am product requirements, user areas, roles, workflows, MVP scope, and open decisions.

2. **`docs/01-product-requirements.md` / `01-product-requirements.md`**  
   Product requirements document defining the confirmed MVP features, later scope, assumptions, business rules, and open client questions.

3. **`docs/02-technical-blueprint.md` / `02-technical-blueprint.md`**  
   Technical blueprint defining the preferred technical direction, application areas, frontend/backend strategy, authentication direction, settings, analytics, and unclear technical points.

4. **`docs/03-database-schema.md` / `03-database-schema.md`**  
   Database planning document defining confirmed data models, relationships, enums, validation notes, and database questions.

5. **`docs/04-routes-and-api.md` / `04-routes-and-api.md`**  
   Route and API planning document defining public routes, private admin routes, private registration routes, server actions, API routes, and permissions.

6. **`smartfit_design_colors.xlsx`**  
   Design color file used only for visual styling direction. It provides Smartfit.am brand colors, light theme colors, dark theme colors, button colors, and gym status colors.

No external sources were used.

---

## 2. Purpose of This File

This file is the official controlled development phase plan for Smartfit.am.

- This file controls the implementation order.
- Codex should follow this file phase by phase.
- ChatGPT should use this file when generating Codex prompts.
- New phases must not be invented automatically.
- Future changes require manually updating this document.
- If a feature does not fit into the approved phases, it must be placed under **Blocked / Unclear Items** instead of creating a new phase.
- Phase 0 through Phase 15 are the completed original MVP phases.
- Phase 16 through Phase 21 were manually added after MVP completion for confirmed Registration Panel improvements.

**This plan now contains Phase 0 through Phase 21. Phase 16 through Phase 21 were added manually by the project owner after MVP completion. Do not create Phase 22 or any later phase unless this document is manually updated again.**

---

## 3. Phase Control Rules

1. Do not skip phases.
2. Do not merge phases unless the project owner approves it.
3. Do not create new phase numbers.
4. Do not work on future phases early.
5. Do not implement unconfirmed features.
6. Do not refactor unrelated code during a phase.
7. Do not replace simple working code with unnecessary abstractions.
8. Do not split simple logic into too many files just to make the structure look larger.
9. Keep each phase small, focused, and easy to review.
10. Each phase must end with a summary of changed files.
11. Each phase must include manual verification steps.
12. Each phase must explain what was implemented and what was intentionally not implemented.
13. If Codex discovers a blocker, it should stop and report the issue instead of guessing.
14. If a requirement is unclear, Codex should mark it as blocked or ask for clarification.
15. Business-critical operations must remain server-side.
16. Public routes must never expose private customer, package ownership, notes, logs, or staff data.
17. Admin and Registration/Reception access must stay separated according to the uploaded requirements.
18. Phase 15 remains the final original MVP phase.
19. Post-MVP work must stay inside the manually approved Registration Panel improvement phases, Phase 16 through Phase 21.
20. Do not create Phase 22 or any later phase without another manual documentation update.

---

## 4. Full Phase Index

| Phase | Name | Main Goal | Depends On | Status |
|---|---|---|---|---|
| Phase 0 | Project Setup and Repository Baseline | Create the basic Smartfit.am app foundation and documentation structure | None | Complete |
| Phase 1 | Design System and App Layout | Apply Smartfit.am colors, global layout, navigation, and reusable UI basics | Phase 0 | Complete |
| Phase 2 | Database and Prisma Foundation | Add confirmed database models, migrations, seed data, and data access foundation | Phase 1 | Complete |
| Phase 3 | Authentication and Route Protection | Add internal login and protect Admin/Registration areas | Phase 2 | Complete |
| Phase 4 | Public Website Pages | Build public pages for gym information, offers, coaches, packages, contact, and app entry point | Phase 3 | Complete |
| Phase 5 | Public Our App and Live Occupancy Page | Build the no-login mobile app-like page with public occupancy and Add to Home Screen guidance | Phase 4 | Complete |
| Phase 6 | Admin Shell, Settings, and Public Content | Build admin panel foundation, settings management, and homepage content management | Phase 5 | Complete |
| Phase 7 | Admin Coaches and Packages | Build coach CRUD, package CRUD, and simple time-restriction configuration | Phase 6 | Complete |
| Phase 8 | Admin Customers and Package Assignment | Build customer CRUD, customer package assignment, and admin package overview | Phase 7 | Complete |
| Phase 9 | Registration Search and Customer Card | Build reception customer search, customer card, package display, and manual session correction UI | Phase 8 | Complete |
| Phase 10 | Check-In Workflow | Implement check-in, package selection, time restriction validation, session deduction, occupancy increase, and logs | Phase 9 | Complete |
| Phase 11 | Check-Out and Occupancy Correction | Implement check-out, occupancy decrease, and manual occupancy correction | Phase 10 | Complete |
| Phase 12 | Notes and Admin Logs | Implement operational notes and admin-visible audit log review | Phase 11 | Complete |
| Phase 13 | Excel Export | Add basic admin Excel exports for confirmed data categories | Phase 12 | Complete |
| Phase 14 | Basic Analytics | Add MVP analytics: current occupancy, daily check-ins, and peak hours | Phase 13 | Complete |
| Phase 15 | Final Testing and Deployment Preparation | Verify MVP completeness, security, private data protection, and deployment readiness | Phase 14 | Complete |
| Phase 16 | Registration Gap Audit and Missing Section Fixes | Audit and expose missing or hidden confirmed Registration Panel sections | Phase 15 | Planned |
| Phase 17 | Registration Customer Workspace Redesign | Redesign `/registration` as a professional daily reception workspace | Phase 16 | Planned |
| Phase 18 | Registration Notes and Activity Experience Polish | Improve customer notes and safe recent operational context | Phase 17 | Planned |
| Phase 19 | Registration Package Freeze and Reactivation | Add the simplest confirmed freeze/reactivation workflow after permission confirmation | Phase 18 | Planned |
| Phase 20 | Reception Workspace Controls and Operational Rules Display | Add reception-side view controls and read-only operational rules | Phase 19 | Planned |
| Phase 21 | Post-MVP Registration Regression and Client Review Preparation | Verify and prepare the improved Registration Panel for client review | Phase 20 | Planned |

**Original MVP phases:** Phase 0 through Phase 15, complete.
**Manually approved post-MVP phases:** Phase 16 through Phase 21.
**Current final approved phase:** Phase 21 — Post-MVP Registration Regression and Client Review Preparation.

---

## 5. Phase Details

# Phase 0 — Project Setup and Repository Baseline

## Goal

Create the basic Smartfit.am project foundation so all later phases have a clean starting point.

## Why This Phase Exists

The uploaded technical blueprint recommends building Smartfit.am as a single full-stack web application with public pages, private Admin Panel routes, private Registration Panel routes, server-side logic, and database-backed workflows.

## Source Requirements Covered

- Smartfit.am is both a public gym website and an internal management system.
- Preferred technical direction: Next.js, TypeScript, PostgreSQL, Prisma, Tailwind CSS.
- The system should stay simple, practical, and maintainable.

## What Codex Should Build

- Set up the basic project structure if it does not already exist.
- Add or verify TypeScript support.
- Add or verify Tailwind CSS support.
- Add basic app metadata using Smartfit.am.
- Add a simple README or project setup note if missing.
- Add a `docs/` folder if missing.
- Ensure the existing documentation files can be placed under `docs/`.
- Add basic environment variable placeholders only if required by the chosen stack.
- Add a simple health check or homepage placeholder so the app can run.

## What Codex Must Not Build

- Do not build Admin Panel features yet.
- Do not build Registration Panel features yet.
- Do not build database models yet.
- Do not build authentication yet.
- Do not build check-in/check-out logic yet.
- Do not add customer accounts, coach dashboard, payments, QR check-in, notifications, or multi-branch support.
- Do not create extra folders that are not needed yet.

## Suggested Files / Folders Likely Affected

- `README.md`
- `docs/`
- `package.json`
- `tsconfig.json`
- `next.config.*`
- `tailwind.config.*`
- `postcss.config.*`
- `app/`
- `app/page.*`
- `.env.example` if the project uses environment variables

## Data / Database Impact

No real database schema should be implemented in this phase.

## UI Impact

Only a basic placeholder UI or default homepage should exist.

## Backend / Logic Impact

No business logic should be implemented in this phase.

## Acceptance Criteria

- The app starts locally without errors.
- TypeScript is enabled.
- Tailwind CSS is available.
- The project clearly uses the Smartfit.am name.
- The `docs/` folder can store the project documentation files.
- No unconfirmed feature has been added.

## Manual Verification Checklist

- Start the development server.
- Open the homepage.
- Confirm the page loads.
- Confirm there are no TypeScript or build errors.
- Confirm no private feature routes were prematurely implemented.

## Completion Definition

Phase 0 is complete when the project has a clean runnable baseline and is ready for styling, layout, database, and feature work.

## Next Phase

Phase 1 — Design System and App Layout.

---

# Phase 1 — Design System and App Layout

## Goal

Apply the Smartfit.am visual foundation using the uploaded color file and create simple layout structures for public and private pages.

## Why This Phase Exists

The project must look consistent and client-ready without being overdesigned. The uploaded `smartfit_design_colors.xlsx` file defines Smartfit.am brand, theme, button, and status colors.

## Source Requirements Covered

- The public website must present the gym professionally and simply.
- The User Panel / Mobile App Experience must be mobile-first.
- The Registration Panel customer card must work on desktop, tablet, and mobile.
- Use uploaded design colors where available.

## What Codex Should Build

- Read `docs/design-colors.md` if available and use it as the main text source for Smartfit.am design tokens.
- Add global CSS variables or theme tokens based on the Smartfit.am color file.
- Include the main brand blue `#009BDF`.
- Include primary hover `#008AC7`.
- Include light theme colors such as white background, soft page background, primary text, secondary text, borders, and card backgrounds.
- Include dark theme colors if the project supports theme switching or needs dark-ready variables.
- Include button colors for primary, success, warning, and danger actions.
- Include status colors for low/medium/high crowd, In gym, Not in gym, expired, close to expiry, and active.
- Create simple public layout structure.
- Create simple private layout structure for Admin and Registration areas.
- Create reusable UI primitives only if they are immediately useful, such as button, card, badge, form field, table wrapper, and status label.
- Keep layout responsive and mobile-friendly.

## What Codex Must Not Build

- Do not build full page content yet.
- Do not build database-backed forms yet.
- Do not build check-in/check-out logic.
- Do not build animations or complex interactions unless already easy and minimal.
- Do not add a full design system library beyond what is needed.
- Do not invent pages beyond the route plan.

## Suggested Files / Folders Likely Affected

- `app/globals.css`
- `tailwind.config.*`
- `app/layout.*`
- `components/ui/`
- `components/layout/`
- `components/status/`
- `components/cards/`

## Data / Database Impact

No database changes.

## UI Impact

- Global styling is applied.
- Layout shells are created.
- Basic reusable visual components exist.
- Status colors are ready for occupancy and customer/package status displays.

## Backend / Logic Impact

No backend business logic.

## Acceptance Criteria

- Smartfit.am brand colors are available in the UI.
- Buttons have default and hover states.
- Status colors are available for occupancy and customer/package statuses.
- Public layout and private layout are simple and readable.
- Mobile responsiveness is considered from the beginning.
- No feature logic is implemented early.

## Manual Verification Checklist

- Open the homepage.
- Confirm colors match the uploaded color file direction.
- Resize the browser to mobile width.
- Confirm layout does not break.
- Confirm no admin/reception business features were implemented early.

## Completion Definition

Phase 1 is complete when the project has consistent Smartfit.am styling and simple reusable layout foundations.

## Next Phase

Phase 2 — Database and Prisma Foundation.

---

# Phase 2 — Database and Prisma Foundation

## Goal

Create the confirmed database foundation for Smartfit.am using the database planning document.

## Why This Phase Exists

Smartfit.am requires persistent records for internal users, settings, public content, customers, coaches, packages, customer package assignments, visits, session changes, occupancy, notes, and logs.

## Source Requirements Covered

- Database areas from `docs/03-database-schema.md`.
- Customers can have multiple packages.
- Packages can have optional time restrictions.
- Check-ins, check-outs, session changes, occupancy changes, notes, settings, and logs need persistent data.
- Public data and private data must remain separated.

## What Codex Should Build

- Add Prisma setup if not already present.
- Add the confirmed models from the database planning document.
- Include only confirmed or clearly necessary models.
- Add enums for staff role, customer status, gym presence status, customer package status, session change type, occupancy event type, audit action type, and public content type.
- Add a simple seed setup for safe generic development data.
- Seed one admin user and one registration user only for local testing if login needs seed accounts.
- Seed one `GymSettings` record with safe default public data.
- Seed `OccupancyState` with `currentCount = 0`.
- Add a small amount of demo data only if needed for manual testing.

## What Codex Must Not Build

- Do not add customer login tables.
- Do not add coach login tables.
- Do not add platform owner or multi-tenant tables.
- Do not add payment, ecommerce, QR, notification, loyalty, or group class tables.
- Do not add complex analytics aggregate tables unless later confirmed.
- Do not import real client/customer data.

## Suggested Files / Folders Likely Affected

- `prisma/schema.prisma`
- `prisma/seed.*`
- `lib/db.*`
- `.env.example`
- `package.json`
- `docs/03-database-schema.md` should not be changed unless explicitly requested

## Data / Database Impact

This phase creates the initial database schema and safe seed data.

## UI Impact

No major UI changes except possible development data appearing in later pages.

## Backend / Logic Impact

- Prisma client/database access foundation is created.
- No full feature actions should be built yet.

## Acceptance Criteria

- Prisma schema includes only confirmed models.
- The database can be migrated locally.
- Seed data can be inserted safely.
- Admin and registration test users exist only if authentication will use seeded users.
- Occupancy state starts at 0.
- No unconfirmed database models are added.

## Manual Verification Checklist

- Run the migration locally.
- Run the seed script if present.
- Confirm database tables exist.
- Confirm seed users/settings/occupancy are created.
- Confirm no unconfirmed tables exist.

## Completion Definition

Phase 2 is complete when the database foundation exists and later phases can safely build features on top of it.

## Next Phase

Phase 3 — Authentication and Route Protection.

---

# Phase 3 — Authentication and Route Protection

## Goal

Add internal login and protect Admin and Registration routes.

## Why This Phase Exists

The uploaded documents confirm that Admin Panel and Registration Panel are private working areas with different responsibilities. Public visitors and gym customers do not need login in the MVP.

## Source Requirements Covered

- Admin users have full access.
- Registration users have limited daily-operation access.
- Public website and public User Panel are no-login.
- Customer accounts are not part of MVP.
- Coach dashboard/login is not confirmed.

## What Codex Should Build

- Add a simple internal login flow.
- Support admin and registration staff roles.
- Redirect admin users to `/admin`.
- Redirect registration users to `/registration`.
- Protect `/admin` routes so only admin users can access them.
- Protect `/registration` routes so registration users can access them.
- Keep public routes accessible without login.
- Add logout behavior.
- Use the seeded users only for local/development if applicable.

## What Codex Must Not Build

- Do not build public customer signup.
- Do not build customer login.
- Do not build coach login.
- Do not build platform owner/master admin.
- Do not add complex permission systems beyond admin and registration access.
- Do not implement feature pages beyond placeholders if needed.

## Suggested Files / Folders Likely Affected

- `app/login/`
- `app/logout/` or logout action
- `app/admin/`
- `app/registration/`
- `middleware.*` if used
- `lib/auth.*`
- `lib/permissions.*`
- `components/auth/`

## Data / Database Impact

Uses `StaffUser` data from Phase 2. No new models should be added unless required by the chosen authentication method and already compatible with the schema.

## UI Impact

- A simple login page.
- Private route placeholders for Admin and Registration.
- Simple logout control.

## Backend / Logic Impact

- Session handling.
- Role checks.
- Route protection.

## Acceptance Criteria

- Public routes are accessible without login.
- `/admin` is not accessible to public users.
- `/registration` is not accessible to public users.
- Admin users can access `/admin`.
- Registration users can access `/registration`.
- Registration users cannot access admin-only pages.
- No customer or coach login exists.

## Manual Verification Checklist

- Open `/` while logged out.
- Open `/our-app` while logged out.
- Try `/admin` while logged out.
- Try `/registration` while logged out.
- Log in as admin and confirm redirect to `/admin`.
- Log in as registration staff and confirm redirect to `/registration`.
- Confirm logout works.

## Completion Definition

Phase 3 is complete when private access is protected and role separation works.

## Next Phase

Phase 4 — Public Website Pages.

---

# Phase 4 — Public Website Pages

## Goal

Build the main public Smartfit.am website pages.

## Why This Phase Exists

The uploaded documents confirm that Smartfit.am must have a regular public website presenting the gym, offers, coaches, packages, location, contact information, and the mobile app/live occupancy feature.

## Source Requirements Covered

- Public website pages: Home, About Us, Coaches, Packages, Contact, Our App.
- Homepage hero should show current offers/news/discounts/announcements.
- Public pages should be professional and simple.
- Public pages must not expose private customer data.

## What Codex Should Build

- Build public homepage `/`.
- Build `/about`.
- Build `/coaches`.
- Build `/packages`.
- Build `/contact`.
- Build `/gallery` as a confirmed MVP public page.
- Show gym photos, equipment, training areas, and atmosphere.
- Keep Gallery public-safe and do not expose private customer information.
- Link clearly to `/our-app`.
- Display public-safe data from settings, public content, active coaches, and active packages.
- Add safe empty states if content is missing.
- Keep public pages mobile-friendly.

## What Codex Must Not Build

- Do not build admin content forms in this phase.
- Do not build gallery management/upload.
- Do not build customer accounts.
- Do not expose customer names, customer IDs, package ownership, sessions, notes, logs, visits, or analytics.
- Do not build ecommerce checkout or online payments.
- Do not build group exercise registration.

## Suggested Files / Folders Likely Affected

- `app/page.*`
- `app/about/`
- `app/coaches/`
- `app/packages/`
- `app/contact/`
- `components/public/`
- `components/layout/PublicLayout.*`
- `lib/public-data.*`

## Data / Database Impact

Reads existing public-safe data. No schema changes.

## UI Impact

- Public website pages become visible.
- Active coaches and packages can appear publicly.
- Contact and location data appear publicly.
- Homepage includes offers/news/announcements if available.

## Backend / Logic Impact

- Public-safe read logic for settings, public content, coaches, and packages.
- Must filter out private/internal records.

## Acceptance Criteria

- `/` loads and presents Smartfit.am.
- `/about` loads.
- `/coaches` loads active coaches only.
- `/packages` loads active packages only.
- `/gallery` loads active gallery images.
- `/contact` loads public contact/location settings.
- Public pages work on mobile.
- Public pages do not expose private customer data.

## Manual Verification Checklist

- Open every public page.
- Confirm no page requires login.
- Confirm public pages do not show private data.
- Confirm pages have safe empty states.
- Confirm navigation to `/our-app` exists.
- Confirm `/gallery` displays active gallery images.
- Confirm mobile layout is readable.

## Completion Definition

Phase 4 is complete when the public website pages are usable, public-safe, and simple.

## Next Phase

Phase 5 — Public Our App and Live Occupancy Page.

---

# Phase 5 — Public Our App and Live Occupancy Page

## Goal

Build the public no-login mobile app-like page that shows live occupancy and Add to Home Screen instructions.

## Why This Phase Exists

The uploaded documents confirm that the User Panel / Mobile App Experience is public, no-login, mobile-first, and focused on current gym occupancy plus useful contact information.

## Source Requirements Covered

- Add Our App / Our App section.
- Public live occupancy count.
- Green/yellow/red crowd status.
- Public app display settings.
- Public page must not show private customer data.
- PWA-style Add to Home Screen experience, not a native app.

## What Codex Should Build

- Build `/our-app`.
- Show Smartfit.am logo if available.
- Show current occupancy count from `OccupancyState`.
- Apply green/yellow/red status using settings thresholds.
- Show motivational text if enabled.
- Show phone, WhatsApp, Instagram, and location link only if enabled.
- Add simple Add to Home Screen instructions.
- Add PWA metadata/icon support if simple and already supported by the app.
- Add `GET /api/public/occupancy` only if needed for polling or live refresh.

## What Codex Must Not Build

- Do not build native iOS or Android app features.
- Do not build App Store or Play Store functionality.
- Do not build push notifications.
- Do not expose customer names, customer IDs, packages, sessions, visits, notes, logs, or staff data.
- Do not implement real-time WebSockets unless the client confirms instant updates.

## Suggested Files / Folders Likely Affected

- `app/our-app/`
- `app/api/public/occupancy/` if needed
- `components/public/OccupancyDisplay.*`
- `components/public/AddToHomeScreenInstructions.*`
- `lib/occupancy/public.*`
- `app/manifest.*` if PWA metadata is implemented simply
- `public/` for icon assets if available

## Data / Database Impact

Reads `OccupancyState` and `GymSettings`. No schema changes.

## UI Impact

- Public mobile page shows live count and crowd status.
- Contact links and motivational text follow settings.
- Page is optimized for phone use.

## Backend / Logic Impact

- Public-safe occupancy read logic.
- Threshold-to-status calculation.
- Optional public API route for polling if chosen.

## Acceptance Criteria

- `/our-app` works without login.
- Current occupancy count appears.
- Green/yellow/red status changes based on thresholds.
- Disabled public app items do not appear.
- No private customer data appears.
- The page works well on mobile.
- If an API route exists, it returns only public-safe occupancy data.

## Manual Verification Checklist

- Open `/our-app` while logged out.
- Confirm occupancy appears.
- Change seed/settings thresholds manually or via admin later and verify color behavior.
- Confirm hidden contact links do not show.
- Confirm no private data appears in page source or API response.
- View on mobile width.

## Completion Definition

Phase 5 is complete when the public mobile page works and safely displays current occupancy and app instructions.

## Next Phase

Phase 6 — Admin Shell, Settings, and Public Content.

---

# Phase 6 — Admin Shell, Settings, and Public Content

## Goal

Build the admin foundation, settings management, and public content management.

## Why This Phase Exists

The Admin Panel is the main control center. Admin users must manage website content, settings, occupancy thresholds, public app display options, and public homepage offers/news/announcements.

## Source Requirements Covered

- Admin Panel basics.
- Website content management.
- Admin settings.
- Homepage content editable from Admin Panel.
- Occupancy color thresholds editable by admin.
- Public app display toggles editable by admin.
- Important admin edits should be logged.

## What Codex Should Build

- Build `/admin` landing page.
- Build `/admin/settings`.
- Build `/admin/content`.
- Add admin navigation.
- Add settings form for confirmed fields:
  - gym name
  - logo reference
  - contact number
  - WhatsApp link
  - Instagram link
  - address
  - map link
  - working days/hours
  - occupancy thresholds
  - public app visibility toggles
  - motivational text
  - hide inactive customers from registration view
- Add public content form/list for offers, promotions, discounts, news, announcements, and homepage hero content.
- Save settings and content server-side.
- Create logs for important settings/content edits.
- Keep forms simple and readable.

## What Codex Must Not Build

- Do not build package/customer/coach CRUD here.
- Do not build image upload unless media handling is already decided.
- Do not build advanced content lifecycle such as draft/published workflow unless already confirmed.
- Do not build export/analytics here.
- Do not build notification settings.

## Suggested Files / Folders Likely Affected

- `app/admin/page.*`
- `app/admin/settings/`
- `app/admin/content/`
- `components/admin/AdminNav.*`
- `components/admin/SettingsForm.*`
- `components/admin/PublicContentForm.*`
- `lib/actions/settings.*`
- `lib/actions/public-content.*`
- `lib/logging.*`

## Data / Database Impact

Uses `GymSettings`, `PublicContent`, `AuditLog`, and `StaffUser`. No new models should be added.

## UI Impact

- Admin landing page exists.
- Admin can edit settings.
- Admin can manage public content.
- Public website and `/our-app` can reflect settings/content changes.

## Backend / Logic Impact

- Admin-only server actions for settings and content.
- Logging helper may be introduced and reused later.
- Validation for thresholds, toggles, links, and content fields.

## Acceptance Criteria

- Only admin can access `/admin/settings` and `/admin/content`.
- Settings can be saved.
- Public app display toggles affect `/our-app`.
- Occupancy thresholds affect public crowd color.
- Public content can be created/updated.
- Important edits create admin-visible log records in the database.
- No registration user can access admin settings/content.

## Manual Verification Checklist

- Log in as admin.
- Open `/admin`.
- Edit settings and save.
- Confirm `/contact` and `/our-app` reflect updated settings.
- Create a homepage offer/news item.
- Confirm public homepage displays active content.
- Log in as registration user and confirm admin routes are blocked.

## Completion Definition

Phase 6 is complete when admin settings and public content management work and are protected.

## Next Phase

Phase 7 — Admin Coaches and Packages.

---

# Phase 7 — Admin Coaches and Packages

## Goal

Build admin management for coaches and package definitions, including simple time-restriction configuration.

## Why This Phase Exists

The uploaded documents confirm that admins must manage coach profiles and gym packages. Packages are required before assigning packages to customers and before check-in can deduct sessions.

## Source Requirements Covered

- Coach CRUD.
- Package CRUD.
- Packages include name, price, session count, package type, assigned coach if needed, active/inactive status, activation/expiration concepts, and optional time restriction.
- Some packages may be usable only before a specific time, such as before 3:00 PM.
- Coaches can be connected to packages and customers.

## What Codex Should Build

- Build `/admin/coaches`.
- Build `/admin/packages`.
- Add coach create/edit/list/archive or delete flow according to current schema direction.
- Add package create/edit/list/archive or delete flow according to current schema direction.
- Include package time restriction fields:
  - available all day
  - restricted by simple time range/end time
  - human-readable label if useful
- Allow assigning a coach to a package when relevant.
- Show active/inactive status.
- Validate price and session count.
- Log important coach and package edits.

## What Codex Must Not Build

- Do not build coach login/dashboard.
- Do not build customer package assignment yet.
- Do not build check-in logic yet.
- Do not build group class registration.
- Do not build online payments or ecommerce package purchase.
- Do not build complex time rules for weekdays/multiple windows unless confirmed.

## Suggested Files / Folders Likely Affected

- `app/admin/coaches/`
- `app/admin/packages/`
- `components/admin/CoachForm.*`
- `components/admin/PackageForm.*`
- `components/admin/DataTable.*`
- `lib/actions/coaches.*`
- `lib/actions/packages.*`
- `lib/validation/packages.*`

## Data / Database Impact

Uses `Coach`, `Package`, `AuditLog`, and `StaffUser`.

## UI Impact

- Admin can manage coach profiles.
- Admin can manage package definitions.
- Active coaches can appear on public `/coaches`.
- Active packages can appear on public `/packages`.

## Backend / Logic Impact

- Admin-only server actions for coach/package saves.
- Validation for package fields and time restrictions.
- Logging for important edits.

## Acceptance Criteria

- Admin can create and edit coaches.
- Admin can create and edit packages.
- Package price and sessions validate.
- Package can be all-day or time-restricted.
- Active packages display publicly.
- Active coaches display publicly.
- Registration user cannot access these pages.
- Important edits create logs.

## Manual Verification Checklist

- Log in as admin.
- Create a coach.
- Confirm coach appears on `/coaches`.
- Create a package.
- Confirm package appears on `/packages`.
- Create a package with a time rule like usable before 3:00 PM.
- Confirm package details save correctly.
- Confirm edit logs are created.

## Completion Definition

Phase 7 is complete when coach and package management is working and public pages can display active records.

## Next Phase

Phase 8 — Admin Customers and Package Assignment.

---

# Phase 8 — Admin Customers and Package Assignment

## Goal

Build admin customer management and package assignment to customers.

## Why This Phase Exists

Customers and customer-owned packages are central to Smartfit.am. Reception cannot search, check in, check out, or deduct sessions until customers and their packages exist.

## Source Requirements Covered

- Customer CRUD.
- Customer profile includes personal information, customer ID, active/inactive status, assigned coach if applicable, current gym status, and package history.
- Customer package overview table.
- Customers can have no active package, one active package, or multiple active packages.
- Admin can search/filter customers by name, ID, status, package, coach, expiration date, and remaining sessions.
- Expired packages and zero-session packages should be easy to find.

## What Codex Should Build

- Build `/admin/customers`.
- Add customer list, search, and basic filters.
- Add customer create/edit form.
- Add assigned coach selection if coaches exist.
- Add customer package assignment form.
- Allow assigning existing package definitions to a customer.
- Store activation date, expiration date, initial sessions, remaining sessions, status, and coach if applicable.
- Show customer package overview table.
- Highlight expired and zero-session packages clearly.
- Allow admin/manager users to freeze and reactivate customer packages.
- Frozen packages should be clearly marked in the admin customer package overview.
- Freezing/reactivation must create admin-visible logs.
- Do not automatically extend expiration dates when freezing unless later confirmed.
- Log important customer edits and package assignment/renewal actions.

## What Codex Must Not Build

- Do not build customer login/accounts.
- Do not build customer self-service dashboard.
- Do not build QR/membership card logic.
- Do not build online payment/package purchase.
- Do not build complex renewal rules that are not confirmed.
- Do not build automatic expiration extension for freezing.

## Suggested Files / Folders Likely Affected

- `app/admin/customers/`
- `components/admin/CustomerForm.*`
- `components/admin/CustomerPackageAssignmentForm.*`
- `components/admin/CustomerOverviewTable.*`
- `components/admin/CustomerPackageStatusBadge.*`
- `lib/actions/customers.*`
- `lib/actions/customer-packages.*`
- `lib/validation/customers.*`

## Data / Database Impact

Uses `Customer`, `CustomerPackage`, `Package`, `Coach`, `AuditLog`, and `StaffUser`.

## UI Impact

- Admin can manage customers.
- Admin can assign packages to customers.
- Admin can view current package situation for customers.

## Backend / Logic Impact

- Admin-only customer save actions.
- Admin-only customer package assignment.
- Validation for customer code uniqueness, package assignment dates, remaining sessions, and status.
- Logging for important edits.

## Acceptance Criteria

- Admin can create a customer.
- Admin can edit a customer.
- Admin can assign one or multiple packages to a customer.
- Customer package status, sessions, activation date, and expiration date display correctly.
- Customer package overview works for no package, one package, and multiple packages.
- Expired and zero-session states are clearly visible.
- Admin can freeze and reactivate customer packages.
- Frozen packages are clearly visible in the customer package overview.
- Freeze/reactivation creates logs.
- Registration user cannot access admin customer management.
- Important changes create logs.

## Manual Verification Checklist

- Create a customer with a customer ID/code.
- Assign one general package.
- Assign a coach package if a coach exists.
- Confirm customer overview shows both packages.
- Set one package to zero sessions and confirm it is clearly marked.
- Set an expired package and confirm it is clearly marked.
- Confirm logs are created.

## Completion Definition

Phase 8 is complete when admins can manage customers and customer package assignments safely.

## Next Phase

Phase 9 — Registration Search and Customer Card.

---

# Phase 9 — Registration Search and Customer Card

## Goal

Build the Registration Panel customer search, customer card, package display, and manual session correction interface.

## Why This Phase Exists

The Registration Panel must be fast and practical for reception staff. Reception needs to search customers, view package details, understand status, and manually correct remaining sessions with plus/minus controls and Save.

## Source Requirements Covered

- Registration Panel customer search.
- Customer card.
- Customer status badge: In gym / Not in gym.
- Package display rules.
- Must handle no active package, one package, and 4–5 active packages.
- Manual session corrections with plus/minus controls.
- Manual changes require Save.
- Every saved manual session correction creates a log.
- Inactive packages can be hidden if the setting is enabled.

## What Codex Should Build

- Build `/registration`.
- Add customer search by name or customer ID.
- Show search results clearly.
- Show selected customer card.
- Show customer status badge.
- Show active packages and inactive packages depending on settings/filter.
- Show package name, remaining sessions, expiry date, status, and time rule.
- Build responsive card layout for desktop, tablet, and mobile.
- Add plus/minus controls for remaining sessions.
- Add explicit Save button for manual session corrections.
- Save manual corrections server-side.
- Prevent remaining sessions from going below zero.
- Create logs for saved manual corrections.
- Allow registration/reception users to freeze and reactivate customer packages.
- Show frozen packages clearly on the registration customer card.
- Manual session corrections do not require admin approval or a correction reason.
- Manual session corrections must still require Save and must create logs.

## What Codex Must Not Build

- Do not implement check-in yet.
- Do not implement check-out yet.
- Do not implement occupancy changes yet.
- Do not build QR scanning.
- Do not build customer self-service.
- Do not build admin-only customer CRUD inside registration.
- Do not add negative-session override unless confirmed.

## Suggested Files / Folders Likely Affected

- `app/registration/`
- `components/registration/CustomerSearch.*`
- `components/registration/CustomerCard.*`
- `components/registration/PackageCard.*`
- `components/registration/SessionStepper.*`
- `components/status/StatusBadge.*`
- `lib/actions/registration-search.*`
- `lib/actions/session-corrections.*`
- `lib/registration/customer-card-data.*`

## Data / Database Impact

Uses `Customer`, `CustomerPackage`, `Package`, `Coach`, `GymSettings`, `PackageSessionChange`, `AuditLog`, and `StaffUser`.

## UI Impact

- Registration staff can search and view customers.
- Customer package cards appear with status and session controls.
- UI supports multiple package scenarios.

## Backend / Logic Impact

- Search/query logic.
- Manual session correction action.
- Audit logging for session corrections.
- Validation for non-negative sessions.

## Acceptance Criteria

- Registration user can access `/registration`.
- Registration user can search by name.
- Registration user can search by customer ID/code.
- Customer card shows name, customer ID, status badge, and packages.
- Package cards show remaining sessions, expiry date, status, and time rule.
- Registration can freeze and reactivate customer packages.
- Frozen packages are clearly shown on the registration customer card.
- Manual session corrections require Save, create logs, and do not require approval/reason.
- Sessions cannot go below zero.

## Manual Verification Checklist

- Log in as registration staff.
- Search for an existing customer.
- Open a customer with no active package.
- Open a customer with one package.
- Open a customer with multiple packages.
- Increase/decrease sessions and save.
- Confirm changes persist after refresh.
- Confirm log appears in the database/admin logs later.

## Completion Definition

Phase 9 is complete when reception can search customers, view package cards, and save manual session corrections.

## Next Phase

Phase 10 — Check-In Workflow.

---

# Phase 10 — Check-In Workflow

## Goal

Implement the full customer check-in workflow with package selection, time restriction validation, selected session deduction, occupancy increase, and logs.

## Why This Phase Exists

Check-in is one of the core operational workflows. It affects customer status, selected packages, session counts, current occupancy, visits, session history, and audit logs.

## Source Requirements Covered

- Receptionist clicks Check in when a customer enters.
- Receptionist selects which package or packages are used.
- Customer status changes from Not in gym to In gym.
- Selected general gym package decreases by 1 if used.
- Selected coach package decreases by 1 if used.
- Other packages do not change unless selected.
- Current occupancy increases by 1.
- Check-in and session deductions create logs.
- Package time restrictions must be validated before deduction.
- Customer should not be checked in twice unless admin override is later confirmed.

## What Codex Should Build

- Add Check in action to the registration customer card.
- Add selected package checkboxes/buttons before confirming check-in.
- Validate that selected packages belong to the customer.
- Validate customer is Not in gym before check-in.
- Validate selected package status.
- Block frozen packages from being selected or used during check-in.
- Validate remaining sessions are above zero.
- Validate package time restriction using server time.
- Deduct 1 session from each selected package.
- Create a `GymVisit` record.
- Create `VisitPackageUsage` / session change records according to schema.
- Set customer status to In gym.
- Increase `OccupancyState.currentCount` by 1.
- Create logs for check-in and each session deduction.
- Use a database transaction for the full check-in.

## What Codex Must Not Build

- Do not add admin override unless confirmed.
- Do not allow negative remaining sessions.
- Do not deduct unselected packages.
- Do not deduct sessions during check-out.
- Do not build QR check-in.
- Do not build customer self check-in.
- Do not build coach dashboard.

## Suggested Files / Folders Likely Affected

- `app/registration/`
- `components/registration/CheckInPanel.*`
- `components/registration/PackageSelection.*`
- `lib/actions/check-in.*`
- `lib/registration/check-in-validation.*`
- `lib/occupancy/update.*`
- `lib/logging.*`
- `lib/time-rules.*`

## Data / Database Impact

Uses and updates `Customer`, `CustomerPackage`, `GymVisit`, `VisitPackageUsage`, `PackageSessionChange`, `OccupancyState`, `OccupancyEvent`, `AuditLog`, and `StaffUser`.

## UI Impact

- Reception customer card gets a check-in flow.
- Reception sees warnings for invalid packages and time restrictions.
- Customer status updates to In gym after successful check-in.
- Occupancy count updates.

## Backend / Logic Impact

- Server-side check-in transaction.
- Package time rule validation.
- Session deduction logic.
- Occupancy increase.
- Audit log writing.

## Acceptance Criteria

- A Not in gym customer can be checked in.
- Reception must select the package(s) used.
- Only selected packages decrease.
- General and coach packages can both decrease if both are selected.
- Pool/other package does not decrease unless selected.
- Frozen packages cannot be selected or used for check-in/session deduction.
- Time-restricted package works before its allowed cutoff/time.
- Time-restricted package is blocked or warned after its allowed time unless override is later confirmed.
- Customer status changes to In gym.
- Occupancy increases by 1.
- Logs are created for check-in and deductions.
- A customer cannot be checked in twice.

## Manual Verification Checklist

- Create a customer with general, coach, and pool packages.
- Check in using only the general package.
- Confirm only general sessions decrease.
- Check out later, then check in using general + coach.
- Confirm both selected packages decrease.
- Try using a time-restricted package outside allowed time.
- Confirm no session is deducted if blocked.
- Confirm occupancy increases only after successful check-in.
- Confirm logs are created.

## Completion Definition

Phase 10 is complete when check-in is reliable, transactional, validates package rules, updates occupancy, and writes logs.

## Next Phase

Phase 11 — Check-Out and Occupancy Correction.

---

# Phase 11 — Check-Out and Occupancy Correction

## Goal

Implement check-out and manual occupancy correction.

## Why This Phase Exists

Check-out completes the customer visit lifecycle. It must mark the customer as Not in gym, record exit time, decrease occupancy, and create a log. Reception also needs manual occupancy correction when the live count is wrong.

## Source Requirements Covered

- Receptionist clicks Check out when the customer leaves.
- Customer status changes from In gym to Not in gym.
- No sessions are deducted during check-out.
- Check-out records exit time.
- Occupancy decreases by 1.
- Check-out creates a log.
- Reception can manually increase/decrease occupancy when needed.
- Manual occupancy changes require Save and create a log.
- Public User Panel uses the current occupancy count.

## What Codex Should Build

- Add Check out action to the registration customer card.
- Validate customer is currently In gym.
- Find and close the open visit.
- Set customer status to Not in gym.
- Record check-out time.
- Decrease occupancy by 1.
- Prevent occupancy from going below zero.
- Create check-out log.
- Add manual occupancy correction control on `/registration`.
- Manual occupancy corrections do not require admin approval, admin password, or a correction reason.
- Manual occupancy corrections must still require Save and must create logs.
- Save manual occupancy correction server-side.
- Create log for manual occupancy correction.
- Ensure `/our-app` reads updated occupancy.

## What Codex Must Not Build

- Do not deduct sessions during check-out.
- Do not auto-close visits after closing time unless confirmed.
- Do not build long-stay alerts unless confirmed later.
- Do not require admin password for occupancy correction unless confirmed.
- Do not build real-time WebSockets unless confirmed.

## Suggested Files / Folders Likely Affected

- `app/registration/`
- `components/registration/CheckOutButton.*`
- `components/registration/OccupancyCorrection.*`
- `lib/actions/check-out.*`
- `lib/actions/occupancy-correction.*`
- `lib/occupancy/update.*`
- `lib/logging.*`
- `app/api/public/occupancy/` if used

## Data / Database Impact

Uses and updates `Customer`, `GymVisit`, `OccupancyState`, `OccupancyEvent`, `AuditLog`, and `StaffUser`.

## UI Impact

- Reception can check customers out.
- Reception can manually correct occupancy count.
- Public `/our-app` reflects current occupancy.

## Backend / Logic Impact

- Server-side check-out transaction.
- Occupancy decrease.
- Manual occupancy correction action.
- Audit log writing.

## Acceptance Criteria

- In gym customer can be checked out.
- Customer status changes to Not in gym.
- Visit gets check-out time.
- No sessions are deducted.
- Occupancy decreases by 1.
- Occupancy cannot go below zero.
- Manual occupancy correction requires Save.
- Manual occupancy correction creates a log.
- Manual occupancy correction does not require approval, admin password, or reason.
- Public occupancy page updates after correction.

## Manual Verification Checklist

- Check in a customer.
- Confirm customer appears In gym.
- Check out the customer.
- Confirm status becomes Not in gym.
- Confirm no session count changed during checkout.
- Confirm occupancy decreased.
- Try to correct occupancy manually.
- Confirm correction appears on `/our-app`.
- Confirm logs exist.

## Completion Definition

Phase 11 is complete when check-out and manual occupancy correction work safely and are logged.

## Next Phase

Phase 12 — Notes and Admin Logs.

---

# Phase 12 — Notes and Admin Logs

## Goal

Implement the Registration Panel notes section and the Admin Panel logs page.

## Why This Phase Exists

The uploaded documents require notes for operational reminders/customer-specific details and admin-visible logs for important actions. Logs must not be editable by reception staff.

## Source Requirements Covered

- Registration Panel includes a Notes section.
- Reception staff can create, read, update, and delete notes if they have permission.
- Notes are sorted by date, newest easiest to find.
- Logs are visible only to admin.
- Logs should not be editable by reception staff.
- Important actions create logs.

## What Codex Should Build

- Add notes section to `/registration`.
- Allow creating and editing notes.
- Link notes to customers when customer-specific.
- Sort notes newest first.
- If delete permission is unclear, do not allow reception delete by default; mark it as blocked or admin-only until confirmed.
- Build `/admin/logs`.
- Show audit logs with actor, action, related customer/target, old/new values where available, and timestamp.
- Admin logs must include package freeze and package reactivation events.
- Admin logs must include manual session correction and manual occupancy correction events.
- Add simple filters only if already straightforward, such as action type or date.
- Ensure registration users cannot access `/admin/logs`.

## What Codex Must Not Build

- Do not allow reception staff to edit or delete audit logs.
- Do not add complex log archive/retention logic.
- Do not add note deletion for reception unless confirmed.
- Do not build external notifications from notes/logs.
- Do not build full internal messaging.

## Suggested Files / Folders Likely Affected

- `app/registration/`
- `components/registration/NotesSection.*`
- `app/admin/logs/`
- `components/admin/AuditLogTable.*`
- `lib/actions/notes.*`
- `lib/admin/logs-data.*`
- `lib/logging.*`

## Data / Database Impact

Uses `Note`, `Customer`, `StaffUser`, and `AuditLog`.

## UI Impact

- Registration customer card or panel includes notes.
- Admin can review logs.

## Backend / Logic Impact

- Notes create/update server actions.
- Admin-only audit log read logic.
- Optional note edit log if implemented simply and clearly.

## Acceptance Criteria

- Registration can create a customer note.
- Registration can edit a note if permitted by current rules.
- Notes display newest first.
- Admin can open `/admin/logs`.
- Admin can see logs from previous actions.
- Admin can see freeze/reactivation logs.
- Admin can see manual correction logs.
- Registration user cannot access `/admin/logs`.
- Audit logs cannot be edited by reception staff.

## Manual Verification Checklist

- Log in as registration.
- Open a customer card.
- Create a note.
- Refresh and confirm note persists.
- Edit the note if editing is allowed.
- Log in as admin.
- Open `/admin/logs`.
- Confirm check-in/check-out/session/occupancy/content/settings logs are visible.
- Confirm logs are read-only.

## Completion Definition

Phase 12 is complete when notes work for operations and admin logs are visible and protected.

## Next Phase

Phase 13 — Excel Export.

---

# Phase 13 — Excel Export

## Goal

Add basic admin Excel export functionality.

## Why This Phase Exists

The uploaded documents confirm that the Admin Panel needs a Data section where important information can be exported as Excel files.

## Source Requirements Covered

- Admin Data section.
- Export options may include customers, packages, coaches, customer package history, check-in/check-out logs, promotion/offer history, and notes if needed.
- Exports are admin-only.
- Basic Excel export is MVP; advanced filtered exports can come later.

## What Codex Should Build

- Build `/admin/data`.
- Add export category selection.
- Add basic export for confirmed important categories:
  - customers
  - packages
  - coaches
  - customer package history
  - check-in/check-out logs
  - promotion/offer history
  - notes if included and safe
- Add `GET /api/admin/export` or equivalent download route.
- Restrict export to admin only.
- Generate files on demand.
- Keep export formatting simple and readable.
- Do not store export history unless confirmed.

## What Codex Must Not Build

- Do not build scheduled exports.
- Do not build automated reports.
- Do not build advanced filters unless already trivial and confirmed.
- Do not export private data through public routes.
- Do not allow registration users to export.

## Suggested Files / Folders Likely Affected

- `app/admin/data/`
- `app/api/admin/export/`
- `components/admin/ExportPanel.*`
- `lib/export/excel.*`
- `lib/admin/export-data.*`
- `lib/permissions.*`

## Data / Database Impact

Reads existing data. No schema changes unless export history is later confirmed, which is not part of this phase.

## UI Impact

- Admin can select export type and download an Excel file.

## Backend / Logic Impact

- Admin-only export generation.
- Data serialization to Excel.
- Safe error handling for empty/no data.

## Acceptance Criteria

- Admin can open `/admin/data`.
- Admin can export customers.
- Admin can export packages.
- Admin can export coaches.
- Admin can export customer package history.
- Admin can export check-in/check-out logs.
- Admin can export promotion/offer history.
- Notes export exists only if notes are included safely.
- Registration user cannot access exports.
- Export files open successfully.

## Manual Verification Checklist

- Log in as admin.
- Open `/admin/data`.
- Export each available category.
- Open each downloaded Excel file.
- Confirm data columns are understandable.
- Log in as registration and confirm export route is blocked.
- Try an invalid export type and confirm safe error handling.

## Completion Definition

Phase 13 is complete when admin-only basic Excel export works for confirmed data categories.

## Next Phase

Phase 14 — Basic Analytics.

---

# Phase 14 — Basic Analytics

## Goal

Add MVP analytics for the admin.

## Why This Phase Exists

The uploaded documents confirm that the Admin Panel should include analytics. The MVP specifically includes daily check-ins, current occupancy, and peak hours.

## Source Requirements Covered

- Basic analytics: daily check-ins, current occupancy, and peak hours.
- Admin analytics help understand usage and activity.
- Analytics must not expose private data publicly.
- More advanced analytics can come later.

## What Codex Should Build

- Build `/admin/analytics`.
- Show current occupancy.
- Show daily check-in count.
- Show peak hours from check-in records using a simple understandable calculation.
- Add simple date range only if easy and safe, such as today/current week, but do not overcomplicate.
- Use existing `GymVisit` and `OccupancyState` data.
- Keep UI simple with cards and a small table or chart if straightforward.
- Handle no-data state.

## What Codex Must Not Build

- Do not build revenue analytics.
- Do not build predictive analytics.
- Do not build customer segmentation.
- Do not build advanced historical occupancy trends unless already available and confirmed for MVP.
- Do not build marketing campaign analytics.
- Do not expose analytics publicly.
- Do not create new analytics tables unless clearly required.

## Suggested Files / Folders Likely Affected

- `app/admin/analytics/`
- `components/admin/AnalyticsCards.*`
- `components/admin/PeakHoursTable.*`
- `lib/admin/analytics-data.*`
- `lib/analytics/basic.*`

## Data / Database Impact

Reads `GymVisit`, `OccupancyState`, and related operational data. No schema changes should be needed.

## UI Impact

- Admin analytics page shows basic activity metrics.

## Backend / Logic Impact

- Simple server-side calculations for current occupancy, daily check-ins, and peak hours.

## Acceptance Criteria

- Admin can open `/admin/analytics`.
- Current occupancy is shown.
- Daily check-ins are shown.
- Peak hours are shown using check-in data.
- Empty state appears when no visits exist.
- Registration user cannot access analytics.
- Public users cannot access analytics.

## Manual Verification Checklist

- Create/check in several visits at different times if test data allows.
- Open `/admin/analytics`.
- Confirm current occupancy matches current state.
- Confirm daily check-in count matches visit records.
- Confirm peak hour calculation is reasonable and visible.
- Confirm no-data state works.
- Confirm access protection.

## Completion Definition

Phase 14 is complete when admin can view the confirmed MVP analytics.

## Next Phase

Phase 15 — Final Testing and Deployment Preparation.

---

# Phase 15 — Final Testing and Deployment Preparation

## Goal

Verify the complete Smartfit.am MVP and prepare it for deployment.

## Why This Phase Exists

This is the final controlled phase. It ensures the public website, mobile app-like page, admin operations, registration workflows, logs, exports, analytics, and private-data protection work together.

## Source Requirements Covered

- Public website works.
- Public mobile app/live occupancy works.
- Admin can manage confirmed data.
- Registration can handle customer search, check-in, check-out, session corrections, notes, and occupancy corrections.
- Sessions and occupancy update correctly.
- Logs are created.
- Basic exports work.
- Basic analytics work.
- Private data is protected.
- Deployment preparation is complete.

## What Codex Should Build

- Review and fix obvious bugs from completed phases.
- Add lightweight tests only for critical logic if the project test setup exists.
- Verify route protection.
- Verify public/private data separation.
- Verify check-in/check-out transaction behavior.
- Verify session deduction rules.
- Verify occupancy updates.
- Verify logs.
- Verify exports.
- Verify analytics.
- Prepare production environment documentation.
- Prepare deployment checklist.
- Ensure no unconfirmed features were accidentally added.
- Ensure the project builds successfully.

## What Codex Must Not Build

- Do not add new features.
- Do not create Phase 16.
- Do not build customer accounts.
- Do not build coach dashboard.
- Do not build QR check-in.
- Do not build online payments.
- Do not build notifications.
- Do not build multi-branch support.
- Do not refactor the whole project.
- Do not rewrite stable working areas without a clear bug.

## Suggested Files / Folders Likely Affected

- `README.md`
- `.env.example`
- deployment notes if present
- test files if the project already has a test setup
- small bug-fix files from earlier phases only as needed

## Data / Database Impact

No schema changes should be made unless a clear bug from earlier phases requires it. Any schema change in this final phase must be minimal and documented.

## UI Impact

Small polish and bug fixes only.

## Backend / Logic Impact

Small bug fixes only. No new workflows.

## Acceptance Criteria

- Public homepage works.
- About, coaches, packages, contact, gallery, and Our App pages work.
- Public occupancy page is public-safe.
- Admin login works.
- Registration login works.
- Admin routes are protected.
- Registration routes are protected.
- Admin can manage settings, content, coaches, packages, customers, and customer packages.
- Admin can freeze and reactivate customer packages.
- Registration can freeze and reactivate customer packages.
- Registration can search customers.
- Registration customer card displays correctly.
- Frozen packages cannot be selected or used for check-in.
- Manual session correction works and logs.
- Manual session correction does not require approval or reason.
- Check-in works and logs.
- Check-out works and logs.
- Manual occupancy correction works and logs.
- Manual occupancy correction does not require approval or reason.
- Notes work according to confirmed permission level.
- Admin logs page works.
- Admin Excel export works.
- Admin basic analytics works.
- Build passes.
- Deployment checklist is ready.
- No Phase 16 is created.

## Manual Verification Checklist

- Open all public pages while logged out.
- Confirm public pages do not expose private data.
- Confirm public Gallery page works.
- Log in as admin.
- Verify every admin page.
- Admin freeze and reactivate a customer package.
- Log in as registration staff.
- Verify registration workflow.
- Registration freeze and reactivate a customer package.
- Run a full customer scenario:
  - create coach
  - create package
  - create customer
  - assign package
  - search customer in registration
  - check in with selected package
  - verify session deduction
  - verify occupancy increase
  - check out
  - verify no session deduction during checkout
  - verify occupancy decrease
  - create note
  - manually correct sessions without approval/reason
  - manually correct occupancy without approval/reason
  - verify frozen packages cannot be used during check-in
  - verify logs
  - export data
  - view analytics
- Confirm production build works.
- Confirm environment variable documentation exists.

## Completion Definition

Phase 15 is complete when the whole Smartfit.am MVP is verified, build-ready, and deployment-prepared.

## Next Phase

None. Phase 15 is the final phase in this document.

---

## Post-MVP Registration Improvement Phases

These phases were added manually by the project owner after completion of the original MVP and Phase 15.

- They are not part of the original MVP.
- They focus only on improving the Registration Panel so it better matches the uploaded Smartfit.am specification and the project owner's reviewed expectations.
- They must follow the same anti-hallucination, simplicity, privacy, server-side permission, and phase-control rules as the original phases.
- They do not authorize customer login, coach login, payments, QR check-in, notifications, ecommerce, multi-branch, platform owner logic, or any other unconfirmed product area.
- Admin Settings remain admin-only. Registration may receive view controls and read-only operational-rule visibility, but not a true system-settings editor.
- The original Phase 15 wording above is preserved as historical MVP phase content. This manually added section authorizes only Phase 16 through Phase 21.

---

# Phase 16 — Registration Gap Audit and Missing Section Fixes

## Goal

Audit the current Registration Panel against the uploaded specification and fix missing or hidden confirmed sections without redesigning everything yet.

## Why This Phase Exists

The completed MVP Registration Panel contains core operational behavior, but the project owner found that the screen appears too basic and does not make every confirmed reception feature easy to discover.

## What Codex Should Build

- Inspect `/registration` in the real code and compare it with the uploaded specification.
- Confirm whether notes appear after selecting a customer.
- If notes only appear after selecting a customer, improve the empty state so this is clearly explained.
- If notes are missing from selected customer cards, add or fix them.
- Confirm the selected customer card shows status, package cards, remaining sessions, expiry dates, package statuses, time rules, check-in, check-out, manual session correction, notes, and occupancy correction.
- Add missing navigation or visibility for already-built confirmed features.
- Improve empty states and search results so reception understands what to do.
- Keep this a small fix phase rather than a full redesign.

## What Codex Must Not Build

- Do not add new models unless a real blocker exists.
- Do not add new product features.
- Do not add an Admin Settings editor inside Registration.
- Do not perform the advanced workspace redesign yet.
- Do not add customer login, coach login, QR check-in, payments, notifications, ecommerce, multi-branch, or platform owner logic.

## Acceptance Criteria

- Registration empty state is clear.
- After customer selection, every confirmed operational section is visible or intentionally explained.
- Notes are visible for selected customers.
- Occupancy correction remains available.
- No private data is exposed publicly.
- Typecheck and build pass.

## Manual Verification Checklist

- Open `/registration` without a selected customer and confirm the next action is clear.
- Search by customer name and customer ID.
- Select a customer and verify every confirmed operational section.
- Verify notes and occupancy correction remain usable.
- Verify public routes do not expose private customer data.

## Completion Definition

Phase 16 is complete when missing or hidden confirmed Registration Panel sections are visible and clearly explained without a broad redesign.

## Next Phase

Phase 17 — Registration Customer Workspace Redesign.

---

# Phase 17 — Registration Customer Workspace Redesign

## Goal

Redesign `/registration` into a professional reception workspace that is fast, clear, and practical for daily gym operations.

## What Codex Should Build

- Improve the Registration Panel UI layout while reusing existing operational logic.
- Keep the private layout consistent with Smartfit.am branding.
- Make the page feel like a reception dashboard rather than a basic form.
- Add a better search area with clearer results.
- When a customer is selected, show a strong customer header with:
  - full name
  - member code
  - current gym status badge
  - active/inactive customer status
  - assigned coach if available
  - last check-in/check-out if available
- Show a quick-action area for:
  - check in
  - check out
  - save session corrections
  - occupancy correction
- Show package cards in a professional responsive grid.
- Show active packages by default and allow showing all packages.
- Show invalid, expired, frozen, and zero-session states clearly.
- Make notes visible in the customer workspace.
- Keep mobile, tablet, and desktop layouts responsive.

## What Codex Must Not Build

- Do not add new business rules.
- Do not add new data models unless required by a discovered blocker.
- Do not add an Admin Settings editor inside Registration.
- Do not add advanced analytics or exports.
- Do not redesign unrelated admin areas.

## Acceptance Criteria

- Registration page is visually professional.
- Reception staff can understand customer status and packages quickly.
- Customer card works for no package, one package, and multiple packages.
- Notes are visible and usable in the customer workspace.
- Search, corrections, check-in/out, and occupancy still work.
- Typecheck and build pass.

## Manual Verification Checklist

- Verify the workspace at mobile, tablet, and desktop sizes.
- Verify no-package, one-package, and multiple-package customers.
- Verify active, inactive, expired, frozen, and zero-session package states.
- Verify all existing reception actions still work.

## Completion Definition

Phase 17 is complete when `/registration` works as a professional, responsive daily reception workspace without changing existing business rules.

## Next Phase

Phase 18 — Registration Notes and Activity Experience Polish.

---

# Phase 18 — Registration Notes and Activity Experience Polish

## Goal

Make notes and recent operational context easier to use inside the Registration Panel.

## What Codex Should Build

- Improve notes placement inside the selected customer workspace.
- Keep notes sorted newest first.
- Keep add, edit, and delete working for ADMIN and REGISTRATION according to existing permissions.
- Keep stale-edit protection and lightweight metadata refresh.
- Add a simple last-updated or refresh indicator if it is not already clear.
- Add a compact recent activity summary only if it can safely reuse existing `AuditLog` and `GymVisit` data:
  - last check-in
  - last check-out
  - last session correction
  - last note update
- Keep recent activity read-only and customer-specific.
- Keep full admin logs restricted to ADMIN.

## What Codex Must Not Build

- Do not build a chat system.
- Do not add notifications.
- Do not add WebSockets.
- Do not add a full logs page for reception.
- Do not add note attachments.
- Do not add note categories unless later confirmed.
- Do not expose notes or activity publicly.

## Acceptance Criteria

- Reception can easily see and use customer notes.
- Notes do not reset unrelated reception work.
- Draft note edits are protected.
- Recent activity, if added, is read-only and customer-specific.
- Admin logs remain admin-only.
- Typecheck and build pass.

## Manual Verification Checklist

- Create, edit, refresh, and delete a note as ADMIN and REGISTRATION.
- Verify stale-edit protection.
- Verify any recent activity summary contains only the selected customer's safe operational context.
- Verify REGISTRATION cannot access the full admin logs page.

## Completion Definition

Phase 18 is complete when notes and safe recent customer activity are easy to understand and use without exposing full admin logs.

## Next Phase

Phase 19 — Registration Package Freeze and Reactivation.

---

# Phase 19 — Registration Package Freeze and Reactivation

## Goal

Implement the package freeze/reactivation workflow mentioned in the uploaded specification using the simplest confirmed behavior.

## Permission Decision Required Before Implementation

The project owner must confirm that REGISTRATION staff may freeze and reactivate customer packages. If this permission is not confirmed, stop and report the blocker instead of implementing the controls for REGISTRATION.

## What Codex Should Build

- Add freeze/reactivate controls for customer packages in `/registration`.
- Allow ADMIN and REGISTRATION users to freeze/reactivate customer packages only if the project owner confirms the permission remains allowed.
- Ensure frozen packages cannot be used for session deduction.
- Ensure reactivated packages become usable again only when sessions, expiration date, package status, and time rules allow it.
- Create `AuditLog` entries for freeze and reactivation.
- Show frozen package state clearly in package cards.
- Do not automatically extend expiration dates unless separately confirmed.

## What Codex Must Not Build

- Do not automatically extend expiration dates.
- Do not add a freeze approval workflow.
- Do not require a freeze reason unless later confirmed.
- Do not redesign package renewal.
- Do not add complex freeze policies.

## Acceptance Criteria

- A package can be frozen from Registration after permission confirmation.
- A frozen package cannot be selected for check-in deduction.
- A package can be reactivated.
- Freeze and reactivation create logs.
- The UI clearly marks frozen packages.
- Typecheck and build pass.

## Manual Verification Checklist

- Confirm the permission decision before implementation.
- Freeze an eligible package and verify it cannot be used for check-in.
- Reactivate it and verify normal eligibility rules still apply.
- Verify freeze/reactivation logs.
- Verify no expiration date is automatically extended.

## Completion Definition

Phase 19 is complete when the confirmed freeze/reactivation workflow is safe, logged, and clear in Registration.

## Next Phase

Phase 20 — Reception Workspace Controls and Operational Rules Display.

---

# Phase 20 — Reception Workspace Controls and Operational Rules Display

## Goal

Add a simple Registration-side controls and status area that helps reception understand current operational rules without giving them Admin Settings access.

## What Codex Should Build

- Add a compact Reception Controls, Reception View Controls, or Workspace Controls panel.
- Show current occupancy correction in a better location if needed.
- Show current registration display behavior:
  - whether inactive customers are hidden or visible based on the admin setting
  - active packages by default and the show-all-packages option
  - current package time-rule behavior
- Add local UI preferences only when simple and not system-wide:
  - compact/detailed customer card mode
  - keep selected customer visible after actions
  - remember the show-all-packages toggle during the current session
- Keep all true system settings editable only in Admin Settings.

## What Codex Must Not Build

- Do not add a true Admin Settings editor in Registration.
- Do not allow Registration to change occupancy thresholds.
- Do not allow Registration to change public app content.
- Do not allow Registration to change gym contact or location settings.
- Do not add new permissions unless confirmed.

## Acceptance Criteria

- Reception has clearer operational controls.
- Admin Settings remain admin-only.
- REGISTRATION cannot edit system-wide settings.
- The UI is clearer and more professional.
- Typecheck and build pass.

## Manual Verification Checklist

- Verify reception can understand active/all package and inactive-customer display behavior.
- Verify local view controls do not modify `GymSettings`.
- Verify REGISTRATION remains blocked from `/admin/settings` and admin-only settings actions.

## Completion Definition

Phase 20 is complete when reception has useful workspace controls and read-only operational-rule visibility without gaining system-settings access.

## Next Phase

Phase 21 — Post-MVP Registration Regression and Client Review Preparation.

---

# Phase 21 — Post-MVP Registration Regression and Client Review Preparation

## Goal

Verify the improved Registration Panel after Phases 16 through 20 and prepare a client-review-ready version.

## What Codex Should Build

- Run final checks focused on Registration.
- Verify search, customer card, packages, sessions, check-in, check-out, notes, occupancy, confirmed freeze/reactivation behavior, and permissions.
- Verify mobile, tablet, and desktop layouts.
- Verify public privacy.
- Update README or a short Registration workflow note if useful.
- Fix only small bugs found during this review.

## What Codex Must Not Build

- Do not add new features.
- Do not add new dashboards.
- Do not create Phase 22 unless the documentation is manually updated again.

## Acceptance Criteria

- Registration Panel matches the uploaded specification better.
- All confirmed operational actions work.
- UI is professional enough for client demo.
- Public/private data separation remains safe.
- Typecheck and build pass.

## Manual Verification Checklist

- Run the complete Registration workflow with representative customer/package states.
- Verify REGISTRATION and ADMIN permissions.
- Verify full admin logs and system settings remain ADMIN-only.
- Verify public routes expose no private Registration data.
- Verify responsive layouts and production build.

## Completion Definition

Phase 21 is complete when the improved Registration Panel is regression-tested, privacy-safe, and ready for client review.

## Next Phase

None. Any phase after Phase 21 requires another manual update to this document by the project owner.

---

## 6. Phase Dependency Rules

- Phase 1 depends on Phase 0 because styling and layouts need the base app.
- Phase 2 depends on Phase 1 because the app foundation should exist before database work.
- Phase 3 depends on Phase 2 because authentication needs internal staff users or a defined user model.
- Phase 4 depends on Phase 3 because public/private routing should be clear before building pages.
- Phase 5 depends on Phase 4 because the Our App page is part of the public website experience.
- Phase 6 depends on Phase 5 because admin settings control public website and Our App display.
- Phase 7 depends on Phase 6 because packages and coaches are admin-managed records.
- Phase 8 depends on Phase 7 because customers need coaches/packages before package assignment works.
- Phase 9 depends on Phase 8 because Registration Panel search and customer cards require customer and package data.
- Phase 10 depends on Phase 9 because check-in requires the customer card and package selection UI.
- Phase 11 depends on Phase 10 because check-out requires open visits created by check-in.
- Phase 12 depends on Phase 11 because logs should exist from check-in, check-out, corrections, and admin actions before building the log review page.
- Phase 13 depends on Phase 12 because exports should include core operational data and notes/logs if available.
- Phase 14 depends on Phase 13 because analytics depend on check-in/check-out and occupancy data already working.
- Phase 15 depends on all earlier phases because it verifies the full MVP.
- Phase 16 depends on the completed MVP because it audits the real Registration Panel before further changes.
- Phase 17 depends on Phase 16 because the redesign must use the verified gap list and existing operational sections.
- Phase 18 depends on Phase 17 because notes and activity polish belong inside the redesigned customer workspace.
- Phase 19 depends on Phase 18 and the project owner's explicit freeze/reactivation permission decision.
- Phase 20 depends on Phase 19 because workspace controls should describe the final confirmed reception behavior.
- Phase 21 depends on Phases 16 through 20 because it verifies the complete post-MVP Registration improvement sequence.

Specific business workflow dependencies:

- Check-in workflow depends on database, authentication, customers, packages, customer package assignment, registration search, and customer card.
- Package time restriction validation depends on package management and check-in workflow.
- Public live occupancy depends on occupancy state and check-in/check-out/manual correction logic.
- Analytics depends on visit records and occupancy records.
- Excel export depends on customer, package, coach, visit, public content, note, and log data.
- Admin logs depend on server-side logging being added during earlier admin and registration actions.

---

## 7. Codex Prompt Usage Rules

Use this file with Codex one phase at a time. Do not ask Codex to implement multiple unrelated phases in one prompt unless the project owner explicitly approves it.

Reusable Codex prompt structure:

```txt
You are working inside the Smartfit.am codebase.

Read:
- README.md
- docs/01-product-requirements.md
- docs/02-technical-blueprint.md
- docs/03-database-schema.md
- docs/04-routes-and-api.md
- docs/05-development-phases.md

Focus only on Phase X — [Phase Name].

Do not work on any other phase.
Do not create new phases.
Do not add unconfirmed features.
Do not refactor unrelated code.
Keep the implementation simple.
Prefer clear and maintainable code over complex architecture.
If something is unclear, stop and report it instead of guessing.

After finishing, summarize:
1. Files changed
2. What was implemented
3. What was not implemented
4. Any blockers or unclear points
5. Manual verification steps completed or still needed
```

Codex should also follow these rules:

- Read the current phase details before making changes.
- Check existing code first.
- Keep the implementation focused.
- Reuse existing simple patterns where available.
- Do not invent new route areas, dashboards, roles, database models, or APIs.
- Do not continue to the next phase automatically.
- At the end of each phase, stop and wait for the next instruction.

---

## 8. Phase Completion Tracking Template

| Phase | Status | Completed Date | Notes |
|---|---|---|---|
| Phase 0 — Project Setup and Repository Baseline | Complete |  | Original MVP |
| Phase 1 — Design System and App Layout | Complete |  | Original MVP |
| Phase 2 — Database and Prisma Foundation | Complete |  | Original MVP |
| Phase 3 — Authentication and Route Protection | Complete |  | Original MVP |
| Phase 4 — Public Website Pages | Complete |  | Original MVP |
| Phase 5 — Public Our App and Live Occupancy Page | Complete |  | Original MVP |
| Phase 6 — Admin Shell, Settings, and Public Content | Complete |  | Original MVP |
| Phase 7 — Admin Coaches and Packages | Complete |  | Original MVP |
| Phase 8 — Admin Customers and Package Assignment | Complete |  | Original MVP |
| Phase 9 — Registration Search and Customer Card | Complete |  | Original MVP |
| Phase 10 — Check-In Workflow | Complete |  | Original MVP |
| Phase 11 — Check-Out and Occupancy Correction | Complete |  | Original MVP |
| Phase 12 — Notes and Admin Logs | Complete |  | Original MVP |
| Phase 13 — Excel Export | Complete |  | Original MVP |
| Phase 14 — Basic Analytics | Complete |  | Original MVP |
| Phase 15 — Final Testing and Deployment Preparation | Complete |  | Original MVP final phase |
| Phase 16 — Registration Gap Audit and Missing Section Fixes | Not Started |  | Manually added post-MVP phase |
| Phase 17 — Registration Customer Workspace Redesign | Not Started |  | Manually added post-MVP phase |
| Phase 18 — Registration Notes and Activity Experience Polish | Not Started |  | Manually added post-MVP phase |
| Phase 19 — Registration Package Freeze and Reactivation | Not Started |  | Permission decision required |
| Phase 20 — Reception Workspace Controls and Operational Rules Display | Not Started |  | Manually added post-MVP phase |
| Phase 21 — Post-MVP Registration Regression and Client Review Preparation | Not Started |  | Current final approved phase |

---

## 9. Blocked / Unclear Items

The following items should not be forced into implementation phases until confirmed:

1. Whether Gallery must be included in the first MVP or delayed.
2. Whether Gallery images are uploaded through Admin Panel or provided as external URLs.
3. Whether reception staff can delete notes or only create/edit them.
4. Whether note edits/deletions must create separate logs.
5. Whether REGISTRATION staff are permitted to freeze/reactivate packages in Phase 19.
6. Whether package freezing extends expiration date.
7. Who can freeze/reactivate packages: admin, reception, or both.
8. Whether package reactivation and renewal are the same workflow or separate workflows.
9. Whether admin override is allowed for time-restricted packages.
10. Whether admin override is allowed for expired packages or zero-session packages.
11. Whether manual occupancy changes require admin password/approval.
12. Whether manual session corrections require a written reason.
13. Whether manual occupancy corrections require a written reason.
14. Exact customer personal information fields.
15. Exact customer ID format.
16. Whether customer IDs should later support QR codes or membership cards.
17. Whether package time restrictions support only before/after time or full ranges.
18. Whether package time restrictions support weekdays or multiple windows.
19. Whether public occupancy should update instantly, every few seconds, every minute, or only on refresh.
20. Whether media upload endpoint should exist.
21. Exact export filters and file naming rules.
22. Whether export history should be stored.
23. Exact analytics formulas beyond current occupancy, daily check-ins, and peak hours.
24. Whether admin can access `/registration` as a receptionist.
25. Whether public coach contact information should be shown or kept admin-only.
26. Whether reception staff should ever be allowed to edit true system settings; this requires a separate permission decision and is not part of Phase 16 through Phase 21.

These unclear items must not create additional phases beyond the manually approved Phase 16 through Phase 21 sequence. Any new phase requires another manual update to this document.

---

## 10. Out of Scope for This Phase Plan

The following features are not included in the current MVP phase plan because they are not confirmed for implementation:

- Customer login accounts.
- Customer self-service dashboard.
- Coach login/dashboard.
- Platform owner/master admin area.
- Multi-branch support.
- Multi-tenant SaaS structure.
- QR code check-in.
- Membership-card scanning.
- Online payments.
- Ecommerce checkout for buying packages.
- Invoice/receipt system.
- Loyalty or rewards system.
- Native iOS app.
- Native Android app.
- SMS notifications.
- WhatsApp notifications.
- Email notifications.
- Push notifications.
- Full group exercise registration.
- Group class schedule management.
- Group class capacity management.
- Group class waiting lists.
- Group class attendance tracking.
- Automated long-stay detection unless confirmed.
- Advanced predictive analytics.
- Revenue analytics.
- Marketing campaign analytics.
- Complex admin override workflows.
- Real-time WebSocket infrastructure unless live update behavior is confirmed.
- Any route, API, model, dashboard, or workflow not directly connected to the confirmed public website, Our App/live occupancy page, Admin Panel, Registration Panel, customer/package/coach management, check-in/check-out, session tracking, occupancy tracking, notes, logs, exports, settings, and basic analytics.

---

## 11. Final Completion Definition

The Smartfit.am MVP is complete because all original fixed phases from Phase 0 through Phase 15 have been completed and verified. Phase 16 through Phase 21 are separately approved post-MVP Registration Panel improvements.

The final MVP must satisfy these completion points:

- Public website works.
- Public homepage displays current gym information and active offers/news/announcements.
- Public About, Coaches, Packages, Contact, and Our App pages work.
- Public mobile app/live occupancy page works without login.
- Public occupancy count uses admin-configured green/yellow/red thresholds.
- Public pages do not expose private customer data.
- Admin login works.
- Registration login works.
- Admin routes are protected.
- Registration routes are protected.
- Admin can manage confirmed settings.
- Admin can manage public content.
- Admin can manage coaches.
- Admin can manage package definitions and time restrictions.
- Admin can manage customers.
- Admin can assign packages to customers.
- Registration can search customers by name or ID.
- Registration customer card shows status, packages, remaining sessions, expiry dates, package statuses, and time rules.
- Manual session corrections work and create logs.
- Check-in works with selected package deduction.
- Time-restricted package validation works.
- Check-in increases occupancy and creates logs.
- Check-out works without deducting sessions.
- Check-out decreases occupancy and creates logs.
- Manual occupancy correction works and creates logs.
- Notes section works according to confirmed permissions.
- Admin logs page works and is read-only for reception.
- Basic Excel export works for confirmed categories.
- Basic analytics works for current occupancy, daily check-ins, and peak hours.
- Private data is protected from public routes and public APIs.
- The project builds successfully.
- Deployment preparation is complete.
- No unconfirmed feature has been accidentally added.
- No unapproved phase beyond Phase 21 has been created.

**Final rule:** Phase 0 through Phase 15 remain the completed original MVP. Phase 16 through Phase 21 are the only manually approved post-MVP Registration improvement phases. Any phase after Phase 21 requires another manual update to this document.
