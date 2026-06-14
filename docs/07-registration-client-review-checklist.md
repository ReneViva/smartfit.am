# Registration Client Review Checklist

Use this checklist for a focused client review of the private Registration
workspace. Use clearly marked temporary data when mutations must be tested,
then remove it and restore occupancy.

## Access And Privacy

- Sign in as ADMIN and confirm `/registration` opens.
- Sign in as REGISTRATION and confirm `/registration` opens.
- As REGISTRATION, confirm `/admin/settings`, `/admin/customers`,
  `/admin/logs`, `/admin/data`, and `/admin/analytics` redirect away.
- Signed out, confirm `/registration` redirects to `/login`.
- Confirm public routes expose no customer records, package ownership,
  sessions, notes, activity, visits, logs, exports, or analytics.

## Search And Workspace

- Search by customer full name and member code.
- Confirm the no-results state is clear.
- Select a customer and confirm name, member code, customer status, gym
  presence, assigned coach, and recent check-in/out details appear.
- Confirm the no-customer state explains how to begin.

## Packages And Controls

- Confirm active usable packages appear by default.
- Confirm Show all displays inactive, frozen, expired, and zero-session
  package history clearly.
- Confirm package name, sessions, expiry, status, time rule, and coach are
  readable.
- Confirm Reception Controls explain current rules and state that system
  settings are managed by Admin.
- Confirm Detailed and Compact modes work.
- In Compact mode, confirm notes and recent activity remain accessible.
- Confirm local view preferences remain after search, selection, and saved
  operational actions.

## Operational Workflow

- Change a session draft and confirm nothing persists before Save.
- Save a session correction, confirm the value updates, and verify its admin
  log.
- Check in a NOT_IN_GYM customer with selected usable packages.
- Confirm only selected package sessions decrease, occupancy increases, and
  duplicate check-in is blocked.
- Confirm expired, zero-session, frozen, and out-of-time-window packages are
  disabled and rejected server-side.
- Check out an IN_GYM customer and confirm sessions do not decrease,
  occupancy decreases, and the visit closes.
- Confirm checkout while NOT_IN_GYM is blocked.
- Freeze and reactivate an eligible package.
- Confirm expiration and remaining sessions do not change and logs are
  created.
- Confirm an expired frozen package does not become usable after reactivation.

## Notes And Activity

- Create, edit, refresh, and delete a customer note.
- Confirm delete confirmation and timestamps are clear.
- Confirm notes remain private and draft/stale-edit safeguards behave as
  expected.
- Confirm recent activity is selected-customer-only, read-only, and contains
  safe summaries without raw JSON, internal IDs, or full admin logs.

## Occupancy

- Change the occupancy draft and confirm nothing persists before Save.
- Save a correction and confirm Registration and `/our-app` show the final
  count.
- Confirm negative occupancy is blocked and the correction is logged.

## Responsive Review

Review around 390px, 768px, and 1440px widths:

- No horizontal overflow.
- Search and controls fit cleanly.
- Customer header stacks cleanly.
- Action buttons remain tappable.
- Package cards, notes, activity, and occupancy correction remain readable.
- Reception Controls help without dominating the page.

## Cleanup

- Remove temporary customers, packages, notes, and visits created for review.
- Restore occupancy to the agreed final count.
- Remove downloaded export files.
- Preserve intentional seed/demo data.

## Release Checks

```bash
npm run typecheck
npm run db:validate
npm run build
git diff --check
```

The project currently has no configured lint or automated test command.
