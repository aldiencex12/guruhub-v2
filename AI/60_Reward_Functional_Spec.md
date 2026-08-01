# 60 — Reward Management Functional Feature Specification

## Module: Student Character & Discipline Management
**Author:** Chief Product Architect  
**Status:** DRAFT (Sprint 2.8)  
**Date:** 2026-07-25  

---

## 1. Business Goal
Recognize positive student achievements (academic, athletic, leadership, extracurricular) by awarding reward points that offset active demerit balances and foster positive school climate.

---

## 2. User Personas & Permissions (RBAC Matrix)

| User Persona | Create Reward | Grant Reward to Student | View Reward History | Archive Reward Type |
| :--- | :---: | :---: | :---: | :---: |
| **Super Admin** | ✅ | ✅ | ✅ | ✅ |
| **School Admin** | ✅ | ✅ | ✅ | ✅ |
| **Principal** | ✅ Read-only | ✅ | ✅ | ❌ |
| **Guru BK** | ✅ | ✅ | ✅ | ❌ |
| **Homeroom Teacher** | ❌ | ✅ | ✅ | ❌ |
| **Teacher** | ❌ | ✅ | ✅ | ❌ |

---

## 3. Navigation & Screen Layout
- **Path:** `/discipline/types?category=REWARD`
- **Layout:** Reward type master table top, Award Grant Modal on student profiles and quick action drawer.

---

## 4. Comprehensive Feature Specifications

- **Widget Breakdown:** Reward type badge (green/emerald), point deduction chip (e.g. `-10 Poin`), reward history list, award certificate generator modal.
- **User Flow:** Teacher selects student -> Clicks "+ Beri Penghargaan" -> Selects reward type (e.g. "Juara Lomba Futsal") -> Enters notes & certificate evidence -> Submits -> Student active points reduced by reward point value.
- **CRUD Operations:** Create Reward Type (POST), Grant Reward to Student (POST incident with negative points), Read History (GET).
- **Validation Rules:**
  - `pointDeduction`: Must be a positive integer (subtracted during point calculation).
  - Award certificate file: PDF or image under 5 MB.
- **Search, Filters, Sorting, Pagination:** Filter by reward category, sort by `date DESC`, paginated list.
- **States:**
  - *Empty State:* "Belum ada akumulasi penghargaan untuk siswa ini."
  - *Loading State:* Loading spinner overlay.
  - *Error State:* Validation error toast.
- **Notifications:** In-app congratulations notification sent to student & parent portal.
- **Export & Import:** Export reward certificate PDF; export school-wide reward summary.
- **Attachments:** Award certificate photo upload.
- **Mobile Behaviour:** Mobile award modal with instant camera snap for certificate evidence.
- **Accessibility:** High-visibility green badge pill with clear screen reader label (`"Penghargaan: -10 Poin"`).
- **Audit Logging:** Logs `GRANT_REWARD` event in `discipline_audit_logs`.
- **Performance:** Instant cache invalidation on student point balance queries.
- **Future Expansion:** Student leaderboard and badge gamification system.
