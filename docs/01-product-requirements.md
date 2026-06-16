# Smartfit.am — Product Requirements

**Document path:** `docs/01-product-requirements.md`  
**Project:** Smartfit.am  
**Document type:** Product Requirements Document  
**Primary source:** Uploaded Smartfit.am website specification document  
**Purpose:** Long-term project knowledge for the ChatGPT Project knowledge base and later for the real project repository.

---

## 1. Project Overview

Smartfit.am is a gym website and gym management platform. It is not only an informational website. It must also work as an internal operational system for managing gym customers, packages, coaches, check-ins, check-outs, session usage, notes, logs, data exports, settings, and analytics.

The platform should support four main areas:

1. **Regular Public Website** — public-facing pages that present the gym, offers, coaches, packages, gallery, location, and contact information.
2. **User Panel / Mobile App Experience** — a public, no-login, mobile-first experience where gym customers can see the live gym occupancy count and quickly access useful gym information.
3. **Registration Panel** — an internal daily operations panel for reception staff to check customers in and out, adjust sessions, manage notes, and control the current occupancy count.
4. **Admin Panel** — a full management panel for the gym owner or administrator to manage content, customers, packages, coaches, settings, logs, exports, and analytics.

Smartfit.am solves two major problems for the gym:

- It gives visitors and customers a simple way to understand the gym, its packages, offers, coaches, location, and crowd level.
- It gives the gym team a structured system for tracking customer visits, package usage, coach sessions, operational notes, and business activity.

The system is useful for the gym because it reduces manual confusion around packages, remaining sessions, customer status, and daily occupancy. It also gives the admin better visibility into gym activity through logs, exports, and analytics.

The system is useful for customers because they can quickly check how crowded the gym is before visiting, find gym information from their phone, and add the Smartfit.am experience to their home screen without needing a separate App Store or Play Store application.

---

## 2. Target Users

### 2.1 Public Visitor

**Needs from the system:**  
A public visitor needs to understand what Smartfit.am offers, where the gym is located, what packages are available, who the coaches are, and how to contact the gym.

**Should be able to:**

- View the homepage.
- View gym information, offers, discounts, and announcements.
- View packages and prices.
- View coaches and their specialties.
- View gallery images.
- View contact details, working hours, and map links.
- Access the Our App / Add Our App page.
- View the public live occupancy count.

**Should not be able to access:**

- Customer profiles.
- Customer IDs.
- Package histories of individual members.
- Reception tools.
- Admin tools.
- Logs, notes, exports, or analytics.

### 2.2 Gym Customer / Member

**Needs from the system:**  
A gym customer needs a mobile-friendly way to see whether the gym is crowded and access contact/location information quickly.

**Should be able to:**

- View the live number of people currently inside the gym.
- Understand crowd status through color indicators: green, yellow, and red.
- Add Smartfit.am to their phone home screen using the website/PWA-style flow.
- See gym contact links such as phone, WhatsApp, Instagram, and location link if enabled by the admin.
- See a motivational message if enabled by the admin.

**Should not be able to access:**

- Private member records.
- Their own package/session data, unless a future customer account feature is confirmed.
- Other customers' data.
- Reception or admin panels.
- Internal notes, logs, or analytics.

**Assumption:** Customers do not need personal login accounts in the MVP because the uploaded specification defines the User Panel / Mobile App Experience as public and no-login.

### 2.3 Receptionist / Registration Staff

**Needs from the system:**  
Reception staff need a fast and simple panel for daily operations: finding customers, checking them in and out, selecting which packages are being used, correcting sessions, writing notes, and keeping the live occupancy count accurate.

**Should be able to:**

- Log in to the Registration Panel.
- Search customers by name or customer ID.
- View customer cards with status, packages, remaining sessions, expiry dates, and package status.
- Check customers in.
- Check customers out.
- Select which package or packages are used during a visit.
- Manually correct remaining package sessions using plus/minus controls.
- Save corrections.
- Freeze or reactivate customer packages if the gym allows this operationally.
- Create, read, update, and possibly delete notes, depending on permission.
- Manually increase or decrease the current occupancy count if correction is needed.

**Should not be able to access:**

- Full admin settings unless explicitly allowed.
- Full analytics and exports unless explicitly allowed.
- Editable logs.
- Website content management unless explicitly allowed.
- Financial or package setup management unless explicitly allowed.

### 2.4 Coach / Trainer

**Needs from the system:**  
The uploaded specification confirms that coaches must be managed by the admin and connected to packages/customers when personal training or coach-specific sessions are included.

**Should be able to:**

- Be represented in the system through a coach profile.
- Be assigned to customers or packages when relevant.
- Appear on public website coach pages if active.

**Should not be able to access:**

- Admin management tools unless a coach dashboard is later confirmed.
- Customer data beyond what is explicitly permitted.
- Reception operations unless the coach is also given staff permissions.

**Assumption:** A separate coach login/dashboard is not part of the MVP because the uploaded specification describes coach management, but does not define coach-facing panel requirements.

### 2.5 Gym Admin / Manager

**Needs from the system:**  
The admin or manager needs full control over gym operations, public content, customers, packages, coaches, settings, logs, data exports, and analytics.

**Should be able to:**

- Log in to the Admin Panel.
- Manage public website content, offers, promotions, discounts, news, and announcements.
- Manage customers.
- Manage packages.
- Manage coaches.
- View customer package overview tables.
- View customers requiring attention.
- View logs.
- Export data as Excel files.
- Manage settings.
- Configure occupancy color thresholds.
- Configure public app display settings.
- View analytics and popularity statistics.

**Should not be able to access:**

- Nothing major is restricted from the primary admin in the uploaded specification. Admin users are described as having full access.

### 2.6 Platform Owner / Master Admin

**Status:** Not confirmed for the MVP.

The uploaded specification describes a gym owner/admin, but does not clearly define a separate platform owner or multi-gym master admin. A platform owner/master admin should only be included if Smartfit.am later becomes a multi-tenant platform or if the client confirms that a higher-level owner role is needed.

---

## 3. Core Product Goals

1. **Present Smartfit.am professionally online**  
   The public website should clearly explain the gym, its packages, offers, coaches, gallery, location, and contact options.

2. **Make gym information easy to access on mobile**  
   The public user experience should be mobile-first and simple enough for customers to quickly check the gym status before visiting.

3. **Show live gym occupancy to customers**  
   Customers should be able to see the current number of people inside the gym, with clear green/yellow/red crowd status colors.

4. **Support an Add to Home Screen / PWA-style experience**  
   Customers should be able to add Smartfit.am to their phone home screen using the website, without requiring a separate native mobile app.

5. **Help reception staff manage daily gym entry and exit**  
   Receptionists should be able to search customers, check them in, check them out, select used packages, correct sessions, and update occupancy.

6. **Track customer package usage accurately**  
   The system should support customers with no active package, one active package, or multiple active packages at the same time.

7. **Support package-specific session deductions**  
   During check-in, only the selected package or packages should decrease. Coach sessions should decrease separately from general gym sessions when selected.

8. **Support package usage restrictions**  
   Packages may have optional time restrictions, such as being usable only before 3:00 PM.

9. **Give admins full control over gym data**  
   Admin users should manage customers, packages, coaches, website content, settings, logs, exports, and analytics.

10. **Keep important actions traceable**  
    Every important operational action should create a log entry visible to the admin.

11. **Provide basic business visibility**  
    The admin should be able to understand daily check-ins, peak hours, occupancy trends, most active customers, and package usage.

12. **Keep the first version practical and form-based**  
    The MVP should be simple, reliable, and focused on the real operational needs of Smartfit.am rather than unnecessary complexity.

---

## 4. Feature Requirements

### Public Website Pages

**Description:**  
Smartfit.am should include public website pages that present the gym clearly and professionally. The website should not be overcomplicated, but it must explain the gym, its offers, packages, coaches, gallery, contact information, and mobile app/live occupancy feature.

**Primary Users:**  
Public visitors, gym customers/members, gym admin/manager.

**Required Data:**

- Gym name.
- Logo.
- Gym description.
- About text.
- Coaches.
- Packages.
- Package prices.
- Session counts.
- Expiration rules.
- Included services.
- Gallery images.
- Phone number.
- WhatsApp link.
- Instagram link.
- Address.
- Working hours.
- Map link.
- Offers, discounts, and announcements.

**Main Actions:**

- Public visitors view website pages.
- Admin updates editable public content.
- Visitors navigate to contact, packages, coaches, and Our App sections.
- Visitors access the mobile live occupancy experience.

**Priority:** MVP.

**Notes / Assumptions:**  
Gallery is confirmed for the MVP. The public website must include a separate `/gallery` page showing gym photos, equipment, training areas, and atmosphere. Gallery images must be public-safe and must not expose private customer information unless the gym has permission to use those photos.

---

### Homepage Offers, News, and Announcements

**Description:**  
The homepage hero section should focus on current offers, promotions, discounts, news, and announcements. The admin should be able to update this content from the Admin Panel.

**Primary Users:**  
Public visitors, gym customers/members, gym admin/manager.

**Required Data:**

- Offer title.
- Offer description.
- Discount or promotion details.
- Start date.
- End date or expiration date, if relevant.
- Status: active, inactive, archived, renewed/reactivated.
- Images or banners, if used.

**Main Actions:**

- Admin creates offers and announcements.
- Admin updates existing offers.
- Admin renews/reactivates offers when needed.
- Admin deletes or archives public content where appropriate.
- Public visitors view active offers on the homepage.
- Admin reviews or exports offer history.

**Priority:** MVP.

**Notes / Assumptions:**  
The specification mentions offer and promotion history. The exact lifecycle of offers, such as draft/published/expired, should be confirmed with the client.

---

### Public Live Gym Monitor

**Description:**  
The public live gym monitor should show the current number of people inside the gym. The count should be easy to read on mobile screens and should use color indicators to show crowd level.

**Primary Users:**  
Gym customers/members, public visitors, reception staff, gym admin/manager.

**Required Data:**

- Current occupancy count.
- Low crowd threshold.
- Medium crowd threshold.
- Crowded threshold.
- Display color rules: green, yellow, red.
- Public app visibility settings.

**Main Actions:**

- Customers view the current occupancy count.
- The system updates the count automatically when reception checks customers in or out.
- Reception manually corrects the count when needed.
- Admin configures the green/yellow/red thresholds in Settings.

**Priority:** MVP.

**Notes / Assumptions:**  
The public page must not show customer names, IDs, packages, or private information. The live update behavior is not fully confirmed. It may refresh instantly, every few seconds, or only on page refresh depending on the technical and client decision.

---

### Add Our App / Mobile App-Like Experience

**Description:**  
Smartfit.am should include an Add Our App or Our App section. This section should explain how customers can add the website to their phone home screen, similar to the iPhone flow: Share -> More -> Add to Home Screen. The installed icon should use the Smartfit.am logo.

**Primary Users:**  
Gym customers/members, public visitors, gym admin/manager.

**Required Data:**

- Smartfit.am logo.
- App icon.
- App name.
- Installation instructions.
- Motivational text, if enabled.
- Contact links, if enabled.
- Location link, if enabled.

**Main Actions:**

- User opens the Our App page.
- User reads installation instructions.
- User adds the website to their phone home screen.
- User later opens the website like a simple mobile app.
- Admin controls which public links/content are visible.

**Priority:** MVP.

**Notes / Assumptions:**  
This should behave like a simple progressive web app experience, but a separate App Store or Play Store application is not required for the MVP.

---

### Public App Content Settings

**Description:**  
The admin should control what appears on the public app/mobile page. The page may show the Smartfit.am logo, motivational message, phone number, WhatsApp link, Instagram link, and location link.

**Primary Users:**  
Gym admin/manager, public visitors, gym customers/members.

**Required Data:**

- Logo.
- Motivational message.
- Phone number.
- WhatsApp link.
- Instagram link.
- Location link.
- Visibility toggles for each item.

**Main Actions:**

- Admin chooses which items are visible on the public app page.
- Admin updates public app content.
- Customers view only the enabled content.

**Priority:** MVP.

**Notes / Assumptions:**  
The final list of visible items should be confirmed with the client. The source document specifically mentions Instagram, phone number, WhatsApp, motivational text, and other links.

---

### Customer / Member Management

**Description:**  
The admin should be able to create, view, update, renew/reactivate, and delete customer profiles. Each customer profile should contain operational information needed for package tracking and gym access.

**Primary Users:**  
Gym admin/manager, receptionist/registration staff.

**Required Data:**

- Customer name.
- Customer ID.
- Personal information.
- Active/inactive status.
- Assigned coach, if applicable.
- Current gym status: In gym or Not in gym.
- Package history.
- Active packages.
- Inactive packages.
- Remaining sessions.
- Expiration dates.
- Notes.

**Main Actions:**

- Admin creates customer profiles.
- Admin views customer details.
- Admin updates customer details.
- Admin renews/reactivates customers where needed.
- Admin deletes customer profiles where appropriate.
- Admin searches and filters customers.
- Receptionist searches customer records for daily operations.

**Priority:** MVP.

The exact customer personal fields and customer ID format will be provided from official project files or client source data. Codex must not invent these fields. If the official customer field list is not available by implementation time, Phase 8 should stop and report the blocker instead of guessing.

---

### Package / Membership Management

**Description:**  
The admin should be able to create, view, update, renew/reactivate, and delete gym packages. Packages are central to the system because they define session counts, prices, access types, coaches, activation dates, expiration dates, and possible time restrictions.

**Primary Users:**  
Gym admin/manager, receptionist/registration staff.

**Required Data:**

- Package name.
- Price.
- Number of sessions.
- Package type.
- Assigned coach, if required.
- Activation date.
- Expiration date.
- Active/inactive status.
- Frozen status, if applicable.
- Optional time restriction.
- Customer assignment.

**Main Actions:**

- Admin creates packages.
- Admin edits package details.
- Admin renews/reactivates packages.
- Admin deletes or archives packages where appropriate.
- Admin assigns packages to customers.
- Receptionist sees package cards during daily operations.
- Receptionist selects which packages are used during check-in.

**Priority:** MVP.

**Notes / Assumptions:**  
The system must support customers with no active package, one active package, or multiple active packages at the same time. Package types may include general gym access, coach sessions, pool access, group training, or other services the gym may add later.

---

### Package Time Restrictions

**Description:**  
Packages may optionally have usage restrictions based on time. For example, a morning package may only allow check-in before 3:00 PM. During check-in, the system must verify whether the selected package can be used at the current time.

**Primary Users:**  
Gym admin/manager, receptionist/registration staff.

**Required Data:**

- Package time rule type: all day or restricted.
- Allowed start time, if needed.
- Allowed end time, if needed.
- Example restriction text.
- Admin override setting, if allowed.

**Main Actions:**

- Admin defines whether a package is available all day or only during a specific time range.
- Receptionist selects the package during check-in.
- System compares the current time with the package's allowed time.
- System allows check-in if the package is valid at that time.
- System warns the receptionist if the package is not valid at that time.
- System prevents deduction unless the check-in is allowed or approved.

**Priority:** MVP.

**Notes / Assumptions:**  
The source document gives the example of a package usable only before 3:00 PM. It is unclear whether restrictions can also include after a certain time, between two times, specific days, weekends, or holidays. This should be confirmed with the client.

---

### Coach / Trainer Management

**Description:**  
The admin should be able to manage coach profiles. Coaches may be connected to packages and customers when a package includes personal training or coach-specific sessions.

**Primary Users:**  
Gym admin/manager, public visitors, receptionist/registration staff.

**Required Data:**

- Coach name.
- Coach surname.
- Photo.
- Specialty.
- Short description, if shown publicly.
- Contact information, if needed.
- Active/inactive status.
- Connected packages.
- Connected customers.

**Main Actions:**

- Admin creates coach profiles.
- Admin updates coach profiles.
- Admin renews/reactivates coach profiles if needed.
- Admin deletes coach profiles where appropriate.
- Admin connects coaches to packages and customers.
- Public visitors view active coaches on the website.
- Receptionist sees coach-related package sessions when relevant.

**Priority:** MVP.

**Notes / Assumptions:**  
A separate coach login is not confirmed. Coach profiles are required, but coach dashboards should be treated as a future feature unless confirmed.

---

### Customer Package Overview Table

**Description:**  
The Admin Panel should include an overview table showing every customer and their current package situation. This table helps the admin quickly understand operational status across all members.

**Primary Users:**  
Gym admin/manager.

**Required Data:**

- Customer name.
- Customer ID.
- Current gym status: In gym or Not in gym.
- Active package or packages.
- Assigned coach, if any.
- Package activation date.
- Package expiration date.
- Remaining sessions for each package.
- Package status: active, inactive, expired, or frozen.

**Main Actions:**

- Admin views all customers in one table.
- Admin filters or searches the overview.
- Admin checks package status and remaining sessions.
- Admin identifies customers requiring attention.

**Priority:** MVP.

**Notes / Assumptions:**  
The table should be designed to handle multiple packages per customer without becoming confusing.

---

### Customer Status and Alerts

**Description:**  
The Admin Panel should include a section for customers who require attention. This helps the gym team find problems before they become operational issues.

**Primary Users:**  
Gym admin/manager.

**Required Data:**

- Customer status.
- Package expiration date.
- Remaining sessions.
- Missing customer fields.
- Package status.
- Last check-in time.
- Current In gym duration, if the long-stay rule is added later.

**Main Actions:**

- Admin views customers with expired packages.
- Admin views customers with zero remaining sessions.
- Admin views customers whose package will expire soon.
- Admin views customers with missing or incomplete data.
- Admin may later view customers still marked as In gym after an unusually long period.

**Priority:** Later.

**Notes / Assumptions:**  
Expired packages and zero-session packages are important and should be visible in the MVP through customer/package views. A dedicated alert center can be built after the core workflow is stable.

---

### Registration Panel Customer Search

**Description:**  
Receptionists should be able to search for customers by name or customer ID. Search results should make it easy to identify the correct customer quickly.

**Primary Users:**  
Receptionist/registration staff.

**Required Data:**

- Customer name.
- Customer ID.
- Current status.
- Active/inactive status.
- Package summary.

**Main Actions:**

- Receptionist enters a name or customer ID.
- System returns matching customers.
- Receptionist selects the correct customer.
- Receptionist opens the customer card.

**Priority:** MVP.

**Notes / Assumptions:**  
Search should be fast and simple because it is used during live reception operations.

---

### Registration Panel Customer Card

**Description:**  
The customer card should clearly show all information needed at reception, including customer identity, gym status, packages, remaining sessions, expiry dates, and package statuses.

**Primary Users:**  
Receptionist/registration staff.

**Required Data:**

- Customer name.
- Customer ID.
- Status badge: In gym or Not in gym.
- Active packages.
- Inactive packages, depending on filter.
- Remaining sessions for each package.
- Expiry date for each package.
- Package status: active, inactive, expired, or frozen.
- Time rule for each package.

**Main Actions:**

- Receptionist views customer details.
- Receptionist sees whether the customer is currently inside the gym.
- Receptionist checks remaining sessions.
- Receptionist checks package expiration and status.
- Receptionist selects packages during check-in.
- Receptionist corrects sessions when needed.

**Priority:** MVP.

**Notes / Assumptions:**  
The card design must work for customers with no active package, one package, or four to five active packages at the same time.

---

### Customer Status Badge

**Description:**  
Each customer should have a clear status badge next to their name showing whether they are currently in the gym.

**Primary Users:**  
Receptionist/registration staff, gym admin/manager.

**Required Data:**

- Customer current gym status.
- Last check-in time.
- Last check-out time.

**Main Actions:**

- System shows Not in gym when the customer is outside.
- System shows In gym after the customer is checked in.
- System returns to Not in gym after check-out.
- Admin and receptionist can identify current presence quickly.

**Priority:** MVP.

**Notes / Assumptions:**  
A customer should not be checked in twice at the same time unless the admin later allows an override.

---

### Check-In Workflow

**Description:**  
When a customer enters the gym, the receptionist clicks Check in. Before confirming, the receptionist should select which package or packages are being used for that visit. The system then updates the customer's gym status, deducts selected sessions, increases live occupancy, and saves logs.

**Primary Users:**  
Receptionist/registration staff, gym admin/manager.

**Required Data:**

- Customer ID.
- Current customer status.
- Selected package or packages.
- Remaining sessions for selected packages.
- Package time restrictions.
- Assigned coach, if applicable.
- Current date and time.
- Current occupancy count.

**Main Actions:**

- Receptionist opens the customer card.
- Receptionist clicks Check in.
- Receptionist selects the package or packages used for the visit.
- System validates package availability and time restrictions.
- System changes customer status from Not in gym to In gym.
- System deducts one session from each selected package.
- System increases live occupancy by 1.
- System creates log entries for check-in and session deductions.

**Priority:** MVP.

**Notes / Assumptions:**  
If a customer trains with a coach, the general gym package and coach package may both decrease if both are selected. Other packages, such as pool access, should not decrease unless selected for that visit.

---

### Check-Out Workflow

**Description:**  
When a customer leaves the gym, the receptionist clicks Check out. Check-out changes the customer's status and decreases the live occupancy count, but does not deduct any sessions.

**Primary Users:**  
Receptionist/registration staff, gym admin/manager.

**Required Data:**

- Customer ID.
- Current customer status.
- Current date and time.
- Current occupancy count.

**Main Actions:**

- Receptionist opens the customer card.
- Receptionist clicks Check out.
- System changes customer status from In gym to Not in gym.
- System records exit time.
- System decreases live occupancy by 1.
- System creates a check-out log entry.

**Priority:** MVP.

**Notes / Assumptions:**  
No sessions should be deducted during check-out.

---

### Manual Session Corrections

**Description:**  
Reception staff should be able to manually correct remaining sessions for each customer package using plus and minus buttons. Changes should only be stored after clicking Save.

**Primary Users:**  
Receptionist/registration staff, gym admin/manager.

**Required Data:**

- Customer package.
- Current remaining sessions.
- New remaining sessions.
- Staff user making the correction.
- Date and time.
- Reason for correction, if added.

**Main Actions:**

- Receptionist increases or decreases remaining sessions.
- Receptionist clicks Save.
- System stores the correction.
- System creates a log entry visible to the admin.
- System prevents remaining sessions from going below zero unless admin override is later allowed.

**Priority:** MVP.

**Notes / Assumptions:**
Manual session corrections do not require admin approval or a correction reason in the MVP. Reception staff can adjust remaining sessions with plus/minus controls, but the change is stored only after clicking Save. Every saved correction must create an admin-visible log entry. Remaining sessions must not go below zero unless a future rule confirms an override.


---

### Package Display Rules

**Description:**  
The Registration Panel must display package information clearly across different customer situations.

**Primary Users:**  
Receptionist/registration staff, gym admin/manager.

**Required Data:**

- Customer packages.
- Package status.
- Remaining sessions.
- Expiry date.
- Time rule.
- Setting for hiding inactive customers/packages from receptionist view.

**Main Actions:**

- System displays no active package state.
- System displays one-package customers clearly.
- System displays customers with four to five active packages clearly.
- Receptionist sees package name, remaining sessions, expiry date, status, and time rule.
- Inactive packages can be hidden if the admin setting is enabled.

**Priority:** MVP.

**Notes / Assumptions:**  
The interface should remain usable on desktop, tablet, and mobile-sized screens, because the uploaded specification includes examples for different screen layouts.

---

### Freezing and Reactivating Packages

**Description:**  
Admin/manager users can freeze and reactivate customer packages. Registration users can do so only when the Admin setting allows it. A frozen package cannot be used during check-in or session deduction. Every freeze and reactivation action must create an admin-visible log entry. The approved advanced workflow tracks planned and actual frozen days and recalculates expiration accordingly.

**Primary Users:**  
Receptionist/registration staff, gym admin/manager.

**Required Data:**

- Package status.
- Freeze date.
- Reactivation date.
- Customer ID.
- Staff user performing the action.
- Expiration date.
- Rule for whether freezing extends expiration.

**Main Actions:**

- Receptionist freezes a package if permitted.
- System prevents frozen packages from being used for check-in session deductions.
- Receptionist or admin reactivates/renews a package.
- System logs freeze, reactivation, and renewal actions.

**Priority:** MVP.

**Notes / Assumptions:**
The manually approved post-Phase 29 scope supersedes the earlier MVP-only permission and expiration assumptions during Phases 37-39. Registration freeze access becomes setting-controlled, and advanced freezes use explicit records, remaining chances, and expiration recalculation.


---

### Notes Section

**Description:**  
The Registration Panel should include a notes section for operational reminders, customer-specific details, or internal communication. Notes should be sorted by date, with the newest notes easiest to find.

**Primary Users:**  
Receptionist/registration staff, gym admin/manager.

**Required Data:**

- Note content.
- Related customer, if customer-specific.
- Author.
- Created date/time.
- Updated date/time.
- Permission level for create/read/update/delete.

**Main Actions:**

- Receptionist creates notes if permitted.
- Receptionist reads notes.
- Receptionist edits notes if permitted.
- Receptionist deletes notes if permitted.
- Admin views notes.
- Admin exports notes if needed.

**Priority:** MVP for basic notes; Later for advanced permissions.

**Notes / Assumptions:**  
The client must confirm whether reception staff can delete notes or only create/edit them.

---

### Manual Occupancy Count Corrections

**Description:**  
The live number of people currently inside the gym should mainly be automated through check-in and check-out actions. Reception staff should also be able to manually increase or decrease the count if a correction is needed.

**Primary Users:**  
Receptionist/registration staff, gym admin/manager, public users indirectly.

**Required Data:**

- Current occupancy count.
- New corrected count.
- Staff user making the correction.
- Date and time.
- Correction reason, if added.

**Main Actions:**

- Receptionist manually increases occupancy count.
- Receptionist manually decreases occupancy count.
- Receptionist clicks Save.
- System updates the public live count.
- System creates a log entry visible to the admin.

**Priority:** MVP.

**Notes / Assumptions:**
Manual occupancy corrections do not require admin approval, admin password, or a correction reason in the MVP. Reception staff can manually increase or decrease the current occupancy count, but the change is stored only after clicking Save. Every saved correction must create an admin-visible log entry. The occupancy count must not go below zero.


---

### Gym Logs / Audit Trail

**Description:**  
The system should keep logs of important gym actions. Logs should be visible only to the admin and should not be editable by reception staff.

**Primary Users:**  
Gym admin/manager.

**Required Data:**

- Log action type.
- Related customer, package, coach, offer, or setting.
- Old value, if relevant.
- New value, if relevant.
- Staff/admin user responsible.
- Date and time.

**Main Actions:**

- System logs check-ins.
- System logs selected session deductions.
- System logs check-outs.
- System logs manual session corrections.
- System logs manual occupancy corrections.
- System logs package freezes, renewals, and reactivations.
- System logs important admin edits, such as package price updates.
- Admin reviews logs.

**Priority:** MVP.

**Notes / Assumptions:**  
Logs should be protected from normal editing. The retention period and whether logs can be exported or archived should be confirmed.

---

### Data Export Section

**Description:**  
The Admin Panel should include a Data section where important information can be exported as Excel files.

**Primary Users:**  
Gym admin/manager.

**Required Data:**

- Customers.
- Packages.
- Coaches.
- Customer package history.
- Check-in and check-out logs.
- Promotion and offer history.
- Notes, if admin wants a record outside the system.

**Main Actions:**

- Admin selects export type.
- System generates Excel file.
- Admin downloads exported data.

**Priority:** MVP for basic exports; Later for advanced filtered exports.

**Notes / Assumptions:**  
The first version can include basic Excel exports for the most important records. Advanced filters, date ranges, and scheduled reports can come later.

---

### Admin Settings

**Description:**  
The Admin Panel should include settings for general system and gym information. Settings should control both public website information and operational rules.

**Primary Users:**  
Gym admin/manager.

**Required Data:**

- Gym name.
- Logo.
- Contact number.
- WhatsApp link.
- Instagram link.
- Address.
- Google Maps or Yandex Maps location link.
- Working days.
- Working hours.
- Occupancy color thresholds.
- Public app display settings.
- Setting for hiding inactive customers from registration staff view.

**Main Actions:**

- Admin updates gym identity and contact data.
- Admin updates map/location links.
- Admin updates working hours.
- Admin configures occupancy threshold colors.
- Admin controls public app visible content.
- Admin controls whether inactive customers are hidden from reception view.

**Priority:** MVP.

**Notes / Assumptions:**  
The settings list can expand later, but the first version should include the settings explicitly mentioned in the uploaded specification.

---

### Analytics / Popularity Dashboard

**Description:**  
The Admin Panel should include analytics that help the gym understand usage, activity, and popularity.

**Primary Users:**  
Gym admin/manager.

**Required Data:**

- Check-in records.
- Check-out records.
- Session deduction records.
- Customer package usage.
- Coach session usage.
- Occupancy counts over time.
- Customer activity history.

**Main Actions:**

- Admin views peak gym hours.
- Admin views average time customers spend in the gym.
- Admin views daily, weekly, and monthly check-ins.
- Admin views most active customers.
- Admin views most used package types.
- Admin views coach-related session usage.
- Admin views current and historical occupancy trends.

**Priority:** MVP for basic analytics; Later for advanced analytics.

**Notes / Assumptions:**  
The recommended MVP includes basic analytics: daily check-ins, current occupancy, and peak hours. More detailed analytics can come after the operational workflow is stable.

---

### Group Training / Group Exercise Support

**Description:**  
The uploaded specification mentions group training as an example package type. It does not fully define group exercise registration, class capacity, schedules, attendance lists, or customer self-registration.

**Primary Users:**  
Gym admin/manager, receptionist/registration staff, customers if expanded later.

**Required Data:**

- Group training package type.
- Sessions included.
- Expiration rules.
- Assigned coach, if relevant.
- Class schedule, if registration is added later.
- Capacity, if registration is added later.

**Main Actions:**

- Admin creates group training as a package type.
- Receptionist selects group training package during check-in if used.
- Optional future feature: customers register for group classes.

**Priority:** Future for customer-facing registration; MVP/Later only as package type if needed.

**Notes / Assumptions:**  
Group exercise registration should not be treated as confirmed MVP scope unless the client confirms class schedules, capacity rules, and registration workflow.

---

### Notifications

**Description:**  
The uploaded specification does not define SMS, WhatsApp, email, or push notifications as confirmed requirements. However, customer status alerts inside the Admin Panel are confirmed as useful operational visibility.

**Primary Users:**  
Gym admin/manager, receptionist/registration staff, customers if external notifications are added later.

**Required Data:**

- Alert type.
- Customer or package trigger.
- Recipient, if external notification is added later.
- Message template, if external notification is added later.

**Main Actions:**

- MVP: Admin views on-screen customer/package attention lists.
- Optional future feature: System sends SMS, WhatsApp, email, or push notifications.

**Priority:** Future for external notifications.

**Notes / Assumptions:**  
Do not include external notification sending in the MVP unless the client confirms it.

---

## 4A. Manually Approved Post-Phase 29 Expansion Requirements

The project owner manually approved the following scope for documentation and future implementation. Phase 30 is documentation-only. Implementation starts in Phase 31 and proceeds sequentially through Phase 41.

### 4A.1 Public and Admin Analytics Expansion

The public `/our-app` page may show privacy-safe aggregate analytics below the existing occupancy experience when an admin-controlled visibility setting is enabled.

Approved aggregate metrics:

- Current occupancy.
- Today's check-in count.
- Hourly check-ins.
- Weekly check-in trend.
- Weekly peak hours.
- Historical occupancy only when the source data can be derived safely and consistently.

Public analytics must not expose customer names, identifiers, package assignments, individual visits, or any other personal data. The presentation must be responsive, should prefer simple bar-chart or existing chart patterns, and must be hidden when the dedicated public-analytics setting is disabled.

The admin analytics experience may expose the same operational metrics without the public visibility restriction. Historical metrics must not be presented unless the implementation has a reliable data source and clearly defined aggregation rules.

### 4A.2 Package Category Management

Package categories become the primary public grouping and filtering system. Existing package `type` data must be preserved or migrated carefully until compatibility is confirmed.

Approved category capabilities:

- Many-to-many relationship between packages and categories.
- Admin create, edit, delete/archive, reorder, and public-visibility controls.
- Dedicated `/admin/categories` management page.
- Hidden categories do not appear publicly.
- A package assigned to any hidden category is hidden from public package listings.
- Hidden categories and affected packages remain visible to authorized admin users.
- Services continue to use the existing package model.

### 4A.3 Public Package Filtering and Sorting

The public packages page must show active, publicly eligible packages only.

Approved controls:

- Category filter.
- Minimum and maximum price filters.
- Price ascending and descending sorts.
- Name sort.

Controls appear above the list on mobile and in a sidebar on desktop. The page must not expose customer package data or admin-only package metadata.

### 4A.4 Admin Customer Documents

Authorized admin users may upload, list, open, download, delete, or archive documents on a customer record. Accepted file types are PDF, JPG, JPEG, and PNG, with a maximum size of 10 MB per file. Material document actions require audit logs.

Customer documents are strictly admin-only. Registration users and public visitors must not receive document metadata, URLs, file contents, or storage access.

Production-safe document storage is not yet confirmed. Before implementation, Codex must inspect existing storage patterns and configuration. If no production-safe storage approach exists, implementation must stop at the storage boundary and report the blocker instead of inventing a local-only production solution. Local/demo storage is allowed only when clearly labeled, isolated from production assumptions, and safe for the current deployment setup.

### 4A.5 Customer Visit History

The admin customer detail page may show:

- Latest three visits.
- Check-in and check-out timestamps.
- Visit duration when derivable.
- Guest count when already stored.
- Packages used when existing data supports the relationship.
- A "View all" path when it can be added without unnecessary complexity.

Visit-history export is postponed and is not part of this approved expansion.

### 4A.6 Advanced Package Freezing

Advanced freezing requires a separate `PackageFreeze` record for every confirmed freeze.

Business rules:

- Packages default to three freeze chances.
- Each customer package receives its own remaining freeze-chance value when assigned.
- Each confirmed freeze decrements the assignment's remaining chances.
- Freezing is blocked at zero remaining chances unless an admin explicitly edits the assignment.
- Freeze chances do not reset automatically.
- A normal freeze starts from the current eligible date.
- A normal freeze accepts requested/planned days and calculates the planned adjusted expiration.
- A retroactive freeze starts from the latest valid checkout when available, calculates the elapsed days through today, and uses those days for the confirmed extension.
- Early reactivation recalculates expiration as the original expiration plus actual frozen days.
- Freeze creation, counter updates, status changes, and expiration recalculation must be transaction-safe.
- Material freeze actions and administrative overrides require audit logs.

Planned freeze data includes the customer package, requested/planned days, actual frozen days, start date, planned end date, reactivated/actual end date, mode, status, original expiration, adjusted expiration, creator, reactivating user, timestamps, and optional administrative notes.

### 4A.7 Registration Freeze Permission

`allowRegistrationPackageFreeze` is an admin-controlled setting that defaults to `false`.

- Admin users retain freeze access.
- Registration users see no freeze action while disabled.
- Server-side authorization must reject registration freeze attempts while disabled.
- A read-only explanation may be shown when useful.
- Enabling the setting allows Registration users to use the approved freeze workflow under the same package validation rules.

### 4A.8 Homepage Redesign

The homepage expansion includes:

- A CSS-first 3D offer carousel.
- Replacement of the current homepage hero with that offer carousel.
- Automatic rotation and manual controls.
- Responsive rectangular cards.
- Active-offer images when available and a stable fallback when absent.
- Default fallback slides when there are no active offers.
- Large section-navigation buttons.
- Stronger emphasis on the Our App section.
- Brief section previews and links.
- Smooth section scrolling where appropriate.
- A scroll-to-top control.

No new carousel or animation dependency may be added without project-owner approval.

---

## 5. MVP Scope

The MVP should focus on the first realistic working version for the client. It should include the core public website, core admin management, core reception workflow, live occupancy, basic logs, basic exports, and basic analytics.

| Feature | Why It Is Needed | User Role |
|---|---|---|
| Public website pages: Home, About Us, Coaches, Packages, Contact, Our App | Lets visitors understand the gym, offers, coaches, packages, location, and app/live occupancy feature | Public visitor, customer, admin |
| Homepage offers/news/announcements | The homepage hero should show current offers and announcements | Public visitor, customer, admin |
| Admin login and Admin Panel basics | The gym needs a protected area for full management | Admin/manager |
| Customer management | Customers are the core records used for packages, status, and visits | Admin/manager, receptionist |
| Package/membership management | Packages control prices, sessions, expiration, and access rules | Admin/manager, receptionist |
| Package time restrictions | Some packages may only be usable before a specific time, such as before 3:00 PM | Admin/manager, receptionist |
| Coach management | Coaches must be connected to packages/customers and shown publicly if active | Admin/manager, public visitor |
| Customer package overview table | Admin needs a clear operational view of customers and their packages | Admin/manager |
| Registration Panel customer search | Reception must quickly find customers by name or ID | Receptionist |
| Reception customer card | Reception needs to see customer status, packages, sessions, expiry dates, and package status | Receptionist |
| Check-in workflow | Check-in changes customer status, deducts selected sessions, increases occupancy, and creates logs | Receptionist |
| Check-out workflow | Check-out changes customer status, records exit time, decreases occupancy, and creates logs | Receptionist |
| Manual session corrections | Reception needs a way to correct mistakes with plus/minus controls | Receptionist, admin |
| Manual occupancy corrections | Reception must be able to fix the live count when needed | Receptionist, admin |
| Public live gym monitor | Customers need to know how crowded the gym is before visiting | Customer, public visitor |
| Add Our App / Our App page | Customers need a simple app-like mobile experience without a native app | Customer, public visitor |
| Public app display settings | Admin must control what contact links and text appear publicly | Admin/manager |
| Basic notes | Reception needs internal operational notes connected to customers or daily work | Receptionist, admin |
| Gym logs | Important actions must be traceable and visible to admin | Admin/manager |
| Basic Excel export | Admin needs offline records of important data | Admin/manager |
| Basic analytics: daily check-ins, current occupancy, peak hours | Admin needs initial visibility into gym activity | Admin/manager |
| Admin settings | Admin needs to update gym information, working hours, thresholds, and public app visibility | Admin/manager |

---

## 6. Later Scope

These features are useful, but can come after the MVP if time, budget, or client priority requires a smaller first launch.

| Feature | Reason to Delay |
|---|---|
| Gallery management | Gallery is useful for the public website, but can be delayed if content/images are not ready for launch |
| Advanced customer status alerts | Expired and zero-session states should appear in MVP, but a dedicated alert center can come later |
| Full package freezing rules | Freezing is mentioned, but rules such as expiration extension need client confirmation |
| Advanced note permissions | Basic notes can exist first; detailed create/edit/delete permission rules can be refined later |
| Advanced exports with filters/date ranges | Basic Excel export is enough for MVP; advanced filtering can be added later |
| Advanced analytics dashboard | Daily check-ins, current occupancy, and peak hours can launch first; deeper trends and comparisons can come later |
| Historical occupancy trends | Requires enough historical data and reporting logic, so it is better after live occupancy is stable |
| Most active customers analytics | Useful, but not required for first operational launch |
| Most used package type analytics | Useful for management decisions, but can follow after package tracking works correctly |
| Coach-related session analytics | Useful after coach package tracking is stable |
| Public offer/promotion archive | Admin should retain offer history, but public archive display is not required unless requested |
| More detailed content lifecycle | Draft, publish, expire, archive, and renew states can be refined later |

---

## 7. Future / Optional Enhancements

The following ideas should remain separate from confirmed MVP requirements. They may be useful for Smartfit.am in the future, but should only be built if the client confirms them.

- **Optional future feature:** Customer login accounts where members can view their own packages, remaining sessions, expiration dates, and visit history.
- **Optional future feature:** QR code check-in using a membership card or mobile QR code.
- **Optional future feature:** Unique membership cards connected to customer IDs.
- **Optional future feature:** Online payments for packages.
- **Optional future feature:** Ecommerce-style package purchase or renewal flow.
- **Optional future feature:** SMS, WhatsApp, email, or push notifications for expiring packages, offers, reminders, or check-in events.
- **Optional future feature:** Native mobile app for iOS/Android.
- **Optional future feature:** Group exercise registration with class schedules, capacity limits, waiting lists, and attendance tracking.
- **Optional future feature:** Coach dashboard for trainers to view assigned customers and sessions.
- **Optional future feature:** Multi-branch support if Smartfit.am expands to multiple gym locations.
- **Optional future feature:** Advanced analytics, including retention, revenue estimates, package conversion, customer segmentation, and long-term attendance trends.
- **Optional future feature:** Loyalty or rewards system.
- **Optional future feature:** Automated long-stay alerts for customers still marked as In gym after an unusually long period.
- **Optional future feature:** Admin override approval flow for restricted packages or zero-session check-ins.

---

## 8. Business Rules

### 8.1 Access and Permissions

- Admin users have full access to public content management, customers, packages, coaches, settings, logs, exports, and analytics.
- Registration users have limited daily-operation access.
- Reception staff should not edit protected logs.
- Reception staff should not access full admin settings unless explicitly allowed.
- The public user panel must not reveal private customer data.

### 8.2 Customer Status

- Each customer has a current gym status: **In gym** or **Not in gym**.
- A customer marked **Not in gym** is currently outside the gym.
- A customer marked **In gym** has checked in and is currently inside the gym.
- A customer should not be checked in twice at the same time unless an admin override is later allowed.

### 8.3 Check-In Rules

- Check-in is performed by the receptionist.
- Before confirming check-in, the receptionist selects which package or packages are being used.
- The customer status changes from **Not in gym** to **In gym**.
- The selected general gym package decreases by 1 session if used.
- The selected coach package decreases by 1 session if the customer uses a coach session that day.
- Other packages do not decrease unless selected.
- Live occupancy increases by 1 after a successful check-in.
- A log entry is created for the check-in and all session deductions.

### 8.4 Check-Out Rules

- Check-out is performed by the receptionist.
- The customer status changes from **In gym** to **Not in gym**.
- No package sessions are deducted during check-out.
- Check-out records the exit time.
- Live occupancy decreases by 1 after check-out.
- A log entry is created for the check-out.

### 8.5 Package Session Rules

- A customer can have no active package, one active package, or multiple active packages.
- Each package has its own remaining session count.
- Only selected packages decrease during check-in.
- Remaining sessions should not go below zero unless the admin specifically allows this later.
- Expired packages and zero-session packages should be clearly marked.
- Frozen packages should not be treated as active for session usage.

### 8.6 Package Time Restriction Rules

- Packages may be available all day or only during a specific time range.
- During check-in, the system must validate the selected package against the current time.
- If the package has no time restriction, check-in can continue normally.
- If the package has a time restriction and the current time is allowed, check-in can continue normally.
- If the package has a time restriction and the current time is not allowed, the system should warn the receptionist.
- The restricted package should not be used and sessions should not be deducted unless admin override is allowed.

**Assumption:** The MVP should support at least a simple “available all day” or “usable before a specific time” rule because the uploaded specification gives the example of a package usable only before 3:00 PM.

### 8.7 Manual Correction Rules

- Reception staff can manually adjust remaining sessions using plus/minus controls.
- Manual changes require clicking Save before they are stored.
- Every saved manual correction creates a log entry visible to the admin.
- Reception staff can manually increase or decrease occupancy count when correction is needed.
- Manual occupancy changes require Save and create a log entry visible to the admin.

### 8.8 Logs

- Every check-in, check-out, session deduction, manual correction, freeze, renewal, reactivation, and important edit should create a log entry.
- Logs are visible to the admin.
- Logs should not be editable by reception staff.
- Logs should protect the gym from confusion by showing who changed what and when.

### 8.9 Occupancy Rules

- Live occupancy is mainly controlled by check-in and check-out events.
- Check-in increases occupancy by 1.
- Check-out decreases occupancy by 1.
- Manual corrections can change occupancy when needed.
- The public live gym monitor uses the current occupancy count.
- The public occupancy count color is based on admin-defined thresholds: green, yellow, and red.

### 8.10 Public Privacy Rules

- The public user panel can show the live occupancy count and general gym information.
- The public user panel must not show customer names.
- The public user panel must not show customer IDs.
- The public user panel must not show package details of individual members.
- The public user panel must not show internal notes, logs, private analytics, or customer-level analytics.
- Public pages must not expose customer documents, individual visit rows, export data, analytics source rows, or staff account data.
- Privacy-safe aggregate analytics may appear only when the dedicated admin visibility setting is enabled.

### 8.11 Package Freezing Rules

- Frozen packages should not be used for session deductions.
- Freezing, reactivation, and renewal should be logged.
- **Assumption:** Whether freezing extends the expiration date is not confirmed and must be decided by the client.

---

## 9. Data Needed From the Client

Before or during development, the following information should be collected from the client.

### Brand and Public Website Data

- Smartfit.am logo.
- App/home screen icon.
- Brand colors.
- Preferred light theme and dark theme colors, if needed.
- Homepage hero text.
- Homepage offers, promotions, discounts, and announcements.
- About Us text.
- Gym values/atmosphere/service description.
- Gallery photos.
- Coach photos.
- Package descriptions.
- Public call-to-action text.

### Contact and Location Data

- Phone number.
- WhatsApp link or number.
- Instagram link.
- Address.
- Google Maps link.
- Yandex Maps link, if used.
- Working days.
- Working hours.

### Customer Data

- Existing customer list, if any.
- Required customer personal fields.
- Customer ID format.
- Active/inactive customer status rules.
- Existing package history, if any.
- Assigned coach information, if already known.

### Package Data

- Package names.
- Package prices.
- Number of sessions per package.
- Package types.
- Activation rules.
- Expiration rules.
- Whether packages can be frozen.
- Whether package freezing extends expiration.
- Time restrictions, such as before 3:00 PM.
- Rules for expired packages.
- Rules for zero-session packages.
- Rules for multiple active packages.

### Coach Data

- Coach names and surnames.
- Coach photos.
- Coach specialties.
- Coach descriptions.
- Coach contact information, if needed.
- Which packages are connected to which coaches.

### Reception Workflow Data

- Whether reception can delete notes.
- Whether reception can freeze/reactivate packages.
- Whether reception can manually change sessions.
- Whether reception can manually change occupancy.
- Whether manual corrections require a reason.
- Whether manual occupancy changes require admin approval/password.
- Whether check-in override is allowed for restricted packages.

### Occupancy and Analytics Data

- Maximum comfortable gym capacity.
- Green crowd threshold.
- Yellow crowd threshold.
- Red crowd threshold.
- Definition of peak hours.
- Analytics the admin considers most important.

### Legal / Policy Data

- Privacy text, if needed.
- Terms or rules for package usage, if displayed publicly.
- Internal data handling expectations.
- Policy for deleting customer records.

---

## 10. Assumptions

- **Assumption:** Smartfit.am is being built for one gym location in the MVP.
- **Assumption:** Customers do not need to create accounts in the MVP.
- **Assumption:** The User Panel / Mobile App Experience is public and no-login.
- **Assumption:** Receptionists manually check customers in and out.
- **Assumption:** QR code check-in is not part of the MVP unless the client confirms it.
- **Assumption:** Online payments are not part of the MVP unless the client confirms it.
- **Assumption:** The system should support customers with multiple packages because the uploaded specification explicitly requires this.
- **Assumption:** A customer cannot be checked in twice at the same time unless admin override is later added.
- **Assumption:** Check-in can deduct sessions, but check-out must not deduct sessions.
- **Assumption:** The first version should prevent remaining sessions from going below zero unless admin override is confirmed.
- **Assumption:** Package time restrictions are required in the MVP because the uploaded specification includes the before-3:00-PM example.
- **Assumption:** Basic notes are needed in the MVP, but exact delete permissions must be confirmed.
- **Assumption:** Basic Excel exports are needed in the MVP, while advanced filtered exports can come later.
- **Assumption:** Basic analytics are needed in the MVP, while advanced analytics can come later.
- **Assumption:** A separate coach dashboard is not part of the MVP because the uploaded specification describes coach management but not coach login functionality.
- **Assumption:** A platform owner/master admin is not part of the MVP unless Smartfit.am becomes a multi-tenant platform.
- **Assumption:** The Add Our App feature should be treated as a PWA-style website experience, not a native mobile application.
- **Assumption:** Group exercise registration is not confirmed for MVP; only group training as a possible package type is confirmed.

---

## 11. Open Questions for the Client

1. Should customers have login accounts in any version, or should the customer-facing side stay fully public/no-login?
2. Should check-in always be manual by reception, or should QR code/member card check-in be added later?
3. Should customers receive a unique numeric ID, QR code, membership card, or a combination of these?
4. What exact customer personal information fields should be stored?
5. Should the system support only one gym location, or should multiple branches be planned for the future?
6. Should payments be tracked manually, or should online payment/package purchase be added later?
7. Should reception staff be allowed to delete notes, or only create and edit them?
8. Should note edits/deletions be logged separately?
9. Should package freezing automatically extend the expiration date?
10. Who is allowed to freeze and reactivate packages: admin only, reception only, or both?
11. Should the system allow check-in if the customer has expired packages?
12. Should the system allow check-in if the customer has zero remaining sessions?
13. Should an admin override be allowed for time-restricted packages?
14. Should admin override require a password or just admin permission?
15. Can package time rules include only “before a time,” or should they support full time ranges such as 9:00 AM–3:00 PM?
16. Should package time rules support specific weekdays?
17. Should check-in be blocked when a package is inactive, expired, frozen, or has zero sessions?
18. Should manual session corrections require a written reason?
19. Should remaining sessions ever be allowed to go below zero?
20. Should manual occupancy changes require an admin password or only receptionist permission?
21. How should the public occupancy number update: instantly, every few seconds, every minute, or only on page refresh?
22. What are the exact green/yellow/red occupancy thresholds?
23. Should occupancy count show only the number, or also a label such as “Not crowded,” “Moderate,” or “Crowded”?
24. Should the public page show working hours and contact links together with the live count?
25. Which items should the admin be able to show/hide on the public app page?
26. Should gallery be included in the first launch or delayed until good photos are ready?
27. Should group exercise registration be included, or should group training only exist as a package type for now?
28. Should coaches have their own dashboard later?
29. What exact Excel exports are required for launch?
30. How long should logs be stored?
31. Should logs be exportable by date range?
32. What analytics are most important to the client for the first release?
33. Should promotional offer history be visible only to admin or also publicly archived?
34. Should inactive customers be hidden from reception by default or only when the admin enables the setting?
35. Who can delete customers, packages, coaches, and public content?

---

## 12. Out of Scope for MVP

The following items should not be built in the first version unless the client explicitly confirms them.

- Customer login accounts.
- Customer self-service dashboard.
- Customer self-service document access.
- Online payments.
- Ecommerce checkout for buying packages.
- Subscription billing.
- Native iOS or Android mobile app.
- QR code check-in.
- Physical membership card system.
- Multi-branch support.
- Multi-tenant/SaaS support.
- Coach login/dashboard.
- Separate Services model or subsystem.
- Full group class registration system.
- Group class scheduling and capacity management.
- Waiting lists for group classes.
- External SMS/WhatsApp/email/push notifications.
- Loyalty or rewards system.
- Predictive, revenue, marketing, or customer-level analytics beyond the explicitly approved aggregate operational metrics.
- Advanced export scheduling or automated reports.
- Public archive of old offers/promotions.
- Complex admin override workflows.
- Detailed permission matrix beyond admin and registration roles.
- Automated long-stay detection unless confirmed.
- Any feature outside the confirmed system and the manually approved Phase 31-41 expansion.

---

## Final Product Direction

Smartfit.am should be built as a practical gym website and operations platform. The MVP should avoid unnecessary complexity and focus on the real workflows that matter every day:

- Visitors understand the gym and its offers.
- Customers check live crowd status from their phone.
- Receptionists accurately check customers in and out.
- Sessions decrease only when the correct package is used.
- Admins manage customers, packages, coaches, settings, logs, exports, and basic analytics.

The most important requirement is operational clarity. The system should make it easy to know who is in the gym, which packages are active, how many sessions remain, which sessions were used, and what changed over time.
