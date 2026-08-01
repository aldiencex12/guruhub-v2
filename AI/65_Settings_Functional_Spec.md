# 65 — Discipline Policies & Settings Functional Feature Specification

## Module: Student Character & Discipline Management
**Author:** Chief Product Architect  
**Status:** DRAFT (Sprint 2.8)  
**Date:** 2026-07-25  

---

## 1. Business Goal
Allow school administrators to configure tenant-wide discipline policy parameters, point calculation rules, reset cycles, carry-forward percentages, and automated parent notification triggers.

---

## 2. User Personas & Permissions (RBAC Matrix)

| User Persona | View Policy Settings | Edit Policy Settings | Reset Point Cycle | Configure Notification Channels |
| :--- | :---: | :---: | :---: | :---: |
| **Super Admin** | ✅ | ✅ | ✅ | ✅ |
| **School Admin** | ✅ | ✅ | ✅ | ✅ |
| **Principal** | ✅ Read-only | ❌ | ❌ | ❌ |
| **Guru BK** | ✅ Read-only | ❌ | ❌ | ❌ |
| **Homeroom Teacher** | ❌ | ❌ | ❌ | ❌ |
| **Teacher** | ❌ | ❌ | ❌ | ❌ |

---

## 3. Navigation & Screen Layout
- **Path:** `/discipline/policies`
- **Layout:** Sectioned configuration grid (Point Calculation Rules, Reset Strategy, Auto-Sanction Toggles, Notification Gateways).

---

## 4. Comprehensive Feature Specifications

- **Widget Breakdown:** Switch toggle components, numeric step inputs, policy reset strategy selector, notification channel check-boxes (`WhatsApp`, `Push`, `Email`), save button bar.
- **User Flow:** School Admin navigates to `/discipline/policies` -> Modifies point reset cycle from `ANNUAL` to `SEMESTER` -> Enables auto-sanction triggers -> Clicks "Simpan Perubahan Policy" -> Policy saved -> Invalidates Redis policy cache.
- **CRUD Operations:** Read Policy (GET), Update Policy (PUT).
- **Validation Rules:**
  - `maxActivePoints`: Must be an integer between 50 and 500.
  - `carryForwardPercentage`: Decimal between 0.00 and 100.00.
- **Search, Filters, Sorting, Pagination:** None (Single page configuration form).
- **States:**
  - *Empty State:* N/A (Default policy populated upon school tenant provision).
  - *Loading State:* Form skeleton.
  - *Error State:* Validation error toast.
- **Notifications:** Success toast upon policy configuration update.
- **Export & Import:** Export school policy document to PDF.
- **Attachments:** None.
- **Mobile Behaviour:** Single column responsive form layout.
- **Accessibility:** Form fields linked to explicit `<label>` tags with helper tooltips.
- **Audit Logging:** Logs `UPDATE_POLICY` event recording old values and new values in `discipline_audit_logs`.
- **Performance:** Instant Redis cache invalidation (`discipline:policy:{schoolId}`).
- **Future Expansion:** Academic track-specific discipline policy overrides (e.g. Vocational vs General High School).
