# Smartfit.am — Design Colors and Design Tokens

**Document path:** `docs/design-colors.md`  
**Project:** Smartfit.am  
**Purpose:** Define Smartfit.am brand colors, theme colors, UI component colors, and status indicators used across the website and app.

---

## 1. Brand Colors

### Primary Brand Blue

- **Name:** Smartfit.am Brand Blue
- **Hex:** `#009BDF`
- **Usage:** Primary buttons, logo, key branding elements, active states
- **Source:** Project specification

### Primary Hover

- **Name:** Smartfit.am Primary Hover
- **Hex:** `#008AC7`
- **Usage:** Button hover states, interactive element hover feedback
- **Source:** Project specification

---

## 2. Light Theme Colors

### Background Colors

- **Page Background (Light):** `#FFFFFF` (white)
- **Card/Section Background:** `#F5F5F5` or `#FAFAFA` (light gray)
- **Input/Form Background:** `#FFFFFF` (white)

### Text Colors

- **Primary Text (Headings, Body):** `#1A1A1A` or `#222222` (dark gray/black)
- **Secondary Text (Labels, Hints):** `#666666` or `#999999` (medium gray)
- **Disabled Text:** `#CCCCCC` or `#DDDDDD` (light gray)

### Border Colors

- **Default Border:** `#DDDDDD` or `#EEEEEE` (light gray)
- **Focus/Active Border:** `#009BDF` (brand blue)
- **Error Border:** `#FF6B6B` or `#E74C3C` (red)

---

## 3. Dark Theme Colors (If Applicable)

*To be defined if dark mode is implemented.*

---

## 4. Status and Action Colors

### Success

- **Name:** Success / Positive
- **Hex:** `#28A745` or `#27AE60` (green)
- **Usage:** Successful actions, confirmations, checked-in status

### Warning

- **Name:** Warning / Caution
- **Hex:** `#FFC107` or `#F39C12` (amber/yellow)
- **Usage:** Warnings, expiring soon, attention needed

### Danger / Error

- **Name:** Danger / Error
- **Hex:** `#FF6B6B`, `#E74C3C`, or `#DC3545` (red)
- **Usage:** Errors, failed actions, critical alerts

### Info

- **Name:** Info / Neutral
- **Hex:** `#17A2B8` or `#3498DB` (light blue)
- **Usage:** Informational messages, help text

---

## 5. Gym Occupancy Status Colors

These colors indicate how crowded the gym is based on occupancy thresholds set by the admin.

### Green (Low Occupancy)

- **Name:** Green / Low Crowd
- **Hex:** `#28A745` or `#27AE60`
- **Meaning:** Gym is not crowded; good time to visit
- **Threshold:** Occupancy ≤ `occupancyGreenMax` (set by admin)

### Yellow (Medium Occupancy)

- **Name:** Yellow / Medium Crowd
- **Hex:** `#FFC107` or `#F39C12`
- **Meaning:** Gym is moderately crowded
- **Threshold:** Occupancy > `occupancyGreenMax` AND ≤ `occupancyYellowMax`

### Red (High Occupancy)

- **Name:** Red / High Crowd
- **Hex:** `#FF6B6B`, `#E74C3C`, or `#DC3545`
- **Meaning:** Gym is very crowded
- **Threshold:** Occupancy > `occupancyYellowMax`

---

## 6. Customer/Package Status Colors

These colors indicate the status of customers and their packages in the admin and registration views.

### Active Package

- **Name:** Active
- **Hex:** `#28A745` (green)
- **Meaning:** Package is usable
- **Usage:** Active, healthy packages on customer cards

### Inactive Package

- **Name:** Inactive
- **Hex:** `#CCCCCC` or `#999999` (gray)
- **Meaning:** Package is not currently active
- **Usage:** Inactive packages in customer overview

### Expired Package

- **Name:** Expired
- **Hex:** `#FF6B6B` or `#E74C3C` (red)
- **Meaning:** Package expiration date has passed
- **Usage:** Expired packages highlighted in red for attention

### Frozen Package

- **Name:** Frozen
- **Hex:** `#6C757D` or `#5A6C7D` (slate blue-gray)
- **Meaning:** Package is frozen and cannot be used for check-in
- **Usage:** Frozen packages clearly marked, often with a snowflake or lock icon

### In Gym Status

- **Name:** In Gym
- **Hex:** `#28A745` (green)
- **Meaning:** Customer is currently inside the gym
- **Usage:** Customer presence badge

### Not In Gym Status

- **Name:** Not In Gym
- **Hex:** `#999999` or `#CCCCCC` (gray)
- **Meaning:** Customer is not inside the gym
- **Usage:** Customer presence badge

---

## 7. UI Component Colors

### Button Colors

#### Primary Button

- **Background:** `#009BDF` (brand blue)
- **Text:** `#FFFFFF` (white)
- **Hover:** `#008AC7` (primary hover)
- **Disabled:** `#CCCCCC` (light gray background), `#999999` (gray text)

#### Secondary Button

- **Background:** `#EEEEEE` or `#F5F5F5` (light gray)
- **Text:** `#1A1A1A` (dark text)
- **Hover:** `#E0E0E0` (slightly darker gray)

#### Danger Button

- **Background:** `#FF6B6B` or `#DC3545` (red)
- **Text:** `#FFFFFF` (white)
- **Hover:** `#E74C3C` (darker red)

#### Success Button

- **Background:** `#28A745` (green)
- **Text:** `#FFFFFF` (white)
- **Hover:** `#218838` (darker green)

### Input Field Colors

- **Border (Focused):** `#009BDF` (brand blue)
- **Border (Error):** `#FF6B6B` (red)
- **Background (Disabled):** `#F5F5F5` (light gray)

### Badge/Chip Colors

- **Active/Primary:** `#009BDF` (brand blue), white text
- **Success:** `#28A745` (green), white text
- **Warning:** `#FFC107` (amber), dark text
- **Danger:** `#FF6B6B` (red), white text
- **Default/Neutral:** `#DDDDDD` (light gray), dark text

---

## 8. Implementation Notes

### CSS Variables / Tailwind Tokens

Phase 1 should implement these colors as:

- CSS custom properties (CSS variables) in `globals.css`, e.g., `--color-primary: #009BDF`
- Tailwind config tokens if using Tailwind CSS
- Any theme system if the app supports multiple themes

### Accessibility

- Ensure sufficient contrast ratio between text and background (WCAG AA minimum 4.5:1 for normal text)
- Use color + another indicator (text, icons) to convey status, not color alone
- Test color combinations with colorblind-friendly tools

### Extensions

- If new colors are needed during development, they should be added to this file before implementation
- Do not use ad-hoc hex values in components; always reference design tokens
- Update this file if any color needs to change for consistency

---

## 9. Sources

This file is the main source for Smartfit.am design tokens and should be referenced by Phase 1 (Design System and App Layout) when implementing global styling and component design.

Known sources referenced:
- Smartfit.am project specification
- `smartfit_design_colors.xlsx` (if available)

**Note:** If exact color specifications are unavailable for any section above, they are marked as pending and should be confirmed with the project owner before Phase 1 finalizes the design system.
