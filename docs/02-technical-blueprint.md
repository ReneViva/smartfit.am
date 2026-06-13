# Smartfit.am — Technical Blueprint

**Document path:** `docs/02-technical-blueprint.md`  
**Project:** Smartfit.am  
**Document type:** Technical Blueprint  
**Purpose:** Translate the confirmed Smartfit.am product requirements into a high-level technical plan. This document is intended for the ChatGPT Project knowledge base first and can later be saved inside the real project directory.

---

## 1. Source Documents Used

The following project documents were used as the source of truth for this blueprint:

1. **Uploaded Word document:** `smartfit_am_website_specification_polished.docx`  
   Main source for the confirmed Smartfit.am requirements, including application areas, roles, workflows, business rules, MVP scope, and open decisions.

2. **Previously created PRD:** `docs/01-product-requirements.md` / `01-product-requirements.md`  
   Used as a structured summary of the uploaded Word document and as the first project knowledge-base file.

3. **Available but not used for functional architecture:** `smartfit_design_colors.xlsx`  
   This file appears to be related to visual design colors. It is not required for this technical blueprint except as a reminder that visual styling should later follow the approved Smartfit.am design colors.

No additional technical specification, database schema, API documentation, hosting requirement, or authentication specification was available at the time of writing this blueprint.

---

## 2. Confirmed Technical Direction

### Confirmed

- Smartfit.am is both a public gym website and an internal gym management system.
- The system must support separate application areas:
  - Regular Public Website.
  - User Panel / Mobile App Experience.
  - Registration Panel.
  - Admin Panel.
- The public website must display gym information, offers, packages, coaches, gallery/contact information, and the Our App / Add Our App feature.
- The public User Panel / Mobile App Experience must be mobile-first and no-login.
- The public User Panel must show the current live gym occupancy count.
- The public occupancy count must use configurable green/yellow/red crowd thresholds.
- The public User Panel must not expose private customer names, IDs, package data, notes, logs, or internal information.
- The Admin Panel must allow full management of website content, customers, packages, coaches, settings, logs, exports, and analytics.
- The Registration Panel must allow reception staff to handle customer search, check-in, check-out, package/session usage, manual corrections, notes, and manual occupancy correction.
- The system must store and manage customer profiles, package assignments, coach profiles, check-in/check-out activity, session counts, notes, logs, settings, public content, exports, and analytics data or analytics source data.
- Customers can have no active package, one active package, or multiple active packages at the same time.
- Packages can have optional time-based usage restrictions, such as being usable only before 3:00 PM.
- Check-in can deduct selected package sessions.
- Check-out must not deduct sessions.
- Important actions must create log entries visible to the admin.
- Basic MVP analytics are confirmed: daily check-ins, current occupancy, and peak hours.
- Admin login is included in the recommended MVP scope.
- The uploaded Word document includes a responsive customer-card visual example for desktop, tablet, and mobile reception views, with customer status, package cards, plus/minus controls, and save action.
* Gallery is confirmed as an MVP public website page at `/gallery`.
* Package freezing and reactivation are confirmed for the MVP.
* Both admin/manager users and registration/reception users can freeze and reactivate customer packages.
* Manual session corrections and manual occupancy corrections do not require admin approval or a reason in the MVP, but they must be logged.


### Preferred / Suggested

The following stack is the preferred technical direction for building Smartfit.am. It is not confirmed by the uploaded requirements, but it is suitable for the confirmed product needs:

- **Next.js** for the full-stack web application.
- **TypeScript** for safer frontend and backend code.
- **PostgreSQL** for relational gym-management data.
- **Prisma** for database access and migrations.
- **Tailwind CSS** for responsive UI styling.
- Role-based access control for Admin Panel and Registration Panel separation.
- Server-side validation for all private and operational actions.
- Database transactions for check-in, check-out, session deduction, manual correction, and occupancy updates.
- Centralized audit/log writing for all important actions.
- A simple PWA-style setup for Add to Home Screen support.

### Not Confirmed

- Exact hosting provider.
- Exact authentication provider or login method.
- Whether registration staff have a separate login screen or use the same login screen as admins.
- Whether customers will ever have personal login accounts.
- Whether coaches will have their own login/dashboard.
- Whether there will be a platform owner/master admin separate from the gym admin.
- Whether Smartfit.am must support multiple gym branches.
- Whether occupancy updates should be instant, polling-based, or page-refresh-based.
- Whether package time-restriction overrides are allowed and who can approve them.
- Whether notes can be deleted by reception staff.
- Package freezing is confirmed for MVP, but automatic expiration-date extension is not included in the MVP unless later confirmed.
- Whether customers will receive numeric IDs only, QR codes, membership cards, or a combination.
- Whether online payments, ecommerce checkout, SMS/WhatsApp/email/push notifications, loyalty, or native mobile apps are required later.

---

## 3. Application Areas

### 3.1 Regular Public Website

**Purpose:**  
Present Smartfit.am publicly and professionally. The website should explain the gym, current offers, packages, coaches, gallery, location, contact information, and the mobile app/live occupancy feature.

**Users:**  
Public visitors, gym customers/members, gym admin/manager for content management.

**Main actions:**

- Visitors view public pages.
- Visitors view offers, discounts, announcements, coaches, packages, gallery, contact information, working hours, and map links.
- Visitors access the Our App / Add Our App section.
- Admin updates editable public content from the Admin Panel.

**Technical notes:**

- Public pages should be accessible without login.
- Public content should be stored in the database or another editable content source because the admin must be able to update homepage offers, promotions, discounts, news, and announcements.
- The homepage hero section should support current offers and announcements.
- Public pages must be responsive and mobile-friendly.

**Status:** Confirmed by requirements.

---

### 3.2 User Panel / Mobile App Experience

**Purpose:**  
Provide a public, no-login, mobile-first experience where customers can quickly see how crowded the gym is and access useful gym contact information.

**Users:**  
Gym clients and public visitors.

**Main actions:**

- View the current number of people inside the gym.
- Understand crowd level through green/yellow/red status colors.
- View Smartfit.am logo.
- View motivational text if enabled by admin settings.
- View phone, WhatsApp, Instagram, and location links if enabled by admin settings.
- Read instructions for adding Smartfit.am to the phone home screen.

**Technical notes:**

- This area must be public and no-login.
- It should behave like a simple PWA-style experience, but no native App Store or Play Store app is confirmed.
- It should use the same central occupancy data updated by check-in, check-out, and manual occupancy correction.
- It must never expose private customer records.
- Exact update frequency for the live occupancy number is unclear.

**Status:** Confirmed by requirements. Update method is unclear.

---

### 3.3 Registration Panel

**Purpose:**  
Support reception staff with fast daily operations: customer lookup, check-in, check-out, session usage, manual corrections, package freezing/reactivation if allowed, notes, and occupancy control.

**Users:**  
Receptionist / registration staff.

**Main actions:**

- Search customers by name or customer ID.
- View customer cards.
- View customer status: In gym or Not in gym.
- View active/inactive packages depending on settings.
- Select package or packages used during check-in.
- Check a customer in.
- Check a customer out.
- Manually increase or decrease remaining sessions with plus/minus controls.
- Save manual corrections.
- Freeze or reactivate customer packages if operationally allowed.
- Create/read/update/delete notes if permission allows.
- Manually correct the current occupancy count.

**Technical notes:**

- The Registration Panel should be private and restricted to reception staff.
- Reception staff should not have full admin access.
- Check-in, check-out, manual session correction, package freezing/reactivation, note changes, and manual occupancy correction should be handled server-side.
- All important actions must write logs visible to admin.
- The customer-card UI should be responsive; the source specification includes a desktop/tablet/mobile visual example for this operational card layout.
- Package freezing and reactivation are confirmed for registration staff in the MVP. Registration staff can freeze and reactivate customer packages, but every freeze/reactivation action must be handled server-side and logged.

**Status:** Confirmed by requirements. Exact login method and some permissions are unclear.

---

### 3.4 Admin Panel

**Purpose:**  
Act as the main control center for the gym owner or administrator.

**Users:**  
Gym owner / admin.

**Main actions:**

- Manage public website content, offers, promotions, discounts, news, and announcements.
- Manage customers.
- Manage packages and package rules.
- Manage coaches.
- View a customer package overview table.
- View customers requiring attention.
- View gym logs.
- Export data as Excel files.
- Manage system/gym settings.
- View analytics.
- Freeze and reactivate customer packages.


**Technical notes:**

- The Admin Panel must be private.
- Admin users have full access according to the requirements.
- Admin actions should create log entries where relevant.
- Admin settings must control public app display options and occupancy thresholds.
- Data export must be restricted to admin users.
- Package freezing and reactivation are confirmed Admin Panel actions in the MVP. These actions must be handled server-side and must create admin-visible log entries.

**Status:** Confirmed by requirements.

---

## 4. Architecture Recommendation

### 4.1 Overall Architecture

**Recommended technical approach:**  
Build Smartfit.am as a single full-stack web application using Next.js and TypeScript. This is appropriate because the product includes public pages, private dashboards, form-heavy management screens, server-side business rules, and database-backed operational workflows.

A single application should contain:

- Public website routes.
- Public mobile app-like route or page.
- Private Admin Panel routes.
- Private Registration Panel routes.
- Server-side business logic for all important operations.
- Database access through Prisma.

This recommendation is not explicitly confirmed in the uploaded documents, but it matches the confirmed application shape.

---

### 4.2 Frontend Approach

**Confirmed by requirements:**

- Public pages are required.
- A mobile-first User Panel / Mobile App Experience is required.
- Admin and Registration Panels are required.
- Registration customer cards must show statuses, packages, remaining sessions, expiration dates, package statuses, and correction controls.
- The public occupancy number must be easy to read on mobile.

**Recommended technical approach:**

- Use responsive Next.js pages and reusable UI components.
- Use Tailwind CSS for layout, spacing, status colors, and mobile responsiveness.
- Use reusable form components for customer, package, coach, settings, notes, and content-management screens.
- Use reusable status badges for customer status and package status.
- Use reusable package cards that work for zero, one, or multiple active packages.
- Use explicit loading, empty, validation-error, and server-error states for operational screens.

---

### 4.3 Backend Approach

**Confirmed by requirements:**

- The system must perform protected customer, package, coach, notes, settings, logs, exports, and analytics operations.
- Check-in and check-out workflows must update customer status, sessions, occupancy, and logs.
- Package time restrictions must be checked before check-in.
- Manual corrections must be saved and logged.

**Recommended technical approach:**

- Handle all critical operations on the server.
- Use server-side validation before writing to the database.
- Use database transactions for check-in, check-out, manual corrections, package freeze/reactivation, and occupancy updates.
- Centralize log creation so important actions are always recorded.
- Keep public read operations separate from private operational write operations.

---

### 4.4 Database Approach

**Confirmed by requirements:**

- Persistent data is required for customers, packages, coaches, check-ins, sessions, notes, logs, settings, content, exports, and analytics source data.
- Customers can have multiple packages at once.
- Packages can have statuses and optional time restrictions.

**Recommended technical approach:**

- Use PostgreSQL because the data is relational and includes many relationships: customers, packages, coaches, visits, session usage, notes, and logs.
- Use Prisma for type-safe database access and migrations.
- Store operational actions in normalized tables rather than relying only on the current customer/package state.
- Keep audit/log data separate from editable business data.

---

### 4.5 Authentication Approach

**Confirmed by requirements:**

- Admin login is part of the recommended MVP scope.
- Admin users and registration users have different access responsibilities.
- Public User Panel and public website do not require login.

**Recommended technical approach:**

- Use authenticated private routes for Admin Panel and Registration Panel.
- Use role-based permission checks for admin vs registration staff.
- Do not create customer login accounts unless the client confirms them.
- Do not create coach login accounts unless the client confirms a coach dashboard.

**Unclear:**  
The exact login method, credential model, and whether admin/reception use one shared login page or separate login pages are not confirmed.

---

### 4.6 Public / Private Route Separation

**Confirmed by requirements:**

- Public website and public User Panel are public.
- Admin Panel and Registration Panel are internal areas with different permissions.

**Recommended technical approach:**

- Separate public routes from private routes clearly.
- Ensure public routes cannot access private customer/package/log data.
- Protect admin and registration routes with authentication and role checks.

---

### 4.7 Dashboard Separation

**Confirmed by requirements:**

- Admin Panel and Registration Panel are separate working areas.
- Admin has full management access.
- Registration staff have limited daily-operation access.

**Recommended technical approach:**

- Keep Admin Panel and Registration Panel UI separate to reduce permission mistakes.
- Avoid showing admin-only controls inside the Registration Panel.
- Use shared backend logic where appropriate, but enforce permissions server-side.

---

### 4.8 Data Validation Approach

**Recommended technical approach:**

- Validate all forms before saving.
- Validate package session counts so they do not go below zero unless an approved override is later confirmed.
- Validate customer status before check-in to prevent double check-in unless an override is later confirmed.
- Validate package time restrictions during check-in.
- Validate required customer, package, coach, settings, and content fields.
- Validate date/time values for activation dates, expiration dates, working hours, and package time restrictions.

The need for validation is directly supported by the confirmed workflows, but the exact validation library is not confirmed.

---

### 4.9 Error Handling Approach

**Recommended technical approach:**

- Show clear validation errors on forms.
- Show safe operational warnings during check-in if a selected package is expired, frozen, has zero sessions, or is outside its allowed time window.
- Show confirmation/error feedback after save actions.
- Do not expose server errors or private data on public pages.
- Log important failed or blocked operational actions if needed, but this behavior is not fully confirmed.

---

## 5. Frontend Strategy

### 5.1 Public Pages

**Confirmed pages from the requirements:**

- Home.
- About Us.
- Coaches.
- Packages.
- Contact Us.
- Our App / Add Our App.
- Gallery is mentioned as a suggested public page and as part of the regular website requirements.

**Frontend needs:**

- Mobile-friendly layout.
- Editable content areas where admin-managed content appears.
- Public display of coaches, packages, offers, announcements, location, working hours, and contact links.
- Clear access to the live occupancy / Our App section.

**Unclear:**  
Whether Gallery must be included in the first MVP or can come later depends on final client approval and available gym images.

---

### 5.2 User Panel / Mobile App Experience

**Confirmed frontend needs:**

- Mobile-first page.
- Smartfit.am logo.
- Current occupancy number.
- Green/yellow/red visual crowd status.
- Motivational message if enabled.
- Contact links if enabled.
- Add to Home Screen instructions.

**Recommended technical approach:**

- Use a simplified mobile layout separate from the full website navigation if needed.
- Use PWA-friendly metadata and app icon configuration.
- Display only public-safe data.

**Unclear:**  
Whether the occupancy count should update instantly, through polling, or only on page refresh.

---

### 5.3 Registration Panel UI

**Confirmed frontend needs:**

- Customer search by name or customer ID.
- Search results that help identify the correct customer quickly.
- Customer card with customer name, customer ID, status badge, packages, remaining sessions, expiry dates, package statuses, and package time rules.
- Check-in button.
- Check-out button.
- Package selection during check-in.
- Plus/minus controls for manual session corrections.
- Save action for corrections.
- Notes section.
- Manual occupancy correction controls.
- Responsive desktop/tablet/mobile layout.

**Recommended technical approach:**

- Use card-based layouts for customer package information.
- Use status badges for `In gym` and `Not in gym`.
- Use package cards that can handle no packages, one package, or 4–5 active packages.
- Use warning states for expired, frozen, zero-session, and time-restricted packages.
- Use confirmation or disabled states before critical saves.

---

### 5.4 Admin Panel UI

**Confirmed frontend needs:**

- Content management screens for offers, promotions, discounts, news, and announcements.
- Customer management screens.
- Package management screens.
- Coach management screens.
- Customer package overview table.
- Customer status/alerts section.
- Logs view.
- Data export section.
- Settings section.
- Analytics section.

**Recommended technical approach:**

- Use tables for customer/package overview, logs, exports, and analytics source lists.
- Use forms for CRUD and settings.
- Use filters for customers by name, ID, status, package, coach, expiration date, and remaining sessions.
- Use clear empty states for no customers, no packages, no logs, no notes, and no analytics data.

---

### 5.5 Reusable UI Components

**Recommended technical approach based on confirmed screens:**

- Customer search input.
- Customer card.
- Package card.
- Status badge.
- Session stepper / plus-minus control.
- Save/cancel action row.
- Notes list/editor.
- Settings form fields.
- Data table.
- Filter controls.
- Public occupancy display.
- Public contact-link buttons.

These components are recommended because they directly support confirmed screens. This is not a detailed component/folder plan.

---

### 5.6 Loading, Empty, and Error States

**Recommended technical approach:**

- Customer search should handle no results.
- Customer card should handle no active package.
- Package list should handle inactive, expired, frozen, and zero-session packages.
- Public occupancy page should handle temporary loading and unavailable occupancy data.
- Export screens should handle empty export results.
- Analytics screens should handle insufficient data.

These states are not individually listed in the uploaded document but are necessary to support the confirmed workflows safely.

---

## 6. Backend Strategy

### 6.1 Public Content Retrieval

**What it does:**  
Loads public website content such as offers, announcements, packages, coaches, gallery, contact details, and working hours.

**Feature that needs it:**  
Regular Public Website.

**Why it must be handled server-side:**  
Public pages must read admin-managed content from a trusted source and avoid exposing private data.

**Status:** Confirmed requirement; implementation approach recommended.

---

### 6.2 Public Occupancy Retrieval

**What it does:**  
Provides the current number of people inside the gym and the crowd color/status based on admin-configured thresholds.

**Feature that needs it:**  
User Panel / Mobile App Experience and public live gym monitor.

**Why it must be handled server-side:**  
The public page should read only the safe occupancy count and threshold result, not private customer records.

**Status:** Confirmed requirement; update method unclear.

---

### 6.3 Admin Content Management

**What it does:**  
Allows admin users to create, update, renew/reactivate, delete, and review public content such as offers, promotions, discounts, news, and announcements.

**Feature that needs it:**  
Admin Panel and public homepage.

**Why it must be handled server-side:**  
Only authorized admin users should edit public content. Offer/promotion history should be stored for review or export.

**Status:** Confirmed requirement.

---

### 6.4 Customer Management

**What it does:**  
Allows admin users to create, view, update, renew/reactivate, delete, search, and filter customer profiles.

**Feature that needs it:**  
Admin Panel and Registration Panel customer search/customer card.

**Why it must be handled server-side:**  
Customer data is private and must be protected. Customer status and package relationships affect operational workflows.

**Status:** Confirmed requirement.

---

### 6.5 Package Management

**What it does:**  
Allows admin users to manage packages, package prices, session counts, package types, assigned coaches if required, activation dates, expiration dates, active/inactive status, and optional time restrictions.

**Feature that needs it:**  
Admin Panel, Registration Panel, check-in workflow, public Packages page.

**Why it must be handled server-side:**  
Package rules control access and session deductions. They must be validated consistently and protected from unauthorized changes.

**Status:** Confirmed requirement.

---

### 6.6 Coach Management

**What it does:**  
Allows admin users to manage coach profiles and connect coaches to packages/customers when relevant.

**Feature that needs it:**  
Admin Panel, public Coaches page, coach-related session usage.

**Why it must be handled server-side:**  
Coach records are connected to packages and customer activity. Admin-only management prevents incorrect assignments.

**Status:** Confirmed requirement.

---

### 6.7 Check-In Logic

**What it does:**  
Processes a customer check-in by changing customer status, validating selected packages, checking package time restrictions, deducting selected package sessions, increasing occupancy, and writing logs.

**Feature that needs it:**  
Registration Panel check-in workflow.

**Why it must be handled server-side:**  
Check-in affects multiple sensitive records at once. It must be atomic and protected from client-side manipulation.

**Status:** Confirmed requirement.

---

### 6.8 Check-Out Logic

**What it does:**  
Processes a customer check-out by changing customer status to Not in gym, recording exit time, decreasing occupancy, and writing a log entry. It must not deduct sessions.

**Feature that needs it:**  
Registration Panel check-out workflow.

**Why it must be handled server-side:**  
Customer status and live occupancy must remain consistent and traceable.

**Status:** Confirmed requirement.

---

### 6.9 Manual Session Correction

**What it does:**  
Allows reception staff to manually increase or decrease remaining package sessions using plus/minus controls and save the correction.

**Feature that needs it:**  
Registration Panel.

**Why it must be handled server-side:**  
Manual corrections affect customer package balance and must create admin-visible logs.

**Status:** Confirmed requirement. Override behavior for negative sessions is unclear.

---

### 6.10 Package Freezing and Reactivation

**What it does:**  
Allows package freezing/reactivation if the gym allows this operationally. Frozen packages should not be treated as active for session usage.

**Feature that needs it:**  
Registration Panel and Admin Panel package/customer package management.

**Why it must be handled server-side:**  
Freezing changes package availability and must be logged.

**Status:** Confirmed as a requirement to support if allowed operationally; exact freeze rules unclear.

---

### 6.11 Notes Management

**What it does:**  
Allows reception staff to create, read, update, and possibly delete notes depending on permission.

**Feature that needs it:**  
Registration Panel notes section; optional admin export.

**Why it must be handled server-side:**  
Notes are internal data and may contain customer-specific operational details. Permissions must be enforced.

**Status:** Confirmed notes section; delete permission unclear.

---

### 6.12 Manual Occupancy Correction

**What it does:**  
Allows reception staff to manually increase or decrease the current occupancy count when correction is needed.

**Feature that needs it:**  
Registration Panel and public live occupancy count.

**Why it must be handled server-side:**  
The public count depends on this value, and every manual correction must be logged.

**Status:** Confirmed requirement. Approval level unclear.

---

### 6.13 Logs / Audit Trail

**What it does:**  
Stores important system actions such as check-ins, check-outs, session deductions, manual corrections, freeze/reactivation, renewal, and important edits.

**Feature that needs it:**  
Admin logs, auditability, exports, operational tracking.

**Why it must be handled server-side:**  
Logs must be trustworthy, protected from normal editing, and created from actual server-side actions.

**Status:** Confirmed requirement.

---

### 6.14 Data Export

**What it does:**  
Allows admin users to export important information as Excel files.

**Feature that needs it:**  
Admin Data section.

**Why it must be handled server-side:**  
Exports contain private data and must be restricted to admin users.

**Status:** Confirmed requirement.

---

### 6.15 Analytics Calculation

**What it does:**  
Calculates usage metrics such as daily/weekly/monthly check-ins, peak hours, average time in gym, most active customers, most used package types, coach session usage, and occupancy trends.

**Feature that needs it:**  
Admin analytics dashboard.

**Why it must be handled server-side:**  
Analytics depend on stored operational data and should not expose private data to public users.

**Status:** Confirmed analytics categories; exact formulas unclear.

---

## 7. Database Strategy

This section describes high-level database needs only. The detailed schema should be created later in `docs/03-database-schema.md`.

### 7.1 Users and Access

**Data to store:**  
Admin users and registration staff users, with enough information to authenticate them and enforce permissions.

**Feature that uses it:**  
Admin Panel, Registration Panel.

**Status:** Partially confirmed. Admin login and role separation are confirmed, but exact authentication method and user-account fields are unclear.

---

### 7.2 Public Website Content

**Data to store:**  
Homepage content, offers, promotions, discounts, news, announcements, content status, and offer/promotion history.

**Feature that uses it:**  
Public website and Admin Panel content management.

**Status:** Confirmed.

---

### 7.3 Gym Settings

**Data to store:**  
Gym name, logo reference, contact number, WhatsApp link, Instagram link, address, map link, working days, working hours, occupancy thresholds, public app display settings, and registration-panel inactive-customer visibility setting.

**Feature that uses it:**  
Admin Settings, public website, User Panel / Mobile App Experience, Registration Panel.

**Status:** Confirmed.

---

### 7.4 Customers

**Data to store:**  
Customer personal information, customer ID, active/inactive status, current gym status, assigned coach if applicable, package history, and related notes/logs.

**Feature that uses it:**  
Admin customer management, Registration Panel customer search/card, check-in/check-out workflows, analytics.

**Status:** Confirmed.

---

### 7.5 Coaches

**Data to store:**  
Coach name, surname, photo reference, specialty, optional contact information, description if used publicly, and active/inactive status.

**Feature that uses it:**  
Admin coach management, public Coaches page, coach-specific packages, coach-related session analytics.

**Status:** Confirmed. Coach contact information is optional/if needed.

---

### 7.6 Packages and Customer Package Assignments

**Data to store:**  
Package name, price, number of sessions, package type, assigned coach if required, activation date, expiration date, active/inactive/frozen/expired status, optional time restriction, remaining sessions, and customer-package relationship/history.

**Feature that uses it:**  
Admin package management, Registration Panel package cards, check-in workflow, customer package overview, analytics, public Packages page.

**Status:** Confirmed.

---

### 7.7 Package Time Restrictions

**Data to store:**  
Whether a package is available all day or only during a specific time range, such as before 3:00 PM.

**Feature that uses it:**  
Check-in validation and package management.

**Status:** Confirmed. Override rules are unclear.

---

### 7.8 Check-In / Check-Out Records

**Data to store:**  
Customer, check-in time, check-out time, selected package(s), deducted sessions, selected coach package if applicable, and resulting occupancy changes.

**Feature that uses it:**  
Registration Panel, logs, analytics, average time in gym, occupancy trends.

**Status:** Confirmed.

---

### 7.9 Session Usage Records

**Data to store:**  
Which package sessions were deducted, when they were deducted, who performed the action, and the before/after session values if required for logs.

**Feature that uses it:**  
Check-in workflow, manual corrections, package history, admin logs, exports, analytics.

**Status:** Confirmed.

---

### 7.10 Notes

**Data to store:**  
Note content, related customer if applicable, creator, date/time, update date/time, and deletion status if deletion is allowed.

**Feature that uses it:**  
Registration Panel notes section and possible admin export.

**Status:** Confirmed notes are required; delete permission unclear.

---

### 7.11 Logs / Audit Events

**Data to store:**  
Action type, actor, target customer/package/coach/setting/content item where relevant, timestamp, before/after values where needed, and short human-readable description.

**Feature that uses it:**  
Admin logs, auditability, data export.

**Status:** Confirmed.

---

### 7.12 Occupancy State

**Data to store:**  
Current number of people inside the gym and enough history to support occupancy trends if required.

**Feature that uses it:**  
Public live occupancy count, Registration Panel, Admin analytics.

**Status:** Confirmed current count is required. Historical occupancy trend detail is confirmed as useful analytics, but exact storage method is unclear.

---

### 7.13 Data Export Sources

**Data to store:**  
The source data for export: customers, packages, coaches, customer package history, check-in/check-out logs, promotion/offer history, and notes if needed.

**Feature that uses it:**  
Admin Data export section.

**Status:** Confirmed export categories. Whether to store export history is unclear.

---

### 7.14 Analytics Source Data

**Data to store:**  
Operational records needed to calculate check-ins, peak hours, average time in gym, active customers, package usage, coach usage, and occupancy trends.

**Feature that uses it:**  
Admin analytics.

**Status:** Confirmed analytics categories. Exact formulas and storage/aggregation approach are unclear.

---

### 7.15 Media References

**Data to store:**  
Logo reference, coach photo references, gallery image references, and possibly homepage/offer image references if the client wants images for public content.

**Feature that uses it:**  
Public website, coach pages, gallery, admin settings/content management.

**Status:** Logo, coach photos, and gallery images are confirmed. Upload/storage method is unclear.

---

## 8. Authentication and Permissions Strategy

Authentication and permissions are required, but not fully specified in the current documents.

### Confirmed Roles / Access Types

| Access Type | Confirmed Purpose | Access Level |
|---|---|---|
| Public visitor | View public website and public live occupancy/app page | Public, no login |
| Gym customer/member | Use public mobile app-like experience and live occupancy view | Public, no login in MVP |
| Receptionist / registration staff | Manage daily customer entry, exit, session usage, notes, and occupancy corrections | Private, limited operational access |
| Gym owner / admin | Manage website, customers, packages, coaches, settings, logs, exports, and analytics | Private, full access |

### Confirmed Permission Rules

- Admin users have full access.
- Registration users have limited daily-operation access.
- Public users must not see private customer data.
- Logs are visible only to admin and should not be editable by reception staff.
- Registration staff should not need full admin access.

### Recommended Technical Approach

- Use authenticated sessions for Admin Panel and Registration Panel.
- Use role checks on every private server-side action.
- Protect admin-only routes from registration users.
- Protect registration-only workflows from public users.
- Keep public User Panel completely separate from private data.
- Avoid customer accounts unless confirmed later.
- Avoid coach accounts unless confirmed later.

### Unclear

- Exact authentication method.
- Exact role names.
- Whether admin and registration staff use one login page or separate login pages.
- Whether registration staff can delete notes.
- Whether registration staff can freeze/reactivate packages without admin approval.
- Whether manual occupancy changes require only receptionist permission or admin confirmation.
- Whether admin overrides are allowed for package time restrictions or zero-session/expired packages.

---

## 9. Data Flow Overview

### 9.1 Customer Check-In Flow

1. Receptionist searches for a customer by name or customer ID.
2. Receptionist opens the customer card.
3. System shows customer status, active/inactive packages, remaining sessions, expiration dates, package statuses, and time rules.
4. Receptionist clicks Check in.
5. Receptionist selects which package or packages are used for the visit.
6. System checks whether the selected package is active, usable, has remaining sessions, and is allowed at the current time.
7. If allowed, the system changes customer status from Not in gym to In gym.
8. System deducts 1 session from each selected package that should be used for that visit.
9. System increases current occupancy by 1.
10. System writes log entries for check-in and all session deductions.
11. System shows the updated customer card.

**Confirmed:** Yes  
**Unclear points:** Admin override rules, expired/zero-session handling, exact warning/approval behavior, and whether check-in can proceed if one selected package is invalid but another is valid.

---

### 9.2 Time-Restricted Package Check-In Flow

1. Receptionist selects a package during check-in.
2. System checks whether the package has a time restriction.
3. If no time restriction exists, the package can be used normally.
4. If a time restriction exists, the system compares the current time with the package's allowed time window.
5. If current time is inside the allowed window, check-in can continue.
6. If current time is outside the allowed window, the system warns the receptionist and should not deduct the session unless an admin override is allowed.

**Confirmed:** Yes  
**Unclear points:** Whether admin override is allowed, who can approve it, and whether the override should be logged separately.

---

### 9.3 Customer Check-Out Flow

1. Receptionist opens the customer card for a customer currently marked as In gym.
2. Receptionist clicks Check out.
3. System changes customer status from In gym to Not in gym.
4. System records the exit time.
5. System decreases the current occupancy count by 1.
6. System writes a check-out log entry.
7. No sessions are deducted.

**Confirmed:** Yes  
**Unclear points:** How the system should behave if occupancy is already zero or if the customer is not marked as In gym.

---

### 9.4 Manual Session Correction Flow

1. Receptionist opens a customer card.
2. Receptionist uses plus/minus controls on a package card.
3. Receptionist clicks Save.
4. System validates the new session count.
5. System saves the new remaining session count.
6. System writes a log entry visible to admin.
7. System displays the updated package data.

**Confirmed:** Yes  
**Unclear points:** Whether negative sessions are ever allowed, whether some corrections require admin approval, and whether correction reasons are required.

---

### 9.5 Manual Occupancy Correction Flow

1. Receptionist opens the occupancy correction control.
2. Receptionist manually increases or decreases the current occupancy number.
3. Receptionist clicks Save.
4. System validates the new occupancy count.
5. System saves the corrected occupancy count.
6. System writes a log entry visible to admin.
7. Public User Panel uses the updated count.

**Confirmed:** Yes  
**Unclear points:** Whether correction requires admin password/approval and whether correction reason is required.

---

### 9.6 Public Occupancy Viewing Flow

1. Public visitor or gym customer opens the User Panel / Mobile App Experience.
2. System loads the current occupancy count.
3. System applies admin-configured green/yellow/red thresholds.
4. Page displays the current number and crowd color.
5. Page displays enabled public app content such as logo, motivational text, phone, WhatsApp, Instagram, and location link.

**Confirmed:** Yes  
**Unclear points:** Update frequency and whether the page should use real-time updates, polling, or refresh-only behavior.

---

### 9.7 Admin Content Update Flow

1. Admin logs in.
2. Admin opens content management for offers, promotions, discounts, news, or announcements.
3. Admin creates, updates, renews/reactivates, or deletes content where appropriate.
4. System saves the content.
5. System stores offer/promotion history.
6. Updated content appears on the public website.
7. System writes logs where relevant.

**Confirmed:** Yes  
**Unclear points:** Exact content fields, publishing workflow, whether drafts are required, and whether images are attached to offers.

---

### 9.8 Admin Data Export Flow

1. Admin opens the Data section.
2. Admin selects an export category.
3. System generates an Excel file from authorized data.
4. Admin downloads the file.

**Confirmed:** Yes  
**Unclear points:** Exact export filters, file naming rules, whether export history should be stored, and whether notes should always be included or only if selected.

---

### 9.9 Admin Analytics Viewing Flow

1. Admin opens the Analytics section.
2. System reads operational data from check-ins, check-outs, sessions, packages, coaches, and occupancy records.
3. System calculates analytics such as daily check-ins, current occupancy, peak hours, average time in gym, most active customers, most used package types, coach-related session usage, and occupancy trends.
4. Admin views the results.

**Confirmed:** Yes  
**Unclear points:** Exact formulas, date filters, chart types, and whether analytics must be exportable.

---

## 10. Settings and Configuration

The uploaded requirements confirm the following configurable items:

| Setting | Used By | Status |
|---|---|---|
| Gym name | Public website, public app page, admin settings | Confirmed |
| Logo | Public website, public app icon/display, admin settings | Confirmed |
| Contact number | Public website, public app page | Confirmed |
| WhatsApp link | Public website, public app page | Confirmed |
| Instagram link | Public website, public app page | Confirmed |
| Address | Public website, contact page, public app page | Confirmed |
| Google Maps or Yandex Maps link | Public website, public app page | Confirmed |
| Gym working days | Public website, settings | Confirmed |
| Gym working hours | Public website, settings | Confirmed |
| Occupancy green/yellow/red thresholds | Public live occupancy display | Confirmed |
| Public app display toggles | Public User Panel / Mobile App Experience | Confirmed |
| Motivational text visibility/content | Public User Panel / Mobile App Experience | Confirmed |
| Whether registration staff can hide inactive customers | Registration Panel | Confirmed |
| Package time restriction | Package management and check-in validation | Confirmed |

### Unclear Settings

- Whether note deletion permission is configurable.
- Whether package freezing extension rules are configurable.
- Whether admin override permissions are configurable.
- Whether manual occupancy corrections require admin password or reason.
- Whether public occupancy update interval is configurable.
- Whether exact public app installation instructions must differ by iPhone/Android.

---

## 11. Analytics / Reporting

### Confirmed Analytics

The Admin Panel should include analytics that help the gym understand usage and activity. Confirmed analytics categories include:

- Peak gym hours.
- Average time customers spend in the gym.
- Number of daily check-ins.
- Number of weekly check-ins.
- Number of monthly check-ins.
- Most active customers.
- Most used package types.
- Coach-related session usage.
- Current occupancy.
- Historical occupancy trends.

The recommended MVP specifically includes:

- Daily check-ins.
- Current occupancy.
- Peak hours.

### Confirmed Reporting / Export

The Admin Data section should support Excel exports for:

- Customers.
- Packages.
- Coaches.
- Customer package history.
- Check-in and check-out logs.
- Promotion and offer history.
- Notes, if the admin wants to keep a record outside the system.

### Unclear Analytics

- Exact formulas for peak hours.
- Exact formula for average time spent in gym.
- Date filters required for analytics.
- Whether analytics should be shown as cards, tables, charts, or all of these.
- Whether analytics should be exportable.
- Whether historical occupancy trends require periodic snapshots or can be derived from check-in/check-out events.

### Not Confirmed

- Revenue analytics.
- Online payment analytics.
- Multi-branch analytics.
- Marketing campaign analytics.
- Customer retention scoring.
- Predictive analytics.

---

## 12. Notifications

External notifications are not confirmed in the current requirements.

### Confirmed

- Internal admin visibility for customers requiring attention is confirmed.
- The Admin Panel should highlight customers with expired packages, zero remaining sessions, packages expiring soon, missing/incomplete data, and customers still marked as In gym after an unusually long period if that rule is added later.

### Not Confirmed

- SMS notifications.
- WhatsApp notifications.
- Email notifications.
- Push notifications.
- Customer reminders.
- Staff/admin notification inbox.
- Automated notification templates.

### Technical Direction

Do not build external notification infrastructure in the MVP unless the client confirms it. Internal alert lists can be implemented as dashboard views or filters based on existing customer/package/check-in data.

---

## 13. File and Image Handling

### Confirmed File / Image Needs

- Gym logo.
- Coach photos.
- Gallery images.
- Possible public content images if the homepage, offers, or announcements require visuals.
- Excel export files generated from admin data.

### Recommended Technical Approach

- Store image metadata/references in the database.
- Store actual image files using a file storage method appropriate for the deployment environment.
- Keep image upload/edit access restricted to admin users.
- Generate Excel export files server-side and restrict downloads to admin users.

### Unclear

- Whether images will be uploaded through the Admin Panel or provided as external URLs.
- Required image sizes and formats.
- Whether images require cropping or resizing.
- Whether old images should be deleted, archived, or kept.
- Whether banners are separate from offers/announcements.
- Whether export files should be stored permanently or generated on demand.

---

## 14. Security Considerations

The following security recommendations directly relate to the confirmed Smartfit.am requirements:

1. **Protect private panels**  
   Admin Panel and Registration Panel must require authentication.

2. **Enforce role permissions server-side**  
   Reception staff must not gain admin permissions by changing client-side code or URLs.

3. **Keep public data safe**  
   The public website and User Panel must not expose private customer names, IDs, packages, notes, logs, or histories.

4. **Protect logs**  
   Logs should be visible only to admins and should not be editable by reception staff.

5. **Use transactions for operational actions**  
   Check-in, check-out, session deduction, manual correction, and occupancy changes should be saved atomically so the system does not end in a partially updated state.

6. **Prevent invalid session counts**  
   Remaining sessions should not go below zero unless an admin-approved override is later confirmed.

7. **Prevent duplicate active check-ins**  
   A customer should not be checked in twice at the same time unless an admin override is later confirmed.

8. **Validate package time restrictions**  
   Package time rules must be checked on the server before deducting sessions.

9. **Restrict exports**  
   Excel exports contain private business/customer data and must be admin-only.

10. **Control manual occupancy correction**  
   Manual occupancy changes should be logged and protected by permission checks.

11. **Validate all forms**  
   Customer, package, coach, settings, notes, content, and correction forms should be validated before saving.

12. **Do not expose implementation errors publicly**  
   Public pages should show safe error states rather than raw server or database errors.

---

## 15. Deployment Considerations

The uploaded documents do not confirm a hosting provider or production infrastructure. The following is a practical recommendation based on the preferred stack.

### Recommended Technical Approach

- Deploy the Next.js application on a platform that supports server-side rendering and server-side actions/API logic.
- Use a managed PostgreSQL database.
- Use Prisma migrations for database changes.
- Use environment variables for database connection, authentication secrets, and file-storage configuration if file uploads are used.
- Use a file-storage solution if admin-managed image uploads are required.
- Configure backups for the database because the system stores operational customer/package/check-in data.
- Keep admin and registration URLs protected in production.
- Use HTTPS in production.

### Unclear

- Hosting provider.
- Database provider.
- Domain/DNS setup.
- Email/SMS/WhatsApp provider, if notifications are later confirmed.
- Image/file storage provider.
- Backup frequency.
- Whether staging and production environments are required.

---

## 16. Technical Questions / Unclear Points

The following questions cannot be safely answered from the uploaded documents and must be confirmed before or during development:

1. Which exact authentication method should be used for admin and registration staff?
2. Should Admin Panel and Registration Panel share one login page or use separate login pages?
3. What exact role names should be used in the system?
4. Should registration staff accounts be managed by the admin?
5. Should customers have login accounts now, later, or never?
6. Should coaches have their own login/dashboard?
7. Is there only one Smartfit.am gym location, or should the system be prepared for multiple branches?
8. Should there be a platform owner/master admin above the gym admin?
9. How should customer IDs be generated?
10. Should customer IDs be numeric, QR-based, membership-card-based, or a combination?
11. Should check-in always be manual through reception?
12. Should QR code check-in be included later?
13. Should the system allow check-in when all packages are expired?
14. Should the system allow check-in when selected packages have zero remaining sessions?
15. Should admin override be allowed for expired packages, zero-session packages, or time-restricted packages?
16. Who is allowed to approve admin overrides?
17. Should override actions require a reason?
18. Should override actions create separate logs?
19. Should package freezing automatically extend the expiration date?
20. Who is allowed to freeze/reactivate packages?
21. Should reception staff be allowed to delete notes, or only create and edit notes?
22. Should note deletion be soft delete or permanent delete?
23. Should manual session corrections require a reason?
24. Should manual occupancy corrections require admin password or only receptionist permission?
25. Should manual occupancy corrections require a reason?
26. What happens if check-out would make occupancy negative?
27. What happens if a customer is still marked as In gym after closing time?
28. What exact rule defines “unusually long period” for customers still marked as In gym?
29. Should public occupancy update instantly, every few seconds, or only on page refresh?
30. Should occupancy update interval be configurable?
31. Should historical occupancy trends be stored as snapshots or calculated from check-in/check-out records?
32. What exact fields are required for customer profiles?
33. What exact package types exist at launch?
34. What exact package time restrictions must be supported?
35. Should package time restrictions support only “before a time” or full start/end time ranges?
36. Should a package be usable on specific days only?
37. What exact fields are required for coach profiles?
38. Should coach contact information be public or admin-only?
39. Are group training packages only package types, or is full group exercise registration required?
40. Should Gallery be part of MVP or later?
41. Should offers/announcements support images?
42. Should media be uploaded through the Admin Panel or inserted as external URLs?
43. What image sizes/formats should be supported?
44. Which export filters are required for Excel exports?
45. Should export history be stored?
46. Which analytics must be in the first client version?
47. What date filters are required for analytics?
48. Should analytics be exportable?
49. Are external notifications required in any form?
50. Which hosting/database/file-storage providers should be used?
51. Is a staging environment required before production?
52. What backup policy is expected for production data?

---

## 17. Do Not Build Yet

Do not technically plan or build the following until the client confirms them in later requirements:

- Customer login accounts.
- Customer self-service dashboard.
- Coach login/dashboard.
- Platform owner/master admin area.
- Multi-branch support.
- QR code check-in.
- Membership-card scanning.
- Online payments.
- Ecommerce checkout for buying packages.
- Loyalty or rewards system.
- Native iOS or Android app.
- External SMS notifications.
- External WhatsApp notifications.
- External email notifications.
- Push notifications.
- Full group exercise registration system.
- Class capacity management.
- Group class waiting lists.
- Advanced predictive analytics.
- Revenue analytics.
- Marketing campaign analytics.
- Real-time WebSocket infrastructure, unless live update behavior is confirmed.
- Detailed Prisma schema.
- Detailed API route list.
- Development phases.
- Codex prompts.
- Detailed folder structure.

---

## Final Technical Summary

Smartfit.am should be built as a practical, role-separated gym website and management system. The confirmed technical foundation is a public website, public no-login mobile occupancy page, private Registration Panel, and private Admin Panel. The most sensitive technical area is the check-in/check-out workflow because it affects customer status, package sessions, coach sessions, occupancy count, and logs at the same time.

The preferred stack is Next.js, TypeScript, PostgreSQL, Prisma, and Tailwind CSS, but this stack is a recommended technical direction rather than a confirmed client requirement. The next documentation file should define the high-level database schema in `docs/03-database-schema.md` without adding unconfirmed features.
