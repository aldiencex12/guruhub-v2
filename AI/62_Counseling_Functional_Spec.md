# 62 — Counseling (BK) Session Functional Feature Specification

## Module: Student Character & Discipline Management
**Author:** Chief Product Architect  
**Status:** DRAFT (Sprint 2.8)  
**Date:** 2026-07-25  

---

## 1. Business Goal
Provide Counseling Teachers (Guru BK) with a secure, confidential case management system to record guidance sessions, student commitment agreements, parent consultations, and follow-up action plans.

---

## 2. User Personas & Permissions (RBAC Matrix)

| User Persona | Record Counseling Session | View Confidential Notes | Edit Session Note | View Action Plan |
| :--- | :---: | :---: | :---: | :---: |
| **Super Admin** | ✅ | ✅ | ✅ | ✅ |
| **School Admin** | ✅ | ✅ | ✅ | ✅ |
| **Principal** | ❌ | ✅ Read-only | ❌ | ✅ |
| **Guru BK** | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Homeroom Teacher** | ❌ | ❌ Privacy Lock | ❌ | 🔒 Summary Only |
| **Teacher** | ❌ | ❌ Privacy Lock | ❌ | ❌ |

---

## 3. Navigation & Screen Layout
- **Path:** `/discipline/students/[id]?tab=counseling`
- **Layout:** Confidential timeline feed with inline editor modal and PDF commitment agreement viewer.

---

## 4. Comprehensive Feature Specifications

- **Widget Breakdown:** Confidentiality banner, session log card, commitment agreement form uploader, follow-up date reminder trigger.
- **User Flow:** Guru BK summons student -> Conducts session -> Opens student profile -> Clicks "+ Catat Bimbingan BK" -> Enters session notes, recommendations & follow-up date -> Uploads signed agreement -> Saves -> Appends to student timeline.
- **CRUD Operations:** Create counseling note (POST), Read session logs (GET), Update follow-up status (PUT).
- **Validation Rules:**
  - `sessionNotes`: Minimum 15 characters, maximum 5000 characters.
  - `counselorTeacherId`: Must match active logged-in counselor.
- **Search, Filters, Sorting, Pagination:** Filter by date, search by keyword in session notes, sort by `sessionDate DESC`.
- **States:**
  - *Empty State:* "Belum ada catatan bimbingan konseling untuk siswa ini."
  - *Loading State:* Confidential lock animation and shimmer.
  - *Error State:* Access denied warning if non-BK user attempts direct URL fetch.
- **Notifications:** In-app reminder notification sent to BK counselor when follow-up date arrives.
- **Export & Import:** Export confidential counseling summary report for principal review.
- **Attachments:** Signed parental commitment agreement PDF upload.
- **Mobile Behaviour:** Mobile voice note attachment recorder hook (future extension).
- **Accessibility:** Screen reader confidentiality alert announcement (`"Catat bimbingan BK bersifat rahasia"`).
- **Audit Logging:** Logs `VIEW_COUNSELING_LOG` and `CREATE_COUNSELING_LOG` with actor user ID.
- **Performance:** Direct DB fetch with encrypted content payload.
- **Future Expansion:** AI speech-to-text counseling transcript generator.
