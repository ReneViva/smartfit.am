# Smartfit.am — Routes and API Plan

**Document path:** `docs/04-routes-and-api.md`  
**Project:** Smartfit.am  
**Document type:** Routes and API planning document  
**Purpose:** Define the confirmed page routes, private route areas, server actions, and minimal API endpoints for Smartfit.am before implementation. This file is intended for the ChatGPT Project knowledge base first and can later be saved inside the real project directory.

---

## 1. Source Documents Used

The following uploaded Smartfit.am project documents were used as the source of truth for this route and API plan:

1. **`smartfit_am_website_specification_polished.docx`**  
   Main source for confirmed application areas, public pages, Admin Panel, Registration Panel, User Panel / Mobile App Experience, check-in/check-out workflows, logs, exports, settings, and MVP scope.

2. **`docs/01-product-requirements.md` / `01-product-requirements.md`**  
   Structured product requirements document created from the uploaded Word specification.

3. **`docs/02-technical-blueprint.md` / `02-technical-blueprint.md`**  
   Technical blueprint that confirms the preferred technical direction and separates confirmed requirements from unclear technical decisions.

4. **`docs/03-database-schema.md` / `03-database-schema.md`**  
   Database planning document that defines confirmed data models and data areas used by the route/action plan.

5. **`smartfit_design_colors.xlsx`**  
   Available project file related to visual design colors. It does not define routes or API requirements, so it is not used for route/API decisions.

No separate finalized authentication specification, deployment specification, API specification, permission matrix, or client-approved route list was available.

---

## 2. Route Planning Principles

Smartfit.am should use a simple and practical route structure. The goal is to support the confirmed requirements without creating unnecessary route layers or unconfirmed modules.

- Public routes should only expose public-safe information.
- Public routes must never expose customer names, customer IDs, package histories, notes, logs, visit history, or private operational data.
- Private routes must require authentication.
- Admin routes should be separate from Registration / Reception routes because the uploaded documents confirm separate responsibilities.
- Admin users have full access to management features.
- Registration / Reception users have limited daily-operation access.
- Routes should be simple and easy to understand.
- Avoid unnecessary nesting.
- Avoid duplicate routes for the same task.
- Prefer one clear page per major confirmed workflow.
- Prefer form-based flows for admin and reception operations.
- Prefer server actions for internal form submissions where practical.
- Use API routes only where they are clearly useful, such as public occupancy fetching and Excel export downloads.
- Keep public pages simple, readable, and mobile-friendly.
- Keep the Registration Panel fast because it is used during live customer entry/exit.
- Keep business-critical updates server-side, especially check-in, check-out, session deduction, manual corrections, and occupancy changes.

**Preferred technical direction:** Next.js App Router, TypeScript, server actions for form-based internal operations, API routes where needed, PostgreSQL, and Prisma. This stack is preferred technical direction, not a client-confirmed requirement.

---

## 3. Confirmed Application Route Areas

| Area | Purpose | Public or Private | User Type | Confirmed / Unclear |
|---|---|---|---|---|
| Regular Public Website | Present the gym, offers, coaches, packages, gallery, location, contact information, and app/live occupancy feature | Public | Public visitors, gym customers/members | Confirmed |
| User Panel / Mobile App Experience | Show public live occupancy count, basic gym information, contact links, motivational text, and Add to Home Screen instructions | Public | Gym customers/members, public visitors | Confirmed |
| Admin Panel | Full management of website content, customers, packages, coaches, settings, logs, exports, and analytics | Private | Gym owner/admin | Confirmed |
| Registration Panel | Daily operational access for customer search, check-in, check-out, session corrections, notes, and occupancy correction | Private | Receptionist / registration staff | Confirmed |
| Authentication | Protect private Admin and Registration routes | Private/public entry point | Admin, registration staff | Partially confirmed; login is confirmed, exact method unclear |

---

## 4. Public Routes

## Route: `/`

### Purpose

Public homepage for Smartfit.am. It should summarize the gym, show current offers/news/discounts/announcements in the hero area, and guide visitors toward packages, coaches, contact information, and the mobile app/live occupancy feature.

### Main Users

Public visitors and gym customers/members.

### Displayed Data

- Gym name and logo.
- Homepage hero content.
- Current offers, promotions, discounts, news, and announcements.
- Summary of gym information.
- Package preview or link to packages.
- Coach preview or link to coaches.
- Gallery preview if Gallery is included.
- Contact/location summary.
- Link or section for the Our App / Add Our App live occupancy feature.

### Main Actions

- View gym summary.
- View current offers and announcements.
- Navigate to About, Coaches, Packages, Contact, Gallery, and Our App pages.
- Access the public mobile app/live occupancy page.

### Data Source

- `GymSettings`.
- `PublicContent`.
- `Package` for public package display.
- `Coach` for active public coach preview.
- `GalleryImage` if Gallery/preview is included.

### Privacy Notes

The homepage must not expose private customer data, package ownership data, internal notes, logs, check-in records, or admin/reception functions.

### Confirmed / Unclear

Confirmed. Exact homepage layout and exact content fields are unclear.

---

## Route: `/about`

### Purpose

Public About page explaining the gym, atmosphere, values, and services.

### Main Users

Public visitors and gym customers/members.

### Displayed Data

- About text.
- Gym description.
- Gym values/atmosphere/services if provided by the client.
- Optional images if included in public content.

### Main Actions

- Read about Smartfit.am.
- Navigate to packages, coaches, contact, or Our App page.

### Data Source

- `GymSettings`.
- `PublicContent` or another simple public content source.

### Privacy Notes

Only public gym information should appear here.

### Confirmed / Unclear

Confirmed as a public website page. Exact content fields are unclear.

---

## Route: `/coaches`

### Purpose

Public page showing active coaches/trainers.

### Main Users

Public visitors and gym customers/members.

### Displayed Data

- Coach name.
- Coach surname.
- Coach photo.
- Coach specialty.
- Short description if provided.
- Contact information only if the client confirms it should be public.

### Main Actions

- View available coaches.
- Learn coach specialties.
- Navigate to packages or contact page.

### Data Source

- `Coach` records marked active.

### Privacy Notes

Do not expose internal coach assignments, private customer relationships, package usage, or coach analytics.

### Confirmed / Unclear

Confirmed. Whether coach contact information is public or admin-only is unclear.

---

## Route: `/packages`

### Purpose

Public page showing available gym packages.

### Main Users

Public visitors and gym customers/members.

### Displayed Data

- Package name.
- Price.
- Session count.
- Package type.
- Expiration rules.
- Included services.
- Time restriction text if relevant and intended for public display.
- Assigned coach if the package requires a coach and this is public-safe.

### Main Actions

- View available packages.
- Understand price, sessions, and included services.
- Navigate to contact or Our App page.

### Data Source

- `Package` records marked active.
- `Coach` only if a package is coach-specific and public display is appropriate.

### Privacy Notes

Do not expose customer package ownership, customer remaining sessions, customer expiration dates, or customer package history.

### Confirmed / Unclear

Confirmed. Exact package types and exact public display fields are unclear.

---

## Route: `/gallery`

### Purpose

Public page showing photos of the gym, equipment, training areas, and atmosphere.

### Main Users

Public visitors and gym customers/members.

### Displayed Data

- Gallery images.
- Optional image titles or descriptions if provided.

### Main Actions

- View gym photos.
- Navigate to contact, packages, or Our App page.

### Data Source

- `GalleryImage` if Gallery is included.

### Privacy Notes

Images should not expose private customer information unless the client has permission to use those images.

### Confirmed / Unclear

Confirmed for MVP. Gallery must be a separate public route on the regular website.

---

## Route: `/contact`

### Purpose

Public Contact page showing how visitors can reach and find Smartfit.am.

### Main Users

Public visitors and gym customers/members.

### Displayed Data

- Contact number.
- WhatsApp link.
- Instagram link.
- Address.
- Working days.
- Working hours.
- Google Maps or Yandex Maps location link.

### Main Actions

- Call the gym.
- Open WhatsApp if enabled.
- Open Instagram if enabled.
- Open map/location link.
- Check working hours.

### Data Source

- `GymSettings`.

### Privacy Notes

Only public contact and location information should be shown.

### Confirmed / Unclear

Confirmed.

---

## Route: `/our-app`

### Purpose

Public mobile-first User Panel / Mobile App Experience. This page should show the live gym occupancy count and explain how users can add Smartfit.am to their phone home screen.

### Main Users

Gym customers/members and public visitors.

### Displayed Data

- Smartfit.am logo.
- Current number of people inside the gym.
- Crowd color/status based on green/yellow/red thresholds.
- Motivational message if enabled by admin settings.
- Phone link if enabled.
- WhatsApp link if enabled.
- Instagram link if enabled.
- Location/map link if enabled.
- Add to Home Screen instructions.

### Main Actions

- View current live occupancy count.
- Understand crowd level using color indicator.
- Use public contact/location links if enabled.
- Follow Add to Home Screen instructions.

### Data Source

- `OccupancyState`.
- `GymSettings`.
- Possibly a public-safe occupancy API route if live/polling updates are needed.

### Privacy Notes

This route must never expose customer names, customer IDs, customer package information, customer notes, visit records, logs, or admin/reception data.

### Confirmed / Unclear

Confirmed. The update behavior of the occupancy number is unclear: instant, every few seconds, every minute, or page refresh only.

---

## 5. Private Admin Routes

## Route: `/admin`

### Purpose

Admin landing page / basic dashboard for the gym owner or administrator. It should provide quick access to the main admin areas and show basic confirmed metrics where available.

### Main Users

Gym owner/admin.

### Displayed Data

- Current occupancy.
- Basic analytics if available, such as daily check-ins and peak hours.
- Customer/package attention summary if included in MVP.
- Links to content, customers, packages, coaches, logs, data exports, settings, and analytics.

### Main Actions

- Navigate to admin management sections.
- Review basic operational status.

### Permission Requirement

Admin only.

### Related Data Models

- `OccupancyState`.
- `GymVisit`.
- `Customer`.
- `CustomerPackage`.
- `AuditLog`.

### Confirmed / Unclear

Confirmed as Admin Panel basics. Exact dashboard content is partially unclear.

---

## Route: `/admin/content`

### Purpose

Admin page for managing homepage offers, promotions, discounts, news, announcements, and public content where appropriate.

### Main Users

Gym owner/admin.

### Displayed Data

- Public content list.
- Offer/promotion/news/announcement title.
- Description/body.
- Active/inactive state.
- Start/end dates if used.
- Image/banner if used.
- Content history or enough data for export/history review.

### Main Actions

- Create public content.
- Update public content.
- Renew/reactivate public content.
- Delete/archive public content where appropriate.
- Review offer/promotion history.

### Permission Requirement

Admin only.

### Related Data Models

- `PublicContent`.
- `AuditLog`.
- `StaffUser`.

### Confirmed / Unclear

Confirmed. Exact content lifecycle, image usage, and draft/published states are unclear.

---

## Route: `/admin/customers`

### Purpose

Admin page for customer/member management and customer package overview. To keep the project simple, this route can handle list, search, filters, create/edit forms, and package overview instead of creating many nested customer routes at the planning stage.

### Main Users

Gym owner/admin.

### Displayed Data

- Customer name.
- Customer ID.
- Personal information fields confirmed by client.
- Active/inactive customer status.
- Current gym status: In gym or Not in gym.
- Assigned coach if applicable.
- Active package(s).
- Package activation date.
- Package expiration date.
- Remaining sessions.
- Package status: active, inactive, expired, or frozen.
- Package history summary if available.

### Main Actions

- Create customer profile.
- View customer profile.
- Update customer profile.
- Renew/reactivate customer if applicable.
- Delete/archive customer where appropriate.
- Search by name or customer ID.
- Filter by status, package, coach, expiration date, and remaining sessions.
- View customer package overview.
- Identify expired, zero-session, soon-expiring, or incomplete customer/package records.
- Freeze customer packages.
- Reactivate customer packages.

### Permission Requirement

Admin only.

### Related Data Models

- `Customer`.
- `CustomerPackage`.
- `Package`.
- `Coach`.
- `GymVisit`.
- `PackageSessionChange`.
- `Note`.
- `AuditLog`.

### Confirmed / Unclear

Confirmed. Exact personal information fields, delete behavior, and customer ID format are unclear.

---

## Route: `/admin/packages`

### Purpose

Admin page for managing gym package definitions and package rules.

### Main Users

Gym owner/admin.

### Displayed Data

- Package name.
- Price.
- Number of sessions.
- Package type.
- Assigned coach if required.
- Active/inactive status.
- Time restriction rule if configured.
- Public/internal description if used.

### Main Actions

- Create package.
- View package.
- Update package.
- Renew/reactivate package where appropriate.
- Delete/archive package where appropriate.
- Define whether package is available all day or only during a specific time range.
- Assign coach if package requires coach sessions.

### Permission Requirement

Admin only.

### Related Data Models

- `Package`.
- `Coach`.
- `CustomerPackage`.
- `AuditLog`.

### Confirmed / Unclear

Confirmed. Exact package types, time restriction structure, and delete/archive behavior are unclear.

---

## Route: `/admin/coaches`

### Purpose

Admin page for managing coach/trainer profiles.

### Main Users

Gym owner/admin.

### Displayed Data

- Coach name.
- Coach surname.
- Photo.
- Specialty.
- Contact information if needed.
- Public description if used.
- Active/inactive status.

### Main Actions

- Create coach profile.
- View coach profile.
- Update coach profile.
- Renew/reactivate coach profile where appropriate.
- Delete/archive coach profile where appropriate.
- Connect coaches to packages/customers when applicable.

### Permission Requirement

Admin only.

### Related Data Models

- `Coach`.
- `Package`.
- `Customer`.
- `CustomerPackage`.
- `AuditLog`.

### Confirmed / Unclear

Confirmed. Whether coach contact information is public or private is unclear.

---

## Route: `/admin/logs`

### Purpose

Admin-only page for viewing protected gym logs / audit trail.

### Main Users

Gym owner/admin.

### Displayed Data

- Check-in logs.
- Session deduction logs.
- Check-out logs.
- Manual session correction logs.
- Manual occupancy correction logs.
- Package freeze/reactivation/renewal logs.
- Important admin edit logs.
- Actor/staff user.
- Date/time.
- Old/new values if relevant.

### Main Actions

- View logs.
- Filter or search logs if included.
- Use logs for operational review.

### Permission Requirement

Admin only. Reception staff must not edit logs.

### Related Data Models

- `AuditLog`.
- `StaffUser`.
- `Customer`.
- `CustomerPackage`.
- `GymVisit`.
- `PackageSessionChange`.
- `OccupancyEvent`.

### Confirmed / Unclear

Confirmed. Exact filters, retention period, and whether logs can be exported by date range are unclear.

---

## Route: `/admin/data`

### Purpose

Admin Data section for Excel exports.

### Main Users

Gym owner/admin.

### Displayed Data

- Export category options.
- Possible export categories: customers, packages, coaches, customer package history, check-in/check-out logs, promotion/offer history, and notes if needed.
- Export status or download link after generation.

### Main Actions

- Select export type.
- Generate Excel export.
- Download export file.

### Permission Requirement

Admin only.

### Related Data Models

- `Customer`.
- `Package`.
- `Coach`.
- `CustomerPackage`.
- `GymVisit`.
- `PackageSessionChange`.
- `PublicContent`.
- `Note`.
- `AuditLog`.

### Confirmed / Unclear

Confirmed. Exact export filters, file naming rules, and whether export history is stored are unclear.

---

## Route: `/admin/settings`

### Purpose

Admin settings page for general gym information, public app display settings, occupancy thresholds, working hours, and registration-panel visibility settings.

### Main Users

Gym owner/admin.

### Displayed Data

- Gym name.
- Logo.
- Contact number.
- WhatsApp link.
- Instagram link.
- Address.
- Google Maps or Yandex Maps link.
- Working days.
- Working hours.
- Occupancy green/yellow/red thresholds.
- Public app display toggles.
- Motivational text.
- Option for registration staff to hide inactive customers from daily view.

### Main Actions

- Update gym identity settings.
- Update public contact/location settings.
- Update working days/hours.
- Update occupancy thresholds.
- Update public app display toggles.
- Update motivational text.
- Update registration inactive-customer visibility setting.

### Permission Requirement

Admin only.

### Related Data Models

- `GymSettings`.
- `AuditLog`.

### Confirmed / Unclear

Confirmed. Exact structure for working days/hours and public app installation instructions is unclear.

---

## Route: `/admin/analytics`

### Purpose

Admin analytics page for usage and activity insight.

### Main Users

Gym owner/admin.

### Displayed Data

- Current occupancy.
- Daily check-ins.
- Weekly check-ins if included.
- Monthly check-ins if included.
- Peak gym hours.
- Average time customers spend in the gym if included.
- Most active customers if included.
- Most used package types if included.
- Coach-related session usage if included.
- Historical occupancy trends if included.

### Main Actions

- View basic analytics.
- Review gym activity patterns.
- Use analytics for operational decisions.

### Permission Requirement

Admin only.

### Related Data Models

- `GymVisit`.
- `Customer`.
- `CustomerPackage`.
- `Package`.
- `PackageSessionChange`.
- `OccupancyState`.
- `OccupancyEvent`.
- `Coach`.

### Confirmed / Unclear

Confirmed as an admin requirement. MVP includes daily check-ins, current occupancy, and peak hours. Exact formulas, filters, chart types, and advanced analytics are unclear.

---

## 6. Private Registration / Reception Routes

## Route: `/registration`

### Purpose

Main Registration Panel for reception staff. This route should support fast daily operations: customer search, customer card viewing, check-in, check-out, selected package usage, manual session corrections, notes, and manual occupancy correction.

### Main Users

Receptionist / registration staff.

### Displayed Data

- Customer search input.
- Search results by name or customer ID.
- Selected customer card.
- Customer name.
- Customer ID.
- Current gym status badge: In gym or Not in gym.
- Active packages.
- Inactive packages depending on selected filter/settings.
- Remaining sessions for each package.
- Expiry date for each package.
- Package status: active, inactive, expired, or frozen.
- Package time rule.
- Notes section.
- Current occupancy count.
- Manual occupancy correction control.

### Main Actions

- Search customers by name or customer ID.
- Select a customer.
- View customer card.
- Select package or packages used during check-in.
- Check customer in.
- Check customer out.
- Manually increase/decrease package sessions with plus/minus controls.
- Save manual session corrections.
- Create/read/update/delete notes if permission allows.
- Freeze/reactivate customer package.
- Manually increase/decrease current occupancy count if correction is needed.
- Save manual occupancy correction.

### Permission Requirement

Registration / Reception staff. Admin may also access if the client wants admin to perform reception operations, but this is not explicitly defined.

### Related Data Models

- `Customer`.
- `CustomerPackage`.
- `Package`.
- `Coach`.
- `GymVisit`.
- `VisitPackageUsage`.
- `PackageSessionChange`.
- `Note`.
- `OccupancyState`.
- `OccupancyEvent`.
- `AuditLog`.
- `GymSettings`.

### Confirmed / Unclear

Confirmed for the MVP. In Phases 37-39, advanced freeze rules apply and Registration freeze access is controlled by an admin setting that defaults to disabled.

---

## 7. Authentication Routes

## Route: `/login`

### Purpose

Login page for internal users who need access to private Admin Panel or Registration Panel.

### Main Users

Gym owner/admin and receptionist / registration staff.

### Main Actions

- Enter login credentials.
- Submit login form.
- Redirect admin users to `/admin`.
- Redirect registration users to `/registration`.
- Show invalid login or inactive account message when needed.

### Permission Notes

- Public visitors and gym customers do not need login for the public website or User Panel / Mobile App Experience.
- Customer signup/login is not confirmed.
- Coach login is not confirmed.
- The exact authentication method is unclear.

### Confirmed / Unclear

Partially confirmed. Admin login is included in MVP, and Registration Panel is private by responsibility. Exact login method, account fields, and whether admin/reception use separate login pages are unclear.

---

## Route: `/logout`

### Purpose

Simple internal logout route or action for staff/admin users.

### Main Users

Gym owner/admin and receptionist / registration staff.

### Main Actions

- End authenticated session.
- Redirect to `/login` or public homepage.

### Permission Notes

Only meaningful for authenticated internal users.

### Confirmed / Unclear

Recommended technical route/action. Logout is not explicitly described in the uploaded documents, but it is necessary if private login exists.

---

## 8. Route Map Summary

```txt
/
  Public homepage with current offers/news/announcements, gym summary, and link to Our App / live occupancy

/about
  Public About page

/coaches
  Public Coaches page

/packages
  Public Packages page

/gallery
  Public Gallery page with gym photos, equipment, training areas, and atmosphere

/contact
  Public Contact page

/our-app
  Public no-login mobile app-like page with live occupancy count and Add to Home Screen instructions

/login
  Internal staff/admin login [UNCLEAR: exact authentication method]

/logout
  Internal logout route/action [Recommended because private login exists]

/admin
  Admin landing page / basic dashboard

/admin/content
  Admin public content management: offers, promotions, discounts, news, announcements

/admin/customers
  Admin customer management and customer package overview

/admin/packages
  Admin package management and package time rules

/admin/coaches
  Admin coach management

/admin/logs
  Admin-only logs / audit trail

/admin/data
  Admin Excel export section

/admin/settings
  Admin gym settings, occupancy thresholds, and public app display settings

/admin/analytics
  Admin analytics: daily check-ins, current occupancy, peak hours, and later analytics if confirmed

/registration
  Reception daily operations: customer search, customer card, check-in, check-out, session corrections, notes, occupancy correction
```

Routes intentionally not included: customer dashboard, coach dashboard, platform owner area, payments, QR check-in, group class registration, notifications, and multi-branch routes.

---

## 9. Server Actions Plan

Server actions are preferred for internal form-based operations where practical. Names below are planning names only, not implementation code.

## Action: `loginStaffUser`

### Purpose

Authenticate an internal admin or registration staff user.

### Used By

`/login`

### Input Data

- Login identifier, such as username or email.
- Password or other credential depending on chosen authentication method.

### Output / Result

- Successful session creation.
- Redirect to `/admin` for admin users.
- Redirect to `/registration` for registration users.
- Error message for invalid login.

### Permission Requirement

Public access to submit login, but only valid internal users can enter private routes.

### Validation Rules

- Required credential fields.
- User must exist.
- User must be active.
- Role must be allowed.

### Log Requirement

Unclear. The requirements confirm logs for important gym actions, but do not explicitly mention login logs.

### Confirmed / Unclear

Partially confirmed. Login is needed; exact authentication method is unclear.

---

## Action: `savePublicContent`

### Purpose

Create or update public homepage content, offers, promotions, discounts, news, and announcements.

### Used By

`/admin/content`

### Input Data

- Content ID if editing.
- Content type.
- Title.
- Body/description.
- Active/inactive status.
- Start/end dates if used.
- Image/banner reference if used.

### Output / Result

- Public content is saved.
- Public website displays updated active content.
- Offer/promotion history remains available for review/export.

### Permission Requirement

Admin only.

### Validation Rules

- Required title/type.
- Valid content type.
- Valid active/inactive state.
- Valid dates if dates are used.

### Log Requirement

Yes. Important admin content edits should create logs.

### Confirmed / Unclear

Confirmed. Exact content fields and lifecycle are unclear.

---

## Action: `deleteOrArchivePublicContent`

### Purpose

Delete or archive public content where appropriate.

### Used By

`/admin/content`

### Input Data

- Content ID.
- Delete/archive intent.

### Output / Result

- Content no longer appears publicly if removed/deactivated.
- History should remain reviewable/exportable where required.

### Permission Requirement

Admin only.

### Validation Rules

- Content record must exist.
- User must be admin.

### Log Requirement

Yes.

### Confirmed / Unclear

Confirmed concept. Whether deletion is permanent or archive/soft delete is unclear.

---

## Action: `saveCustomer`

### Purpose

Create or update a customer/member profile.

### Used By

`/admin/customers`

### Input Data

- Customer ID/code.
- Customer name.
- Personal information fields confirmed by client.
- Active/inactive status.
- Assigned coach if applicable.

### Output / Result

- Customer record is created or updated.
- Admin customer list and registration search reflect changes.

### Permission Requirement

Admin only.

### Validation Rules

- Required customer name.
- Required customer ID/code.
- Unique customer ID/code.
- Valid active/inactive status.
- Assigned coach must exist if selected.

### Log Requirement

Yes for important customer edits.

### Confirmed / Unclear

Confirmed. Exact customer personal fields and customer ID format are unclear.

---

## Action: `deleteOrArchiveCustomer`

### Purpose

Delete or archive a customer profile where appropriate.

### Used By

`/admin/customers`

### Input Data

- Customer ID.
- Delete/archive intent.

### Output / Result

- Customer is removed from active management views or marked deleted/archived depending on final rule.

### Permission Requirement

Admin only.

### Validation Rules

- Customer must exist.
- User must be admin.
- Deletion behavior must not break logs, visits, or package history.

### Log Requirement

Yes.

### Confirmed / Unclear

Confirmed concept. Permanent delete vs archive/soft delete is unclear.

---

## Action: `savePackage`

### Purpose

Create or update a gym package definition.

### Used By

`/admin/packages`

### Input Data

- Package ID if editing.
- Package name.
- Price.
- Number of sessions.
- Package type.
- Assigned coach if required.
- Active/inactive status.
- Time restriction configuration if used.

### Output / Result

- Package definition is saved.
- Public Packages page and registration/admin package data can reflect the change.

### Permission Requirement

Admin only.

### Validation Rules

- Required package name.
- Valid price.
- Valid session count.
- Valid package type.
- Valid assigned coach if selected.
- Valid time restriction fields if enabled.

### Log Requirement

Yes. Package edits are explicitly included in example logs.

### Confirmed / Unclear

Confirmed. Exact package types and time restriction structure are unclear.

---

## Action: `deleteOrArchivePackage`

### Purpose

Delete or archive a package where appropriate.

### Used By

`/admin/packages`

### Input Data

- Package ID.
- Delete/archive intent.

### Output / Result

- Package is removed from active package lists or archived according to final rule.

### Permission Requirement

Admin only.

### Validation Rules

- Package must exist.
- Existing customer package history should not be broken.

### Log Requirement

Yes.

### Confirmed / Unclear

Confirmed concept. Delete/archive behavior is unclear.

---

## Action: `assignPackageToCustomer`

### Purpose

Assign a package to a customer, creating a customer-owned package with activation date, expiration date, remaining sessions, and status.

### Used By

`/admin/customers` or `/admin/packages`

### Input Data

- Customer ID.
- Package ID.
- Activation date.
- Expiration date.
- Initial/remaining sessions.
- Assigned coach if applicable.
- Status.

### Output / Result

- Customer receives a package assignment.
- Customer card and admin overview show the package.

### Permission Requirement

Admin only unless the client confirms reception can assign/renew packages.

### Validation Rules

- Customer must exist.
- Package must exist.
- Dates must be valid.
- Sessions must be non-negative.
- Coach must exist if selected.

### Log Requirement

Yes. Package assignment/renewal is an important operational change.

### Confirmed / Unclear

Confirmed as a needed capability for package management and customer package history. Exact renewal behavior is unclear.

---

## Action: `saveCoach`

### Purpose

Create or update coach/trainer profiles.

### Used By

`/admin/coaches`

### Input Data

- Coach ID if editing.
- Name.
- Surname.
- Photo reference.
- Specialty.
- Description if used.
- Contact information if needed.
- Active/inactive status.

### Output / Result

- Coach profile is saved.
- Public Coaches page can show active coaches.
- Packages/customers can connect to the coach where applicable.

### Permission Requirement

Admin only.

### Validation Rules

- Required name.
- Required surname.
- Required specialty.
- Valid active/inactive status.

### Log Requirement

Yes for important coach edits.

### Confirmed / Unclear

Confirmed. Public/private handling of coach contact information is unclear.

---

## Action: `deleteOrArchiveCoach`

### Purpose

Delete or archive a coach profile where appropriate.

### Used By

`/admin/coaches`

### Input Data

- Coach ID.
- Delete/archive intent.

### Output / Result

- Coach is removed from active public/internal lists or archived according to final rule.

### Permission Requirement

Admin only.

### Validation Rules

- Coach must exist.
- Existing package/customer relationships should not be broken.

### Log Requirement

Yes.

### Confirmed / Unclear

Confirmed concept. Delete/archive behavior is unclear.

---

## Action: `saveGymSettings`

### Purpose

Save general gym settings, contact information, occupancy thresholds, working hours, and public app display settings.

### Used By

`/admin/settings`

### Input Data

- Gym name.
- Logo reference.
- Contact number.
- WhatsApp link.
- Instagram link.
- Address.
- Map link.
- Working days.
- Working hours.
- Occupancy threshold values.
- Public app display toggles.
- Motivational text.
- Hide inactive customers setting.

### Output / Result

- Settings are saved.
- Public website and public app page reflect updated settings.
- Registration Panel respects inactive-customer visibility setting.

### Permission Requirement

Admin only.

### Validation Rules

- Valid threshold numbers.
- Logical threshold order.
- Valid URLs/links if provided.
- Required gym name if client requires it.

### Log Requirement

Yes. Settings edits are important admin changes.

### Confirmed / Unclear

Confirmed. Exact working days/hours structure is unclear.

---

## Action: `searchCustomers`

### Purpose

Search customers by name or customer ID for reception and admin workflows.

### Used By

`/registration`, `/admin/customers`

### Input Data

- Search query.
- Optional filters for admin search.
- Optional setting/filter for inactive customers.

### Output / Result

- Matching customer list.
- Basic customer identifiers needed to choose the correct customer.

### Permission Requirement

Admin or Registration / Reception staff.

### Validation Rules

- Search query should be handled safely.
- Reception results should respect the inactive-customer visibility setting if enabled.

### Log Requirement

No. Searching does not need logs based on current requirements.

### Confirmed / Unclear

Confirmed. Whether search should be a server action, server-rendered search route, or client/API request is an implementation detail.

---

## Action: `checkInCustomer`

### Purpose

Process customer check-in, selected package usage, session deduction, occupancy increase, and log creation.

### Used By

`/registration`

### Input Data

- Customer ID.
- Selected customer package IDs.
- Current date/time from server.
- Acting staff user.
- Override data only if overrides are later confirmed.

### Output / Result

- Customer status changes from Not in gym to In gym.
- Selected package sessions decrease by 1 where applicable.
- Other packages do not change.
- Current occupancy increases by 1.
- Visit record is created.
- Session usage/change records are created.
- Logs are created.
- Updated customer card is shown.

### Permission Requirement

Registration / Reception staff. Admin access to this action is unclear.

### Validation Rules

- Customer must exist.
- Customer should not already be In gym unless override is confirmed.
- At least one package should be selected when a package is required for entry; exact no-package behavior is unclear.
- Selected package must belong to the customer.
- Selected package must not be frozen.
- Selected package should have remaining sessions above zero unless override is confirmed.
- Selected package should not be expired unless override is confirmed.
- Selected package must pass time restriction validation.
- Session count must not go below zero unless admin override is confirmed.

### Log Requirement

Yes. Check-in and all session deductions must create log entries.

### Confirmed / Unclear

Confirmed. Expired/zero-session handling, admin override, and no-active-package behavior are unclear.

---

## Action: `checkOutCustomer`

### Purpose

Process customer check-out, occupancy decrease, exit time recording, and log creation.

### Used By

`/registration`

### Input Data

- Customer ID.
- Acting staff user.
- Current date/time from server.

### Output / Result

- Customer status changes from In gym to Not in gym.
- Open visit is closed with check-out time.
- Current occupancy decreases by 1.
- Check-out log is created.
- No sessions are deducted.

### Permission Requirement

Registration / Reception staff. Admin access to this action is unclear.

### Validation Rules

- Customer must exist.
- Customer should currently be In gym.
- There should be an open visit.
- Occupancy should not go below zero.

### Log Requirement

Yes. Check-out must create a log entry.

### Confirmed / Unclear

Confirmed. Behavior when customer is already Not in gym or occupancy is already zero is unclear.

---

## Action: `saveManualSessionCorrection`

### Purpose

Save manual plus/minus corrections to remaining sessions for a customer package.

### Used By

`/registration`

### Input Data

- Customer package ID.
- New remaining session count or delta.
- Acting staff user.
- Correction reason if required.

### Output / Result

- Remaining sessions are updated.
- Session change record is created.
- Admin-visible log is created.
- Updated package card is shown.

### Permission Requirement

Registration / Reception staff. Admin access is likely useful but not explicitly stated.

### Validation Rules

- Customer package must exist.
- New remaining session count must not go below zero.
- Save must be explicit before storing.
- No admin approval is required.
- No correction reason is required in the MVP.

### Log Requirement

Yes. Every saved manual correction must create an admin-visible log.

### Confirmed / Unclear

Confirmed for MVP. Manual session corrections do not require approval or reason but must be saved explicitly and logged.

---

## Action: `freezeCustomerPackage`

### Purpose

Freeze a customer package so it is not treated as active for session usage.

### Used By

`/registration` and/or `/admin/customers`

### Input Data

- Customer package ID.
- Acting staff/admin user.
- Freeze reason if required.

### Output / Result

- Package status becomes frozen.
- Package cannot be used for session deduction.
- Log is created.

### Permission Requirement

Admin users always. Registration / Reception staff only when `allowRegistrationPackageFreeze` is enabled.

### Validation Rules

- Customer package must exist.
- Package must be eligible under the advanced freeze rules.
- Remaining freeze chances must be greater than zero.
- Registration requests must be rejected when the permission setting is disabled.
- Frozen packages should not be treated as active.
- Normal or retroactive effective dates must be validated.
- Freeze record creation, chance decrement, status change, expiration context, and audit logging must be transactional.

### Log Requirement

Yes. Freeze actions must be logged.

### Confirmed / Unclear

Confirmed for MVP and expanded for Phases 37-39. Advanced freezing uses explicit freeze history, remaining chances, normal or retroactive dates, transactional updates, and setting-controlled Registration access.

---

## Action: `reactivateCustomerPackage`

### Purpose

Reactivate or renew a frozen/inactive/expired customer package where allowed.

### Used By

`/registration` and/or `/admin/customers`

### Input Data

- Customer package ID.
- Acting staff/admin user.
- New expiration date if renewal changes it.
- New sessions if renewal changes them.

### Output / Result

- Package status changes according to final rule.
- Reactivation/renewal is logged.
- Customer package card updates.

### Permission Requirement

Admin users always. Registration / Reception staff only when `allowRegistrationPackageFreeze` is enabled.

### Validation Rules

- Customer package must exist.
- An active freeze record must exist for advanced reactivation.
- Registration requests must be rejected when the permission setting is disabled.
- Early reactivation must calculate actual frozen days and resulting expiration deterministically.
- Freeze, customer-package, and audit updates must be transactional.

### Log Requirement

Yes. Reactivation or renewal behavior should be clearly logged.

### Confirmed / Unclear

Confirmed for MVP and expanded for Phases 37-39. Advanced reactivation records actual end date, recalculates expiration from actual frozen days, and requires setting-controlled Registration access.

---

## Action: `saveNote`

### Purpose

Create or update an operational note.

### Used By

`/registration` and possibly `/admin/customers`

### Input Data

- Note ID if editing.
- Customer ID if customer-specific.
- Note content.
- Acting staff/admin user.

### Output / Result

- Note is saved.
- Notes are sorted by newest date in the UI.

### Permission Requirement

Registration / Reception staff if permitted; admin should be able to view notes. Exact permissions unclear.

### Validation Rules

- Note content is required.
- Customer must exist if note is customer-specific.

### Log Requirement

Unclear. The documents require logs for important actions, but do not explicitly state whether note create/edit/delete must be logged.

### Confirmed / Unclear

Confirmed notes section. Exact note permissions and logging are unclear.

---

## Action: `deleteNote`

### Purpose

Delete a note if permission allows.

### Used By

`/registration` and possibly `/admin/customers`

### Input Data

- Note ID.
- Acting staff/admin user.

### Output / Result

- Note is deleted or hidden depending on final rule.

### Permission Requirement

Unclear. Client must confirm whether reception staff can delete notes or only create/edit them.

### Validation Rules

- Note must exist.
- User must have permission to delete.

### Log Requirement

Unclear.

### Confirmed / Unclear

Partially confirmed. Note deletion is explicitly listed as an open decision.

---

## Action: `saveManualOccupancyCorrection`

### Purpose

Manually correct the current occupancy count.

### Used By

`/registration`

### Input Data

- New occupancy count or delta.
- Acting staff user.
- Reason if required.

### Output / Result

- Current occupancy count is updated.
- Occupancy event is recorded if implemented.
- Public User Panel uses the corrected count.
- Admin-visible log is created.

### Permission Requirement

Registration / Reception staff, unless client requires admin password/approval.

### Validation Rules

- Occupancy count must not go below zero.
- Save must be explicit before storing.
- No admin approval or admin password is required in the MVP.
- No correction reason is required in the MVP.

### Log Requirement

Yes. Manual occupancy changes must create log entries visible to admin.

### Confirmed / Unclear

Confirmed for MVP. Manual occupancy correction does not require approval, admin password, or reason but must be saved explicitly and logged.

---

## 10. API Route Plan

API routes should be minimal. Most internal form operations can be handled as server actions. Use API routes where they are clearly useful for public data fetching, generated file downloads, or browser polling.

## API Route: `GET /api/public/occupancy`

### Purpose

Return only the public-safe current occupancy information for the `/our-app` page if live/polling updates are needed.

### Used By

`/our-app`

### Request Data

- No private request data.

### Response Data

- Current occupancy count.
- Crowd color/status derived from admin-configured thresholds.
- Optional public-safe timestamp of last update.

### Permission Requirement

Public.

### Validation Rules

- Return only public-safe data.
- Do not return customer names, IDs, package data, visit records, notes, logs, or staff data.

### Error Cases

- Occupancy settings missing.
- Occupancy state missing.
- Server unavailable.

### Confirmed / Unclear

Partially confirmed. Public occupancy is confirmed, but whether it needs an API route depends on the chosen update behavior.

---

## API Route: `GET /api/admin/export`

### Purpose

Generate and download Excel exports for admin-selected data categories.

### Used By

`/admin/data`

### Request Data

- Export type, such as customers, packages, coaches, customer package history, check-in/check-out logs, promotion/offer history, or notes if included.
- Optional filters/date ranges only if confirmed later.

### Response Data

- Excel file download.
- Safe error message if export cannot be generated.

### Permission Requirement

Admin only.

### Validation Rules

- User must be admin.
- Export type must be one of the confirmed export categories.
- Optional filters must be valid if added.

### Error Cases

- Permission denied.
- Invalid export type.
- No matching data.
- Export generation failure.

### Confirmed / Unclear

Confirmed that Excel export is required. Exact export filters, file names, and whether export history is stored are unclear.

---

## API Route: `POST /api/admin/media`

### Purpose

Upload or store references for media such as logos, coach photos, gallery images, or public content images.

### Used By

Potentially `/admin/settings`, `/admin/coaches`, `/admin/content`, `/admin` gallery management if included.

### Request Data

- Image file or external image URL.
- Media type/context.

### Response Data

- Stored media URL/reference.

### Permission Requirement

Admin only.

### Validation Rules

- User must be admin.
- File type/size rules must be defined before implementation.

### Error Cases

- Permission denied.
- Invalid file type.
- File too large.
- Storage unavailable.

### Confirmed / Unclear

Unclear. Images/logo/photos are confirmed data needs, but upload method is not confirmed. Do not build this endpoint until media handling is decided.

---

## 11. Public Data Exposure Rules

Public routes and public API routes may expose only general Smartfit.am information.

### Public Routes May Expose

- Gym name.
- Logo.
- Public homepage content.
- Public offers, promotions, discounts, news, and announcements.
- Active coach public profiles.
- Public package information.
- Gallery images if included.
- Contact number.
- WhatsApp link.
- Instagram link.
- Address.
- Map/location link.
- Working days and working hours.
- Public live occupancy count.
- Privacy-safe aggregate occupancy and attendance analytics when enabled by admin.
- Crowd color/status based on admin thresholds.
- Motivational text if enabled.
- Public app display links enabled by admin settings.
- Add to Home Screen instructions.

### Public Routes Must Never Expose

- Customer names.
- Customer IDs.
- Customer personal information.
- Customer package ownership.
- Remaining sessions for individual customers.
- Customer expiration dates.
- Customer package history.
- Customer current status as individual records.
- Check-in/check-out logs.
- Visit records.
- Analytics source rows or individual visit rows.
- Notes.
- Audit logs.
- Export files or export result data.
- Staff/admin account data.
- Internal database IDs for private records.
- Admin settings that are not meant for public display.
- Analytics that reveal private customer behavior.
- Customer document metadata, storage keys, URLs, or file contents.

### Confirmed / Unclear

Confirmed and expanded. Public routes may show only general gym information, live occupancy, and approved aggregate analytics. They must not expose private or customer-level data.

---

## 12. Permission Matrix

| Route / Action | Public | Admin | Registration / Reception | Notes |
|---|---:|---:|---:|---|
| `/` | Yes | Yes | Yes | Public homepage |
| `/about` | Yes | Yes | Yes | Public page |
| `/coaches` | Yes | Yes | Yes | Public page |
| `/packages` | Yes | Yes | Yes | Public page |
| `/gallery` | Yes | Yes | Yes | MVP timing unclear |
| `/contact` | Yes | Yes | Yes | Public page |
| `/our-app` | Yes | Yes | Yes | Public live occupancy/app page |
| `GET /api/public/occupancy` | Yes | Yes | Yes | Only public-safe occupancy data |
| `/login` | Yes | Yes | Yes | Used to access private areas |
| `/logout` | No | Yes | Yes | Recommended technical route/action |
| `/admin` | No | Yes | No | Admin private area |
| `/admin/content` | No | Yes | No | Admin content management |
| `/admin/customers` | No | Yes | No | Admin customer management |
| `/admin/customers/[customerId]` | No | Yes | No | Customer detail, documents, and recent visit history |
| `/admin/packages` | No | Yes | No | Admin package management |
| `/admin/categories` | No | Yes | No | Admin package-category management |
| `/admin/coaches` | No | Yes | No | Admin coach management |
| `/admin/logs` | No | Yes | No | Logs visible only to admin |
| `/admin/data` | No | Yes | No | Admin Excel exports |
| `/admin/settings` | No | Yes | No | Admin settings |
| `/admin/analytics` | No | Yes | No | Admin analytics |
| `/registration` | No | Unclear | Yes | Admin access to reception route is not explicitly confirmed |
| `savePublicContent` | No | Yes | No | Admin only |
| `saveCustomer` | No | Yes | No | Admin only |
| `savePackage` | No | Yes | No | Admin only |
| `assignPackageToCustomer` | No | Yes | Unclear | Reception renewal/assignment not confirmed |
| `saveCoach` | No | Yes | No | Admin only |
| `saveGymSettings` | No | Yes | No | Admin only |
| `checkInCustomer` | No | Unclear | Yes | Admin access unclear |
| `checkOutCustomer` | No | Unclear | Yes | Admin access unclear |
| `saveManualSessionCorrection` | No | Unclear | Yes | Admin access unclear |
| `saveManualOccupancyCorrection` | No | Unclear | Yes | Admin approval/password unclear |
| `saveNote` | No | Yes | Yes | Exact note permissions unclear |
| `deleteNote` | No | Yes | Unclear | Reception delete permission unclear |
| `freezeCustomerPackage` | No | Yes | Setting-controlled | Admin always; Registration only when enabled |
| `reactivateCustomerPackage` | No | Yes | Setting-controlled | Admin always; Registration only when enabled |
| Customer document actions | No | Yes | No | Admin-only private file operations |
| Category management actions | No | Yes | No | Admin-only create/edit/archive/reorder/visibility |
| `GET /api/admin/export` | No | Yes | No | Admin only |
| `POST /api/admin/media` | No | Yes | No | Upload method unconfirmed |

No other roles are confirmed for MVP. Coach login, customer login, and platform owner/master admin are not included.

---

## 13. Validation and Error Handling by Route/Action

### Public Routes

- Public pages should handle missing public content safely.
- Public pages should handle missing logo/contact links without exposing errors.
- `/our-app` should handle unavailable occupancy data with a safe public message.
- Public routes must never display internal server/database errors.
- Public routes must never expose private operational records.

### `/login` / Authentication

- Login identifier is required.
- Credential is required.
- Internal user must exist.
- Internal user must be active.
- User role must be allowed.
- Invalid login should show a safe error message.

### Admin Content Actions

- Content title/type should be validated.
- Active/inactive state should be valid.
- Dates should be valid if used.
- Only admin can create/update/delete/archive content.
- Public content changes should be logged.

### Admin Customer Actions

- Customer ID/code is required and should be unique.
- Customer name is required.
- Active/inactive status must be valid.
- Assigned coach must exist if selected.
- Exact personal required fields are unclear.
- Customer delete/archive should not damage logs, visits, or package history.

### Admin Package Actions

- Package name is required.
- Price must be valid.
- Session count must be valid and non-negative.
- Package type must be valid.
- Assigned coach must exist if selected.
- Time restriction data must be valid if enabled.
- Package edits should be logged.

### Admin Coach Actions

- Coach name is required.
- Coach surname is required.
- Coach specialty is required.
- Active/inactive status must be valid.
- Coach edits should be logged.

### Admin Settings Actions

- Occupancy thresholds must be valid numbers.
- Green/yellow/red threshold logic must be consistent.
- URLs/links should be valid where provided.
- Settings edits should be logged.

### Check-In Action

- Customer must exist.
- Customer should not already be In gym unless override is confirmed.
- Selected package(s) must belong to customer.
- Selected package(s) should be active and not frozen.
- Selected package(s) should not be expired unless override is confirmed.
- Selected package(s) should have remaining sessions unless override is confirmed.
- Package time restriction must be checked on the server.
- Session count should not go below zero unless override is confirmed.
- Occupancy should increase by 1 only after a valid check-in.
- Check-in and session deductions must be logged.

### Check-Out Action

- Customer must exist.
- Customer should currently be In gym.
- Open visit should exist.
- No sessions should be deducted.
- Occupancy should decrease by 1.
- Occupancy should not go below zero.
- Check-out must be logged.

### Manual Session Correction Action

- Customer package must exist.
- New remaining sessions must be valid.
- Remaining sessions should not go below zero unless override is confirmed.
- Save is required before storing.
- Reason is required only if confirmed.
- Correction must be logged.

### Manual Occupancy Correction Action

- New occupancy count must be valid.
- Occupancy count must not go below zero.
- Save is required before storing.
- Admin password/approval is required only if confirmed.
- Reason is required only if confirmed.
- Correction must be logged.

### Notes Actions

- Note content is required.
- Customer must exist if note is customer-specific.
- Create/read/update/delete permissions must be enforced.
- Delete behavior is unclear.
- Note logging is unclear.

### Export API

- User must be admin.
- Export type must be valid.
- Empty results should produce a safe message or empty export depending on final implementation choice.
- Export must not be available to public or reception users.

---

## 14. Logging Requirements by Action

| Action | Log Needed? | Why | Confirmed / Unclear |
|---|---|---|---|
| `loginStaffUser` | Unclear | Login logging is not mentioned in requirements | Unclear |
| `savePublicContent` | Yes | Admin content changes are important public website changes | Confirmed concept |
| `deleteOrArchivePublicContent` | Yes | Public content removal/reactivation should be traceable | Confirmed concept |
| `saveCustomer` | Yes | Important customer edits should be recorded | Confirmed concept |
| `deleteOrArchiveCustomer` | Yes | Customer removal/archive is important | Confirmed concept |
| `savePackage` | Yes | Example log includes admin updating monthly package price | Confirmed |
| `deleteOrArchivePackage` | Yes | Package removal/archive affects operations/history | Confirmed concept |
| `assignPackageToCustomer` | Yes | Package assignment/renewal affects customer package history | Confirmed concept |
| `saveCoach` | Yes | Coach edits are important admin changes | Confirmed concept |
| `deleteOrArchiveCoach` | Yes | Coach removal/archive affects public and package data | Confirmed concept |
| `saveGymSettings` | Yes | Settings control public app, occupancy thresholds, and gym info | Confirmed concept |
| `searchCustomers` | No | Search is not listed as an action requiring logs | Confirmed not required by current docs |
| `checkInCustomer` | Yes | Check-in must create log entry | Confirmed |
| `checkOutCustomer` | Yes | Check-out must create log entry | Confirmed |
| `saveManualSessionCorrection` | Yes | Every saved manual correction must create admin-visible log | Confirmed |
| `freezeCustomerPackage` | Yes | Freeze behavior should be clearly logged | Confirmed |
| `reactivateCustomerPackage` | Yes | Reactivation/renewal behavior should be clearly logged | Confirmed |
| `saveNote` | Unclear | Notes are confirmed, but note-change logging is not explicitly required | Unclear |
| `deleteNote` | Unclear | Note deletion permission and logging need confirmation | Unclear |
| `saveManualOccupancyCorrection` | Yes | Manual occupancy changes must create admin-visible logs | Confirmed |
| `GET /api/admin/export` | Unclear | Export is confirmed, but export event logging is not specified | Unclear |
| `POST /api/admin/media` | Unclear | Media upload method is not confirmed | Unclear |

---

## 15. Minimal Implementation Notes

- Keep route names readable and predictable.
- Keep public routes separate from private routes.
- Keep admin routes under `/admin`.
- Keep reception routes under `/registration`.
- Keep the Registration Panel mostly on one route unless the UI becomes too large.
- Do not create unnecessary nested routes for every form unless the workflow needs them.
- Keep server actions small and focused on one business operation.
- Do not create API endpoints for every internal action if a server action is simpler.
- Use API routes only for public occupancy fetching, Excel downloads, and media upload if confirmed.
- Keep public occupancy data separate from private customer/visit data.
- Keep check-in, check-out, session deduction, manual correction, and occupancy changes server-side.
- Use database transactions for operations that change multiple records at once.
- Use clear action names instead of clever abstractions.
- Do not create unused endpoints.
- Do not create future-feature routes until the client confirms those features.
- Keep error messages safe and understandable.
- Keep the project simple enough for the client and future developers to understand.

---

## 16. Route and API Questions / Unclear Points

1. Should Gallery be included in the first MVP route set or delayed?
2. Should the public live occupancy page be only `/our-app`, or should there also be a separate `/live` or `/occupancy` route?
3. Should `/our-app` use live polling, instant updates, or page-refresh-only data?
4. Should `GET /api/public/occupancy` be built immediately or only if live updates are required?
5. Should Admin Panel and Registration Panel share `/login`, or should they have separate login pages?
6. What exact authentication method should be used for internal users?
7. Should admin users be allowed to access `/registration` and perform reception operations?
8. Should registration staff have access to any admin pages, or only `/registration`?
9. Should customer create/edit forms be handled inside `/admin/customers`, or should customer detail routes be added later?
10. Should package create/edit forms be handled inside `/admin/packages`, or should package detail routes be added later?
11. Should coach create/edit forms be handled inside `/admin/coaches`, or should coach detail routes be added later?
12. Should customer notes be shown only inside `/registration`, or also inside `/admin/customers`?
13. Should reception staff be allowed to delete notes?
14. Should note edits/deletions create logs?
15. Should package freezing/reactivation be available from `/registration`, `/admin/customers`, or both?
16. Should package renewal be admin-only or also available to reception staff?
17. Should manual session corrections require a reason field?
18. Should manual occupancy corrections require a reason field?
19. Should manual occupancy corrections require an admin password or only receptionist permission?
20. Should check-in be blocked when the selected package is expired?
21. Should check-in be blocked when the selected package has zero remaining sessions?
22. Should check-in be blocked when the selected package is frozen?
23. Should check-in be blocked when the selected package is outside its allowed time restriction?
24. Should admin override be possible for blocked check-ins?
25. If admin override exists, should it be handled inside the same `checkInCustomer` action or a separate action?
26. Should blocked check-in attempts be logged?
27. What should happen if check-out is clicked for a customer already marked Not in gym?
28. What should happen if check-out would make occupancy negative?
29. Should public package time restrictions be shown on `/packages`, or only inside internal panels?
30. Should coach contact information be shown publicly on `/coaches`?
31. Should offer/promotion history have a separate admin route, or remain inside `/admin/content`?
32. Should customer status alerts have a separate route, or remain inside `/admin` or `/admin/customers`?
33. Should analytics exports be included in `/admin/data`, `/admin/analytics`, or not included yet?
34. Should logs support filters/search in MVP?
35. Should Excel exports support filters or date ranges in MVP?
36. Should export history be stored and displayed?
37. Should media upload be handled through `POST /api/admin/media`, external URLs, or manual developer-provided assets?
38. Should Gallery management have a route under `/admin/content`, or a separate `/admin/gallery` route if Gallery is confirmed?
39. Should working hours be edited in `/admin/settings` as simple text or structured day/time fields?
40. Should public app installation instructions have separate iPhone/Android sections?
41. Should `/admin/analytics` include only MVP analytics first, or all analytics listed in the specification?
42. Should current occupancy appear on `/admin`, `/registration`, `/our-app`, or all three?
43. Should inactive customers be hidden from `/registration` by default or only when admin enables the setting?
44. Should reception staff be able to manually change customer fields, or only operational fields?
45. Which exact data should be returned in registration search results?
46. Which exact data should be returned in admin customer filters?
47. Should API routes be used for internal searches, or should searches be handled through server-rendered pages/server actions?
48. Should logout be a route or only a server action/button?

---

## 16A. Approved Post-Phase 29 Route and Action Plan

This section documents manually approved route and action expansion for Phases 31-41. Names are planning names and should be aligned with existing code conventions during implementation.

### Public Route: `/our-app`

Planned additions:

- Keep the current occupancy experience.
- Add aggregate analytics below occupancy when `showPublicAnalyticsOnOurApp` is enabled.
- Show current occupancy, today's check-ins, hourly check-ins, weekly check-in trend, weekly peak hours, and reliable historical occupancy.
- Prefer responsive cards and simple bar charts.
- Return no customer identifiers, individual visits, package ownership, or customer-level analytics.
- Hide the entire analytics section when the setting is disabled.

Possible server boundary:

- Extend the existing public occupancy query when its contract remains simple, or add a narrowly scoped `GET /api/public/analytics`.
- Return only pre-aggregated, public-safe values.
- Do not reuse a private admin response object directly.

### Admin Route: `/admin/analytics`

Planned additions:

- Current occupancy.
- Today's check-ins.
- Hourly check-ins.
- Weekly check-in trend.
- Weekly peak hours.
- Historical occupancy only when a reliable source exists.

The route remains Admin-only. Existing analytics patterns should be reused before adding a chart dependency.

### Public Route: `/packages`

Planned additions:

- Show active packages that pass category visibility rules.
- Filter by one or more approved category selections according to the final UI.
- Filter by minimum and maximum price.
- Sort by price ascending, price descending, or name.
- Place controls above results on mobile and in a sidebar on desktop.
- Hide a package when any assigned category is hidden.
- Expose no customer-package or admin-only data.

Query parameters should be validated, normalized, and reflected in a shareable URL where practical.

### Admin Route: `/admin/categories`

Admin-only package-category management.

Displayed data:

- Category name and slug.
- Sort order.
- Public visibility.
- Archive status.
- Assigned package count.
- Hidden-package impact where useful.

Actions:

- `createPackageCategory`
- `updatePackageCategory`
- `deleteOrArchivePackageCategory`
- `reorderPackageCategories`
- `setPackageCategoryVisibility`
- `assignCategoriesToPackage`

Every action requires Admin authorization, validation, safe handling of existing package assignments, and an audit log. Archive is preferred over destructive deletion when assignments exist.

### Admin Route: `/admin/customers/[customerId]`

The customer detail may add two Admin-only sections.

Recent visits:

- Latest three visits.
- Check-in and check-out.
- Derived duration.
- Guest count if stored.
- Packages used if existing relations support it.
- Optional simple "View all" navigation.

Documents:

- List active and archived documents as approved.
- Upload PDF, JPG, JPEG, or PNG up to 10 MB.
- Open or download through an authorized private-file response.
- Archive/delete according to the confirmed retention strategy.
- Never expose document data to Registration.

Planned document actions:

- `uploadCustomerDocument`
- `archiveCustomerDocument`
- `deleteCustomerDocument` only if physical deletion is explicitly approved
- `restoreCustomerDocument` if archive recovery is supported
- Authorized download/open handler

The document upload route or action must not be implemented until a production-safe storage provider, private access method, and retention behavior are confirmed.

### Advanced Freeze Actions

`freezeCustomerPackage` planned input:

- Customer-package ID.
- Mode: normal or retroactive.
- Requested/planned freeze days.
- Planned end date when supplied.
- Optional note.
- Acting user.

Required behavior:

- Admin is always authorized.
- Registration is authorized only when `allowRegistrationPackageFreeze` is true.
- Resolve retroactive start from the latest valid checkout when available.
- Calculate retroactive days from that checkout through today.
- Reject zero remaining freeze chances.
- Create `PackageFreeze`, decrement the counter, update status, and log in one transaction.

`reactivateCustomerPackage` planned input:

- Customer-package ID or active freeze ID.
- Actual end date, normally current date/time.
- Optional note.
- Acting user.

Required behavior:

- Apply the same role and setting checks.
- Calculate actual frozen days.
- Persist actual days on the freeze record.
- Set resulting expiration to original expiration plus actual frozen days.
- Update freeze and assignment records and audit log in one transaction.

Planned Admin-only action:

- `setCustomerPackageFreezeChances`

This action must validate a non-negative integer, record before/after values, and never run automatically as part of renewal unless a later approved rule explicitly says so.

### Settings Actions

`saveGymSettings` may accept:

- `showPublicAnalyticsOnOurApp`
- `allowRegistrationPackageFreeze`

Both fields require Admin authorization, boolean validation, and audit logs. Defaults for existing and new settings rows are `false`.

### Homepage Route: `/`

Phase 40 changes presentation only:

- CSS-first 3D offer carousel with automatic and manual navigation.
- Replace the current hero and provide default fallback slides when no active offers exist.
- Responsive rectangular cards.
- Package image and stable fallback handling.
- Large section-navigation controls.
- Stronger Our App emphasis.
- Concise section previews and links.
- Smooth section navigation and scroll-to-top.

Do not change public authorization, data privacy, or business logic. Do not add a carousel/animation dependency without project-owner approval.

### Phase 41 Regression Boundary

Phase 41 reviews all approved routes and actions, exports, demo data, authorization, public privacy, responsive layouts, error states, and build/typecheck behavior. It adds no Phase 42 and no unapproved route family.

---

## 17. Do Not Include Yet

Do not include the following routes, actions, or APIs until confirmed by the client or later project documents:

- Customer signup route.
- Customer login route.
- Customer account dashboard route.
- Customer package self-view route.
- Customer visit history self-view route.
- Coach login route.
- Coach dashboard route.
- Platform owner/master admin route area.
- Multi-branch route area.
- Branch-specific public pages.
- QR code check-in route or API.
- Membership-card scan route or API.
- Online payment routes.
- Ecommerce checkout routes.
- Cart/order routes.
- Invoice/receipt routes.
- Loyalty/rewards routes.
- Native mobile app APIs.
- Push notification APIs.
- SMS/WhatsApp/email notification APIs.
- Notification template routes.
- Full group class registration routes.
- Group class schedule management routes.
- Group class capacity routes.
- Group class waiting list routes.
- Public archive route for old offers/promotions unless confirmed.
- Advanced export scheduling APIs.
- Advanced predictive analytics routes.
- Revenue analytics routes.
- Marketing campaign analytics routes.
- WebSocket routes or real-time infrastructure unless live update behavior is confirmed.
- Any route or API not directly supporting the confirmed system or the manually approved Phase 31-41 analytics, category, filtering, document, visit-history, freeze, permission, homepage, and final-review scope.

---

## Final Route/API Summary

Smartfit.am should use a small, clear route structure: public website pages, one public mobile app/live occupancy page, one private Admin Panel area, and one private Registration Panel area. Most internal operations should be implemented as server-side actions because the project is form-based and operational. API routes should be limited to cases where they are clearly useful, especially public occupancy fetching and admin Excel export downloads.

The most important route/API safety rule is separation of public and private data. Public routes may show gym information and live occupancy count, but they must never expose customer records, customer IDs, package ownership, remaining sessions, notes, logs, or visit history. The most important operational actions are check-in, check-out, manual session correction, and manual occupancy correction; these must remain server-side, permission-protected, validated, and logged.
