# Smartfit.am - Admin Upgrades Scope

**Document path:** `docs/admin-upgrades-scope.md`  
**Branch:** `admin-upgrades`  
**Document type:** Branch-specific scope lock  
**Current branch phase:** Admin Upgrades Phase 1 — Scope Lock and Documentation Update

---

## 1. Purpose

This document controls the new `admin-upgrades` branch and organizes the gym owner's requested admin/reception changes into safe implementation phases.

This is a branch-specific upgrade track based on new gym-owner feedback. It is not official Phase 30 or any later official Smartfit.am phase. The official Smartfit.am phase plan remains unchanged unless the project owner manually updates it.

Admin Upgrades Phase 1 is documentation-only. It must not implement product code, change Prisma schema, change routes, change server actions, change UI components, or change business logic.

---

## 2. Branch Name

`admin-upgrades`

---

## 3. Source Context

This branch is based on new gym-owner meeting feedback. The branch must still respect the existing Smartfit.am privacy, permission, and simplicity rules:

- Public pages stay public-safe and never expose private customer or staff data.
- Admin keeps full management access.
- Registration keeps daily operational access only.
- Business-critical writes stay server-side.
- Unconfirmed future features stay out of scope.
- Existing implementation conflicts should be documented before risky database or workflow changes are attempted.

---

## 4. Confirmed Owner Decisions

- Package discounts use two price fields:
  - original price
  - final discount price
- If discount price is filled, the public package card should show the original price crossed out and the discount price clearly.
- The old customer multiple-packages assignment method should be replaced completely.
- Do not keep old implementation folders unless it is absolutely necessary and safe. Git history is enough.
- A package/membership interval means the customer package date range, for example 90 days.
- Same-day repeated check-ins count separately.
- Zero service sessions or expired membership/package days should show a warning and allow check-in without deduction.
- Daily check-in limit reached is a hard block.
- Interval check-in limit reached is a hard block.
- Frozen packages/memberships remain blocked from normal use.
- Telegram should be added to both the public Our App page and the Contact page.
- Our App announcements should be highly noticeable but user-friendly, such as a prominent dismissible banner/card, not push notifications, browser vibration, or aggressive animation.

---

## 5. Requested Change Groups

### A. Settings and Public Contact Information

- Merge working days and working hours into one flexible custom schedule textarea.
- Preserve line breaks and custom text.
- Add Telegram URL and visibility setting.
- Show Telegram on Our App and Contact where enabled.

### B. Public Content and Homepage Promotions

- Add promotion CTA URL.
- Add optional CTA label.
- If CTA label exists, show a button.
- If CTA URL exists but CTA label is empty, make the promotion card clickable.
- Add simple ordering for promotions.
- Preferred ordering UX: Move Up / Move Down controls instead of drag-and-drop or manual duplicate-prone order numbers.
- Add visible-on-app checkbox for important announcements.
- Our App should show visible announcements prominently.

### C. Package Public Display Improvements

- Add original price and discount price.
- Add public highlight / featured checkbox.
- Discount and highlight are independent.

### D. Customer Profile Improvements

- Add email.
- Add address.
- Add profile photo.
- Profile photo is separate from customer documents.
- Admin and Registration can manage profile photo.
- Only JPEG/PNG should be allowed for profile photo.
- Email should appear in the customer summary/header area and be edited through Edit Customer Profile, not document upload.

### E. Reception Notes Bug Fix

- Restore/fix the ability for Reception to add notes to a customer from the Registration workspace.
- Keep notes private.

### F. Coach Categories

- Reuse the existing category system if practical.
- Allow categories to be assigned to coaches during create/edit.
- Do not create a separate duplicate category system unless unavoidable.

### G. Membership/Package/Service Model Replacement

This is the largest core change in the branch.

Target model direction:

- Package remains the reusable admin/public package template.
- CustomerPackage or a renamed equivalent becomes the customer's active membership/package container.
- A customer should have one active membership/package container at a time after the replacement.
- Service/session lines live inside that customer package/membership.

Example customer active membership:

- Main gym access: 90 days
- Swimming with Davit: 12 sessions
- Bodybuilding with Chris: 8 sessions
- Group exercise: 5 sessions

The old method where the customer simply receives many separate active packages should be removed/replaced.

### H. Check-In Limits and Fast Service Deduction

- Add support for unlimited or limited check-ins across the package interval.
- Add support for unlimited or limited check-ins per day.
- Daily and interval limits are hard blocks.
- Same-day repeated check-ins count separately.
- Reception can still check in with warning when service sessions are zero or membership days are expired, but without deduction.
- Frozen packages/memberships remain blocked.
- Reception should be able to quickly deduct selected service/session lines during check-in.
- Check-out must not deduct sessions.

### I. Registration General Workspace

- Add a new merged Registration section called General.
- General should combine customer lookup and currently-in-gym control.
- Left side: searchable customers who are not checked in / can be checked in.
- Right side: customers currently in gym with Checkout and Open Customer buttons.
- Search should support name, phone, and member code where available.
- Fast check-in should not require opening the full customer dashboard.
- Open Customer should still allow deeper profile/notes/package/freeze work.

### J. Admin Sidebar Laptop Scroll Fix

- Fix private/admin sidebar scrolling so all menu sections are reachable on laptop-height screens.

---

## 6. Proposed Branch Phase Plan

Admin Upgrades Phase 1 — Scope Lock and Documentation Update  
Documentation-only scope lock for the branch.

Admin Upgrades Phase 2 — Settings, Telegram, Working Schedule, and Sidebar Fix  
Flexible working schedule textarea, Telegram settings/contact display, and admin sidebar scroll fix.

Admin Upgrades Phase 3 — Public Content Links, Ordering, and App Visibility Data  
CTA URL, CTA label, Move Up/Down ordering, and visible-on-app data support.

Admin Upgrades Phase 4 — Homepage Carousel and Our App Announcement Display  
Clickable carousel cards/buttons and prominent Our App announcements.

Admin Upgrades Phase 5 — Package Discount and Public Highlight  
Original price, final discount price, public discount UI, and package highlight checkbox.

Admin Upgrades Phase 6 — Customer Email, Address, and Profile Photo  
Customer profile fields and separate profile photo handling for Admin and Registration.

Admin Upgrades Phase 7 — Reception Notes Bug Fix  
Restore/fix customer note creation from Registration.

Admin Upgrades Phase 8 — Coach Categories  
Category assignment for coaches using the existing category system where practical.

Admin Upgrades Phase 9 — Membership/Service Schema Replacement  
Replace old customer multiple-package assignment model with one active membership/package container and multiple service/session lines.

Admin Upgrades Phase 10 — Admin Membership and Service Editor  
Admin customer dashboard editor for dates, guests, limits, service lines, coaches, sessions, and history/logging.

Admin Upgrades Phase 11 — Registration Fast Check-In Logic  
Fast service deduction, guests, daily/interval limits, warnings, hard blocks, and server-side validation.

Admin Upgrades Phase 12 — Registration General Workspace  
Merged customer lookup and currently-in-gym page optimized for crowded reception usage.

Admin Upgrades Phase 13 — Exports, Logs, Analytics, and Regression  
Update exports/logs/analytics and run full Admin/Registration/public regression.

---

## 7. Known Conflicts With Current/Old Behavior

- Existing docs and earlier implementation supported customers with multiple active packages.
- New owner decision replaces that with one active membership/package container plus service/session lines.
- Earlier review expectations blocked expired or zero-session packages. New decision allows warning-based check-in without deduction for zero sessions or expired days.
- Daily and interval check-in limits are hard blocks.
- Frozen package/membership use remains blocked.
- Existing review checklists still include multi-package assignment checks and should be treated as old behavior for this branch until updated in a later admin-upgrades phase.
- The official `docs/05-development-phases.md` plan ends at Phase 41. This branch uses separate "Admin Upgrades Phase" names and must not create official Phase 42 or later.

---

## 8. Privacy and Permission Rules

- Public pages must never expose customer names, member IDs, private contact details, package ownership, service lines, visits, notes, logs, exports, staff data, or private documents.
- Admin can manage full data.
- Registration can perform daily operational work.
- Business-critical writes must remain server-side.
- Logs must remain admin-visible and protected from editing by reception.

---

## 9. Blockers / Questions to Verify Before Implementation

These are open review items, not blockers for this documentation phase:

- Exact final naming: CustomerPackage vs Membership vs CustomerMembership.
- Whether one active membership/package should be enforced with a database constraint or application validation first.
- How existing live data should be migrated from multiple customer packages to one membership with service lines.
- Whether expired-day warning check-in should still increase occupancy.
- Whether warning-based check-in should create a special audit log action.
- Whether inactive customers are warning-only or blocked in the new General workflow.

---

## Phase 1 Scope Check

- No product code should be implemented in Admin Upgrades Phase 1.
- No Prisma schema should be modified in Admin Upgrades Phase 1.
- No routes, server actions, UI components, or business logic should be changed in Admin Upgrades Phase 1.
- No official Smartfit.am phase number should be created or modified in Admin Upgrades Phase 1.
- Customer accounts, coach dashboards, payments, QR check-in, notifications, ecommerce, multi-branch logic, and native/mobile-app features remain out of scope.
