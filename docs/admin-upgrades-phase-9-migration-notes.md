# Admin Upgrades Phase 9 Migration Notes

Phase 9 adds the non-destructive schema foundation for the owner-approved
membership/service model.

## Implemented Schema Path

- `CustomerPackage` remains the customer membership/package container.
- `CustomerPackageService` stores service/session lines inside a
  `CustomerPackage`.
- `Package` keeps serving as the admin/public package template.
- `Package` and `CustomerPackage` now have daily and interval check-in limit
  fields for later enforcement.

## Backfill Behavior

The Phase 9 migration backfills one `CustomerPackageService` row for each
existing `CustomerPackage` row. The backfilled service line preserves:

- source package reference
- package name as service name
- initial and remaining sessions
- customer-package coach, or package assigned coach when no snapshot coach exists
- the first assigned package category by category display order

This preserves existing package/session data without changing customer
membership status, package dates, visits, freezes, session changes, or logs.

## One Active Membership Risk

The owner-approved target is one active membership/container per customer.
The existing production-era model allowed multiple active customer package rows.

Phase 9 does not automatically merge multiple active rows because the correct
surviving membership interval is a business decision when active packages have
different activation dates, expiration dates, coaches, guest passes, freeze
state, or histories.

The migration adds a partial lookup index for active non-deleted
`CustomerPackage` rows, but it does not add a unique constraint yet. A unique
constraint should be added only after the intended dev/demo/staging data is
reviewed and duplicate active rows are either manually resolved or converted by
an owner-approved backfill.

Recommended future enforcement after review:

```sql
CREATE UNIQUE INDEX "CustomerPackage_one_active_container_per_customer_uidx"
ON "CustomerPackage"("customerId")
WHERE "deletedAt" IS NULL AND "status" = 'ACTIVE';
```

Do not run that unique index against real data until duplicate active
membership/container rows have been resolved.
