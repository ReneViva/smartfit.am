# Smartfit.am — Client Decisions

**Document path:** `docs/00-client-decisions.md`
**Project:** Smartfit.am
**Purpose:** Record final client/project-owner decisions that clarify previously unclear Smartfit.am requirements.

---

## 1. Gallery

Gallery is confirmed as part of the regular public website MVP.

The website must include a separate public route called `/gallery`.

The Gallery page should show photos of the gym, equipment, training areas, and atmosphere.

Gallery must be public-safe. Photos must not expose private customer information unless the gym has permission to use those photos.

---

## 2. Package Freezing and Reactivation

Package freezing is confirmed for the MVP.

Freezing is one of the important gym-management features and must be available in both:

* Admin Panel
* Registration Panel

Both admin/manager users and registration/reception users must be able to freeze and reactivate customer packages.

A frozen package must not be usable during check-in.

A frozen package must not be treated as active for session deduction.

Every freeze and reactivation action must create an admin-visible log entry.

For the MVP, freezing does not automatically extend the package expiration date unless this rule is confirmed later.

---

## 3. Customer Fields and Customer ID Format

The exact customer fields and customer ID format will be provided from project files or official client/source data.

Codex must not invent customer fields or customer ID rules.

Until the official fields are provided, documentation should keep customer personal fields marked as source-defined.

Phase 8 must use the provided customer fields from the official source files. If those fields are not available by Phase 8, Codex should stop and report the blocker instead of guessing.

---

## 4. Manual Session Corrections

Manual session corrections do not require admin approval.

Manual session corrections do not require a correction reason in the MVP.

Reception staff can adjust remaining sessions with plus/minus controls and must click Save before the change is stored.

Every saved manual session correction must create a log entry visible to admin.

Remaining sessions must not go below zero unless a future rule confirms an override.

---

## 5. Manual Occupancy Corrections

Manual occupancy corrections do not require admin approval.

Manual occupancy corrections do not require a correction reason in the MVP.

Reception staff can manually increase or decrease the current occupancy count and must click Save before the change is stored.

Every saved manual occupancy correction must create a log entry visible to admin.

The occupancy count must not go below zero.

---

## 6. Design Colors

Design colors should be stored in a readable documentation file, preferably:

`docs/design-colors.md`

Do not store design colors mainly in `.env`.

Phase 1 should use `docs/design-colors.md` as the source for CSS variables, Tailwind tokens, buttons, cards, themes, and status colors.
