# 59 — Student Character Profile Functional Feature Specification

## Module: Student Character & Discipline Management
**Author:** Chief Product Architect  
**Status:** DRAFT (Sprint 2.8)  
**Date:** 2026-07-25  

---

## 1. Business Goal
Provide a comprehensive 360-degree behavioral profile for every student, aggregating active demerit points, reward accomplishments, sanction histories, counseling logs, and behavioral risk scores.

---

## 2. User Personas & Permissions (RBAC Matrix)

| User Persona | View Profile | View Active Points | View Counseling Notes | Add Counseling Note |
| :--- | :---: | :---: | :---: | :---: |
| **Super Admin** | ✅ | ✅ | ✅ | ✅ |
| **School Admin** | ✅ | ✅ | ✅ | ✅ |
| **Principal** | ✅ | ✅ | ✅ Read-only | ❌ |
| **Guru BK** | ✅ | ✅ | ✅ Full | ✅ Full |
| **Homeroom Teacher** | 🔒 Assigned Class | 🔒 Assigned Class | ❌ Hidden for Privacy | ❌ |
| **Teacher** | 🔒 Basic Info | 🔒 Basic Info | ❌ Hidden for Privacy | ❌ |

---

## 3. Navigation & Screen Layout
- **Path:** `/discipline/students/[id]`
- **Layout:** Header header banner (Photo, NISN, Class, Active Points Gauge), Tabbed content panels below (Violations, Rewards, Sanctions, Counseling, Timeline).

---

## 4. Comprehensive Feature Specifications

- **Widget Breakdown:** Character Score Radial Gauge, Demerit Point Velocity Sparkline, Violation History Table, Reward List, Active Sanction Cards, Confidential Counseling Feed.
- **User Flow:** User searches student -> Clicks profile -> Views active point gauge (e.g. 35/100, WARNING) -> Inspects violation timeline -> BK adds counseling session note -> System saves log.
- **CRUD Operations:** Read student profile (GET), Create counseling note (POST), Download SP letter (GET PDF).
- **Validation Rules:** Counseling note must be at least 15 characters long.
- **Search, Filters, Sorting, Pagination:** Tab-specific search and date filters, sorting by date `DESC`, pagination (10 items per tab).
- **States:**
  - *Empty State:* "Siswa ini belum memiliki catatan pelanggaran atau penghargaan."
  - *Loading State:* Profile header skeleton and shimmer tabs.
  - *Error State:* 404 Student Not Found error boundary card.
- **Notifications:** Toast notification when counseling log is recorded.
- **Export & Import:** Export complete Student Behavioral Transcript to PDF (with official school header).
- **Attachments:** Attachment gallery for sanction documents and counseling agreement forms.
- **Mobile Behaviour:** Mobile tab dropdown selector with sticky top header.
- **Accessibility:** Accessible score gauge with aria-valuemin, aria-valuemax, aria-valuenow properties.
- **Audit Logging:** Confidential access logging when viewing counseling notes (`VIEW_COUNSELING_LOG`).
- **Performance:** Cached active points query (`discipline:points:{schoolId}:{studentId}`).
- **Future Expansion:** AI character score index computation and behavioral trend prediction.
