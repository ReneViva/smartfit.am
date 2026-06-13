# Smartfit.am — Database Schema

**Document path:** `docs/03-database-schema.md`  
**Project:** Smartfit.am  
**Document type:** Database schema planning document  
**Purpose:** Define the confirmed database needs for Smartfit.am before implementation. This file is intended for the ChatGPT Project knowledge base first and can later be saved inside the real project directory.

---

## 1. Source Documents Used

The following uploaded Smartfit.am project documents were used as the source of truth for this database plan:

1. **`smartfit_am_website_specification_polished.docx`**  
   Main source for the confirmed product requirements, application areas, user responsibilities, workflows, business rules, MVP scope, and open decisions.

2. **`docs/01-product-requirements.md` / `01-product-requirements.md`**  
   Structured product requirements document created from the uploaded Word specification.

3. **`docs/02-technical-blueprint.md` / `02-technical-blueprint.md`**  
   High-level technical plan based on the uploaded Word specification and product requirements document.

4. **`smartfit_design_colors.xlsx`**  
   Available project file related to design colors. It does not define database requirements, so it is not used for functional schema decisions.

No separate detailed authentication specification, client data import sheet, package catalog, existing member list, hosting specification, or finalized permission matrix was available.

---

## 2. Database Scope

This database schema covers only data required by confirmed Smartfit.am requirements.

### Confirmed Data Areas

- Internal users for private Admin Panel and Registration Panel access.
- Gym settings and public configuration.
- Public website content, including offers, promotions, discounts, news, announcements, and homepage content.
- Gallery images for the confirmed MVP public Gallery page.
- Customer package freezing and reactivation records for both Admin Panel and Registration Panel workflows.
- Customers / gym members.
- Coaches / trainers.
- Package definitions and package details.
- Customer package assignments, including remaining sessions, activation dates, expiration dates, statuses, and package history.
- Optional package time restrictions, such as packages usable only before a specific time.
- Customer check-in and check-out records.
- Selected package usage during check-in.
- Manual session corrections.
- Current gym occupancy count.
- Manual occupancy corrections.
- Customer/internal notes.
- Admin-visible logs / audit trail.
- Data needed for Excel exports.
- Data needed for basic analytics, including daily check-ins, current occupancy, and peak hours.
- Media references for logo, coach photos, gallery images, and possible public content images.

### Unclear Data Areas

- Exact authentication fields for admin and registration users.
- Exact customer personal information fields.
- Exact customer ID format.
(These fields will be provided from official project files or client source data. Codex must not invent customer personal fields or customer ID format.
)
- Whether customer QR codes or membership card identifiers are required.
- Automatic expiration-date extension during package freezing is not included in the MVP unless later confirmed.
- Whether package time restrictions support only “before a time” or full start/end time ranges.
- Whether package time restrictions support weekdays or other schedule rules.
- Whether check-in overrides are allowed for expired, zero-session, frozen, or time-restricted packages.
- Whether note deletion is allowed for reception staff.
- Whether exports themselves need to be stored as historical records.
- Whether historical occupancy analytics should use snapshots, visit records, or separate occupancy events.
- Whether media files are uploaded into the system or stored as external URLs.

### Not Included Because Not Confirmed

- Customer login accounts.
- Customer self-service dashboard data.
- Coach login/dashboard data.
- Platform owner/master admin data.
- Multi-branch or multi-gym tenant data.
- Online payment records.
- Ecommerce order/checkout records.
- QR code check-in scans.
- Membership-card scan events.
- External notification templates or delivery logs.
- Loyalty/reward records.
- Group class registration, capacity, waiting list, or attendance records.
- Native mobile app device tokens.
- Advanced marketing analytics.

---

## 3. Database Design Principles

### 3.1 Relational Structure

Smartfit.am should use a relational structure because the confirmed requirements depend on clear relationships between customers, packages, coaches, visits, sessions, notes, logs, and settings.

### 3.2 Preferred Database Stack

- **PostgreSQL** is the preferred database direction because the data is structured and relational.
- **Prisma ORM** is the preferred ORM direction for schema definition, migrations, and type-safe database access.

PostgreSQL and Prisma are preferred technical choices from the project planning context. They are not presented as client-confirmed requirements unless confirmed separately.

### 3.3 Clear Ownership of Records

Records should make ownership clear:

- A customer owns customer package assignments.
- A customer package belongs to one customer and is based on one package definition.
- A check-in/check-out visit belongs to one customer.
- Session usage records belong to a customer package and may belong to a visit.
- Notes may belong to a customer if they are customer-specific.
- Logs should identify the actor and the affected record where possible.

### 3.4 Timestamps

Important records should store timestamps, especially:

- Creation and update time for editable records.
- Check-in and check-out times.
- Session deduction/correction time.
- Occupancy correction time.
- Note creation/update time.
- Log creation time.
- Package activation, expiration, freeze, and reactivation dates.

### 3.5 Status Fields

Status fields are needed where the requirements explicitly mention statuses:

- Customer active/inactive status.
- Customer gym presence status: `In gym` or `Not in gym`.
- Customer package status: active, inactive, expired, or frozen.
- Coach active/inactive status.
- Public content active/inactive or archived behavior, with exact lifecycle still unclear.

### 3.6 Soft Delete

Soft delete is recommended for sensitive operational records where deletion could damage history:

- Customers.
- Packages.
- Coaches.
- Public content.
- Notes, if note deletion is allowed.

This is a recommended technical field, not a confirmed business rule. The client must confirm whether records should be deleted permanently or only hidden/archived.

### 3.7 Audit / History Tracking

Audit/history tracking is strongly supported by the requirements. The documents explicitly require logs for check-ins, check-outs, session deductions, manual corrections, freeze/reactivation, renewals, and important edits.

### 3.8 Server-Side Control for Sensitive Updates

The database should support server-side enforcement for sensitive actions:

- Check-in.
- Check-out.
- Session deduction.
- Manual session correction.
- Occupancy correction.
- Package freezing/reactivation.
- Admin settings changes.
- Data exports.

These updates should not rely only on client-side UI behavior.

---

## 4. Confirmed Data Models

## Model: StaffUser

### Purpose

Stores internal users who can access the private Admin Panel or Registration Panel.

### Related Requirement

The uploaded specification confirms separate Admin Panel and Registration Panel access areas. Admin users have full access, while registration staff have limited daily-operation access.

### Suggested Fields

| Field | Type | Required? | Description | Confirmed / Unclear |
|---|---|---|---|---|
| id | String / UUID / CUID | Yes | Internal database identifier. | Recommended technical field |
| name | String | Unclear | Display name of the staff/admin user. | Unclear |
| username | String | Unclear | Login identifier if username-based login is used. | Unclear |
| email | String | Unclear | Login/contact identifier if email-based login is used. | Unclear |
| passwordHash | String | Unclear | Needed only if using password-based authentication. | Unclear |
| role | StaffRole | Yes | Distinguishes admin from registration staff. | Confirmed concept; exact enum names unclear |
| isActive | Boolean | Yes | Controls whether the internal user can access the system. | Recommended technical field |
| createdAt | DateTime | Yes | Record creation time. | Recommended technical field |
| updatedAt | DateTime | Yes | Last update time. | Recommended technical field |

### Relationships

| Related Model | Relationship Type | Description | Confirmed / Unclear |
|---|---|---|---|
| AuditLog | one-to-many | One staff user can create many logs. | Confirmed concept |
| Note | one-to-many | One staff user can create/update notes. | Confirmed concept |
| GymVisit | one-to-many | One staff user can perform many check-ins/check-outs. | Confirmed concept |
| PackageSessionChange | one-to-many | One staff user can perform many session deductions/corrections. | Confirmed concept |
| OccupancyEvent | one-to-many | One staff user can perform many manual occupancy corrections. | Confirmed concept |

### Notes

Exact authentication method is not confirmed. This model should remain flexible until the login method is decided.

---

## Model: GymSettings

### Purpose

Stores gym-wide settings used by public pages, the public mobile app-like experience, the Registration Panel, and the Admin Panel.

### Related Requirement

The Admin Settings section must allow the admin to manage gym name, logo, contact links, address, map link, working days/hours, occupancy thresholds, public app display settings, and whether inactive customers are hidden from registration staff.

### Suggested Fields

| Field | Type | Required? | Description | Confirmed / Unclear |
|---|---|---|---|---|
| id | String / UUID / CUID | Yes | Internal database identifier. | Recommended technical field |
| gymName | String | Yes | Public gym name. | Confirmed |
| logoUrl | String | No | Logo or image reference. | Confirmed data need; storage method unclear |
| contactNumber | String | No | Public contact number. | Confirmed |
| whatsappLink | String | No | WhatsApp contact link. | Confirmed |
| instagramLink | String | No | Instagram link. | Confirmed |
| address | String | No | Gym address. | Confirmed |
| mapLink | String | No | Google Maps or Yandex Maps link. | Confirmed |
| workingDays | String / JSON | No | Gym working days. | Confirmed; exact structure unclear |
| workingHours | String / JSON | No | Gym working hours. | Confirmed; exact structure unclear |
| occupancyGreenMax | Int | No | Highest count considered low crowd/green. | Confirmed concept; exact thresholds client-defined |
| occupancyYellowMax | Int | No | Highest count considered medium/yellow. | Confirmed concept; exact thresholds client-defined |
| showPhoneInPublicApp | Boolean | Yes | Controls phone visibility in public app page. | Confirmed |
| showWhatsappInPublicApp | Boolean | Yes | Controls WhatsApp visibility in public app page. | Confirmed |
| showInstagramInPublicApp | Boolean | Yes | Controls Instagram visibility in public app page. | Confirmed |
| showLocationInPublicApp | Boolean | Yes | Controls location link visibility in public app page. | Confirmed |
| showMotivationalTextInPublicApp | Boolean | Yes | Controls motivational text visibility. | Confirmed |
| motivationalText | String | No | Public app motivational message. | Confirmed |
| hideInactiveCustomersFromRegistration | Boolean | Yes | Controls registration view filtering. | Confirmed |
| createdAt | DateTime | Yes | Record creation time. | Recommended technical field |
| updatedAt | DateTime | Yes | Last update time. | Recommended technical field |

### Relationships

| Related Model | Relationship Type | Description | Confirmed / Unclear |
|---|---|---|---|
| AuditLog | one-to-many / target reference | Settings changes should create logs. | Confirmed concept |

### Notes

The project likely needs one settings record for the MVP. Multi-gym/multi-branch settings are not confirmed.

---

## Model: PublicContent

### Purpose

Stores admin-managed public content such as homepage offers, promotions, discounts, news, announcements, and possibly homepage hero content.

### Related Requirement

The admin can update homepage offers, promotions, discounts, and news. The homepage hero should be dedicated to current offers and announcements. Offer and promotion history should be stored for review or export.

### Suggested Fields

| Field | Type | Required? | Description | Confirmed / Unclear |
|---|---|---|---|---|
| id | String / UUID / CUID | Yes | Internal database identifier. | Recommended technical field |
| type | PublicContentType / String | Yes | Content category, such as offer, promotion, discount, news, announcement, or hero content. | Confirmed concept; exact values unclear |
| title | String | Yes | Public content title. | Confirmed concept |
| body | String | No | Public content description/details. | Confirmed concept |
| imageUrl | String | No | Optional visual/banner image. | Unclear |
| startsAt | DateTime | No | Start date/time if content is time-limited. | Unclear |
| endsAt | DateTime | No | End date/time if content expires. | Unclear |
| isActive | Boolean | Yes | Whether content is currently public/active. | Confirmed concept |
| deletedAt | DateTime | No | Soft delete/archive timestamp if used. | Recommended technical field |
| createdById | String | No | Staff user who created it. | Recommended technical field |
| createdAt | DateTime | Yes | Record creation time. | Recommended technical field |
| updatedAt | DateTime | Yes | Last update time. | Recommended technical field |

### Relationships

| Related Model | Relationship Type | Description | Confirmed / Unclear |
|---|---|---|---|
| StaffUser | many-to-one | Content may be created/updated by an admin. | Recommended technical relationship |
| AuditLog | one-to-many / target reference | Content changes should be loggable. | Confirmed concept |

### Notes

Exact content lifecycle is unclear. The documents mention create, update, renew/reactivate, delete, and history, but do not define draft/published/expired/archive rules.

---

## Model: Customer

### Purpose

Stores gym customer/member profiles used for package tracking, check-in/check-out status, notes, logs, and analytics.

### Related Requirement

The admin can create, view, update, renew/reactivate, and delete customer profiles. Each customer profile should include personal information, customer ID, active/inactive status, assigned coach if applicable, current gym status, and package history.

### Suggested Fields

| Field | Type | Required? | Description | Confirmed / Unclear |
|---|---|---|---|---|
| id | String / UUID / CUID | Yes | Internal database identifier. | Recommended technical field |
| customerCode | String | Yes | Customer-facing ID used for search and identification. | Confirmed; format unclear |
| firstName | String | Unclear | Customer first name. | Unclear but personal information is confirmed |
| lastName | String | Unclear | Customer last name/surname. | Unclear but personal information is confirmed |
| fullName | String | Yes | Customer name for search/display. | Confirmed concept |
| phone | String | Unclear | Customer contact phone if needed. | Unclear |
| status | CustomerStatus | Yes | Active or inactive customer status. | Confirmed |
| gymPresenceStatus | GymPresenceStatus | Yes | In gym or Not in gym. | Confirmed |
| assignedCoachId | String | No | Default/assigned coach if applicable. | Confirmed if applicable |
| lastCheckInAt | DateTime | No | Last time customer checked in. | Recommended technical field |
| lastCheckOutAt | DateTime | No | Last time customer checked out. | Recommended technical field |
| deletedAt | DateTime | No | Soft delete timestamp if used. | Recommended technical field |
| createdAt | DateTime | Yes | Record creation time. | Recommended technical field |
| updatedAt | DateTime | Yes | Last update time. | Recommended technical field |

### Relationships

| Related Model | Relationship Type | Description | Confirmed / Unclear |
|---|---|---|---|
| Coach | many-to-one | Customer may have an assigned coach if applicable. | Confirmed if applicable |
| CustomerPackage | one-to-many | Customer can have zero, one, or multiple packages. | Confirmed |
| GymVisit | one-to-many | Customer can have many check-in/check-out visits. | Confirmed |
| Note | one-to-many | Customer can have operational notes. | Confirmed concept |
| AuditLog | one-to-many / target reference | Customer actions should be loggable. | Confirmed |

### Notes

Exact personal information fields must be confirmed with the client. The public website must never expose private customer names, IDs, package details, notes, or logs.
Exact customer personal information fields and customer ID format must come from official project files or client source data. Codex must not invent additional customer fields. If the field list is unavailable during Phase 8, implementation should stop and report the blocker instead of guessing.


---

## Model: Coach

### Purpose

Stores coach/trainer profiles for admin management, public coach display, coach-specific packages, and coach-related session tracking.

### Related Requirement

The admin can create, view, update, renew/reactivate, and delete coach profiles. Coach profiles should include name, surname, photo, specialty, contact information if needed, and active/inactive status. Coaches can be connected to packages and customers.

### Suggested Fields

| Field | Type | Required? | Description | Confirmed / Unclear |
|---|---|---|---|---|
| id | String / UUID / CUID | Yes | Internal database identifier. | Recommended technical field |
| firstName | String | Yes | Coach name. | Confirmed |
| lastName | String | Yes | Coach surname. | Confirmed |
| photoUrl | String | No | Coach photo reference. | Confirmed; storage method unclear |
| specialty | String | Yes | Coach specialty. | Confirmed |
| description | String | No | Short public description if used. | Confirmed in PRD from public coach page need; exact text unclear |
| contactInfo | String | No | Contact information if needed. | Confirmed optional |
| isActive | Boolean | Yes | Active/inactive status. | Confirmed |
| deletedAt | DateTime | No | Soft delete timestamp if used. | Recommended technical field |
| createdAt | DateTime | Yes | Record creation time. | Recommended technical field |
| updatedAt | DateTime | Yes | Last update time. | Recommended technical field |

### Relationships

| Related Model | Relationship Type | Description | Confirmed / Unclear |
|---|---|---|---|
| Customer | one-to-many | A coach may be assigned to multiple customers. | Confirmed if applicable |
| Package | one-to-many | A package may require or be connected to a coach. | Confirmed if applicable |
| CustomerPackage | one-to-many | A customer package may be coach-specific. | Confirmed if applicable |
| PackageSessionChange | one-to-many | Coach-related session usage may be tracked. | Confirmed analytics concept |

### Notes

A coach login/dashboard is not confirmed and should not be included in the schema yet.

---

## Model: Package

### Purpose

Stores reusable gym package definitions that admin can manage and public visitors may view on the Packages page.

### Related Requirement

The admin can create, view, update, renew/reactivate, and delete gym packages. Packages include name, price, number of sessions, package type, assigned coach if required, and optional time restrictions.

### Suggested Fields

| Field | Type | Required? | Description | Confirmed / Unclear |
|---|---|---|---|---|
| id | String / UUID / CUID | Yes | Internal database identifier. | Recommended technical field |
| name | String | Yes | Package name. | Confirmed |
| description | String | No | Public/internal description. | Unclear |
| price | Decimal | Yes | Package price. | Confirmed |
| sessionCount | Int | Yes | Number of included sessions. | Confirmed |
| packageType | String | Yes | Type such as general gym, coach session, pool access, or group training. | Confirmed concept; exact allowed values unclear |
| assignedCoachId | String | No | Coach required for coach-specific package if applicable. | Confirmed if required |
| isActive | Boolean | Yes | Active/inactive status. | Confirmed |
| hasTimeRestriction | Boolean | Yes | Whether usage is restricted by time. | Confirmed |
| allowedStartTime | String / Time | No | Start time if time range is supported. | Unclear |
| allowedEndTime | String / Time | No | End time; supports “before 3:00 PM” style rule. | Confirmed concept; exact structure unclear |
| timeRestrictionLabel | String | No | Human-readable rule like “Can be used only before 3:00 PM”. | Confirmed example; recommended technical field |
| deletedAt | DateTime | No | Soft delete timestamp if used. | Recommended technical field |
| createdAt | DateTime | Yes | Record creation time. | Recommended technical field |
| updatedAt | DateTime | Yes | Last update time. | Recommended technical field |

### Relationships

| Related Model | Relationship Type | Description | Confirmed / Unclear |
|---|---|---|---|
| Coach | many-to-one | Package may be connected to a coach if required. | Confirmed if applicable |
| CustomerPackage | one-to-many | Package definition can be assigned to many customer packages. | Recommended technical relationship |
| PublicContent | none / indirect | Packages may be shown publicly, but not necessarily linked to content records. | Unclear |
| AuditLog | one-to-many / target reference | Package edits should be loggable. | Confirmed concept |

### Notes

The documents use “package” both for package definitions and customer-specific package ownership. This schema separates `Package` from `CustomerPackage` as a recommended technical design so remaining sessions and activation/expiration dates can be tracked per customer.

---

## Model: CustomerPackage

### Purpose

Stores a specific package owned by a specific customer, including remaining sessions, activation date, expiration date, status, and package history.

### Related Requirement

The system must support customers with no active package, one package, or multiple active packages at the same time. Each package card should show package name, remaining sessions, expiry date, status, and time rule.

### Suggested Fields

| Field | Type | Required? | Description | Confirmed / Unclear |
|---|---|---|---|---|
| id | String / UUID / CUID | Yes | Internal database identifier. | Recommended technical field |
| customerId | String | Yes | Customer who owns this package. | Confirmed relationship |
| packageId | String | Yes | Package definition assigned to the customer. | Recommended technical relationship |
| coachId | String | No | Coach connected to this specific customer package, if applicable. | Confirmed if applicable |
| activationDate | DateTime | Yes | Package activation date. | Confirmed |
| expirationDate | DateTime | Yes | Package expiration date. | Confirmed |
| initialSessions | Int | Yes | Session count when package was assigned/renewed. | Confirmed concept |
| remainingSessions | Int | Yes | Current remaining sessions. | Confirmed |
| status | CustomerPackageStatus | Yes | Active, inactive, expired, or frozen. | Confirmed |
| frozenAt | DateTime | No | When package was frozen. | Confirmed concept; exact rules unclear |
| reactivatedAt | DateTime | No | When package was reactivated. | Confirmed concept |
| deletedAt | DateTime | No | Soft delete timestamp if used. | Recommended technical field |
| createdAt | DateTime | Yes | Record creation time. | Recommended technical field |
| updatedAt | DateTime | Yes | Last update time. | Recommended technical field |

### Relationships

| Related Model | Relationship Type | Description | Confirmed / Unclear |
|---|---|---|---|
| Customer | many-to-one | Customer package belongs to one customer. | Confirmed |
| Package | many-to-one | Customer package is based on one package definition. | Recommended technical relationship |
| Coach | many-to-one | Customer package may be assigned to a coach. | Confirmed if applicable |
| PackageSessionChange | one-to-many | Session deductions/corrections are linked to this package. | Confirmed concept |
| VisitPackageUsage | one-to-many | Package may be selected during check-in visits. | Confirmed concept |
| AuditLog | one-to-many / target reference | Freezing, renewal, reactivation, and edits should be loggable. | Confirmed |

### Notes

This model is central to the check-in workflow. Session counts should not go below zero unless the client confirms admin override behavior.
Freezing and reactivation are confirmed for the MVP. A frozen customer package cannot be used during check-in or session deduction. Both admin/manager users and registration/reception users can freeze and reactivate customer packages. Every freeze and reactivation action must create an admin-visible log entry. Freezing does not automatically extend the expiration date in the MVP unless later confirmed.


---

## Model: GymVisit

### Purpose

Stores check-in and check-out records for customer visits.

### Related Requirement

Check-in changes customer status to In gym, records date/time, deducts selected sessions, increases occupancy, and logs actions. Check-out changes status to Not in gym, records exit time, decreases occupancy, and does not deduct sessions.

### Suggested Fields

| Field | Type | Required? | Description | Confirmed / Unclear |
|---|---|---|---|---|
| id | String / UUID / CUID | Yes | Internal database identifier. | Recommended technical field |
| customerId | String | Yes | Customer who visited. | Confirmed |
| checkedInAt | DateTime | Yes | Check-in date/time. | Confirmed |
| checkedOutAt | DateTime | No | Check-out date/time. Null while customer is inside. | Confirmed |
| checkedInById | String | Yes | Staff user who checked the customer in. | Confirmed concept |
| checkedOutById | String | No | Staff user who checked the customer out. | Confirmed concept |
| occupancyAfterCheckIn | Int | No | Occupancy after check-in. | Recommended technical field |
| occupancyAfterCheckOut | Int | No | Occupancy after check-out. | Recommended technical field |
| createdAt | DateTime | Yes | Record creation time. | Recommended technical field |
| updatedAt | DateTime | Yes | Last update time. | Recommended technical field |

### Relationships

| Related Model | Relationship Type | Description | Confirmed / Unclear |
|---|---|---|---|
| Customer | many-to-one | Visit belongs to a customer. | Confirmed |
| StaffUser | many-to-one | Staff user performs check-in/check-out. | Confirmed concept |
| VisitPackageUsage | one-to-many | A visit can use one or more selected packages. | Confirmed |
| PackageSessionChange | one-to-many | Session deductions during visit can be tracked. | Confirmed concept |
| AuditLog | one-to-many / target reference | Check-in/check-out actions are logged. | Confirmed |

### Notes

A customer should not have more than one open visit at the same time unless admin override is later confirmed.

---

## Model: VisitPackageUsage

### Purpose

Stores which customer packages were selected and used during a specific check-in visit.

### Related Requirement

Before confirming check-in, the receptionist should select which package or packages are being used. Only selected packages should decrease.

### Suggested Fields

| Field | Type | Required? | Description | Confirmed / Unclear |
|---|---|---|---|---|
| id | String / UUID / CUID | Yes | Internal database identifier. | Recommended technical field |
| visitId | String | Yes | Related check-in visit. | Confirmed concept |
| customerPackageId | String | Yes | Selected customer package. | Confirmed concept |
| sessionsDeducted | Int | Yes | Usually 1 per selected package for a visit. | Confirmed concept; exact quantity rules unclear |
| createdAt | DateTime | Yes | Record creation time. | Recommended technical field |

### Relationships

| Related Model | Relationship Type | Description | Confirmed / Unclear |
|---|---|---|---|
| GymVisit | many-to-one | Package usage belongs to a visit. | Confirmed |
| CustomerPackage | many-to-one | Usage refers to one selected customer package. | Confirmed |
| PackageSessionChange | one-to-one / one-to-many | Session deduction can be represented as a session change. | Recommended technical relationship |

### Notes

This model supports the example where general sessions and Coach Davit sessions both decrease, but pool sessions do not decrease unless selected.

---

## Model: PackageSessionChange

### Purpose

Stores session deductions and manual corrections for customer packages.

### Related Requirement

Check-in deducts selected package sessions. Manual session corrections using plus/minus controls must be saved and logged. Customer package history and session usage need to be exportable/traceable.

### Suggested Fields

| Field | Type | Required? | Description | Confirmed / Unclear |
|---|---|---|---|---|
| id | String / UUID / CUID | Yes | Internal database identifier. | Recommended technical field |
| customerPackageId | String | Yes | Package whose session count changed. | Confirmed |
| visitId | String | No | Related visit if the change happened during check-in. | Confirmed concept |
| changedById | String | Yes | Staff user who performed the deduction/correction. | Confirmed concept |
| changeType | SessionChangeType | Yes | Check-in deduction, manual correction, freeze/reactivation-related adjustment if needed. | Confirmed concept; exact values need confirmation |
| previousRemainingSessions | Int | Yes | Remaining sessions before change. | Recommended technical field |
| newRemainingSessions | Int | Yes | Remaining sessions after change. | Recommended technical field |
| delta | Int | Yes | Negative for deduction, positive/negative for manual correction. | Recommended technical field |
| reason | String | No | Optional internal explanation. Not required in MVP because manual session corrections do not require a reason. | Confirmed optional |
| createdAt | DateTime | Yes | When change happened. | Confirmed concept |

### Relationships

| Related Model | Relationship Type | Description | Confirmed / Unclear |
|---|---|---|---|
| CustomerPackage | many-to-one | Session change belongs to one customer package. | Confirmed |
| GymVisit | many-to-one | Optional visit connected to check-in deductions. | Confirmed concept |
| StaffUser | many-to-one | Staff user performed the change. | Confirmed concept |
| AuditLog | one-to-many / target reference | Session changes should create admin-visible logs. | Confirmed |

### Notes

This model is recommended because logs alone may not be enough for reliable package history, analytics, and exports.

---

## Model: Note

### Purpose

Stores internal notes used by registration staff and admins for operational reminders, customer-specific details, or internal communication.

### Related Requirement

The Registration Panel should include a notes section. Reception staff can create, read, update, and delete notes if they have permission. Notes should be sorted by date, with newest notes easiest to find.

### Suggested Fields

| Field | Type | Required? | Description | Confirmed / Unclear |
|---|---|---|---|---|
| id | String / UUID / CUID | Yes | Internal database identifier. | Recommended technical field |
| customerId | String | No | Related customer if note is customer-specific. | Confirmed concept |
| content | String | Yes | Note text. | Confirmed |
| createdById | String | Yes | Staff user who created note. | Confirmed concept |
| updatedById | String | No | Staff user who last updated note. | Recommended technical field |
| deletedAt | DateTime | No | Soft delete timestamp if deletion is allowed. | Unclear |
| createdAt | DateTime | Yes | Note creation time. | Confirmed concept |
| updatedAt | DateTime | Yes | Last update time. | Confirmed concept |

### Relationships

| Related Model | Relationship Type | Description | Confirmed / Unclear |
|---|---|---|---|
| Customer | many-to-one | Note may belong to one customer. | Confirmed concept |
| StaffUser | many-to-one | Note is created/updated by staff/admin. | Confirmed concept |
| AuditLog | one-to-many / target reference | Note changes may be logged if required. | Unclear |

### Notes

Whether reception staff can delete notes is an open client question.

---

## Model: OccupancyState

### Purpose

Stores the current number of people inside the gym.

### Related Requirement

The public User Panel must show the current number of people inside the gym. The count is mainly updated by check-in/check-out and can be manually corrected by reception staff.

### Suggested Fields

| Field | Type | Required? | Description | Confirmed / Unclear |
|---|---|---|---|---|
| id | String / UUID / CUID | Yes | Internal database identifier. | Recommended technical field |
| currentCount | Int | Yes | Current number of people inside the gym. | Confirmed |
| updatedById | String | No | Staff user who last changed it manually or through operation. | Recommended technical field |
| updatedAt | DateTime | Yes | Last update time. | Recommended technical field |

### Relationships

| Related Model | Relationship Type | Description | Confirmed / Unclear |
|---|---|---|---|
| OccupancyEvent | one-to-many | Current count changes can be recorded as events. | Recommended technical relationship |
| StaffUser | many-to-one | Last updater if relevant. | Recommended technical relationship |

### Notes

For MVP, this may be a single-row table. Multi-branch occupancy is not confirmed.

---

## Model: OccupancyEvent

### Purpose

Stores changes to occupancy count caused by check-in, check-out, or manual correction.

### Related Requirement

Check-in increases occupancy by 1, check-out decreases occupancy by 1, manual corrections can increase/decrease occupancy, and manual changes must create a log entry visible to admin. Historical occupancy trends are listed as useful analytics.

### Suggested Fields

| Field | Type | Required? | Description | Confirmed / Unclear |
|---|---|---|---|---|
| id | String / UUID / CUID | Yes | Internal database identifier. | Recommended technical field |
| eventType | OccupancyEventType | Yes | Check-in, check-out, or manual correction. | Confirmed concept |
| previousCount | Int | Yes | Occupancy before change. | Recommended technical field |
| newCount | Int | Yes | Occupancy after change. | Recommended technical field |
| delta | Int | Yes | Change amount. | Recommended technical field |
| visitId | String | No | Related visit if caused by check-in/check-out. | Confirmed concept |
| changedById | String | No | Staff user who caused or manually performed the change. | Confirmed concept |
| reason | String | No | Optional internal explanation. Not required in MVP because manual occupancy corrections do not require a reason. | Confirmed optional |
| createdAt | DateTime | Yes | When the event happened. | Confirmed concept |

### Relationships

| Related Model | Relationship Type | Description | Confirmed / Unclear |
|---|---|---|---|
| GymVisit | many-to-one | Occupancy event may relate to a visit. | Confirmed concept |
| StaffUser | many-to-one | Staff user caused/performed the change. | Confirmed concept |
| AuditLog | one-to-many / target reference | Manual correction must create log. | Confirmed |

### Notes

Exact historical occupancy analytics approach is unclear. This model is recommended to support traceability and trends.

---

## Model: AuditLog

### Purpose

Stores admin-visible logs of important actions. Logs should not be editable by reception staff.

### Related Requirement

The system must log check-ins, session deductions, check-outs, manual session corrections, package freezes, renewals/reactivations, important admin edits, and manual occupancy corrections.

### Suggested Fields

| Field | Type | Required? | Description | Confirmed / Unclear |
|---|---|---|---|---|
| id | String / UUID / CUID | Yes | Internal database identifier. | Recommended technical field |
| actorId | String | No | Staff/admin user who performed the action. | Confirmed concept |
| actionType | AuditActionType / String | Yes | Type of action performed. | Confirmed concept; exact values need finalization |
| targetType | String | No | Target model/type, such as customer, package, visit, setting, content. | Recommended technical field |
| targetId | String | No | Target record ID. | Recommended technical field |
| customerId | String | No | Related customer if relevant. | Confirmed for many actions |
| description | String | Yes | Human-readable log message. | Confirmed concept |
| oldValue | Json / String | No | Previous value for edits/corrections. | Confirmed concept through examples; structure unclear |
| newValue | Json / String | No | New value for edits/corrections. | Confirmed concept through examples; structure unclear |
| createdAt | DateTime | Yes | Time action happened. | Confirmed |

### Relationships

| Related Model | Relationship Type | Description | Confirmed / Unclear |
|---|---|---|---|
| StaffUser | many-to-one | Actor who performed the action. | Confirmed concept |
| Customer | many-to-one | Related customer for customer-specific actions. | Confirmed concept |

### Notes

AuditLog is one of the most important models because the requirements repeatedly emphasize traceability. Logs should be admin-visible and protected from normal editing.

---

## Model: GalleryImage

### Purpose

Stores references to gallery images displayed on the public website.

### Related Requirement

The regular public website includes Gallery as a suggested public page with gym photos, equipment, training areas, and atmosphere.

### Suggested Fields

| Field | Type | Required? | Description | Confirmed / Unclear |
|---|---|---|---|---|
| id | String / UUID / CUID | Yes | Internal database identifier. | Recommended technical field |
| imageUrl | String | Yes | Image reference or URL. | Confirmed data need; storage method unclear |
| title | String | No | Optional image title. | Unclear |
| altText | String | No | Optional accessibility/description text. | Recommended technical field |
| sortOrder | Int | No | Display order. | Recommended technical field |
| isActive | Boolean | Yes | Whether image is shown publicly. | Recommended technical field |
| createdAt | DateTime | Yes | Record creation time. | Recommended technical field |
| updatedAt | DateTime | Yes | Last update time. | Recommended technical field |

### Relationships

| Related Model | Relationship Type | Description | Confirmed / Unclear |
|---|---|---|---|
| StaffUser | many-to-one | Admin may upload/create image record. | Recommended technical relationship |

### Notes

Gallery is confirmed for the MVP. This model should be included in the initial schema if the project supports database-backed gallery management from the start. If image upload/storage is not ready, image records may store external or static image URLs first.

---

## 5. Relationship Overview

### Plain-English Relationship Summary

- Internal staff users perform protected actions and create logs.
- Gym settings control public gym information, occupancy thresholds, and public app display settings.
- Public content appears on the public website and can be managed by admins.
- Customers may have an assigned coach.
- Customers can have zero, one, or many customer packages.
- Each customer package is based on a package definition.
- Packages may optionally be connected to coaches.
- Check-ins/check-outs are stored as visits.
- A visit can use one or more customer packages.
- Each selected customer package usage can create a session change.
- Manual session corrections also create session changes.
- Occupancy state stores the current public count.
- Occupancy events record check-in, check-out, and manual correction changes.
- Notes may be customer-specific and are created by staff/admin users.
- Audit logs store important actions across the system.

### Text-Based Relationship Diagram

```txt
StaffUser
  ├── AuditLog
  ├── Note
  ├── GymVisit
  ├── PackageSessionChange
  └── OccupancyEvent

GymSettings
  └── controls public settings, occupancy thresholds, and app visibility

PublicContent
  └── shown on public website / homepage offers and announcements

Coach
  ├── Customer
  ├── Package
  └── CustomerPackage

Customer
  ├── CustomerPackage
  │     ├── Package
  │     ├── VisitPackageUsage
  │     └── PackageSessionChange
  ├── GymVisit
  │     ├── VisitPackageUsage
  │     └── OccupancyEvent
  ├── Note
  └── AuditLog

OccupancyState
  └── OccupancyEvent

GalleryImage
  └── shown on public Gallery page if Gallery is included
```

---

## 6. Status and Enum Planning

## Enum: StaffRole

### Used By

`StaffUser`, authentication/permissions, Admin Panel, Registration Panel.

### Values

| Value | Meaning | Confirmed / Unclear |
|---|---|---|
| ADMIN | Gym owner/admin with full access. | Confirmed concept; exact value name recommended |
| REGISTRATION | Receptionist/registration staff with limited operational access. | Confirmed concept; exact value name recommended |

---

## Enum: CustomerStatus

### Used By

`Customer`.

### Values

| Value | Meaning | Confirmed / Unclear |
|---|---|---|
| ACTIVE | Customer profile is active. | Confirmed |
| INACTIVE | Customer profile is inactive. | Confirmed |

---

## Enum: GymPresenceStatus

### Used By

`Customer`, Registration Panel customer card, Admin customer overview.

### Values

| Value | Meaning | Confirmed / Unclear |
|---|---|---|
| IN_GYM | Customer has checked in and is currently inside the gym. | Confirmed |
| NOT_IN_GYM | Customer is currently outside the gym. | Confirmed |

---

## Enum: CustomerPackageStatus

### Used By

`CustomerPackage`, Registration Panel package cards, Admin overview.

### Values

| Value | Meaning | Confirmed / Unclear |
|---|---|---|
| ACTIVE | Package can be used if it also has sessions, valid dates, and passes time rules. | Confirmed |
| INACTIVE | Package is not active. | Confirmed |
| EXPIRED | Package expiration date has passed. | Confirmed |
| FROZEN | Package is frozen and should not be treated as active for session usage. | Confirmed |

---

## Enum: PackageType

### Used By

`Package`.

### Values

| Value | Meaning | Confirmed / Unclear |
|---|---|---|
| General gym access | Standard gym access package. | Confirmed as example |
| Coach sessions | Coach-specific training package. | Confirmed as example |
| Pool access | Pool-related package. | Confirmed as example |
| Group training | Group training package type. | Confirmed as example |
| Other services | Future package/service types the gym may add later. | Confirmed as flexible concept |

### Notes

Because exact launch package types are not finalized, `packageType` may be safer as a controlled string or editable package-type table rather than a hard-coded enum in the first schema.

---

## Enum: SessionChangeType

### Used By

`PackageSessionChange`.

### Values

| Value | Meaning | Confirmed / Unclear |
|---|---|---|
| CHECK_IN_DEDUCTION | Session deducted because package was selected during check-in. | Confirmed |
| MANUAL_CORRECTION | Remaining sessions manually changed with plus/minus controls. | Confirmed |

### Notes

Additional values for renewal, freeze, or admin override should not be added until those workflows are confirmed.

---

## Enum: OccupancyEventType

### Used By

`OccupancyEvent`.

### Values

| Value | Meaning | Confirmed / Unclear |
|---|---|---|
| CHECK_IN | Occupancy increased because a customer checked in. | Confirmed |
| CHECK_OUT | Occupancy decreased because a customer checked out. | Confirmed |
| MANUAL_CORRECTION | Reception manually changed occupancy count. | Confirmed |

---

## Enum: AuditActionType

### Used By

`AuditLog`.

### Values

| Value | Meaning | Confirmed / Unclear |
|---|---|---|
| CUSTOMER_CHECK_IN | Customer checked in. | Confirmed |
| CUSTOMER_CHECK_OUT | Customer checked out. | Confirmed |
| SESSION_DEDUCTION | Package session decreased during check-in. | Confirmed |
| SESSION_CORRECTION | Remaining sessions manually corrected. | Confirmed |
| OCCUPANCY_CORRECTION | Occupancy count manually corrected. | Confirmed |
| PACKAGE_FREEZE | Customer package frozen. | Confirmed |
| PACKAGE_REACTIVATION | Customer package reactivated. | Confirmed |
| PACKAGE_RENEWAL | Customer/package renewed. | Confirmed concept |
| CUSTOMER_EDIT | Customer data edited. | Confirmed concept |
| PACKAGE_EDIT | Package data edited. | Confirmed concept |
| COACH_EDIT | Coach data edited. | Confirmed concept |
| SETTINGS_EDIT | Settings changed. | Confirmed concept |
| PUBLIC_CONTENT_EDIT | Offers/news/promotions/announcements changed. | Confirmed concept |

### Notes

Exact action names can be finalized during implementation. Do not add notification/payment/QR action types unless those features are confirmed.

---

## Enum: PublicContentType

### Used By

`PublicContent`.

### Values

| Value | Meaning | Confirmed / Unclear |
|---|---|---|
| OFFER | Public gym offer. | Confirmed |
| PROMOTION | Public promotion. | Confirmed |
| DISCOUNT | Public discount. | Confirmed |
| NEWS | Public news item. | Confirmed |
| ANNOUNCEMENT | Public announcement. | Confirmed |
| HOMEPAGE_HERO | Homepage hero content. | Confirmed concept |

---

## 7. Business Rule Storage

### Customer Can Have Multiple Packages

**Requirement:**  
A customer can have no active package, one package, or multiple active packages at the same time.

**Database Impact:**  
Use `CustomerPackage` as a one-to-many relationship from `Customer`. Do not store only one package directly on the customer record.

**Unclear Points:**  
Whether there is any maximum number of active packages beyond the UI requirement to handle four to five active packages.

---

### Check-In Deducts Only Selected Packages

**Requirement:**  
Before confirming check-in, reception selects which package or packages are used. Only selected packages decrease.

**Database Impact:**  
Use `GymVisit` for the visit and `VisitPackageUsage` to store selected packages. Use `PackageSessionChange` to store each deduction.

**Unclear Points:**  
Whether a single selected package can deduct more than one session in special cases.

---

### Check-Out Does Not Deduct Sessions

**Requirement:**  
Check-out changes customer status to Not in gym and decreases occupancy. It must not deduct package sessions.

**Database Impact:**  
`GymVisit.checkedOutAt` should be updated. No `PackageSessionChange` deduction should be created for check-out.

**Unclear Points:**  
What should happen if check-out is attempted for a customer already marked Not in gym.

---

### Customer Gym Presence Status

**Requirement:**  
Each customer has a status badge showing In gym or Not in gym.

**Database Impact:**  
Store `Customer.gymPresenceStatus`. Open visits can also be used to confirm whether the status is correct.

**Unclear Points:**  
Whether status should be corrected automatically after closing time or after an unusually long period.

---

### Prevent Double Check-In

**Requirement:**  
A customer should not be checked in twice at the same time unless the admin specifically allows an override.

**Database Impact:**  
The database should support identifying an open visit where `checkedOutAt` is null. Implementation should prevent more than one active open visit per customer unless override is later confirmed.

**Unclear Points:**  
Whether admin override for double check-in will exist.

---

### Package Time Restrictions

**Requirement:**  
Packages may be available all day or only during a specific time range, such as only before 3:00 PM. During check-in, the system must compare the current time with the package allowed time.

**Database Impact:**  
Store `Package.hasTimeRestriction`, and optional time fields such as `allowedStartTime` and `allowedEndTime`, plus a display label if useful.

**Unclear Points:**  
Whether rules can include weekdays, holidays, only-after times, or multiple time windows.

---

### Frozen Packages Cannot Be Used

**Requirement:**  
A frozen package should not be treated as active for session usage.

**Database Impact:**  
Store `CustomerPackage.status = FROZEN` and optional `frozenAt` / `reactivatedAt` timestamps.

**Unclear Points:**  
Whether freezing extends expiration date and who can freeze/reactivate.

---

### Remaining Sessions Should Not Go Below Zero

**Requirement:**  
The system should prevent remaining sessions from going below zero unless admin specifically allows it later.

**Database Impact:**  
Store `remainingSessions` as an integer and validate it before writing. A database check constraint can enforce non-negative values unless override behavior is added.

**Unclear Points:**  
Whether admin override should allow negative values or only allow check-in without deduction.

---

### Manual Session Corrections Must Be Saved and Logged

**Requirement:**  
Reception can use plus/minus controls to correct remaining sessions. Changes require Save and every saved correction creates a log entry visible to admin.

**Database Impact:**  
Store changes in `PackageSessionChange` and create an `AuditLog` record.

**Unclear Points:**  
Whether correction reason is required.

---

### Live Occupancy Count

**Requirement:**  
Check-in increases live occupancy by 1, check-out decreases it by 1, and manual corrections can adjust the count. Public User Panel uses this count.

**Database Impact:**  
Store current count in `OccupancyState`. Store changes in `OccupancyEvent` if historical traceability and trend analytics are needed.

**Unclear Points:**  
Whether occupancy should update instantly, by polling, or only on page refresh.

---

### Public Privacy

**Requirement:**  
The public User Panel must show only general gym information and live occupancy count, not private customer data.

**Database Impact:**  
Public queries should read only `GymSettings`, public content, public package/coach/gallery data, and `OccupancyState.currentCount`. They should not expose `Customer`, `CustomerPackage`, `GymVisit`, `Note`, or `AuditLog` data.

**Unclear Points:**  
None for the privacy rule itself.

---

### Logs Must Be Admin-Visible and Protected

**Requirement:**  
Logs are visible only to admin and should not be editable by reception staff.

**Database Impact:**  
Use `AuditLog` for important actions. Do not provide normal update/delete workflows for reception staff.

**Unclear Points:**  
How long logs should be stored and whether logs can ever be archived.

---

## 8. Prisma Schema Draft

The following Prisma schema draft includes confirmed or clearly necessary models only. Some fields are marked as unclear or recommended technical fields in comments. This draft is not the final implementation schema.

```prisma
// Prisma schema draft for confirmed Smartfit.am data requirements only.
// Unclear fields are marked with comments.
// PostgreSQL + Prisma are preferred technical directions, not client-confirmed requirements.

enum StaffRole {
  ADMIN
  REGISTRATION
}

enum CustomerStatus {
  ACTIVE
  INACTIVE
}

enum GymPresenceStatus {
  IN_GYM
  NOT_IN_GYM
}

enum CustomerPackageStatus {
  ACTIVE
  INACTIVE
  EXPIRED
  FROZEN
}

enum SessionChangeType {
  CHECK_IN_DEDUCTION
  MANUAL_CORRECTION
}

enum OccupancyEventType {
  CHECK_IN
  CHECK_OUT
  MANUAL_CORRECTION
}

enum AuditActionType {
  CUSTOMER_CHECK_IN
  CUSTOMER_CHECK_OUT
  SESSION_DEDUCTION
  SESSION_CORRECTION
  OCCUPANCY_CORRECTION
  PACKAGE_FREEZE
  PACKAGE_REACTIVATION
  PACKAGE_RENEWAL
  CUSTOMER_EDIT
  PACKAGE_EDIT
  COACH_EDIT
  SETTINGS_EDIT
  PUBLIC_CONTENT_EDIT
}

enum PublicContentType {
  OFFER
  PROMOTION
  DISCOUNT
  NEWS
  ANNOUNCEMENT
  HOMEPAGE_HERO
}

model StaffUser {
  id           String    @id @default(cuid())
  name         String?   // Exact staff profile fields are unclear.
  username     String?   @unique // Use only if username login is chosen.
  email        String?   @unique // Use only if email login is chosen.
  passwordHash String?   // Needed only for password-based authentication.
  role         StaffRole
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  createdContent      PublicContent[]
  checkedInVisits     GymVisit[] @relation("VisitCheckedInBy")
  checkedOutVisits    GymVisit[] @relation("VisitCheckedOutBy")
  sessionChanges      PackageSessionChange[]
  notesCreated        Note[] @relation("NoteCreatedBy")
  notesUpdated        Note[] @relation("NoteUpdatedBy")
  occupancyEvents     OccupancyEvent[]
  auditLogs           AuditLog[]
}

model GymSettings {
  id                                  String   @id @default(cuid())
  gymName                             String
  logoUrl                             String?
  contactNumber                       String?
  whatsappLink                        String?
  instagramLink                       String?
  address                             String?
  mapLink                             String?
  workingDays                         String?  // Exact structure unclear; may become JSON or separate table.
  workingHours                        String?  // Exact structure unclear; may become JSON or separate table.
  occupancyGreenMax                   Int?
  occupancyYellowMax                  Int?
  showPhoneInPublicApp                Boolean  @default(true)
  showWhatsappInPublicApp             Boolean  @default(true)
  showInstagramInPublicApp            Boolean  @default(true)
  showLocationInPublicApp             Boolean  @default(true)
  showMotivationalTextInPublicApp     Boolean  @default(true)
  motivationalText                    String?
  hideInactiveCustomersFromRegistration Boolean @default(false)
  createdAt                           DateTime @default(now())
  updatedAt                           DateTime @updatedAt
}

model PublicContent {
  id          String            @id @default(cuid())
  type        PublicContentType
  title       String
  body        String?
  imageUrl    String?           // Offer/banner images are unclear.
  startsAt    DateTime?
  endsAt      DateTime?
  isActive    Boolean           @default(true)
  deletedAt   DateTime?         // Recommended technical field if soft delete/archive is used.
  createdById String?
  createdBy   StaffUser?        @relation(fields: [createdById], references: [id])
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
}

model Customer {
  id                String            @id @default(cuid())
  customerCode      String            @unique
  firstName         String?           // Exact personal fields are unclear.
  lastName          String?           // Exact personal fields are unclear.
  fullName          String
  phone             String?           // Confirm with client if needed.
  status            CustomerStatus    @default(ACTIVE)
  gymPresenceStatus GymPresenceStatus @default(NOT_IN_GYM)
  assignedCoachId   String?
  assignedCoach     Coach?            @relation(fields: [assignedCoachId], references: [id])
  lastCheckInAt     DateTime?
  lastCheckOutAt    DateTime?
  deletedAt         DateTime?         // Recommended technical field if soft delete is used.
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  packages          CustomerPackage[]
  visits            GymVisit[]
  notes             Note[]
  auditLogs         AuditLog[]
}

model Coach {
  id          String    @id @default(cuid())
  firstName   String
  lastName    String
  photoUrl    String?
  specialty   String
  description String?
  contactInfo String?   // Optional if needed.
  isActive    Boolean   @default(true)
  deletedAt   DateTime? // Recommended technical field if soft delete is used.
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  assignedCustomers Customer[]
  packages          Package[]
  customerPackages  CustomerPackage[]
}

model Package {
  id                   String    @id @default(cuid())
  name                 String
  description          String?
  price                Decimal
  sessionCount          Int
  packageType           String    // Exact launch package type values need confirmation.
  assignedCoachId       String?
  assignedCoach         Coach?    @relation(fields: [assignedCoachId], references: [id])
  isActive              Boolean   @default(true)
  hasTimeRestriction    Boolean   @default(false)
  allowedStartTime      String?   // Exact time type/format unclear.
  allowedEndTime        String?   // Supports examples like usable before 3:00 PM.
  timeRestrictionLabel  String?
  deletedAt             DateTime? // Recommended technical field if soft delete is used.
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  customerPackages      CustomerPackage[]
}

model CustomerPackage {
  id                String                @id @default(cuid())
  customerId        String
  customer          Customer              @relation(fields: [customerId], references: [id])
  packageId         String
  package           Package               @relation(fields: [packageId], references: [id])
  coachId           String?
  coach             Coach?                @relation(fields: [coachId], references: [id])
  activationDate    DateTime
  expirationDate    DateTime
  initialSessions   Int
  remainingSessions Int
  status            CustomerPackageStatus @default(ACTIVE)
  frozenAt          DateTime?
  reactivatedAt     DateTime?
  deletedAt         DateTime?             // Recommended technical field if soft delete is used.
  createdAt         DateTime              @default(now())
  updatedAt         DateTime              @updatedAt

  visitUsages       VisitPackageUsage[]
  sessionChanges    PackageSessionChange[]
}

model GymVisit {
  id                     String    @id @default(cuid())
  customerId             String
  customer               Customer  @relation(fields: [customerId], references: [id])
  checkedInAt            DateTime  @default(now())
  checkedOutAt           DateTime?
  checkedInById          String
  checkedInBy            StaffUser @relation("VisitCheckedInBy", fields: [checkedInById], references: [id])
  checkedOutById         String?
  checkedOutBy           StaffUser? @relation("VisitCheckedOutBy", fields: [checkedOutById], references: [id])
  occupancyAfterCheckIn  Int?
  occupancyAfterCheckOut Int?
  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt

  packageUsages          VisitPackageUsage[]
  sessionChanges         PackageSessionChange[]
  occupancyEvents        OccupancyEvent[]
}

model VisitPackageUsage {
  id                String          @id @default(cuid())
  visitId           String
  visit             GymVisit        @relation(fields: [visitId], references: [id])
  customerPackageId String
  customerPackage   CustomerPackage @relation(fields: [customerPackageId], references: [id])
  sessionsDeducted  Int             @default(1)
  createdAt         DateTime        @default(now())

  sessionChange     PackageSessionChange?
}

model PackageSessionChange {
  id                        String            @id @default(cuid())
  customerPackageId          String
  customerPackage            CustomerPackage   @relation(fields: [customerPackageId], references: [id])
  visitId                    String?
  visit                      GymVisit?         @relation(fields: [visitId], references: [id])
  visitPackageUsageId        String?           @unique
  visitPackageUsage          VisitPackageUsage? @relation(fields: [visitPackageUsageId], references: [id])
  changedById                String
  changedBy                  StaffUser         @relation(fields: [changedById], references: [id])
  changeType                 SessionChangeType
  previousRemainingSessions  Int
  newRemainingSessions       Int
  delta                      Int
  reason                     String?           // Confirm whether manual corrections require a reason.
  createdAt                  DateTime          @default(now())
}

model Note {
  id          String    @id @default(cuid())
  customerId  String?
  customer    Customer? @relation(fields: [customerId], references: [id])
  content     String
  createdById String
  createdBy   StaffUser @relation("NoteCreatedBy", fields: [createdById], references: [id])
  updatedById String?
  updatedBy   StaffUser? @relation("NoteUpdatedBy", fields: [updatedById], references: [id])
  deletedAt   DateTime? // Note deletion permission is unclear.
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model OccupancyState {
  id           String   @id @default(cuid())
  currentCount Int      @default(0)
  updatedById  String?
  updatedAt    DateTime @updatedAt
}

model OccupancyEvent {
  id            String             @id @default(cuid())
  eventType     OccupancyEventType
  previousCount Int
  newCount      Int
  delta         Int
  visitId       String?
  visit         GymVisit?          @relation(fields: [visitId], references: [id])
  changedById   String?
  changedBy     StaffUser?         @relation(fields: [changedById], references: [id])
  reason        String?            // Confirm whether manual occupancy corrections require a reason.
  createdAt     DateTime           @default(now())
}

model AuditLog {
  id          String          @id @default(cuid())
  actorId     String?
  actor       StaffUser?      @relation(fields: [actorId], references: [id])
  actionType  AuditActionType
  targetType  String?
  targetId    String?
  customerId  String?
  customer    Customer?       @relation(fields: [customerId], references: [id])
  description String
  oldValue    Json?
  newValue    Json?
  createdAt   DateTime        @default(now())
}

model GalleryImage {
  id        String   @id @default(cuid())
  imageUrl  String
  title     String?
  altText   String?
  sortOrder Int?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## 9. Indexing and Constraints

### Recommended Indexes Based on Confirmed Usage

| Model | Field(s) | Reason | Confirmed / Recommended |
|---|---|---|---|
| StaffUser | username | Login lookup if username login is used. | Unclear |
| StaffUser | email | Login lookup if email login is used. | Unclear |
| Customer | customerCode | Reception searches by customer ID. | Confirmed |
| Customer | fullName | Reception/admin search by name. | Confirmed |
| Customer | status | Admin filters by active/inactive status. | Confirmed |
| Customer | gymPresenceStatus | Admin/reception views In gym / Not in gym. | Confirmed |
| Customer | assignedCoachId | Admin filters by coach. | Confirmed |
| Package | name | Package lookup/display. | Recommended |
| Package | packageType | Admin analytics/filtering by package type. | Confirmed concept |
| CustomerPackage | customerId | Load customer packages quickly. | Confirmed |
| CustomerPackage | packageId | Link package assignments to package definitions. | Confirmed concept |
| CustomerPackage | status | Filter active/inactive/expired/frozen packages. | Confirmed |
| CustomerPackage | expirationDate | Find expired or soon-expiring packages. | Confirmed |
| CustomerPackage | remainingSessions | Find zero-session packages. | Confirmed |
| GymVisit | customerId | View customer visit history. | Confirmed |
| GymVisit | checkedInAt | Daily/weekly/monthly check-in analytics and peak hours. | Confirmed |
| GymVisit | checkedOutAt | Average time in gym and open visit detection. | Confirmed |
| PackageSessionChange | customerPackageId | Package history and exports. | Confirmed concept |
| OccupancyEvent | createdAt | Historical occupancy trends. | Confirmed analytics concept |
| AuditLog | createdAt | Sort/filter logs by time. | Confirmed |
| AuditLog | actionType | Filter logs by action. | Confirmed concept |
| Note | customerId | Load customer notes. | Confirmed concept |
| PublicContent | type, isActive | Load active homepage/public content. | Confirmed |

### Recommended Constraints

- `Customer.customerCode` should be unique.
- `StaffUser.username` or `StaffUser.email` should be unique depending on login method.
- `CustomerPackage.remainingSessions` should be non-negative unless admin override is confirmed.
- `CustomerPackage.initialSessions` should be non-negative.
- `Package.sessionCount` should be non-negative.
- `OccupancyState.currentCount` should be non-negative.
- Only one current `OccupancyState` row should exist for the MVP, unless multi-branch support is confirmed later.
- Only one open `GymVisit` per customer should exist unless double check-in override is confirmed.

### Unclear Constraints

- Whether package names must be unique.
- Whether coach names must be unique.
- Whether public content titles must be unique.
- Whether customer phone numbers are required or unique.
- Whether package type values should be restricted by enum or editable by admin.
- How to enforce one open visit per customer in Prisma/PostgreSQL while allowing future overrides.

---

## 10. Data Validation Notes

### Confirmed Validation Needs

- Customer search must support name and customer ID.
- Customer status must be either In gym or Not in gym.
- Customer active/inactive status must be valid.
- Customer package status must be active, inactive, expired, or frozen.
- Check-in should validate that the customer is not already checked in unless override is confirmed.
- Check-in should validate selected package time restrictions.
- Check-in should deduct only selected packages.
- Check-out must not deduct sessions.
- Manual session corrections require Save before storage.
- Remaining sessions should not go below zero unless admin allows it later.
- Manual occupancy corrections require Save before storage.
- Occupancy count should not become negative.
- Public occupancy thresholds must support green/yellow/red display.
- Public User Panel must not expose private customer data.

### Recommended Technical Validation

- Required fields should be validated before saving customer, package, coach, content, note, and settings records.
- Dates should be validated so expiration date is not earlier than activation date unless the client confirms special cases.
- Package price should be non-negative.
- Package session count should be non-negative.
- Occupancy thresholds should be logical, for example green limit lower than yellow limit.
- Check-in/check-out updates should run inside database transactions.
- Manual correction reason should be stored if the client requires reasons.

### Unclear Validation Rules

- Exact required customer fields.
- Exact customer ID format.
- Whether customer phone is required.
- Whether package names must be unique.
- Whether selected packages can deduct more than one session.
- Whether expired packages can be used with override.
- Whether zero-session packages can be used with override.
- Whether frozen packages can ever be overridden.
- Whether package time restrictions can have multiple time windows.
- Whether package time restrictions can depend on weekdays.
- Whether note content has a length limit.
- Whether manual correction reason is required.
- Whether manual occupancy correction reason is required.

---

## 11. Data Privacy and Safety Notes

Smartfit.am stores private operational data about gym customers, package usage, visits, notes, and staff actions. The following practical privacy and safety rules directly relate to the confirmed requirements:

- Public pages must never expose customer names, customer IDs, private package records, notes, logs, or visit history.
- Public occupancy should show only the current count and crowd status.
- Admin exports contain private operational data and must be admin-only.
- Logs should be visible only to admins.
- Reception staff should only access the operational data needed for daily check-in/check-out and corrections.
- Customer personal information should be limited to what the gym actually needs.
- Internal database IDs should not be used as public customer identifiers.
- Customer-facing IDs should use `customerCode` or another confirmed member identifier.
- Sensitive changes should be logged with actor and timestamp.
- Soft deletion should be considered for customers, packages, coaches, notes, and public content to avoid losing historical context accidentally.

No legal/privacy policy text is confirmed in the uploaded documents.

---

## 12. Seed Data Plan

Seed data should be safe, generic, and only used for local development/testing.

| Seed Data | Purpose | Confirmed / Optional |
|---|---|---|
| One admin staff user | Test Admin Panel access. | Optional development seed |
| One registration staff user | Test Registration Panel access. | Optional development seed |
| Basic GymSettings record | Allow public pages and occupancy thresholds to load. | Optional development seed |
| Sample coach profiles | Test coach management and public coach display. | Optional development seed |
| Sample package definitions | Test package management and check-in package selection. | Optional development seed |
| Sample customers | Test customer search, cards, and package assignments. | Optional development seed |
| Sample customer packages | Test multiple packages, remaining sessions, expiration, and statuses. | Optional development seed |
| Initial OccupancyState with count 0 | Test public occupancy display. | Optional development seed |
| Sample public content | Test homepage offers/news/announcements. | Optional development seed |
| Sample gallery images with placeholder URLs | Test Gallery only if Gallery is included. | Optional development seed |

Do not seed real client customer data unless the client provides approved import data.

---

## 13. Migration Notes

- Use Prisma migrations to manage schema changes in a controlled way.
- Keep local development migrations separate from production data operations.
- Review migrations carefully before applying them to production because the system stores customer, package, session, visit, and log history.
- Back up production data before major schema changes.
- Avoid destructive migrations for logs, visits, package history, and customer package records unless the client confirms the data can be removed.
- Add new optional fields before making them required if existing data may not have values.
- Any change to check-in/check-out or session deduction tables should be tested carefully because these workflows affect multiple records at once.

No implementation commands are included here because this document is still database planning, not a development phase or Codex prompt.

---

## 14. Database Questions / Unclear Points

1. What exact login method should be used for admin and registration staff?
2. Should staff users log in with username, email, phone number, or another identifier?
3. What exact role names should be used for admin and registration staff?
4. Can admin create and deactivate registration staff accounts?
5. What exact personal information fields are required for customer profiles?
6. What exact customer ID format should be used?
7. Should customers also have QR codes or membership card IDs?
8. Should customer phone number be required?
9. Should customer phone number be unique?
10. Should customers ever have login accounts?
11. Should coaches ever have login accounts?
12. Are coach contact details public or admin-only?
13. What exact package types exist at launch?
14. Should package types be hard-coded, admin-editable, or free text?
15. Should package names be unique?
16. Are package activation and expiration dates stored on the package definition, the customer package assignment, or both?
17. Should a customer package keep the original package price at the time of assignment?
18. Should package renewals create a new `CustomerPackage` record or update the existing one?
19. Should package history include old prices, old expiration dates, and old session counts?
20. Can one customer have two active packages of the same package definition at the same time?
21. Should remaining sessions ever be allowed to go below zero?
22. If admin override is allowed, should the database store override reason and approving admin?
23. Should check-in be allowed when all packages are expired?
24. Should check-in be allowed when the selected package has zero remaining sessions?
25. Should check-in be allowed when the selected package is frozen?
26. Should package time restriction support only “before a time” or full start/end time ranges?
27. Should package time restrictions support weekdays?
28. Should package time restrictions support multiple rules per package?
29. Should package freezing extend the expiration date?
30. Who can freeze/reactivate packages?
31. Should freeze/reactivation be stored as separate history records beyond `AuditLog`?
32. Should manual session corrections require a reason?
33. Should manual occupancy corrections require a reason?
34. Should manual occupancy corrections require admin password or only registration permission?
35. What should happen if check-out would make occupancy negative?
36. Should one customer be blocked from having more than one open visit?
37. Should open visits be automatically closed at the end of the day?
38. What defines an unusually long In gym duration?
39. Should historical occupancy trends be calculated from visits or stored as occupancy events/snapshots?
40. Should public occupancy update instantly, through polling, or only when the page refreshes?
41. Should occupancy update interval be stored in settings?
42. Should note deletion be allowed?
43. Should note deletion be soft delete or permanent delete?
44. Should note edits and deletions create separate audit logs?
45. What exact fields should public content include?
46. Should offers/news/promotions have images?
47. Should content have draft/published/expired/archived statuses?
48. Should promotion history be a separate table or derived from audit logs and content timestamps?
49. Should export history be stored?
50. What exact Excel exports are required for launch?
51. Should exports support date range filters?
52. Should exported files be stored permanently or generated on demand?
53. Should gallery be included in MVP or later?
54. Should image uploads be stored in the app, external storage, or as external URLs?
55. Should images have title/alt text/sort order fields?
56. What analytics must be stored as precomputed values, if any?
57. Should analytics be calculated live from visits/logs, or stored in aggregate tables later?
58. Should database backups follow a specific client policy?

---

## 15. Do Not Include Yet

Do not include the following database areas until they are confirmed by the client or later project documents:

- Customer account/login tables.
- Customer dashboard/session self-view tables.
- Coach account/login tables.
- Coach dashboard tables.
- Platform owner/master admin hierarchy.
- Multi-branch gym tables.
- Tenant/company tables for a SaaS version.
- Online payment tables.
- Ecommerce order and cart tables.
- Invoice/receipt tables.
- QR code scan event tables.
- Membership-card scan tables.
- External notification template tables.
- SMS/WhatsApp/email/push delivery logs.
- Native mobile device token tables.
- Loyalty/reward tables.
- Group class schedule tables.
- Group class registration tables.
- Group class waiting list tables.
- Group class attendance tables.
- Marketing campaign tables.
- Advanced revenue analytics tables.
- Predictive analytics tables.
- Any database model not directly supporting the confirmed public website, public occupancy page, Admin Panel, Registration Panel, customer/package/coach management, check-in/check-out, session tracking, occupancy tracking, notes, logs, exports, settings, or basic analytics.

---

## Final Database Summary

Smartfit.am needs a practical relational database focused on gym operations. The core schema should store customers, coaches, package definitions, customer package assignments, visits, selected package usage, session changes, occupancy state, occupancy events, notes, logs, public content, settings, and gallery/media references if Gallery is included.

The most important database design decision is separating package definitions from customer-owned packages. This allows one customer to have multiple packages at the same time, each with its own remaining sessions, expiration date, status, coach connection, and usage history.

The second most important design decision is preserving traceability. Check-ins, check-outs, session deductions, manual corrections, package freeze/reactivation, occupancy corrections, and important admin edits should create reliable records that the admin can review and export.

Unconfirmed areas should stay out of the schema until the client confirms them, especially customer logins, coach dashboards, QR check-in, payments, multi-branch support, notifications, and group class registration.
