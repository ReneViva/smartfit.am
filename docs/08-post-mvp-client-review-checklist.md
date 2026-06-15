# Post-MVP Client Review Checklist

Use this checklist for a complete client review of the public website, Admin
workspace, and Registration workspace. Use clearly named temporary customers
and packages for tests that change data, then remove them and restore the
agreed occupancy count.

## Public Website

- Open the homepage with no active offers and confirm the empty message is
  clear.
- Review the homepage with one offer and with several offers.
- Confirm offers rotate automatically and the arrows and dots work.
- Confirm offer text and images look balanced with horizontal, vertical,
  logo/SVG, and no-image content.
- Review the homepage around 390px and 1440px widths.
- Open Public Packages and confirm package/service type and included guest
  allowance are clear.
- Open Our App and confirm it shows the current total occupancy only.
- Review About, Coaches, Gallery, Contact, and Our App for accurate public
  information.
- Confirm public pages do not show customer names, member IDs, contact
  details, birth dates, package ownership, remaining sessions, remaining guest
  passes, visits, notes, logs, or exports.

## Admin Packages And Services

- Create or edit a package with a guest-pass allowance.
- Confirm negative and fractional guest-pass allowances are rejected.
- Review the preset package/service types, including gym access, swimming,
  cardio, training, and coach-session options.
- Create a package with a custom type and confirm an empty custom type is
  rejected.
- Search and filter packages by package/service type.
- Confirm public package cards show only package-definition information.

## Admin Customers

- Create a temporary customer with birth date, phone, and emergency phone.
- Confirm birth date is required for new customers and a future date is
  rejected.
- Confirm emergency phone is visible only in private workspaces and exports.
- Search by member ID, name, phone, and emergency phone.
- Review an older customer with no birth date and confirm the missing value is
  clearly flagged.
- Assign more than one package/service to the same customer.
- Confirm a new assignment copies the package's default guest allowance.
- Confirm assigned-package cards show sessions, guest passes, dates, status,
  coach, and package/service type.

## Assigned Package Editing

- Edit an assigned package's package definition, dates, sessions, guest
  passes, coach, and allowed status.
- Confirm an end date before the start date is rejected.
- Confirm negative values and remaining values greater than initial values are
  rejected.
- Confirm direct frozen status changes are blocked when freeze/reactivate
  controls must be used.
- Freeze and reactivate an eligible assigned package.
- Confirm the normal add/renew flow still creates a separate assignment.
- Review the Admin log and confirm old and new values are recorded.

## Registration And Guest Check-In

- Search for the temporary customer and confirm operational profile details,
  package/service type, sessions, and remaining guest passes are readable.
- Check in with zero guests and confirm occupancy increases by one while guest
  passes remain unchanged.
- Check out and confirm occupancy decreases by one without another session or
  guest-pass deduction.
- Check in with one guest and select the intended guest source package.
- Confirm only the selected source package loses a guest pass.
- Confirm occupancy increases by the full party size and Currently In Gym
  shows the guest/party information.
- Check out and confirm occupancy decreases by the stored party size.
- Confirm missing guest source, insufficient guest passes, negative guest
  count, fractional guest count, and invalid guest source are rejected.
- Confirm normal session deduction still works for gym and service-like
  packages.

## Notes And Currently In Gym

- Create, edit, refresh, and delete a temporary customer note.
- Confirm notes remain private to staff workspaces.
- Confirm Currently In Gym shows the correct customer and party-size details.
- Confirm checkout does not deduct another session or guest pass.

## Exports

- As ADMIN, download Customers, Packages, Coaches, Customer Package History,
  Check-in/Check-out Logs, Promotion/Offer History, and Notes exports.
- Confirm customer exports include birth date and emergency phone.
- Confirm package exports include default guest passes and package/service
  type.
- Confirm customer package history includes initial and remaining guest
  passes plus package/service type.
- Confirm visit exports include guest count, party size, and guest-pass
  deductions.
- Confirm REGISTRATION and signed-out users cannot download Admin exports.

## Login And Access Separation

- Signed out, confirm Admin and Registration routes redirect to login.
- Sign in as ADMIN and confirm Admin and Registration workspaces open.
- Sign in as REGISTRATION and confirm Registration opens.
- As REGISTRATION, confirm Admin settings, customers, logs, data, analytics,
  and exports remain unavailable.

## Known Remaining Manual Tests

- Let the homepage carousel run for several rotations in the client's primary
  desktop and mobile browsers.
- Hover and keyboard-focus the carousel controls and confirm rotation pauses
  while interacting.
- Review final client-provided offer images, especially transparent logos and
  unusually tall images.
- Run the full check-in/check-out review with clearly disposable data in the
  intended local or demo environment.
- Open downloaded Excel files in the client's preferred spreadsheet
  application.
- Run the demo seed only against a confirmed local or disposable database,
  using the documented safety flag.

## Cleanup And Sign-Off

- Remove temporary customers, packages, notes, visits, and offer content.
- Restore occupancy to the agreed final count.
- Remove downloaded test export files.
- Confirm Admin, Registration, and public access separation one final time.
- Record client feedback and approval:

  - Reviewer:
  - Review date:
  - Approved:
  - Follow-up notes:
