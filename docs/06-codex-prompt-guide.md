# Smartfit.am — Codex Prompt Guide

**Document path:** `docs/06-codex-prompt-guide.md`  
**Project:** Smartfit.am  
**Document type:** Codex prompt workflow guide  
**Purpose:** Teach ChatGPT how to generate focused, phase-controlled, simple Codex prompts for Smartfit.am.

---

## 1. Source Documents Used

This guide was created from the uploaded Smartfit.am project files only:

1. **`smartfit_am_website_specification_polished.docx`**  
   Main source for Smartfit.am requirements, application areas, users, workflows, MVP scope, and unclear points.

2. **`docs/01-product-requirements.md` / `01-product-requirements.md`**  
   Product Requirements Document defining confirmed MVP features, later scope, assumptions, business rules, and open client questions.

3. **`docs/02-technical-blueprint.md` / `02-technical-blueprint.md`**  
   Technical Blueprint defining preferred stack direction, application areas, frontend/backend strategy, authentication direction, settings, analytics, and unclear points.

4. **`docs/03-database-schema.md` / `03-database-schema.md`**  
   Database Schema planning document defining confirmed data models, relationships, enums, validation notes, and database questions.

5. **`docs/04-routes-and-api.md` / `04-routes-and-api.md`**  
   Routes and API planning document defining public routes, private routes, server actions, API routes, and permissions.

6. **`docs/05-development-phases.md` / `05-development-phases.md`**  
   Official fixed development phase plan for Smartfit.am. This is the main control document for phase order.

7. **`smartfit_design_colors.xlsx`**  
   Design color source used by the project for Smartfit.am brand colors, theme colors, button colors, and status colors.

8. **User-provided prompt for `docs/06-codex-prompt-guide.md`**  
   Defines the required purpose, structure, phase-control behavior, simplicity rules, templates, and final rule for this guide.

No external sources were used.

**Expected document note:** The user mentioned `docs/smartfit_am_websidte_specification_polished.docx`. The available uploaded file is named `smartfit_am_website_specification_polished.docx`.

---

## 2. Purpose of This Guide

This file teaches ChatGPT how to generate Codex prompts for Smartfit.am.

Smartfit.am development must be guided by the uploaded project documentation, especially `docs/05-development-phases.md`. ChatGPT should use this file whenever the project owner asks for a Codex prompt, a fix prompt, a bug-fix prompt, or a phase-completion review.

Codex prompts must:

- Follow `docs/05-development-phases.md` exactly.
- Focus on one phase at a time.
- Use the exact phase number and phase name from the phase plan.
- Avoid creating new phases.
- Avoid adding unconfirmed features.
- Avoid jumping ahead to future phases.
- Keep implementation simple, practical, and reviewable.
- Choose the most direct clean solution.
- Avoid writing unnecessary code.
- Avoid unnecessary abstractions, folders, utilities, wrappers, hooks, and dependencies.
- Stop and report blockers instead of guessing.

The goal is not to make the smallest possible code at any cost. The goal is to produce the **smallest clean solution that fully satisfies the confirmed requirements and acceptance criteria for the current phase**.

---

## 3. Required Documents for Every Codex Prompt

Every Codex prompt should instruct Codex to read these files first, if they exist in the codebase:

```txt
README.md
docs/00-client-decisions.md
docs/01-product-requirements.md
docs/02-technical-blueprint.md
docs/03-database-schema.md
docs/04-routes-and-api.md
docs/05-development-phases.md
docs/06-codex-prompt-guide.md
docs/design-colors.md
```

Document roles:

- `README.md` explains the local project setup and current implementation notes.
- `docs/00-client-decisions.md` records final client decisions that clarify previously unclear requirements.
- `docs/01-product-requirements.md` explains what Smartfit.am must do.
- `docs/02-technical-blueprint.md` explains the preferred technical direction.
- `docs/03-database-schema.md` explains confirmed data models and database boundaries.
- `docs/04-routes-and-api.md` explains confirmed routes, actions, APIs, and permissions.
- `docs/05-development-phases.md` controls the current phase and implementation order.
- `docs/06-codex-prompt-guide.md` controls how Codex should behave while implementing.
- `docs/design-colors.md` provides Smartfit.am design tokens and color definitions.

`docs/05-development-phases.md` is the official phase plan. Phase 0 through Phase 15 are the completed original MVP phases. The project owner manually extended the plan with post-MVP Registration Panel improvement phases, Phase 16 through Phase 21. Codex and ChatGPT must not create Phase 22 or any later phase unless the project owner manually updates that document again.

The post-MVP phases exist only because the project owner reviewed the completed Registration Panel against the uploaded specification and explicitly approved a focused improvement sequence. They do not weaken the anti-hallucination, simplicity, privacy, permission, or phase-control rules.

---

## 4. Universal Codex Prompt Rules

The following rules must appear in every Codex prompt for Smartfit.am:

- Work only on the requested phase.
- Do not work on future phases.
- Do not create new phases.
- Do not add unconfirmed features.
- Do not use external requirements.
- Do not refactor unrelated files.
- Do not rewrite working code without a clear reason.
- Keep changes small and focused.
- Keep code simple and readable.
- Use uploaded documentation as the source of truth.
- Use the existing project structure.
- Reuse existing components, helpers, actions, types, and patterns where practical.
- Avoid unnecessary dependencies.
- Avoid unnecessary abstractions.
- Avoid unnecessary wrapper functions, hooks, utilities, and service layers.
- Keep public data separate from private data.
- Keep business-critical updates server-side.
- Protect private Admin and Registration areas.
- Do not expose customer data, package ownership, notes, logs, visits, or staff data on public pages.
- If a requirement is unclear, stop and report it.
- After finishing, summarize changed files.
- Mention what was implemented.
- Mention what was intentionally not implemented.
- Mention blockers or unclear points.

---

## 5. Optimal Implementation Rules for Codex

### Choose the Shortest Safe Path

Codex should solve the phase using the smallest clean implementation that satisfies the phase acceptance criteria. The solution should be correct, readable, safe, and easy to review.

### Prefer Existing Patterns

Before creating new files or abstractions, Codex should check whether the project already has a similar component, helper, action, validation function, layout, route pattern, or data-access pattern. Existing patterns should be reused when practical.

### Avoid Premature Abstraction

Codex should not create generic frameworks, factories, service layers, complex utility systems, or reusable abstractions unless the current phase clearly needs them. A simple direct feature-level implementation is preferred.

### Avoid Dependency Bloat

Codex should not install packages for simple tasks that can be handled with existing tools, built-in browser behavior, the existing stack, or basic TypeScript. New dependencies should only be introduced when clearly necessary for the current phase.

### Keep UI Practical

Codex should use simple forms, cards, tables, badges, buttons, and clear loading/empty/error states. The UI should be clean and client-ready, but not overdesigned.

### Keep Server Logic Clear

Business-critical operations should be handled server-side. This includes authentication, permissions, customer/package writes, check-in, check-out, session deduction, manual corrections, occupancy updates, exports, and logs. The implementation should remain direct and understandable.

### Prefer Localized Changes

Codex should modify only files related to the current phase. It should not refactor unrelated pages, actions, models, styles, or components.

### Do Not “Prepare” for Unconfirmed Future Features

Codex should not add hidden support for payments, QR check-in, customer accounts, coach dashboards, multi-branch support, notifications, native mobile apps, loyalty systems, ecommerce checkout, or full group class registration unless those features are explicitly confirmed in the current phase.

### Report Instead of Guessing

If Codex cannot safely decide something from the documentation, it should stop and report the blocker. It should not invent requirements, business rules, database models, routes, dashboards, roles, or APIs.

---

## 6. Standard Codex Prompt Template

Use this copy-paste-ready template when asking Codex to implement one phase.

```txt
You are working inside the Smartfit.am codebase.

Read these files first:
- README.md
- docs/00-client-decisions.md
- docs/01-product-requirements.md
- docs/02-technical-blueprint.md
- docs/03-database-schema.md
- docs/04-routes-and-api.md
- docs/05-development-phases.md
- docs/06-codex-prompt-guide.md
- docs/design-colors.md

Focus only on:

Phase X — [Exact Phase Name]

Important phase-control rules:
- Work only on this phase.
- Do not work on future phases.
- Do not create new phase numbers.
- Do not add unconfirmed features.
- Do not skip ahead.
- Do not refactor unrelated files.

Implementation style:
- Choose the simplest correct solution.
- Find the shortest clean path to satisfy the phase.
- Reuse existing files, components, helpers, actions, and patterns where practical.
- Do not create unnecessary abstractions.
- Do not create unnecessary folders.
- Do not install new dependencies unless clearly needed.
- Do not write hundreds of lines when a small clear solution works.
- Keep the code readable, direct, and maintainable.
- Follow the existing project structure.
- Use TypeScript.
- Keep public data separate from private data.
- Keep business-critical updates server-side.
- If something is unclear, stop and report the blocker instead of guessing.

Phase details from docs/05-development-phases.md:
[paste the exact phase details here]

Before coding:
1. Briefly identify the smallest set of files likely needed.
2. Briefly identify whether existing code can be reused.
3. Do not write a long plan.

After finishing, summarize:
1. Files changed
2. What was implemented
3. What was intentionally not implemented
4. How to manually test it
5. Any blockers or unclear points
```

---

## 7. Phase Prompt Generation Rules

When ChatGPT generates a Codex prompt for a phase, it must:

1. Read the exact phase from `docs/05-development-phases.md`.
2. Copy the phase number exactly.
3. Copy the phase name exactly.
4. Not rename the phase.
5. Include only tasks from that phase.
6. Include `What Codex Should Build`.
7. Include `What Codex Must Not Build`.
8. Include likely files/folders.
9. Include data/database impact.
10. Include UI impact.
11. Include backend/logic impact.
12. Include acceptance criteria.
13. Include manual verification checklist.
14. Include the completion definition.
15. Include the exact next phase.
16. Add the universal simplicity and optimality rules.
17. Not add extra tasks.
18. Not invent missing requirements.
19. Not add extra phase numbers.
20. Not continue beyond the final approved phase in `docs/05-development-phases.md`.

---

## 8. Phase Completion Review Template

When the project owner pastes Codex output back into ChatGPT, use this review structure:

```md
# Phase X Review

## Status
Complete / Partially Complete / Blocked

## What Codex Completed
- ...

## Files Changed
- ...

## Missing Items
- ...

## Issues or Risks
- ...

## Simplicity Review
- Did Codex keep the solution simple?
- Did Codex avoid unrelated refactors?
- Did Codex avoid unnecessary abstractions?
- Did Codex avoid extra dependencies?
- Did Codex stay inside the requested phase?

## Manual Testing Needed
- ...

## Decision
- If complete: move to Phase X+1.
- If incomplete: continue Phase X with a fix prompt.
- If blocked: ask the user for clarification.
```

Review rules:

- If the phase is complete, ChatGPT may generate the next phase prompt only if there is a next phase in `docs/05-development-phases.md`.
- If Phase 15 is complete, ChatGPT may move to Phase 16 only because the project owner manually added Phase 16 through Phase 21 to `docs/05-development-phases.md`.
- If Phase 21 is complete, ChatGPT must not suggest Phase 22.
- If something remains after Phase 21, ChatGPT should create a `Remaining Issues` list, not a new phase.

---

## 9. Fix Prompt Template

Use this when Codex partially completed a phase but missed one or more required items.

```txt
You are still working on Smartfit.am.

Stay in the same phase:

Phase X — [Exact Phase Name]

Read:
- docs/05-development-phases.md
- docs/06-codex-prompt-guide.md
- Any files you changed in the previous attempt

Fix only the missing items listed below:
[Paste missing items]

Rules:
- Stay inside Phase X.
- Do not redo completed work.
- Do not start the next phase.
- Do not create new phases.
- Do not add unconfirmed features.
- Do not refactor unrelated code.
- Keep the fix as small as possible.
- Use the simplest clean solution.
- Reuse the existing implementation where possible.
- Do not install new dependencies unless clearly required.
- If something is unclear, stop and report the blocker.

After finishing, summarize:
1. Files changed
2. Missing items fixed
3. Anything intentionally not changed
4. How to manually test the fix
5. Any blockers or unclear points
```

---

## 10. Bug Fix Prompt Template

Use this when a bug is found after a phase has been implemented.

```txt
You are working inside the Smartfit.am codebase.

A bug was found after implementing:

Phase X — [Exact Phase Name]

Bug description:
[Describe the bug clearly]

Expected behavior:
[Describe expected behavior]

Actual behavior:
[Describe actual behavior]

Rules:
- Fix the bug only.
- Do not add new features.
- Do not change the phase plan.
- Do not create new phases.
- Do not refactor unrelated files.
- Do not rewrite the feature from scratch unless absolutely necessary.
- Prefer a small targeted fix.
- Keep the solution simple and readable.
- Reuse existing code and patterns where practical.
- Do not install new dependencies unless clearly required.
- If the root cause cannot be safely identified, explain the blocker instead of guessing.

After finishing, explain:
1. Root cause
2. Files changed
3. What was fixed
4. What was not changed
5. How to test the fix
6. Any remaining risks or unclear points
```

---

## 11. Next Phase Prompt Template

Use this when one phase is complete and the project owner wants the next Codex prompt.

```txt
Phase X is complete.

Using docs/05-development-phases.md and docs/06-codex-prompt-guide.md, generate the Codex prompt for the next phase.

Do not skip phases.
Do not create a new phase.
Do not add unconfirmed features.
Make the prompt guide Codex toward the simplest correct implementation.
```

ChatGPT must check the official phase index before responding. The current plan has been manually extended through Phase 21. If the completed phase is Phase 21, there is no next phase unless `docs/05-development-phases.md` is manually updated again.

---

## 12. Rules for Preventing Phase Hallucination

Phase hallucination means ChatGPT or Codex invents new phase numbers, skips the official order, renames phases, or continues beyond the final phase.

Strict rules:

- Always check the Full Phase Index in `docs/05-development-phases.md`.
- The current approved plan contains **Phase 0 through Phase 21**.
- Phase 0 through Phase 15 are the completed original MVP phases.
- Phase 16 through Phase 21 are manually approved post-MVP Registration Panel improvement phases.
- Never continue beyond the final phase.
- The current plan ends at Phase 21, so stop at Phase 21.
- Do not create Phase 22 or any later phase.
- If something is left unfinished after the final phase, create a `Remaining Issues` list, not Phase 22.
- New phases require manual update to `docs/05-development-phases.md`.
- ChatGPT may refer to Phase 16 through Phase 21 because the phase document has now been manually updated.
- ChatGPT must never say “next is Phase 22” unless the phase document is manually updated again.
- Codex must not add phase numbers in its output unless it is referring to the official phase being implemented.
- If a feature does not fit into the fixed phase plan, state that `docs/05-development-phases.md` must be manually updated first.

Official phase index:

| Phase | Name |
|---|---|
| Phase 0 | Project Setup and Repository Baseline |
| Phase 1 | Design System and App Layout |
| Phase 2 | Database and Prisma Foundation |
| Phase 3 | Authentication and Route Protection |
| Phase 4 | Public Website Pages |
| Phase 5 | Public Our App and Live Occupancy Page |
| Phase 6 | Admin Shell, Settings, and Public Content |
| Phase 7 | Admin Coaches and Packages |
| Phase 8 | Admin Customers and Package Assignment |
| Phase 9 | Registration Search and Customer Card |
| Phase 10 | Check-In Workflow |
| Phase 11 | Check-Out and Occupancy Correction |
| Phase 12 | Notes and Admin Logs |
| Phase 13 | Excel Export |
| Phase 14 | Basic Analytics |
| Phase 15 | Final Testing and Deployment Preparation |
| Phase 16 | Registration Gap Audit and Missing Section Fixes |
| Phase 17 | Registration Customer Workspace Redesign |
| Phase 18 | Registration Notes and Activity Experience Polish |
| Phase 19 | Registration Package Freeze and Reactivation |
| Phase 20 | Reception Workspace Controls and Operational Rules Display |
| Phase 21 | Post-MVP Registration Regression and Client Review Preparation |

---

## 13. Rules for Preventing Feature Hallucination

Feature hallucination means adding features, dashboards, routes, models, actions, APIs, roles, or business rules that are not confirmed in the uploaded Smartfit.am files.

Strict rules:

- Use only uploaded Smartfit.am files.
- Do not use external requirements.
- Do not add customer accounts.
- Do not add customer dashboard/self-service features.
- Do not add coach dashboard.
- Do not add coach login.
- Do not add QR code check-in.
- Do not add membership-card scan events.
- Do not add online payments.
- Do not add ecommerce checkout.
- Do not add multi-branch support.
- Do not add platform owner/master admin hierarchy.
- Do not add native mobile app features.
- Do not add external SMS/WhatsApp/email/push notifications.
- Do not add full group class registration.
- Do not add group class schedule, capacity, waiting list, or attendance workflows unless later confirmed.
- Do not add loyalty/reward system.
- Do not add advanced marketing analytics.
- Do not add hidden infrastructure for any of these features.
- If unsure, mark the item as unclear and ask for clarification.

Confirmed MVP work should stay focused on:

- Public website pages.
- Public Gallery page.
- Public no-login Our App/live occupancy page.
- Admin Panel.
- Registration Panel.
- Customers.
- Coaches.
- Packages and package time restrictions.
- Customer package assignment.
- Check-in/check-out.
- Manual session and occupancy corrections.
- Notes.
- Logs.
- Excel exports.
- Basic analytics.
- Final testing and deployment preparation.

Confirmed post-MVP Registration work must stay focused on Phase 16 through Phase 21:

- Registration gap audit and missing-section fixes.
- Registration customer workspace redesign.
- Notes and safe customer-specific activity polish.
- Package freeze/reactivation only after the project owner confirms REGISTRATION permission.
- Reception view controls and read-only operational-rule display.
- Registration regression testing and client-review preparation.

**Important:** Admin Settings remain admin-only. Reception view controls must not become a true system-settings editor. Any future request to let REGISTRATION edit system-wide settings requires a separate permission decision and another manual documentation update.

---

## 14. Simple Implementation Rules for Codex

Codex should follow these simple implementation rules in every phase:

- Use clear names.
- Keep files small, but do not split unnecessarily.
- Avoid clever abstractions.
- Avoid premature optimization.
- Avoid large rewrites.
- Prefer direct server actions where appropriate.
- Prefer simple forms and tables.
- Prefer simple cards for mobile views.
- Prefer existing components when practical.
- Prefer existing validation patterns when practical.
- Prefer readable TypeScript.
- Do not install new packages unless clearly needed.
- Ask before introducing major dependencies.
- Do not create a “perfect architecture” when a simple feature-level solution is enough.
- Do not add code only because it might be useful later.
- Do not make the project harder for the owner to understand.
- Do not split one simple action across many files unless it improves clarity.
- Do not make generic systems for one-time workflows.
- Do not refactor unrelated working code while implementing a phase.
- Do not change styling globally unless the phase requires it.
- Do not replace simple UI with complex animations or unnecessary interactivity.
- Make the implementation easy to manually verify.

When choosing between two valid solutions, Codex should choose the one that is:

1. Correct.
2. Shorter.
3. Easier to understand.
4. Easier to test.
5. More consistent with existing files.

---

## 15. Required End-of-Phase Codex Summary

Codex must provide this summary after every phase:

```md
## Phase X Completion Summary

### Files Changed
- ...

### Implemented
- ...

### Not Implemented
- ...

### Simplicity / Scope Check
- Confirmed this stayed inside Phase X.
- Confirmed no new phases were created.
- Confirmed no unconfirmed features were added.
- Confirmed no unrelated refactors were done.
- Confirmed no unnecessary dependencies were added.

### Manual Testing
- ...

### Blockers / Questions
- ...
```

Codex should be honest in this summary. If a requirement was not completed, it must say so clearly instead of claiming success.

---

## 16. Example Codex Prompt for Phase 0 Only

This is an example prompt only. Do not generate prompts for all phases inside this file.

```txt
You are working inside the Smartfit.am codebase.

Read these files first:
- README.md
- docs/00-client-decisions.md
- docs/01-product-requirements.md
- docs/02-technical-blueprint.md
- docs/03-database-schema.md
- docs/04-routes-and-api.md
- docs/05-development-phases.md
- docs/06-codex-prompt-guide.md
- docs/design-colors.md

Focus only on:

Phase 0 — Project Setup and Repository Baseline

Important phase-control rules:
- Work only on Phase 0.
- Do not work on Phase 1 or any future phase.
- Do not create new phase numbers.
- Do not add unconfirmed features.
- Do not skip ahead.
- Do not refactor unrelated files.

Implementation style:
- Choose the simplest correct solution.
- Find the shortest clean path to satisfy Phase 0.
- Reuse existing files and structure where practical.
- Do not create unnecessary abstractions.
- Do not create unnecessary folders.
- Do not install new dependencies unless clearly needed for the baseline.
- Do not write hundreds of lines when a small clear setup works.
- Keep the code readable, direct, and maintainable.
- Follow the existing project structure.
- Use TypeScript.
- If something is unclear, stop and report the blocker instead of guessing.

Phase details from docs/05-development-phases.md:

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
- Add a docs/ folder if missing.
- Ensure the existing documentation files can be placed under docs/.
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
- README.md
- docs/
- package.json
- tsconfig.json
- next.config.*
- tailwind.config.*
- postcss.config.*
- app/
- app/page.*
- .env.example if the project uses environment variables

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
- The docs/ folder can store the project documentation files.
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

Before coding:
1. Briefly identify the smallest set of files likely needed.
2. Briefly identify whether existing code can be reused.
3. Do not write a long plan.

After finishing, provide this summary:

## Phase 0 Completion Summary

### Files Changed
- ...

### Implemented
- ...

### Not Implemented
- ...

### Simplicity / Scope Check
- Confirmed this stayed inside Phase 0.
- Confirmed no new phases were created.
- Confirmed no unconfirmed features were added.
- Confirmed no unrelated refactors were done.
- Confirmed no unnecessary dependencies were added.

### Manual Testing
- ...

### Blockers / Questions
- ...
```

---

## 17. Codex Prompt Questions / Unclear Points

These unclear points must not be solved by guessing inside Codex prompts. If a phase touches one of these issues and the documentation still does not resolve it, Codex should stop and report the blocker.

1. Exact authentication method for admin and registration staff is not confirmed.
2. Exact staff login identifier is unclear: username, email, phone, or another value.
3. Exact customer personal information fields are not fully confirmed.
4. Exact customer ID/code format is not confirmed.
5. Whether customer phone number is required or unique is unclear.
6. Whether admin users can access the Registration Panel is unclear.
7. Whether registration staff can delete notes is unclear.
8. Whether note edits/deletions must create logs is unclear.
9. Whether manual session corrections require a reason is unclear.
10. Whether manual occupancy corrections require a reason is unclear.
11. Whether manual occupancy corrections require admin password/approval is unclear.
12. Whether check-in overrides are allowed for expired packages is unclear.
13. Whether check-in overrides are allowed for zero-session packages is unclear.
14. Whether check-in overrides are allowed for frozen packages is unclear.
15. Whether check-in overrides are allowed for time-restricted packages is unclear.
16. Whether customers with no active package can be checked in is unclear.
17. Whether selected packages can deduct more than one session in special cases is unclear.
18. Exact time-restriction structure is unclear beyond simple rules such as “before 3:00 PM”.
19. Whether package time restrictions support weekdays, holidays, or multiple time windows is unclear.
20. Whether package freezing extends expiration date is unclear.
21. Who can freeze/reactivate packages is unclear.
22. Exact package renewal behavior is unclear.
23. Whether package names must be unique is unclear.
24. Whether package types should be hard-coded, editable, or free text is unclear.
25. Whether media/images should be uploaded into the app or stored as external URLs is unclear.
26. Whether Gallery is required in MVP or can be delayed is unclear.
27. Exact public content lifecycle is unclear: active/inactive/archive/draft/published/expired.
28. Whether public content images are required is unclear.
29. Exact Excel export filters and date ranges are unclear.
30. Whether export history should be stored is unclear.
31. Exact analytics formulas are unclear.
32. Whether occupancy updates should be instant, polling-based, or refresh-only is unclear.
33. Whether historical occupancy analytics should use visits, occupancy events, or snapshots is unclear.
34. Exact deployment provider is not confirmed.
35. Exact production file/image storage method is not confirmed.
36. Exact backup policy is not confirmed.

---

## 18. Final Rule

```txt
Codex and ChatGPT must follow docs/05-development-phases.md exactly. Phase 16 through Phase 21 are the only manually approved post-MVP phases. No Phase 22, unconfirmed feature, unrelated refactor, or over-engineered implementation is allowed unless the project owner manually updates the documentation again.
```
